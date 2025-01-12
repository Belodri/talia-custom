import { _defineAttributesSchema, _defineDateSchema } from "./shared.mjs";
import TaliaDate from "./TaliaDate.mjs";

/**
 * @typedef {object} EffectObject
 * @property {string} sId                       - The unique identifier for the effect (same as the key in `allEffects`).
 * @property {number | null} durationInDays     - How many days does this effect last? If null, the effect is permanent.
 * @property {number} capacity                  - How much does this effect increase/decrease the settlement's capacity.
 * @property {object} attributes                - The attributes that this effect affects.  
 * @property {number} attributes.authority      - How much does this effect increase/decrease authority.
 * @property {number} attributes.economy        - How much does this effect increase/decrease economy.
 * @property {number} attributes.community      - How much does this effect increase/decrease community.
 * @property {number} attributes.progress       - How much does this effect increase/decrease progress.
 * @property {number} attributes.intrigue       - How much does this effect increase/decrease intrigue.
 * @property {string} description               - A description of the effect.
 * @property {DateObj} beginDate                - The date of the effect begin.
 */


export default class Effect extends foundry.abstract.DataModel {
    /** @readonly */
    static database = new foundry.utils.Collection();

    static defineSchema() {
        const { StringField, NumberField, SchemaField, HTMLField } = foundry.data.fields;
        return {
            sId: new StringField({required: true, blank: false}),
            durationInDays: new NumberField({required: true, integer: true, nullable: true}),
            capacity: new NumberField({required: true, integer: true, nullable: false}),
            attributes: new SchemaField(_defineAttributesSchema()),
            description: new HTMLField({blank: true, initial: ""}),
            beginDate: new SchemaField(_defineDateSchema(), {nullable: false}),
        }
    }

    /**
     * Initialises the Effect.database collection from the effectsData array from sourceData
     * and freezes each entry as well as Effect.database itself.
     * @param {object[]} effectsData
     */
    static initDatabase(effectsData) {
        for(const dataObj of effectsData) {
            Effect.database.set( dataObj.sId, dataObj );
        }
    }

    constructor(data, options = {}) {
        super(data, options);
    }

    static apply(settlement, sId) {
        const databaseEntry = Effect.database.get(sId);
        if(!databaseEntry) throw new Error(`Effect not found | sId: "${sId}".`);
        if(settlement.effects.has(sId)) throw new Error(`Effect already active | sId: "${sId}"`);

        const effectData = foundry.utils.deepClone(databaseEntry);
        effectData.beginDate = TaliaDate.now().toObject();
        const effect = new Effect(effectData, {parent: settlement});
        return settlement.addEffect(effect);
    }

    /**
     * Sets the effect's begin date.
     * @param {import("./TaliaDate.mjs").DateObject} date
     */
    modifyBeginDate(date) {
        this.updateSource({beginDate: date});
        return this;
    }

    /** @returns {TaliaDate | null}     Null if the effect has an infinite duration. */
    get expiryDate() {
        return this.durationInDays === null ?  null 
            : TaliaDate.fromDate(this.beginDate)
                .getOffsetDate(this.durationInDays);
    }

    get hasBegun() {
        const nowInDays = TaliaDate.now().inDays();
        return nowInDays <= TaliaDate.fromDate(this.beginDate).inDays();
    }

    get isExpired() {
        const expiryDate = this.expiryDate();
        if(expiryDate === null) return false;

        const nowInDays = TaliaDate.now().inDays();
        return nowInDays > expiryDate.inDays();
    }

    get isActive() {
        return this.hasBegun && !this.isExpired;
    }

}
