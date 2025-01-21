import { _defineDateSchema, _defineModifiersSchema } from "./sharedSchemas.mjs";
import TaliaDate from "../../utils/TaliaDate.mjs";

export default class Effect extends foundry.abstract.DataModel {
    static defineSchema() {
        const {
            SchemaField, HTMLField, NumberField, StringField, EmbeddedDataField
        } = foundry.data.fields;

        return {
            id: new StringField({ required: true, nullable: false, blank: false }),
            name: new StringField({ required: true, nullable: false, blank: false }),
            monthsDuration: new NumberField({ required: true, integer: true, min: 0, nullable: false, initial: 0 }),  // 0 means the effect is permanent
            beginDate: new EmbeddedDataField( TaliaDate ),
            modifiers: new SchemaField( _defineModifiersSchema() ),
            flavorText: new StringField({ required: false, blank: true, initial: "" }),
            effectText: new StringField({ required: false, blank: true, initial: "" }),
        }
    }

    static database = new foundry.utils.Collection();

    static initData(effectsData) {
        for(const dataObj of effectsData) {
            Effect.database.set(dataObj.id, dataObj);
        }
    }

    get isTemporary() { return this.monthsDuration > 0 }

    /** The date on which the effect ends. If the effect is permanent, the endDate is 0/0/0000 */
    get endDate() {
        return TaliaDate.fromOffset(this.beginDate, { months: this.monthsDuration });
    }

    /** 
     * @returns {number} The remaining duration of an active effect in days; Infinity for permanent effects. 
     * Months duration in days for inactive effects 
     */
    get remainingDays() {
        if(this.isActive) {
            if(this.isTemporary) return this.endDate.inDays - TaliaDate.now().inDays;
            else return Infinity;
        } else return this.monthsDuration * TaliaDate.DAYS_IN_MONTH;
    }

    get isActive() {
        const now = TaliaDate.now();
        return ( this.beginDate.isBefore(now) ||this.beginDate.isSame(now) ) && this.endDate.isAfter(now);
    }

    async setBeginDate(date) {
        const newDate = TaliaDate.fromDate(date);
        return await this.parent.update({[`effects.${this.id}.beginDate`]: newDate});
    }

    async activate() {
        return this.isActive ? null : await this.setBeginDate(TaliaDate.now());
    }
    
    async deactivate() {
        return this.isActive ? await this.setBeginDate() : null;
    }
}
