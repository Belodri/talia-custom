import { TaliaCustomAPI } from "../../scripts/api.mjs";
import { MODULE } from "../../scripts/constants.mjs";

export default {
    register() {
        (async () => {
            await Effect.init();
            await Building.init();
            TaliaCustomAPI.add({Settlement}, "none");

            TaliaCustomAPI.add({SettlementJournalEntry}, "none");
        })();
    }
}

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
 * @typedef {Object} TaliaDate
 * @property {number} day       Day of the month, starting with 0. Total of 30 days in each month.
 * @property {number} month     Month of the year, starting with 0. Total of 12 months in each year.
 * @property {number} year      The year. Game start year is 1497.
 */

/**
 * @typedef {Object} SettlementObject
 * @property {string} name                                  The settlement's name
 * @property {TaliaDate} foundingDate                       The founding date in the Talian calender
 * @property {BuildingObject[]} constructedBuildings        An array of building objects that represent constructed buildings.
 * @property {EffectObject[]} currentEffects                An array of effect objects that represent the currently active effects.
 */

class Settlement {
    /*----------------------------------------------------------------------------
                    Static Properties            
    ----------------------------------------------------------------------------*/
    static baseAttributes = {
        authority: 0,
        economy: 0,
        community: 0,
        progress: 0,
        intrigue: 0,
    }
    static baseCapacity = 4;

    /*----------------------------------------------------------------------------
                    Static Methods            
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
    
    /**
     * Creates a journal entry for a new settlement.
     * @argument {string} settlementName    - The name of the settlement (and the journal).
     * @returns {Promise<JournalEntry>}     - The journal entry with the settlement flag.
     */
    static async createNewSettlement(settlementName) {
        if(!game.user.isGM) throw new Error("Only GM users can create new settlements.");
        if(typeof settlementName !== "string") throw new Error("The settlement's name has to be a string.")

        // make sure the settlement doesn't already exist
        const existingJournal = game.journal.getName(settlementName);
        if(existingJournal) throw new Error("A settlement journal with this name already exists. Each settlement must have a unique name.");

        //create a new journal entry for this settlement
        const documentData = {
            name: settlementName,
            ownership: {
                'default': CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
            }
        }
        const createdJournal = await JournalEntry.create(documentData);

        // create a new settlement
        const settlement = new Settlement({name: settlementName});
        const flagData = settlement.toJSON();
        
        //store the settlement on the document's flag and return it
        return await createdJournal.setFlag(MODULE.ID, "settlementData", flagData);

    }

    /**
     * Gets the journal entry document with the settlement.
     * @param {string} settlementName   - The name of the settlement (and the journal).
     * @returns {Promise<JournalEntry>} - The journal entry with the settlement flag.
     */
    static async getSettlementDoc(settlementName) {
        const journalDoc = game.journal.getName(settlementName);
        if(!journalDoc) throw new Error(`Couldn't find journal entry: ${settlementName}.`);

        return journalDoc;
    }

    /**
     * 
     * @param {JournalEntry} journalEntryDocument   - The journal entry with the settlement flag.
     * @returns {Settlement | undefined}            - The settlement instance or undefined.
     */
    static settlementFromDoc(journalEntryDocument) {
        const flagData = journalEntryDocument?.flags?.[MODULE.ID]?.["settlementData"];
        if(!flagData) return undefined;

        return new Settlement(flagData);
    }

    /*----------------------------------------------------------------------------
                    Instance Properties            
    ----------------------------------------------------------------------------*/


    /*----------------------------------------------------------------------------
                    Instance Methods            
    ----------------------------------------------------------------------------*/

    /** @param {SettlementObject} settlementData  */
    constructor(settlementData) {
        this.name = settlementData.name;
        this.foundingDate = settlementData.foundingDate ?? {day: 0, month: 0, year: 0};

        /** @type {Collection<string, Building>} */
        this.constructedBuildings = Building.collectionFromArray(settlementData.constructedBuildings ?? []);
        /** @type {Collection<string, Effect>} */
        this.currentEffects = Effect.collectionFromArray(settlementData.currentEffects ?? []);
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
            constructedBuildings: this.constructedBuildings.toJSON(),
            currentEffects: this.currentEffects.toJSON(),
        }
    }

    /**
     * Adds a building to the settlement's constructed buildings.
     * @param {string} buildingId The building's id as found in Building.allBuildings
     * @throws {Error} Will throw an error if buildingId is not a key of Building.allBuildings
     * @returns {this}
     */
    constructBuilding(buildingId) {
        //check if the building is already constructed
        if(this.constructedBuildings.has(buildingId)) {
            ui.notifications.warn(`Building ID: ${buildingId} is already constructed.`);
            return this;
        }

        const buildingObj = Building.allBuildings[buildingId];
        if(!buildingObj) throw new Error(`Building ID: ${buildingId} was not found in Building.allBuildings.`);

        const building = new Building(buildingObj)
            .setConstructionDate(this.currentDate);
        this.constructedBuildings.set(building.id, building);
        return this;
    }

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

        const effectObj = Effect.allEffects[effectId];
        if(!effectObj) throw new Error(`Effect ID: ${effectId} was not found in Effect.allEffects.`);

        const effect = new Effect(effectObj)
            .setBeginDate(this.currentDate);
        this.currentEffects.set(effect.id, effect);
        return this;
    }

    async saveToFlag() {

    }

    /*----------------------------------------------------------------------------
                    Getters            
    ----------------------------------------------------------------------------*/

    /**
     * Calculates the total attributes for the settlement by summing up the base attributes,
     * attributes from all constructed buildings, and attributes from current effects.
     */
    get attributes() {
        // Start with a copy of baseAttributes to avoid mutating the static object
        const attributes = {...Settlement.baseAttributes};

        // sum up the attributes from each constructed building
        for(let building of this.constructedBuildings) {
            for( let key in building.attributes) {
                attributes[key] += building.attributes[key];
            }
        }

        //sum up the attributes from each current effect
        for(let effect of this.currentEffects) {
            for( let key in effect.attributes) {
                attributes[key] += effect.attributes[key]
            }
        }

        return attributes;
    }

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
    get capacity() {
        return Settlement.baseCapacity + this.currentEffects.reduce((acc, curr) => acc += curr.capacityEffect ?? 0, 0)
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
            return date.year * 360 + date.month * 30 + date.day ?? 0;   
        }

        const currentDateInDays = convertToDays(this.currentDate);
        const filteredBuildings = this.constructedBuildings.filter(b => {   //true if the construction date is less than or equal to MAX_DAYS_APART days apart from the current date.
            const constructionDateInDays = convertToDays(b.constructionDate);
            const difference = Math.abs(currentDateInDays - constructionDateInDays);
            return difference <= MAX_DAYS_APART;
        });
        return filteredBuildings;
    }

    /**
     * @returns {Building[]}    An array of buildings that have not yet been constructed in this settlement.
     */
    get constructableBuildings() {
        return Object.entries(Building.allBuildings)
            .filter(([id, buildingObj]) => !this.constructedBuildings.has(id))
            .map(([id, buildingObj]) => buildingObj);
    }
}


/**
 * @typedef {Object} BuildingObject
 * @property {string} id                            - The unique identifier for the building (same as the key in `allBuildings`).
 * @property {string} name                          - The name of the building.
 * @property {number} scale                         - The scale of the building, representing its size or impact level.
 * @property {Object} attributes                    - The attributes that this building affects.  
 * @property {number} attributes.authority          - How much does this building increase/decrease authority.
 * @property {number} attributes.economy            - How much does this building increase/decrease economy.
 * @property {number} attributes.community          - How much does this building increase/decrease community.
 * @property {number} attributes.progress           - How much does this building increase/decrease progress.
 * @property {number} attributes.intrigue           - How much does this building increase/decrease intrigue.
 * @property {string} requirements                  - A description of requirements needed to construct the building.
 * @property {string} description                   - A detailed description of the building.
 * @property {string} buildingEffectDescription     - The building's persistent effect.
 * @property {TaliaDate | null} constructionDate    - The date the building was constructed. Null if the building hasn't been constructed yet.
 */

class Building {

    /*----------------------------------------------------------------------------
                    Static Properties            
    ----------------------------------------------------------------------------*/

    /**
     * An object of all buildings available in the game.
     * Each key in this object corresponds to the `id` property of its associated `BuildingObject`.
     * @type {Object<string, BuildingObject>}
     */
    static allBuildings;

    /*----------------------------------------------------------------------------
                    Static Methods            
    ----------------------------------------------------------------------------*/

    /**
     * Initializes the class by asynchronously loading JSON data for static property `allBuildings`
     * @returns {Promise<void>}  A promise that resolves when both `allBuildings` property is fully loaded.
     */
    static async init() {
        const fileName = "buildingData";
        const path = `modules/${MODULE.ID}/world/settlement/${fileName}.json`;
        const response = await fetch(path);
        Building.allBuildings = await response.json();
    }

    /**
     * Creates a Collection of Buildings from an array of building data
     * @param {BuildingObject[]} buildingsArray - Array of building data objects
     * @returns {Collection<string, Building>} A Collection of Buildings keyed by their IDs
     */
    static collectionFromArray(buildingObjArray) {
        const collection = new foundry.utils.Collection();
        for(let buildingObj of buildingObjArray) {
            const building = new Building(buildingObj);
            collection.set(building.id, building);
        }
        return collection;
    }

    /*----------------------------------------------------------------------------
                    Instance Methods            
    ----------------------------------------------------------------------------*/

    /** @param {BuildingObject} buildingObject */
    constructor(buildingObject) {
        //required properties
        this.id = buildingObject.id;
        this.name = buildingObject.name;
        this.scale = buildingObject.scale;
        this.attributes = {
            authority: buildingObject.attributes.authority,
            economy: buildingObject.attributes.economy,
            community: buildingObject.attributes.community,
            progress: buildingObject.attributes.progress,
            intrigue: buildingObject.attributes.intrigue,
        };
        this.requirements = buildingObject.requirements;
        this.description = buildingObject.description;
        this.buildingEffectDescription = buildingObject.buildingEffectDescription;

        //optional properties
        this.constructionDate = buildingObject.constructionDate ?? null;
    }

    /**
     * Returns a plain object representation of the building instance for JSON serialization.
     * This method is automatically called by JSON.stringify().
     * @returns {BuildingObject} A plain object containing the building's properties.
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            scale: this.scale,
            attributes: this.attributes,
            requirements: this.requirements,
            description: this.description,
            buildingEffectDescription: this.buildingEffectDescription,
            constructionDate: this.constructionDate,
        };
    }

    /**
     * Sets the construction date of the building.
     * @argument {TaliaDate} date   - The date of the building's construction.
     * @returns {this}
     */
    setConstructionDate(date) {
        this.constructionDate = {
            day: date.day, 
            month: date.month, 
            year: date.year
        }
        return this;
    }
}

/**
 * @typedef {Object} EffectObject
 * @property {string} id                    - The unique identifier for the effect (same as the key in `allEffects`).
 * @property {string} name                  - The name of the effect.
 * @property {Object} attributes            - The attributes that this effect affects.  
 * @property {number} attributes.authority  - How much does this effect increase/decrease authority.
 * @property {number} attributes.economy    - How much does this effect increase/decrease economy.
 * @property {number} attributes.community  - How much does this effect increase/decrease community.
 * @property {number} attributes.progress   - How much does this effect increase/decrease progress.
 * @property {number} attributes.intrigue   - How much does this effect increase/decrease intrigue.
 * @property {number} capacityEffect        - How much does this effect increase/decrease the settlement's capacity.
 * @property {string} description           - A detailed description of the effect.
 * @property {TaliaDate | null} beginDate   - The date the effect started. Null if the effect hasn't started yet.
 */
class Effect {

    /*----------------------------------------------------------------------------
                    Static Properties            
    ----------------------------------------------------------------------------*/

    /**
     * An object of all effects available in the game.
     * Each key in this object corresponds to the `id` property of its associated `EffectObject`.
     * @type {Object<string, EffectObject>}
     */
    static allEffects;

    /*----------------------------------------------------------------------------
                    Static Methods            
    ----------------------------------------------------------------------------*/

    /**
     * Initializes the class by asynchronously loading JSON data for static property `allEffects`
     * @returns {Promise<void>}  A promise that resolves when both `allEffects` property is fully loaded.
     */
    static async init() {
        const fileName = "effectData";
        const path = `modules/${MODULE.ID}/world/settlement/${fileName}.json`;
        const response = await fetch(path);
        Effect.allEffects = await response.json();
    }

    static collectionFromArray(effectObjArray) {
        const collection = new foundry.utils.Collection();
        for(let effectObj of effectObjArray) {
            const effect = new Effect(effectObj);
            collection.set(effect.id, effect);
        }
        return collection;
    }

    /*----------------------------------------------------------------------------
                    Instance Methods            
    ----------------------------------------------------------------------------*/

    /** @param {EffectObject} effectObject */
    constructor(effectObject) {
        //required properties
        this.id = effectObject.id;
        this.name = effectObject.name;
        this.attributes = {
            authority: effectObject.attributes.authority,
            economy: effectObject.attributes.economy,
            community: effectObject.attributes.community,
            progress: effectObject.attributes.progress,
            intrigue: effectObject.attributes.intrigue,
        };
        this.capacityEffect = effectObject.capacityEffect;
        this.description = effectObject.description;

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
            name: this.name,
            attributes: this.attributes,
            capacityEffect: this.capacityEffect,
            description: this.description,
            beginDate: this.beginDate,
        };
    }

    /**
     * Sets the begin date of the effect.
     * @argument {TaliaDate} date   - The date of the effects's begin.
     * @returns {this}
     */
    setBeginDate(date) {
        this.beginDate = {
            day: date.day, 
            month: date.month, 
            year: date.year
        }
        return this;
    }
}