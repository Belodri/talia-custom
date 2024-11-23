import { Adventurer } from "./adventurer.mjs";
import { Helpers } from "../../utils/helpers.mjs";

/*  WORKFLOW

    Roll everything at the same time once the mission is accepted.
    Then display the results through buttons on the UI.
*/

/**
 * @typedef {object} MissionDataObject
 * @property {string} name                      The name of the mission.
 * @property {string} id                        The id of the mission.
 * @property {object} dc                        The missions difficulty class for each attribute.
 * @property {number} dc.brawn                       
 * @property {number} dc.cunning                
 * @property {number} dc.spellcraft             
 * @property {number} dc.influence              
 * @property {number} dc.reliability    
 * @property {string} description               A very brief description of what the mission entails
 */

export class Mission {
    /*----------------------------------------------------------------------------
                    Static Properties            
    ----------------------------------------------------------------------------*/
    static CONFIG = {
        minDC: 10,
        maxDC: 25,
    }

    static MAJOR_ATTRIBUTE_KEYS = ["brawn", "cunning", "spellcraft", "influence"];

    static RELIABILITY_KEY = "reliability";


    /*----------------------------------------------------------------------------
                    Instance Properties            
    ----------------------------------------------------------------------------*/

    attributeDCs = {
        brawn: 0,
        cunning: 0,
        spellcraft: 0,
        influence: 0,
        reliability: 0
    };

    /**
     * Holds the results of mission rolls, including rolls for major attributes and reliability.
     * Initially set to `null`, and later populated with an object containing roll results.
     * 
     * @type {null | { 
     *   major: {[key: string]: RollResult}, 
     *   reliability: {[key: string]: RollResult}
     * }}
     */
    missionRolls = null;

    /** 
     * @type {Collection<string, Adventurer>} 
     */
    _assignedAdventurers = new foundry.utils.Collection();
    /*----------------------------------------------------------------------------
                    Instance Methods            
    ----------------------------------------------------------------------------*/

    /**
     * 
     * @param {MissionDataObject} dataObject 
     */
    constructor(dataObject = {}) {
        this.name = dataObject.name ?? "New Mission";
        this.id = dataObject.id ?? foundry.utils.randomID();
        this.description = dataObject.description ?? "";

        for(let [k, _] of Object.entries(this.attributeDCs)) {
            this.attributeDCs[k] = dataObject.rawAttributeDCs[k] ?? 
                (Helpers.getRandomInt(Mission.CONFIG.minDC, Mission.CONFIG.maxDC));
        }
        for(let value of dataObject.assignedAdventurers) {
            const adventurer = new Adventurer(value);
            this._assignedAdventurers.set(adventurer.id, adventurer);
        }
    }

    /**
     * Returns a plain object representation of the adventurer instance for JSON serialization.
     * This method is automatically called by JSON.stringify().
     * @returns {MissionDataObject} A plain object containing the adventurer's properties.
     */
    toJSON() {
        return {
            name: this.name,
            id: this.id,
            attributesDCs: foundry.utils.deepClone(this.attributeDCs),
            assignedAdventurers: this._assignedAdventurers.toJSON(),
        }
    }

    /**
     * Assigns an adventurer to this mission.
     * @param {Adventurer} adventurer 
     * @returns {Adventurer | null} Returns the null if the adventurer could not be assigned to the mission. Otherwise returns the adventurer.
     */
    assignAdventurer(adventurer) {
        if(this._assignedAdventurers.size >= 4) {
            ui.notifications.warn("You can only assign up to 4 adventurers to one mission.");
            return null;
        }
        return this._assignedAdventurers.set(adventurer.id, adventurer);
    }

    /**
     * Unassign an adventurer from this mission.
     * @param {Adventurer} adventurer 
     * @returns {boolean} True if the adventurer exists in the collection and has been removed, false otherwise.
     */
    unassignAdventurer(adventurer) {
        return this._assignedAdventurers.delete(adventurer.id)
    }

    /**
     * Gets the adventurer with the highest total modifier for a given attribute key
     * @param {string} attributeKey 
     * @returns {Adventurer | undefined} The adventurer or undefined if none could be found in the collection. 
     */
    getBestAdventurerForAttribute(attributeKey) {
        if(!Object.keys(this.attributeDCs).includes(attributeKey)) throw new Error(`Invalid argument: ${attributeKey}.`);
        let highestTotal = 0;
        let best;
        for(let adventurer of this._assignedAdventurers) {
            let total = adventurer.attributes[attributeKey].mod + adventurer.experienceBonus;
            if(total > highestTotal) {
                highestTotal = total;
                best = adventurer;
            }
        }
        return best;
    }

    /**
     * Rolls all relevant rolls for the mission so they can be accessed later.
     * @returns {this}
     */
    async _setAllMissionRolls() {
        const missionRolls = {
            /** 
             * RollResults for each major attribute, where the keys are attribute names (e.g., "brawn") and values are RollResult objects.
             * @type {{[key: string]: RollResult}} 
             */
            major: {},
            /**
             * Reliability RollResults for each adventurer, where the keys are adventurer IDs and values are RollResult objects. 
             * @type {{[key: string]: RollResult}} 
             */
            reliability: {},
        };
        //set the major mission rolls
        for(let key of Mission.MAJOR_ATTRIBUTE_KEYS) {
            const bestAdventurer = this.getBestAdventurerForAttribute(key);
            missionRolls.major[key] = await bestAdventurer.rollAttribute(key, this.attributeDCs[key]);
        }

        //set the reliability rolls
        for(let adventurer of this._assignedAdventurers) {
            missionRolls.reliability[adventurer.id] = await adventurer.rollAttribute(Mission.RELIABILITY_KEY, this.attributeDCs[Mission.RELIABILITY_KEY]);
        }
        this.missionRolls = missionRolls;
        return this;
    }
    

    /*----------------------------------------------------------------------------
                    Getters            
    ----------------------------------------------------------------------------*/
    /**
     * @returns {boolean} True if missionRolls is not null.
     */
    get isRolled() {
        return this.missionRolls !== null;
    }

    /**
     * @returns {number} The number of adventurers assigned to this mission.
     */
    get adventurerCount() {
        return this._assignedAdventurers.size;
    }

    /**
     * Calculates the actual reward based on mission outcomes, considering the results of major attribute rolls and reliability rolls.
     * @throws {Error} If the mission checks have not been rolled yet.
     * @returns {number} The actual reward, adjusted based on major and reliability roll results.
     */
    get actualReward() {
        if(!this.isRolled) throw new Error("Actual reward cannot be determined until the mission checks have been rolled.");

        // Calculate the multiplier for major attribute rolls
        let majorRewardMultiplier = 1;
        for(let rollResult of Object.values(this.missionRolls.major)) {
            if(rollResult.isCritical) majorRewardMultiplier += 0.5;       // Critical success increases reward by 50%
            else if(!rollResult.isSuccess) majorRewardMultiplier -= 0.25; // Failure decreases reward by 25%
        }

        // Calculate the multiplier for reliability rolls
        let reliabilityMultiplier = 1;
        const reliabilityResults = Object.values(this.missionRolls.reliability);
        // If any adventurer rolled a critical success, reliability multiplier remains 100%
        if (!reliabilityResults.some(result => result.isCritical)) {
            // Otherwise the reliability multiplier equals the proportion of successes
            const successfulReliabilityRolls = reliabilityResults.filter(result => result.isSuccess).length;
            reliabilityMultiplier = successfulReliabilityRolls / this.adventurerCount;
        }
        
        return this.potentialReward * majorRewardMultiplier * reliabilityMultiplier;
    }

    //TODO
    get potentialReward() {
        const BASELINE = 100;
        
    }
}


/**
 * @typedef {object} RollResult
 * @property {Adventurer} adventurer    The adventurer who's made this roll.
 * @property {string} attribute         The attribute that has been rolled.
 * @property {number} dc                The difficulty class of the roll.
 * @property {boolean} isSuccess
 * @property {boolean} isCritical
 * @property {boolean} isFumble         
 * @property {Roll} roll                The evaluated roll
 */


/* TODO

    - Adventurer death @ major roll nat 1.
    - Base values for mission reward and adventurer cost.


 */
