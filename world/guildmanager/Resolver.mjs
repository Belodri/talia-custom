import { Helpers } from "../../utils/helpers.mjs";

/** @typedef {import("../../foundry/common/utils/collection.mjs").default} Collection */
/** @typedef {import("../../system/dnd5e/module/dice/d20-roll.mjs").default} D20Roll */
/** @typedef {import("./adventurer.mjs").default} Adventurer */
/** @typedef {import("./mission.mjs").default} Mission */

/**
 * @typedef {object} CheckResult
 * @property {string} id                A unique identifier for this result. `${adventurerId}_${attributeKey}`
 * @property {string} adventurerId      The id of the adventurer who rolled this result.
 * @property {string} adventurerName    The name of the adventurer who rolled this result.
 * @property {number} adventurerLevel   The level of the adventurer at the time of the roll.
 * @property {number} adventurerExp     The exp of the adventurer at the time of the roll.
 * @property {string} attributeKey      The attribute that this roll is for.
 * @property {boolean} isSuccess        Is this roll a success
 * @property {number} dc                The DC for the check.
 * @property {number} total             The total of the rolled check.
 * @property {number} margin            How much is the total over/under the DC?
 * @property {boolean} isFumble         Is this check a critical fail?
 * @property {boolean} isCritical       Is this check a critical success?
 * @property {object} rollObj           The roll as an object.
 */

/**
 * @typedef {object} AdventurerResult
 * @property {string} id                    The id of the adventurer
 * @property {string} name                  The name of the adventurer
 * @property {boolean} died                 Did the adventurer die from any of the checks?
 * @property {number} critsCount            How many crits did the adventurer roll in the checks they made?
 * @property {CheckResult[]} checkResults   The CheckResult objects of each of the checks the adventurer made.
 * @property {number} expGained             How much exp did the adventurer gain from these checks?
 * @property {boolean} causedLevelUp        Did the exp the adventurer gained from this cause a levelup?
 */

export class Resolver {
    static CONFIG = {
        attributes: {
            brawn: { key: "brawn", isMain: true, },
            cunning: { key: "cunning", isMain: true, },
            spellcraft: { key: "spellcraft", isMain: true, },
            influence: { key: "influence", isMain: true, },
            reliability: { key: "reliability", isMain: false, },
        },
        expGainedForSuccessfulMission: 1,
    };

    /** @type {{[checkId: string]: CheckResult}} */
    #checkResults = {};

    /** @type {{[adventurerId: string]: AdventurerResult}} */
    #adventurerResults = {};

    #isEvaluated = false;

    //#region Public

    /**
     * @param {Mission} mission
     */
    constructor(mission) {
        this.mission = mission;
        this.adventurers = mission.assignedAdventurers;
    }

    /**
     * A unique identifier for a result. `${adventurerId}_${attributeKey}`
     * @param {string} attributeKey
     * @param {string} advId
     */
    static getCheckId(attributeKey, advId) { return `${advId}_${attributeKey}`; }

    /**
     * Gets the adventurer that's best suited for making a check.
     * @param {Mission} mission
     * @param {string} attributeKey
     * @returns {Adventurer | null} The best adventurer or null if none is assigned to the mission.
     * @interface
     */
    static getBestForCheck(mission, attributeKey) {
        let best = null;
        for (const adv of mission.assignedAdventurers) {
            if (!best
                || adv.attributes[attributeKey].totalRollMod > best.attributes[attributeKey].totalRollMod) {
                best = adv;
            }
        }
        return best;
    }

    /**
     * Evaluates the Resolver instance.
     * @param {object} [options]
     * @param {boolean} [options.strict=false]  Should an error be throw if this is called on an already evaluated Resolver?
     * @returns {Promise<this>}                 A promise that returns the evaluated Resolver.
     */
    async evaluate({strict=false}={}) {
        if(this.#isEvaluated) {
            if(strict) throw new Error("This Resolver has already been evaluated.");
            else return this;
        }

        // Set all check results first
        const results = await this.#setAllCheckResults();
        if(!results) throw new Error("Unable to resolve all results.");

        // Then set all adventurer results based on these.
        for(const adv of this.adventurers) {
            this.#setAdventurerResult(adv);
        }

        this.#isEvaluated = true;
        return this;
    }

    get checkResults() {
        if(!this.#isEvaluated) throw new Error("This resolver has not yet been evaluated.");
        return this.#checkResults;
    }

    get adventurerResults() {
        if(!this.#isEvaluated) throw new Error("This resolver has not yet been evaluated.");
        return this.#adventurerResults;
    }

    //#endregion

    //#region Private

    /** 
     * Creates an adventurerResult based on set checkResults and adds it to `#adventurerResults`
     * @param {Adventurer} adv 
     */
    #setAdventurerResult(adv) {
        let died = false;
        let critsCount = 0;
        let checkResults = [];

        for(const result of Object.values(this.#checkResults)) {
            if(result.adventurerId !== adv.id) continue;

            checkResults.push(result);
            if (result.causedDeath) died = true;
            if (result.isCritical) critsCount++;
        }

        const expGained = critsCount + (died ? 0 : expGainedForSuccessfulMission); // crits + 1 if survived
        const advResult = {
            id: adv.id,
            name: adv.name,
            died,
            critsCount,
            checkResults,
            expGained,
            causedLevelUp: expGained >= adv.expForLevelUp
        }

        this.#adventurerResults[adv.id] = advResult;
    }

    /**
     * Sets the checkResults for all attributes.
     */
    async #setAllCheckResults() {
        const promises = [];
        for (const attrCfg of Object.values(Resolver.CONFIG.attributes)) {
            if (attrCfg.isMain) {
                // main checks are each rolled once by the best adventurer
                const adv = Resolver.getBestForCheck(this.mission, attrCfg.key);
                if(!adv) throw new Error("No adventurer is assigned to this mission."); //should never happen but just in case

                promises.push(this.#setCheckResult(attrCfg.key, adv));
            } else {
                // non-main checks are rolled by all adventurers
                for (const adv of this.adventurers) {
                    promises.push(this.#setCheckResult(attrCfg.key, adv));
                }
            }
        }
        return Promise.all(promises);
    }

    /** 
     * Creates a checkResult based on an awaited roll and adds it to `#checkResults`
     * @param {string} attributeKey 
     * @param {Adventurer} adventurer  
     */
    async #setCheckResult(attributeKey, adventurer) {
        const checkId = Resolver.getCheckId(attributeKey, adventurer.id);

        const roll = await this.#createRoll(attributeKey, adventurer);
        const dc = roll.options.targetValue;

        const checkResult = {
            id: checkId,
            adventurerId: adventurer.id,
            adventurerName: adventurer.name,
            adventurerLevel: adventurer.level,
            adventurerExp: adventurer.exp,
            attributeKey: attributeKey,
            isSuccess: Helpers.isRollSuccess(roll),
            isFumble: roll.isFumble,
            isCritical: roll.isCritical,
            total: roll.total,
            margin: roll.total - dc,
            dc,
            rollObj: roll.toJSON(),
            causedDeath: this.#determineCausedDeath(roll)
        };
        
        this.#checkResults[checkId] = checkResult;
    }

    /**
     * Determines whether a given roll caused the death of the adventurer.
     * @param {D20Roll} roll 
     */
    #determineCausedDeath(roll) {
        const deathMargin = this.mission.risk.deathMargin;
        const margin = roll.total - roll.options.targetValue;
        return roll.isFumble || (deathMargin + margin) < 0;
    }

    /**
     * Rolls, evaluates, and returns the check as a dnd5e D20 roll.
     * @param {string} attributeKey
     * @param {Adventurer} adventurer
     * @returns {Promise<D20Roll>}  Promise that resolves to a D20Roll
     */
    async #createRoll(attributeKey, adventurer) {
        const dc = this.mission.dc[attributeKey];
        const rollData = {
            mod: adventurer.attributes[attributeKey].mod,
            exp: adventurer.expBonus,
        };

        return dnd5e.dice.d20Roll({
            parts: ["@mod", "@exp"],
            data: rollData,
            targetValue: dc,
            fastForward: true,
            chatMessage: false,
            messageData: {
                rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
                speaker: { alias: adventurer.name, },
                flags: { "talia-custom": { missionId: this.mission.id, adventurerId: adventurer.id } }
            }
        });
    }

    //#endregion
}
