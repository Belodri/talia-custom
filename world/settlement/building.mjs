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
                ),
                effectIds: new SetField(
                    new StringField({ required: false, blank: false}),
                    { required: true, initial: [] }
                ),
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

    constructor(data, options = {}) {
        super(data, options);
    }

    /**
     * @param {Settlement} settlement 
     * @param {string} sId 
     */
    static build(settlement, sId) {
        const databaseEntry = Building.database.get(sId);
        if(!databaseEntry) throw new Error(`Building not found | sId: "${sId}".`);
        if(settlement.buildings.has(sId)) throw new Error(`Building already constructed | sId: "${sId}"`);

        const buildingData = foundry.utils.deepClone(databaseEntry);
        buildingData.constructionDate = TaliaDate.now().toObject();
        const building = new Building(buildingData, {parent: settlement});
        return settlement.addBuilding(building);
    }

    destroy() {
        this.settlement.removeBuilding(this);
        return this.updateSource({}, {parent: null});  //No idea if it'll get garbage collected otherwise.
    }

    /**
     * Sets the building's construction date.
     * @param {import("./TaliaDate.mjs").DateObject} date
     */
    modifyConstructionDate(date) {
        this.updateSource({constructionDate: date});
        return this;
    }

    /**
     * Has this building been constructed within the last 30 days?
     */
    get recentlyConstructed() {
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
}
