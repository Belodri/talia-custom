import { _defineAttributesSchema, _defineDateSchema } from "./shared.mjs";
import TaliaDate from "./TaliaDate.mjs";
const { StringField, NumberField, SchemaField, SetField } = foundry.data.fields;


export default class Building extends foundry.abstract.DataModel {
    static buildPeriodInDays = 30;

    /** @readonly */
    static database = new foundry.utils.Collection();
    
    static defineSchema() {
        return {
            sId: new StringField({ required: true, blank: false }),
            name: new StringField({ required: true, blank: false }),
            scale: new NumberField({ required: true, nullable: false, integer: true }),
            capacity: new NumberField({ required: true, nullable: false, integer: true}),
            attributes: new SchemaField(_defineAttributesSchema()),
            requirements: new SchemaField({
                attributes: new SchemaField(_defineAttributesSchema()),
                buildingIds: new SetField(
                    new StringField({ required: false, blank: false}),
                    { required: true, initial: [] }
                ),
                specialists: new SetField(
                    new StringField({ required: false, blank: false}),
                    { required: true, initial: [] }
                )
            }),
            flavorText: new StringField({ required: true, blank: false}),
            specialEffectText: new StringField({ required: true, blank: true, initial: ""}),
            constructionDate: new SchemaField(_defineDateSchema()),
        }
    }

    /**
     * Initialises the Building.database collection from the buildingsData array from sourceData
     * @param {object[]} buildingsData 
     */
    static initDatabase(buildingsData) {
        for(const dataObj of buildingsData) {
            Building.database.set( dataObj.sId, dataObj );
        }
    }

    static get allBuildingInstances() {
        return new foundry.utils.Collection(
            Building.database.map(dataObj => 
                [dataObj.sId, new Building(dataObj)]
            )
        );
    }

    constructor(data, options = {}) {
        super(data, options);
    }

    /**
     * @param {Settlement} settlement 
     * @param {string} sId 
     */
    static async build(settlement, sId) {
        const databaseEntry = Building.database.get(sId);
        if(!databaseEntry) throw new Error(`Building not found | sId: "${sId}".`);
        if(settlement.buildings.has(sId)) throw new Error(`Building already constructed | sId: "${sId}"`);

        const buildingData = foundry.utils.deepClone(databaseEntry);
        buildingData.constructionDate = TaliaDate.now().toObject();
        const building = new Building(buildingData, {parent: settlement});
        return settlement.addBuilding(building);
    }

    async destroy() {
        await this.settlement.removeBuilding(this);
        return this.updateSource({}, {parent: null});  //No idea if it'll get garbage collected otherwise.
    }

    /**
     * Sets the building's construction date.
     * @param {import("./TaliaDate.mjs").DateObject} date
     */
    async modifyConstructionDate(date) {
        this.updateSource({constructionDate: date});
        return this.parent.save();
    }

    /**
     * Has this building been constructed within the last 30 days?
     */
    get recentlyConstructed() {
        if(!this.isConstructed) return false;
        const nowInDays = TaliaDate.now().inDays();
        const constructionDateInDays = TaliaDate.fromDate(this.constructionDate).inDays();
        const diff = nowInDays - constructionDateInDays;
        return diff >= 0 && diff < 30;
    }

    /**
     * How much capacity does this building take up in the parent settlement?
     * If the building has been constructed within the last 30 days, it returns it's own scale,
     * otherwise returns 0.
     * @returns {number}
     */
    get occupiedCapacity() {
        return this.recentlyConstructed ? this.scale : 0;
    }

    get settlement() {
        return this.parent;
    }

    get isConstructed() {
        return !!this.parent;
    }

    get constructionDateDisplay() {
        return this.isConstructed ? TaliaDate.fromDate(this.constructionDate).displayString() : "";
    }

    get hasBuildingRequirements() {
        return !!this.requirements.buildingIds.size;
    }

    get hasSpecialistRequirements() {
        return !!this.requirements.specialists.size;
    }

    get hasAttributeRequirements() {
        return Object.values(this.requirements.attributes).some(v => v !== 0);
    }

    get hasRequirements() {
        return this.hasAttributeRequirements
            || this.hasSpecialistRequirements
            || this.hasBuildingRequirement;
    }

    meetsAttributeRequirements(settlement) {
        return Object.entries(this.requirements.attributes)
            .every(([k, v]) => v === 0 || settlement.attributes[k] >= v);
    }

    meetsBuildingRequirements(settlement) {
        const buildings = settlement.buildings;
        return [...this.requirements.buildingIds]
            .every(sId => buildings.has(sId));
    }

    meetsSpecialistRequirements(settlement) {
        return [...this.requirements.specialists]
            .every(specialist => settlement.specialists.has(specialist));
    }

    meetsScale(settlement) {
        return this.scale <= settlement.capacityAvailable;
    }

    /**
     * Checks whether a given settlement meets this building's requirements.
     * Does NOT check scale/capacity!
     * @param {Settlement} settlement 
     */
    meetsRequirements(settlement) {
        return this.meetsAttributeRequirements(settlement)
            && this.meetsBuildingRequirements(settlement)
            && this.meetsSpecialistRequirements(settlement);
    }

    /**
     * Checks whether this building can be constructed in a given settlement.
     * Checks both requirements and scale/capacity!
     * @param {Settlement} settlement 
     */
    canBeConstructed(settlement) {
        return this.meetsRequirements(settlement) 
            && this.meetsScale(settlement) 
            && !settlement.buildings.has(this.sId);
    }
}
