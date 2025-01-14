import { MODULE } from "../../scripts/constants.mjs";
import Building from "./building.mjs"
import Effect from "./effect.mjs"
import { MappingField } from "../../utils/fields.mjs";
import { _defineAttributesSchema, _defineDateSchema } from "./shared.mjs";
import SettlementApp from "./settlementApp.mjs";

const {
    StringField, EmbeddedDataField, SetField, SchemaField, ObjectField
} = foundry.data.fields;

export default class Settlement extends foundry.abstract.DataModel {
    static SETTINGS_KEY = "settlementsDatabase";

    static defineSchema() {
        return {
            name: new StringField({ required: true, blank: false }),
            founding: new SchemaField(_defineDateSchema(), { required: true }),
            specialists: new SetField( new StringField(), {required: true, nullable: false, initial: []}),
            _buildings: new SetField( new EmbeddedDataField( Building )),
            _effects: new SetField( new EmbeddedDataField( Effect ))
        }
    }

    static init() {
        game.settings.register(MODULE.ID, Settlement.SETTINGS_KEY, {
            name: "Settlements",
            scope: "world",
            config: false,
            requiresReload: false,
            type: Object,
            default: {},
        });
    }

    constructor(data, options = {}) {
        super(data, options);
    }

    //#region Database Operations

    /**
     * @typedef {{[key: string]: object}} SettingsData
     * An object where the keys are the names of settlements, and the values are their corresponding data.
     */

    /** @returns {SettingsData} */
    static #getSettingData() {
        return game.settings.get(MODULE.ID, Settlement.SETTINGS_KEY, {strict: false});
    }

    /** @returns {Promise<SettingsData>} */
    static async #setSettingData(data) {
        return game.settings.set(MODULE.ID, Settlement.SETTINGS_KEY, data);
    }

    /**
     * Saves the Settlement to the database.
     * @param {boolean} [overwrite=true]    If false, an error will be thrown if trying to overwrite an existing settlement. 
     */
    async save(overwrite = true) {
        const data = Settlement.#getSettingData();
        if(!overwrite && data[this.name]) throw new Error(`Disallowed overwrite of settlement "${this.name}".`);
        
        data[this.name] = this.toObject(false);
        return Settlement.#setSettingData(data);
    }

    /**
     * Deletes an existing Settlement from the database.
     * @param {string} settlementName 
     */
    static async delete(settlementName) {
        const data = Settlement.#getSettingData();
        if(!data[settlementName]) throw new Error(`No settlement named "${settlementName}" found.`);

        delete data[settlementName];
        return Settlement.#setSettingData(data);
    }

    /**
     * Gets an existing Settlement from the database.
     * @param {string} settlementName 
     */
    static get(settlementName) {
        const data = Settlement.#getSettingData();
        const obj = data[settlementName];
        if(!obj) throw new Error(`No settlement named "${settlementName}" found.`);

        return Settlement.fromSource(obj, {strict: true});
    }

    //#endregion

    //#region Derived Data

    get attributes() {
        const attr = {
            authority: 0,
            economy: 0,
            community: 0,
            progress: 0,
            intrigue: 0,
        };
    
        for(const building of this.buildings) {
            attr.authority += building.attributes.authority;
            attr.economy += building.attributes.economy;
            attr.community += building.attributes.community;
            attr.progress += building.attributes.progress;
            attr.intrigue += building.attributes.intrigue;
        }

        for(const effect of this.effects) {
            if(!effect.isActive) continue;
            attr.authority += effect.attributes.authority;
            attr.economy += effect.attributes.economy;
            attr.community += effect.attributes.community;
            attr.progress += effect.attributes.progress;
            attr.intrigue += effect.attributes.intrigue;
        }
    
        return attr;
    }

    get app() {
        return new SettlementApp(this);
    }

    /**
     * The sum of scale of buildings constructed within the last 30 days.
     * @returns {number}
     */
    get constructionScale() {
        return this.buildings.reduce((acc, curr) => acc += curr.occupiedCapacity, 0);
    }

    get capacityAvailable() {
        return this.capacity - this.constructionScale;
    }

    /**
     * The total capacity of the settlement.
     * @returns {number}
     */
    get capacity() {
        const base = 4;
        const buildingCapacity = this.buildings.reduce((acc, curr) => acc += curr.capacity, 0);
        const effectCapacity = this.effects.reduce((acc, curr) => acc += curr.capacity, 0);

        return base + buildingCapacity + effectCapacity;
    }

    //#endregion

    //#region Buildings

    get buildings() {
        const mapping = this._buildings.map(b => [b.sId, b]);
        return new foundry.utils.Collection(mapping);
    }

    async addBuilding(building) {
        if(this.buildings.has(building.sId)) return;    //no duplicate buildings
        this.updateSource({_buildings: this._buildings.add(building)});
        return await this.save();
    }

    async removeBuilding(building) {
        const buildings = this.buildings;
        buildings.delete(building.sId);
        const setAfterDeletion = new Set(buildings);
        this.updateSource({_buildings: setAfterDeletion});
        return await this.save();
    }

    //#endregion

    //#region Effects

    get effects() {
        const mapping = this._effects   
            .map(e => [e.sId, e]);
        return new foundry.utils.Collection(mapping);
    }

    get activeEffects() {
        const mapping = this._effects
            .filter(e => e.isActive)
            .map(e => [e.sId, e]);
        return new foundry.utils.Collection(mapping);
    }

    get expiredEffects() {
        const mapping = this._effects
            .filter(e => e.isExpired)
            .map(e => [e.sId, e]);
        return new foundry.utils.Collection(mapping);
    }

    addEffect(effect) {
        return this.updateSource({_effects: this._effects.add(effect)});
    }

    removeEffect(effect) {
        const effects = this.effects;
        effects.delete(effect.sId);
        const setAfterDeletion = new Set(buildings);
        return this.updateSource({_effects: setAfterDeletion});
    }

    //#endregion

    //#region Specialists

    /*
        Specialists are represented by simple strings;
        Can be anything a building could require that's not otherwise part of the settlement's data.
    */

    /**
     * @param {string} specialist   
     */
    addSpecialist(specialist) {
        return this.updateSource({specialists: this.specialists.add(specialist)});
    }

    /**
     * @param {string} specialist 
     */
    removeSpecialist(specialist) {
        return this.updateSource({specialists: this.specialists.delete(specialist)});
    }

    //#endregion

}


let ALL_BUILDINGS;
let ALL_EFFECTS;

/*
    What data does the settlement UI need?

    - settlement name              
    - founding date
    - derived attributes
    - constructed buildings
    - available buildings
    - active events
    - factions
    - advisors
*/

/*
    TODO
    - add a saveToFlag method
    - add a loadFromFlag method
    - add advisors (no need for separate class, just make it an object)
    - add effects to effectData
    - UI
*/


/**
 * @typedef {object} TaliaDate
 * @property {number} day       Day of the month, starting with 0. Total of 30 days in each month.
 * @property {number} month     Month of the year, starting with 0. Total of 12 months in each year.
 * @property {number} year      The year. Game start year is 1497.
 */

const buildings = new foundry.utils.Collection();


/**
 * @typedef {object} SettlementObject
 * @property {string} name                                      The settlement's name
 * @property {TaliaDate} foundingDate                           The founding date in the Talian calender
 * @property {string[]} buildingIds                             An array of building ids that represent constructed buildings.
 * @property {string[]} effectIds                               An array of effect ids that represent the currently active effects.
 * @property {Map<[key: string], TaliaDate>} constructionLog    A map of buildingIds with a corresponding date.
 * @property {Map<[key: string], TaliaDate>} 
 */

class _Settlement {
    /*----------------------------------------------------------------------------
                    Static Properties            
    ----------------------------------------------------------------------------*/
    static SETTINGS_KEY = "settlementsJSONData";

    static baseAttributes = {
        authority: 0,
        economy: 0,
        community: 0,
        progress: 0,
        intrigue: 0,
    }

    static baseCapacity = 4;

    /*----------------------------------------------------------------------------
                    Instance Properties            
    ----------------------------------------------------------------------------*/

    #buildingIds = new Set();
    #effectIds = new Set();

    /*----------------------------------------------------------------------------
                    Instance Methods            
    ----------------------------------------------------------------------------*/

    /** @param {SettlementObject} settlementObject  */
    constructor(settlementObject) {
        this.name = settlementObject.name;
        this.foundingDate = settlementObject.foundingDate;

        this.#buildingIds = new Set(settlementObject.buildingIds ?? []);
        this.#effectIds = new Set(settlementObject.effectIds ?? []);
    }

    /**
     * Returns a plain object representation of the settlement instance for JSON serialization.
     * This method is automatically called by JSON.stringify().
     * @returns {SettlementObject} A plain object containing the settlement's properties.
     */
    toJSON() {
        return {
            name: this.name,
            foundingDate: this.foundingDate,
            buildingIds: this.#buildingIds,
            effectIds: this.#effectIds,
        }
    }

    /*----------------------------------------------------------------------------
                    Testing          
    ----------------------------------------------------------------------------*/

    static getTestData() {
        return {
            name: "testSettlement",
            foundingDate: {
                day: 0,
                month: 6,
                year: 1497
            },
        };
    }

    /*----------------------------------------------------------------------------
                    Database Operations            
    ----------------------------------------------------------------------------*/
    //#region Database Operations
    

    /**
     * @typedef {{[key: string]: SettlementObject}} SettingsData
     * An object where the keys are the names of settlements, and the values are their corresponding data.
     */

    /** @returns {SettingsData} */
    static #getSettingData() {
        return game.settings.get(MODULE.ID, _Settlement.SETTINGS_KEY);
    }

    /** @returns {Promise<SettingsData>} */
    static async #setSettingData(data) {
        return game.settings.set(MODULE.ID, _Settlement.SETTINGS_KEY, data);
    }

    /**
     * Creates a new Settlement on the database.
     * @param {{name: string, foundingDate: TaliaDate}} creationData 
     */
    static async create({name, foundingDate}) {
        if(!game.user.isGM) throw new Error("Only GM users can create new settlements.");
        if(typeof name !== "string" || Object.values(foundingDate).every(v => typeof v === "number")) {
            throw new Error(`Invalid arguments.`);
        }

        const data = _Settlement.#getSettingData();
        if(data[name]) throw new Error(`A settlement with the name "${name}" already exists.`);
        data[name] = new _Settlement({name, foundingDate});
        await _Settlement.#setSettingData(data);

        return _Settlement.get(name);
    }

    /**
     * Updates an existing Settlement on the database.
     */
    async update() {
        const data = _Settlement.#getSettingData();
        if(!data[this.name]) throw new Error(`No settlement named "${this.name}" found.`);

        data[this.name] = this;
        return _Settlement.#setSettingData(data);
    }

    /**
     * Deletes an existing Settlement from the database.
     * @param {string} settlementName 
     */
    static async delete(settlementName) {
        const data = _Settlement.#getSettingData();
        if(!data[settlementName]) throw new Error(`No settlement named "${settlementName}" found.`);

        delete data[settlementName];
        return _Settlement.#setSettingData(data);
    }

    /**
     * Gets an existing Settlement from the database.
     * @param {string} settlementName 
     */
    static get(settlementName) {
        const data = _Settlement.#getSettingData();
        if(!data[settlementName]) throw new Error(`No settlement named "${settlementName}" found.`);
        return new _Settlement(data[settlementName]);
    }

    //#endregion
    

    /*----------------------------------------------------------------------------
                    Building Handling         
    ----------------------------------------------------------------------------*/
    //#region 

    get buildings() {
        return 
    }

    get constructableBuildings() {
        return Building.database.filter(b => !this.buildings.has(b.id))
    }

    #canBeConstructed(building) {
        
    }

    addBuilding(id, constructionDate = {}) {

    }


    /**
     * Adds a building to the settlement's constructed buildings.
     * @param {string} buildingId
     * @returns {this}
     */
    constructBuilding(buildingId, constructionDate = undefined) {
        //check if the building is already constructed
        if(this.constructedBuildings.has(buildingId)) {
            ui.notifications.warn(`Building ID: ${buildingId} is already constructed.`);
            return this;
        }

        
    }

    //#endregion

    /**
     * Adds an effect to the settlement's current effects.
     * @param {string} effectId The effect's id as found in Effect.allEffects
     * @throws {Error} Will throw an error if effectId is not a key of Effect.allEffects
     * @returns {this}
     */
    beginEffect(effectId) {
        //check if the effect is already active
        if(this.currentEffects.get(effectId)) {
            ui.notifications.warn(`Effect ID: ${effectId} is already active.`);
            return this;
        }

        const effectObj = _Effect.allEffects[effectId];
        if(!effectObj) throw new Error(`Effect ID: ${effectId} was not found in Effect.allEffects.`);

        const effect = new _Effect(effectObj)
            .setBeginDate(this.currentDate);
        this.currentEffects.set(effect.id, effect);
        return this;
    }


    /*----------------------------------------------------------------------------
                    Getters            
    ----------------------------------------------------------------------------*/

    /**
     * Gets the current date from simple calendar.
     * @returns {TaliaDate} The current date in TaliaDate format.
     */
    get currentDate() {
        const simpleCalendarDate = SimpleCalendar.api.currentDateTime();
        return {
            day: simpleCalendarDate.day,
            month: simpleCalendarDate.month,
            year: simpleCalendarDate.year
        }
    }

    /**
     * Calculates the total capacity of the settlement by summing up the base capacity and all capacityEffects from current effects.
     * @returns {number}    The total capacity of the settlement
     */
    get maxCapacity() {
        
    }

    get currentCapacity() {

    }

    /**
     * @returns {number}   The sum of scale of all recently constructed buildings. 
     */
    get constructionScale() {
        return this.recentlyConstructedBuildings.reduce((acc, curr) => acc += curr.scale, 0)
    }

    /**
     * @returns {Building[]}    An array of buildings that have been constructed within the last MAX_DAYS_APART days.
     */
    get recentlyConstructedBuildings() {
        const MAX_DAYS_APART = 30; 
        /**
         * Converts a TaliaDate into an absolute day count.
         * @param {TaliaDate} date
         * @returns {number} The total day count from a base date (day 0, month 0, year 0).
         */
        function convertToDays(date) {
            return ( date.year * 360 ) + ( date.month * 30 ) + date.day ?? 0;   
        }

        const currentDateInDays = convertToDays(this.currentDate);
        const filteredBuildings = this.constructedBuildings.filter(b => {   //true if the construction date is less than or equal to MAX_DAYS_APART days apart from the current date.
            const constructionDateInDays = convertToDays(b.constructionDate);
            const difference = Math.abs(currentDateInDays - constructionDateInDays);
            return difference <= MAX_DAYS_APART;
        });
        return filteredBuildings;
    }


}

/**
 * @typedef {object} SettlementAttributes
 * @property {number} authority
 * @property {number} economy
 * @property {number} community
 * @property {number} progress
 * @property {number} intrigue
 */

/**
 * @typedef {object} BuildingRequirements
 * @property {SettlementAttributes} attributes      What are the minimum attributes the settlement must have to construct this building?
 * @property {string[]} buildingIds                 What buildings must already be constructed in the settlement to construct this building?
 * @property {string[]} specialistIds               What specialists must already be in the settlement to construct this building?
 * @property {string[]} effectIds                   What effects need to be active in the settlement to construct this building?
 */

/**
 * @typedef {object} BuildingObject
 * @property {string} id                                - The unique identifier for the building (same as the key in `allBuildings`).
 * @property {string} name                              - The name of the building.
 * @property {number} scale                             - The scale of the building, representing its size or impact level.
 * @property {number} capacity                          - By how much does this building incrase the capacity of the settlement? 
 * @property {SettlementAttributes} attributes          - The attributes that this building affects.  
 * @property {BuildingRequirements} requirements        - What is required to construct the building?
 * @property {string} flavorText                        - Thematic flavor text.
 * @property {string[]} buildingEffectIds               - Which effects does the settlement gain once the building is constructed?
 * @property {TaliaDate | undefined} constructionDate    - The date the building was constructed. Null if the building hasn't been constructed yet.
 */



/**
 * The structure of the raw json 
 * @typedef {object} BuildingSourceData
 * @property {string} id
 * @property {string} name
 * @property {number} scale
 * @property {number} capacity
 * @property {object} attributes
 * @property {number} [attributes.authority]
 * @property {number} [attributes.economy]
 * @property {number} [attributes.community]
 * @property {number} [attributes.progress]
 * @property {number} [attributes.intrigue]
 * @property {object} [requirements]
 * @property {object} [requirements.attributes]
 * @property {number} [requirements.attributes.authority]
 * @property {number} [requirements.attributes.economy]
 * @property {number} [requirements.attributes.community]
 * @property {number} [requirements.attributes.progress]
 * @property {number} [requirements.attributes.intrigue]
 * @property {string[]} [requirements.buildingIds]
 * @property {string[]} [requirements.specialists]
 * @property {string[]} [requirements.effectIds]
 * @property {string} flavorText
 * @property {string[]} buildingEffectIds
 */


class _Building {

    /*----------------------------------------------------------------------------
                    Static Properties            
    ----------------------------------------------------------------------------*/

    /**
     * A collection of all buildings available in the game.
     * @type {foundry.utils.Collection<[key: string], Building>}
     */
    static #allBuildings = new foundry.utils.Collection();

    /*----------------------------------------------------------------------------
                    Instance Properties            
    ----------------------------------------------------------------------------*/

    /**
     * @type {_Settlement} The settlement this building is constructed in.
     */
    settlement;

    /** @type {TaliaDate} The date of this building's construction. */
    constructionDate;

    /*----------------------------------------------------------------------------
                    Static Methods            
    ----------------------------------------------------------------------------*/

    /**
     * Initializes the class
     * @param {BuildingSourceData[]} buildingsData 
     */
    static init(buildingsData) {
        Building.#allFromSource(buildingsData);
    }

    /**
     * Populates Building.#allBuildings with Buildings from given source data.
     * @param {BuildingSourceData[]} sourceData 
     */
    static #allFromSource(sourceData) {
        const getDataObj = (raw) => {
            return {
                id: raw.id,
                name: raw.name,
                scale: raw.scale,
                capacity: raw.capacity ?? 0,
                attributes: {
                    authority: raw.attributes.authority ?? 0,
                    economy: raw.attributes.economy ?? 0,
                    community: raw.attributes.community ?? 0,
                    progress: raw.attributes.progress ?? 0,
                    intrigue: raw.attributes.intrigue ?? 0
                },
                requirements: {
                    attributes: {
                        authority: raw.requirements.attributes.authority ?? 0,
                        economy: raw.requirements.attributes.economy ?? 0,
                        community: raw.requirements.attributes.community ?? 0,
                        progress: raw.requirements.attributes.progress ?? 0,
                        intrigue: raw.requirements.attributes.intrigue ?? 0
                    },
                    buildingIds: raw.requirements.buildingIds ?? [],
                    specialistIds: raw.requirements.specialistIds ?? [],
                    effectIds: raw.requirements.effectIds ?? [],
                },
                flavorText: raw.flavorText,
                buildingEffectIds: raw.buildingEffectIds ?? [],
            };
        }

        const isValid = (obj) => {
            return obj.id && typeof obj.id === "string"
                && obj.name && typeof obj.name === "string"
                && typeof obj.scale === "number"
                && typeof obj.capacity === "number"
                && typeof obj.attributes?.authority === "number"
                && typeof obj.attributes?.economy === "number"
                && typeof obj.attributes?.community === "number"
                && typeof obj.attributes?.progress === "number"
                && typeof obj.attributes?.intrigue === "number"
                && typeof obj.requirements?.attributes?.authority === "number"
                && typeof obj.requirements?.attributes?.economy === "number"
                && typeof obj.requirements?.attributes?.community === "number"
                && typeof obj.requirements?.attributes?.progress === "number"
                && typeof obj.requirements?.attributes?.intrigue === "number"
                && obj.requirements?.buildingIds.every(id => typeof id === "string")
                && obj.requirements?.specialistIds.every(id => typeof id === "string")
                && obj.requirements?.effectIds.every(id => typeof id === "string")
                && obj.flavorText && typeof obj.flavorText === "string"
                && obj.buildingEffectIds.every(id => typeof id === "string")
        }

        const seen = new Set();
        for(const rawObj of sourceData) {
            if(seen.has(rawObj.id)) continue;
            seen.add(rawObj.id);

            const buildingObj = getDataObj(rawObj);
            if(!isValid(buildingObj)) {
                console.error(`Invalid building object: `, buildingObj);
                continue;
            }

            const building = new Building(buildingObj);
            Building.#allBuildings.set(building.id, building);
        }
    }

    static get allBuildings() {
        return Building.#allBuildings;
    }

    /*----------------------------------------------------------------------------
                    Instance Methods            
    ----------------------------------------------------------------------------*/

    /**
     * 
     * @param {BuildingObject} data 
     */
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.scale = data.scale;
        this.capacity = data.capacity;
        this.attributes = {
            authority: data.attributes.authority,
            economy: data.attributes.economy,
            community: data.attributes.community,
            progress: data.attributes.progress,
            intrigue: data.attributes.intrigue,
        };
        this.requirements = data.requirements;
        this.flavorText = data.flavorText;
        this.buildingEffectIds = data.buildingEffectIds;

        this.settlement = data.settlement;
        this.constructionDate = data.constructionDate;

    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            scale: this.scale,
            capacity: this.capacity,
            attributes: {
                authority: this.attributes.authority,
                economy: this.attributes.economy,
                community: this.attributes.community,
                progress: this.attributes.progress,
                intrigue: this.attributes.intrigue,
            },
            requirements: this.requirements,
            flavorText: this.flavorText,
            buildingEffectIds: this.buildingEffectIds,

        }
    }



    /**
     * Can this buildng be constructed in a given settlement?
     * @param {_Settlement} settlement 
     */
    canBeConstructed(settlement) {
        if(settlement.buildings.has(this.id)) return false;

        
    }

    construct(settlement, constructionDate) {

        const building = new Building()
        this.settlement = settlement;
        this.constructionDate = constructionDate;
    }


}

/**
 * @typedef {object} EffectObject
 * @property {string} id                        - The unique identifier for the effect (same as the key in `allEffects`).
 * @property {number} durationInDays            - How many days does this effect last? If 0, the effect is permanent.
 * @property {number} capacity                  - How much does this effect increase/decrease the settlement's capacity.
 * @property {object} attributes                - The attributes that this effect affects.  
 * @property {number} attributes.authority      - How much does this effect increase/decrease authority.
 * @property {number} attributes.economy        - How much does this effect increase/decrease economy.
 * @property {number} attributes.community      - How much does this effect increase/decrease community.
 * @property {number} attributes.progress       - How much does this effect increase/decrease progress.
 * @property {number} attributes.intrigue       - How much does this effect increase/decrease intrigue.
 * @property {string} description               - A description of the effect.
 * @property {TaliaDate | undefined} beginDate   - The date the effect started. Undefined for effects have have not started.
 */
class _Effect {

    /*----------------------------------------------------------------------------
                    Static Properties            
    ----------------------------------------------------------------------------*/

    /**
     * A collection of all effects available in the game.
     * @type {foundry.utils.Collection<[key: string], EffectObject>}
     */
    static effectsDatabase = new foundry.utils.Collection();

    /*----------------------------------------------------------------------------
                    Instance Properties            
    ----------------------------------------------------------------------------*/

    /*----------------------------------------------------------------------------
                    Static Methods            
    ----------------------------------------------------------------------------*/

    /**
     * @typedef {object} EffectsSourceData
     * @property {string} id
     * @property {number} durationInDays
     * @property {number} attributes.authority      
     * @property {number} attributes.economy        
     * @property {number} attributes.community      
     * @property {number} attributes.progress 
     * @property {number} attributes.intrigue 
     * @property {string} effectDescription
     */

    /**
     * Initializes the class
     * @param {EffectsSourceData} effectsSourceData 
     */
    static init(effectsSourceData) {
        _Effect.#addObjectsToEffectsDatabase(effectsSourceData);
    }

    static #addObjectsToEffectsDatabase(sourceData) {
        const getDataObj = (raw) => {
            return {
                id: raw.id,
                durationInDays: raw.durationInDays ?? 0,
                capacity: raw.capacity ?? 0,
                attributes: {
                    authority: raw.attributes.authority ?? 0,
                    economy: raw.attributes.economy ?? 0,
                    community: raw.attributes.community ?? 0,
                    progress: raw.attributes.progress ?? 0,
                    intrigue: raw.attributes.intrigue ?? 0
                },
                effectDescription: raw.effectDescription,
            };
        }

        const isValid = (obj) => {
            return obj.id && typeof obj.id === "string"
                && typeof obj.durationInDays === "number"
                && typeof obj.capacity === "number"
                && typeof obj.attributes?.authority === "number"
                && typeof obj.attributes?.economy === "number"
                && typeof obj.attributes?.community === "number"
                && typeof obj.attributes?.progress === "number"
                && typeof obj.attributes?.intrigue === "number"
                && obj.effectDescription && typeof obj.effectDescription === "string"
        }

        const seen = new Set();
        for(const rawObj of sourceData) {
            if(seen.has(rawObj.id)) continue;
            seen.add(rawObj.id);

            const effectObj = getDataObj(rawObj);
            if(!isValid(effectObj)) {
                console.error(`Invalid effect object: `, effectObj);
                continue;
            }

            //Building.#buildingsDatabase.set(effectObj.id, effectObj);
        }
    }

    /*----------------------------------------------------------------------------
                    Instance Methods            
    ----------------------------------------------------------------------------*/

    /** 
     * @param {EffectObject} effectObject 
     * @param {_Settlement} settlement
     */
    constructor(effectObject, settlement) {
        //required properties
        this.settlement = settlement
        this.id = effectObject.id;
        this.durationInDays = effectObject.durationInDays;
        this.attributes = {
            authority: effectObject.attributes.authority,
            economy: effectObject.attributes.economy,
            community: effectObject.attributes.community,
            progress: effectObject.attributes.progress,
            intrigue: effectObject.attributes.intrigue,
        };
        this.capacity = effectObject.capacity;
        this.effectDescription = effectObject.effectDescription;

        //optional properties
        this.beginDate = effectObject.beginDate ?? null;
    }

    /**
     * Returns a plain object representation of the effect instance for JSON serialization.
     * This method is automatically called by JSON.stringify().
     * @returns {EffectObject} A plain object containing the effect's properties.
     */
    toJSON() {
        return {
            id: this.id,
            durationInDays: this.durationInDays,
            attributes: this.attributes,
            capacity: this.capacity,
            description: this.description,
            beginDate: this.beginDate,
        };
    }
}
