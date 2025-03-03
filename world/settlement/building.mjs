import { _defineDateSchema, _defineModifiersSchema, _defineAttributesSchema } from "./sharedSchemas.mjs";
import TaliaDate from "../../utils/TaliaDate.mjs";

export default class Building extends foundry.abstract.DataModel {
    static updateFields = [
        "effectText", 
        "flavorText", 
        "modifiers.attributes.authority",
        "modifiers.attributes.community",
        "modifiers.attributes.economy",
        "modifiers.attributes.progress",
        "modifiers.attributes.intrigue",
        "modifiers.capacity",
        "requirements.attributes.authority",
        "requirements.attributes.community",
        "requirements.attributes.economy",
        "requirements.attributes.progress",
        "requirements.attributes.intrigue",
        "requirements.buildings",
        "requirements.unlocked"
    ];

    static defineSchema() {
        const {
            StringField, SetField, SchemaField, HTMLField, NumberField, EmbeddedDataField
        } = foundry.data.fields;

        return {
            id: new StringField({ required: true, nullable: false, blank: false }),
            name: new StringField({ required: true, blank: false }),
            modifiers: new SchemaField( _defineModifiersSchema() ),
            scale: new NumberField({ initial: 0 }),
            requirements: new SchemaField({
                attributes: new SchemaField( _defineAttributesSchema() ),
                buildings: new SetField( new StringField() ),
                unlocked: new SetField( new StringField() ),
            }),
            flavorText: new StringField({ required: false, blank: true, initial: "" }),
            effectText: new StringField({ required: false, blank: true, initial: "" }),
            constructionDate: new EmbeddedDataField( TaliaDate )
        }
    }

    static database = new foundry.utils.Collection();

    static initData(buildingsData) {
        for(const dataObj of buildingsData) {
            Building.database.set(dataObj.id, dataObj);
        }
    }

    /** @returns {boolean} */
    get isBuilt() {
        const now = TaliaDate.now();
        return !this.constructionDate.isBeginning && (this.constructionDate.isBefore(now) || this.constructionDate.isSame(now))
    }

    /** Has this building been constructed within the last 30 days? */
    get isRecentlyConstructed() {
        if(!this.isBuilt) return false;
        const daysDiff = TaliaDate.now().inDays - this.constructionDate.inDays;
        return daysDiff <= 30;
    }

    get allRequirementsMet() {
        return !this.isBuilt
            && this._scaleMet
            && this._attributesMet
            && this._buildingsMet
            && this._unlockedMet
    }

    get _scaleMet() {
        return this.scale <= ( this.parent?.capacity.available ?? 0 );
    }

    get _attributesMet() {
        return Object.entries(this.requirements.attributes)
            .every(([k, v]) => v === 0 || this.parent?.attributes[k] >= v )
    }

    get _buildingsMet() {
        return [...this.requirements.buildings]
            .every(id => this.parent?.buildings[id].isBuilt)
    }

    get _unlockedMet() {
        return [...this.requirements.unlocked]
            .every(str => this.parent?.unlocked.has(str))
    }

    get hasModifiers() {
        return Object.values(this.modifiers).some(Boolean);
    }

    async setConstructionDate(date) {
        const newDate = date ? TaliaDate.fromDate(date) : new TaliaDate();
        return await this.parent.update({[`buildings.${this.id}.constructionDate`]: newDate});
    }

    async build() {
        return this.isBuilt ? null : await this.setConstructionDate(TaliaDate.now());
    }

    async destroy() {
        return this.isBuilt ? await this.setConstructionDate() : null;
    }
}
