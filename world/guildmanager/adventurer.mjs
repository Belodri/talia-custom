import { Helpers } from "../../utils/helpers.mjs";

/**
 * 
 * @typedef {object} AdventurerDataObject
 * @property {string} name                              The name of the adventurer.
 * @property {string} id                                The id of the adventurer.
 * @property {object} rawAttributes                     The adventurer's attributes.
 * @property {Attribute} rawAttributes.brawn            Physical prowess, combat ability, and endurance.
 * @property {Attribute} rawAttributes.cunning          Stealth, subterfuge, strategy, and knowledge.
 * @property {Attribute} rawAttributes.spellcraft       Magical affinity, knowledge and powers.
 * @property {Attribute} rawAttributes.influence        Social skills, manipulation, charisma, and leadership.
 * @property {Attribute} rawAttributes.reliability      Reliability gauges how consistently the adventurer can be counted on to complete tasks and follow through without undermining the guild or mission.
 * @property {number} survivedMissions                  The number of missions this Adventurer has survived.
 */

export class Adventurer {
    _rawAttributes = {
        brawn: 0,
        cunning: 0,
        spellcraft: 0,
        influence: 0,
        reliability: 0
    };

    
    /**
     * 
     * @param {AdventurerDataObject} dataObject 
     */
    constructor(dataObject = {}) {
        //set raw attributes
        for(let [k, v] of Object.entries(this._rawAttributes)) {
            // Ensure attributes are set from the dataObject, or use 3d6 if not provided
            this._rawAttributes[k] = dataObject.rawAttributes?.[v] ??
                (Helpers.getRandomInt(1,6) + Helpers.getRandomInt(1,6) + Helpers.getRandomInt(1,6));   // 3d6
        }

        //other properties
        this.name = dataObject.name ?? "New Adventurer";
        this.id = dataObject.id ?? foundry.utils.randomID();
        this.survivedMissions = dataObject.survivedMissions ?? 0;
        this.isAssigned = dataObject.isAssigned ?? false;
    }

    /*----------------------------------------------------------------------------
                    Instance Methods            
    ----------------------------------------------------------------------------*/

    
    /**
     * Returns a plain object representation of the adventurer instance for JSON serialization.
     * This method is automatically called by JSON.stringify().
     * @returns {AdventurerDataObject} A plain object containing the adventurer's properties.
     */
    toJSON() {
        return {
            name: this.name,
            id: this.id,
            rawAttributes: foundry.utils.deepClone(this._rawAttributes),
            survivedMissions: this.survivedMissions,
            isAssigned: this.isAssigned,
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

    /**
     * Rolls a given attribute and compares the result to a given DC.
     * @param {string} attributeKey 
     * @param {number} dc 
     * @returns {Promise<RollResult>}
     */
    async rollAttribute(attributeKey, dc) {
        const roll = await new foundry.dice.Roll(`1d20`).evaluate();

        const mod = this.attributes[attributeKey].mod;
        const exp = this.experienceBonus;
        const final = roll.total + mod + exp;
        let result = {
            adventurer: this,
            attribute: attributeKey,
            dc,
            isSuccess: (roll.total === 20 || final >= dc) && roll.total !== 1,
            isCritical: roll.total === 20,
            isFumble: roll.total === 1,
            roll,
        }

        return result;
    }

    /*----------------------------------------------------------------------------
                    Getters            
    ----------------------------------------------------------------------------*/

    /**
     * Gets the adventurer's attributes along with their modifiers.
     * 
     * The attributes are based on the raw values stored in `#rawAttributes`, and each attribute 
     * has a modifier calculated using the formula `(attribute value - 10) / 2` (rounded down).
     * 
     * Example:
     * ```javascript
     * {
     *   brawn: { total: 12, mod: 1 },
     *   cunning: { total: 14, mod: 2 },
     *   spellcraft: { total: 8, mod: -1 },
     *   influence: { total: 10, mod: 0 },
     *   reliability: { total: 16, mod: 3 }
     * }
     * ```
     * 
     * @returns {object} An object containing the adventurer's attributes with their total and modifier.
     * @returns {{[key: string]: {total: number, mod: number}}} The object maps attribute names (e.g., `brawn`, `cunning`) 
     * to an object containing the total value and the modifier for each attribute.
     */
    get attributes() {
        let attributes = {};
        for(let [k, v] of Object.entries(this._rawAttributes)) {
            attributes[k] = {
                total: v,
                mod: Math.floor((v - 10) / 2)
            }
        }
        return attributes;
    }

    /**
     * Gets the experience bonus based on the number of survived missions.
     * 
     * The bonus is awarded as follows:
     * - +1 for the first survived mission
     * - +1 for the third survived mission
     * - +1 for every three survived missions after the third
     *
     * @returns {number} The calculated experience bonus.
     */
    get experienceBonus() {
        if(this.survivedMissions === 0) return 0;                   // bonus starts at 0
        if(this.survivedMissions < 3) return 1;                     // get a +1 bonus for the first survived mission
        if(this.survivedMissions < 6) return 2;                     // get a +1 bonus for the third survived mission
        return 2 + Math.floor((this.survivedMissions - 3) / 3);     // get a +1 bonus for every three survived missions after that
    }
}
