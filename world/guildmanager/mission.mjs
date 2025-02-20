import { Helpers } from "../../utils/helpers.mjs";
import Guild from "./guild.mjs";
import Adventurer from "./adventurer.mjs";
import TaliaDate from "../../utils/TaliaDate.mjs";
import shared from "./shared.mjs";
import { MODULE } from "../../scripts/constants.mjs";

/** @typedef {import("../../foundry/common/utils/collection.mjs").default} Collection */
/** @typedef {import("../../system/dnd5e/module/dice/d20-roll.mjs").default} D20Roll */

/*
    TO DO
    - Chat Message: Show Adventurer image
*/

export default class Mission extends foundry.abstract.DataModel {
    constructor(...args) {
        super(...args);

        //for type annotations
        /** @type {Collection<string, Adventurer>} */
        this.assignedAdventurers ??= new foundry.utils.Collection();

        /** @type {Collection<string, CheckResult>} */
        this.checkResults ??= new foundry.utils.Collection();
    }
    
    static CONFIG = {
        dc: {
            min: 10,
            max: 25
        },
        durationMonths: {
            min: 1,
            max: 3,
        },
        maxAdventurers: 4,
    }

    static defineSchema() {
        const {
            StringField, SetField, SchemaField, HTMLField, NumberField, EmbeddedDataField, BooleanField, ArrayField, ObjectField
        } = foundry.data.fields;

        return {
            id: new StringField({ required: true, nullable: false, blank: false }),
            name: new StringField({ blank: true, initial: "" }),
            dc: new SchemaField( shared.defineAttributesSchema() ),
            durationInMonths: new NumberField({ integer: true, initial: 1, positive: true }),
            description: new StringField({ required: false, blank: true, initial: "" }),
            _assignedAdventurerIds: new SetField( new StringField() ),
            _checkResults: new ArrayField( new ObjectField() ),
            startDate: new EmbeddedDataField( TaliaDate, { initial: shared.defineDateSchema() } ),
            isOver: new BooleanField(),
        }
    }

    /** The date on which the mission finishes. If the mission hasn't started yet, the finishDate is 0/0/0000 */
    get finishDate() {
        return TaliaDate.fromOffset(this.startDate, { months: this.durationInMonths });
    }

    get hasStarted() { return !!this.startDate?.inDays; }

    get isFinished() { return this.hasStarted && this.finishDate.isBefore( TaliaDate.now() ); }

    /**
     * Update this Mission, propagating the changes to the parent Guild.  
     * @param {object} changes          New values which should be applied to the data model
     * @param {object} [options={}]     Options which determine how the new data is merged
     * @returns {Promise<object>}       An object containing the changed keys and values
     */
    async update(changes, options = {}) {
        return this.parent.updateEmbedded(this, changes, options);
    }


    //#region Data preparation
    _initialize(...args) {
        super._initialize(...args);
        this.prepareDerivedData();
    }

    prepareDerivedData() {
        this.assignedAdventurers = new foundry.utils.Collection(
            this._assignedAdventurerIds.map(id => {
                const adv = this.parent._adventurers[id];
                return [id, adv];
            }) 
        );
        this.checkResults = new foundry.utils.Collection(
            this._checkResults.map((res) => [res.id, res])
        );
    }
    //#endregion


    //#region Adventurer Assignment

    /**
     * Assigns an adventurer to this mission.
     * @param {Adventurer | string } adventurer     An adventurer or the id of an adventurer;
     */
    async assignAdventurer(adventurer) {
        if( typeof adventurer === "string" ) {
            adventurer = this.parent.adventurers.get(adventurer);
        }

        if(this.assignedAdventurers.has(adventurer.id)) return;
        if( this.assignedAdventurers.size >= Mission.CONFIG.maxAdventurers ) {
            throw new Error(`Cannot assign: Maximum number of adventurers per mission reached (${Mission.CONFIG.maxAdventurers}).`);
        }
        if( adventurer.assignedMission ) throw new Error(`Adventurer "${adventurer.name}" is already assigned to another mission.`);

        const ids = new Set([...this._assignedAdventurerIds]);
        ids.add(adventurer.id);
        return this.update({_assignedAdventurerIds: [...ids]});
    }

    /**
     * Unassigns an assigned adventurer from this mission.
     * @param {Adventurer | string } adventurer     An adventurer or the id of an adventurer;
     */
    async unassignAdventurer(adventurer) {
        if( typeof adventurer === "string" ) {
            adventurer = this.parent.adventurers.get(adventurer);
        }

        if(!this.assignedAdventurers.has(adventurer.id)) return;
        const ids = new Set([...this._assignedAdventurerIds]);
        ids.delete(adventurer.id);
        return this.update({_assignedAdventurerIds: [...ids]});
    }

    /**
     * Unassigns all assigned adventurers from this mission.
     */
    async unassignAll() {
        return this.update({_assignedAdventurerIds: []});
    }
    //#endregion


    //#region Random Generation

    static getRandomData() {
        const dc = Mission._getRandomDCs();
        const durationInMonths = Mission._getRandomDuration();

        return {
            dc, durationInMonths
        }
    }

    static _getRandomDuration() {
        const { min, max } = Mission.CONFIG.durationMonths;
        return Helpers.getRandomInt(min, max);
    }

    static _getRandomDCs() {
        const { min, max } = Mission.CONFIG.dc;
        return Adventurer.ATTRIBUTE_KEYS.reduce((acc, curr) => {
            acc[curr] = Helpers.getRandomInt(min, max);
            return acc;
        }, {});
    }
    //#endregion

    //#region Start

    get canStart() {
        const hasAdventurers = !!this.assignedAdventurers.size;

        return hasAdventurers;
    }

    async start({restart=false} = {}) {
        if( !this.canStart ) {
            throw new Error("This mission cannot be started yet.");
        }

        if( this.hasStarted && !restart ) {
            throw new Error("Mission is already started.")
        }

        const results = await Resolver.createMissionResults(this);
        const startDate = TaliaDate.now();

        const changes = {
            _checkResults: results,
            startDate: startDate,
        }
        return this.update(changes);
    }
    
    //#endregion


    /**
     * Transform a result into a ChatMessage, displaying the roll result.
     * This function can either create the ChatMessage directly, or return the data object that will be used to create.
     * @param {CheckResult} result 
     * @param {object} [options]
     * @param {boolean} [options.create=true]   Whether to automatically create the chat message, or only return the
     *                                          prepared chatData object.
     * @param {string} [options.rollMode]       The template roll mode to use for the message from CONFIG.Dice.rollModes
     * @returns {Promise<ChatMessage|object>}   A promise which resolves to the created ChatMessage document if create is
     *                                          true, or the Object of prepared chatData otherwise.
     */
    static async resultToMessage(result, {create=true, rollMode=CONST.DICE_ROLL_MODES.PUBLIC}={}) {
        const { rollObj, attributeKey, dc, adventurerName } = result;

        const roll = dnd5e.dice.D20Roll.fromData(rollObj);
        const flavor = `<strong>${Resolver.CONFIG.attrCapital[attributeKey]}</strong> - DC ${dc}`;
        const messageData = {
            flavor: flavor,
            speaker: {
                alias: adventurerName,
            },
            flags: {
                [MODULE.ID]: {
                    checkResult: result,
                }
            }
        };
        return roll.toMessage(messageData, { create, rollMode });    //async
    }
}

/**
 * @typedef {object} CheckResult
 * @property {string} id                A unique identifier for this result. `${adventurerId}.${attributeKey}`
 * @property {string} adventurerId      The id of the adventurer who rolled this result.
 * @property {string} adventurerName    The name of the adventurer who rolled this result.
 * @property {string} attributeKey      The attribute that this roll is for.
 * @property {boolean} isSuccess        Is this roll a success
 * @property {number} dc                The DC for the check.
 * @property {number} total             The total of the rolled check.
 * @property {number} margin            The absolute difference between DC and total
 * @property {boolean} isFumble         Is this check a critical fail?
 * @property {boolean} isCritical       Is this check a critical success?
 * @property {object} rollObj           The roll as an object.
 */

class Resolver {
    static CONFIG = {
        mainChecks: ["brawn", "cunning", "spellcraft", "influence"],
        attrCapital: {
            brawn: "Brawn",
            cunning: "Cunning",
            spellcraft: "Spellcraft",
            influence: "Influence",
            reliability: "Reliability",
        },
        rollFlavor: {
            brawn: "<strong>Brawn</strong> Check",
            cunning: "<strong>Cunning</strong> Check",
            spellcraft: "<strong Check",
            influence: "Influence Check",
            reliability: "Reliability Check",
        }
    }

    /**
     * @param {Mission} mission 
     */
    constructor( mission ) {
        this.mission = mission;
    }

    //#region Creating Mission Results
    /** 
     * Rolls all checks of the mission and returns the results.
     * Does not create ChatMessages so those can be revealed later. 
     * @param {Mission} mission 
     * @returns {Promise<CheckResult[]>}
     */
    static async createMissionResults(mission) {
        const resolver = new Resolver(mission);
        return resolver._createResults();
    }

    /** 
     * Rolls all checks of the mission and returns the results.
     * Does not create ChatMessages so those can be revealed later. 
     * @returns {Promise<CheckResult[]>}
     */
    async _createResults() {
        const checkPromises = Resolver.CONFIG.mainChecks.map((key) => {
            const adv = this.#getBestForCheck(key);
            return this.#getCheckResult(key, adv); // Directly return the promise
        });
    
        const reliabilityPromises = this.mission.assignedAdventurers.map((adv) => 
            this.#getCheckResult("reliability", adv)
        );
    
        return Promise.all([...checkPromises, ...reliabilityPromises]);
    }

    /**
     * Rolls a check for a given attribute and adventurer and returns the result.
     * @param {string} attributeKey             
     * @param {Adventurer} adventurer
     * @returns {Promise<CheckResult>}
     */
    async #getCheckResult(attributeKey, adventurer ) {
        const id = `${adventurer.id}.${attributeKey}`;
        const dc = this.mission.dc[attributeKey];

        const roll = await this.#rollCheck({
            attributeKey, dc, adventurer
        });

        const result = {
            id,
            adventurerId: adventurer.id,
            adventurerName: adventurer.name,
            attributeKey,
            isSuccess: Helpers.isRollSuccess(roll),
            dc: roll.options.targetValue,
            total: roll.total,
            margin: Math.abs( roll.options.targetValue - roll.total),
            isFumble: roll.isFumble,
            isCritical: roll.isCritical,
            rollObj: roll.toJSON(),
        };

        return result;
    }

    /**
     * Rolls, evaluates, and returns the check as a dnd5e D20 roll.
     * @param {object} args
     * @param {string} args.attributeKey
     * @param {number} args.dc
     * @param {Adventurer} args.adventurer
     * @returns {D20Roll}
     */
    async #rollCheck({ attributeKey, dc, adventurer }) {
        const attr = attributeKey[0].toUpperCase() + attributeKey.slice(1);
        const flavor = `<strong>${attr} check - DC ${dc}</strong>`;

        return await dnd5e.dice.d20Roll({
            parts: ["@mod", "@exp"], 
            data: adventurer.attributes[attributeKey],
            targetValue: dc,
            flavor: flavor,
            fastForward: true,
            chatMessage: false,
            messageData: {
                rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
                flavor: flavor,
                speaker: {
                    alias: adventurer.name,
                }
            }
        });
    }

    /**
     * Gets the adventurer that's best suited for making a check.
     * @param {string} attributeKey 
     * @returns {Adventurer}
     */
    #getBestForCheck(attributeKey) {
        let best = null;
        for(const adv of this.mission.assignedAdventurers) {
            if (!best 
                || adv.attributes[attributeKey].mod > best.attributes[attributeKey].mod) {
                best = adv;
            }
        }
        return best;
    }

    //#endregion
}

/* 
    
    Calculates the actual reward based on mission outcomes, considering the results of major attribute rolls and reliability rolls.
    @throws {Error} If the mission checks have not been rolled yet.
    @returns {number} The actual reward, adjusted based on major and reliability roll results.
    
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
 */
