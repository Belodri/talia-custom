import { Helpers } from "../../utils/helpers.mjs";
import Guild from "./guild.mjs";
import Adventurer from "./adventurer.mjs";
import TaliaDate from "../../utils/TaliaDate.mjs";
import shared from "./shared.mjs";
import { MODULE } from "../../scripts/constants.mjs";
import { MappingField } from "../../utils/mappingField.mjs";

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

        /** @type {{[key: string]: CheckResult}} */
        this.results ??= {};
    }
    
    static CONFIG = {
        dc: {
            min: 10,
            max: 25
        },
        durationDays: {
            min: 30,
            max: 90,
        },
        maxRewardItems: 3,
        maxAdventurers: 4,
        risk: {
            low: {
                explanation: "Failing a check with a natural 1 results in death.",
                label: "Low",
                deathMargin: 99,
            },
            medium: {
                explanation: "Failing a check by 5 or more results in death.",
                label: "Medium",
                deathMargin: 5,
            },
            high: {
                explanation: "Failing a check results in death.",
                label: "High",
                deathMargin: 0,
            }
        },
        states: {
            none: {
                key: "none",
                icon: "fa-solid fa-users",
                hint: "Adventurers can be assigned to this mission",
                label: "",
                numeric: 0,
            },
            ready: {
                key: "ready",
                icon: "fa-solid fa-user-check",
                hint: "Can be started",
                label: "Ready",
                numeric: 1,
            },
            ongoing: {
                key: "ongoing",
                icon: "fa-solid fa-route",
                hint: "Is ongoing",
                label: "Ongoing",
                numeric: 2,
            },
            returned: {
                key: "returned",
                icon: "fa-solid fa-exclamation",
                hint: "Has returned",
                label: "Returned",
                numeric: 3,
            },
            logged: {
                key: "logged",
                icon: "",
                hint: "",
                label: "",
                numeric: 4,
            }
        }
    }

    static defineSchema() {
        const {
            StringField, SetField, SchemaField, HTMLField, NumberField, EmbeddedDataField, 
            BooleanField, ArrayField, ObjectField, DocumentUUIDField
        } = foundry.data.fields;


        const getRewardItemsSchema = () => {
            const schemaObj = {};
            for(let i = 0; i < Mission.CONFIG.maxRewardItems; i++) {
                schemaObj[i] = new SchemaField({
                    uuid: new DocumentUUIDField({ 
                        embedded: false, 
                        validate: (value) => { 
                            if(value.includes("Item.")) return true;
                            ui.notifications.error(`Invalid document. Expects documents of type "Item".`);
                            return false;
                        }
                    }),
                    quantity: new NumberField({min: 1, nullable: true, initial: null })
                });
            }
            return schemaObj;
        }

        return {
            id: new StringField({ required: true, nullable: false, blank: false }),
            name: new StringField({ blank: true, initial: "", label: "Name" }),
            dc: new SchemaField( shared.defineAttributesSchema(), {label: "DC"}),
            _risk: new StringField({ 
                initial: "low", required: true, label: "Risk",
                choices: Object.entries(Mission.CONFIG.risk)
                    .reduce((acc, [k, v]) => {
                        acc[k] = v.label;
                        return acc;
                    }, {}),
            }),
            rewards: new SchemaField({
                gp: new NumberField({ integer: true, nullable: true, required: true, positive: true, label: "gp"}),
                items: new SchemaField( getRewardItemsSchema(), {label: "Items"} ),
                other: new SetField( new StringField(), { label: "Other rewards" })
            }, { label: "Rewards" }),
            durationInDays: new NumberField({ integer: true, initial: 1, positive: true, label: "Duration (days)"}),
            description: new StringField({ required: false, blank: true, initial: "", label: "Description" }),
            _assignedAdventurerIds: new SetField( new StringField() ),
            results: new ObjectField({ required: false }),
            startDate: new EmbeddedDataField( TaliaDate, { required: false, nullable: true, initial: null } ), 
            returnDate: new EmbeddedDataField( TaliaDate, { required: false, nullable: true, initial: null } ), 
            finishDate: new EmbeddedDataField( TaliaDate, { required: false, nullable: true, initial: null }),
        }
    }

    //#region Getters

    /** Can an adventurer be assigned to this mission. */
    get canAssign() {
        return !this.hasStarted 
            && this._assignedAdventurerIds.size <= Mission.CONFIG.maxAdventurers
    }

    /** Can this mission start? */
    get canStart() {
        return !this.hasStarted
            && this._assignedAdventurerIds.size
            && this._assignedAdventurerIds.size <= Mission.CONFIG.maxAdventurers
    }

    /** Has this mission been started? */
    get hasStarted() { return !!this.startDate && !!this.returnDate; }

    /** Has this mission returned? */
    get hasReturned() { 
        const retDays = this.daysUntilReturn;
        return retDays !== null && retDays <= 0;
    }

    /** Has this mission been finished, finalized, and logged? */
    get hasFinished() { return !!this.finishDate; }

    /** The number of days until the mission returns. Returns null if the mission hasn't started. Returns a negative number if the mission has returned already.*/
    get daysUntilReturn() { 
        return this.hasStarted
            ? this.returnDate.inDays - this.startDate.inDays
            : null;
    }

    /** 
     * Gets results that have not been revealed. 
     * @returns {CheckResult[] | null}  An array of check results or null if results doesn't exist
     */
    get unrevealedResults() {
        return this.results 
            ? Object.values(this.results).filter(r => !r.isRevealed) 
            : null;
    }

    /** 
     * Gets results that have been revealed. 
     * @returns {CheckResult[] | null}  An array of check results or null if results doesn't exist
     */
    get revealedResults() {
        return this.results
            ? Object.values(this.results).filter(r => r.isRevealed) 
            : null;
    }

    get state() {
        const states = Mission.CONFIG.states;

        const current = this.hasFinished ? states["logged"]
            : this.hasReturned ? states['returned']
                : this.hasStarted ? states['ongoing']
                    : this.canStart ? states['ready']
                        : states['none'];
        return current;
    }

    get risk() {
        /** @type {"low", "medium", "high"} */
        const r = this._risk;
        return Mission.CONFIG.risk[r];
    }

    //#endregion

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
        const getItemNameFromUuid = (uuid) => {
            if(!uuid) return "";
            const { name } = fromUuidSync(uuid);
            return name;
        };

        this.assignedAdventurers = new foundry.utils.Collection(
            this._assignedAdventurerIds.map(id => {
                const adv = this.parent._adventurers[id];
                return [id, adv];
            }) 
        );

        this.duration = {
            total: this.durationInDays,
            remaining: this.daysUntilReturn
        };

        this.rewards.itemRecords = Object.entries(this.rewards.items)
            .reduce((acc, [key, values]) => {
                acc[key] = {
                    uuid: values.uuid,
                    name: getItemNameFromUuid(values.uuid),
                    quantity: values.quantity
                };
                return acc;
            }, {});
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

        if( !adventurer || !( adventurer instanceof Adventurer) ) {
            throw new Error(`Invalid argument "${adventurer}".`);
        }


        if(this.assignedAdventurers.has(adventurer.id)) {
            ui.notifications.error(`This adventurer is already assigned to this mission.`);
            return;
        };

        if( this.assignedAdventurers.size >= Mission.CONFIG.maxAdventurers ) {
            ui.notifications.error(`You cannot assign more than ${Mission.CONFIG.maxAdventurers} adventurers to this mission.`);
            return;
        }
        if( adventurer.assignedMission ) {
            ui.notifications.error(`This adventurer is already assigned to another mission.`);
            return;
        }

        return this.#assignAdventurer(adventurer);
    }

    /**
     * Assigns an adventurer to this mission.
     * @param {Adventurer} adventurer
     */
    async #assignAdventurer(adventurer) {
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
        const data = {
            name: "DEFAULT MISSION NAME",
            dc: Mission._getRandomDCs(),
            durationInDays: Mission._getRandomDuration(),
            _risk: Mission._getRandomRisk(),
        }

        return data;
    }

    static _getRandomDuration() {
        const { min, max } = Mission.CONFIG.durationDays;
        return Helpers.getRandomInt(min, max);
    }

    static _getRandomDCs() {
        const { min, max } = Mission.CONFIG.dc;
        return Adventurer.ATTRIBUTE_KEYS.reduce((acc, curr) => {
            acc[curr] = Helpers.getRandomInt(min, max);
            return acc;
        }, {});
    }

    static _getRandomRisk() {
        const [chosen] = Helpers.getRandomArrayElements(
            Object.keys(Mission.CONFIG.risk), 1
        );
        return chosen;
    }
    //#endregion

    //#region Start & Finish

    async start({restart=false} = {}) {

        const allowStart = ( restart && !this.hasStarted && !this.hasFinished ) 
            || this.canStart;
        if(!allowStart) throw new Error(`Unable to start mission id "${this.id}".`);
        
        const startDate = TaliaDate.now();
        const returnDate = TaliaDate.fromOffset(startDate, {days: this.durationInDays})

        const changes = {
            results: await Resolver.createMissionResults(this),
            startDate,
            returnDate,
        }
        return this.update(changes);
    }

    async finish() {
        if( !this.hasReturned || this.hasFinished ) throw new Error(`Unable to finish mission id "${this.id}".`);

        // perform updates
        const promises = [
            ...this.assignedAdventurers.map(adv => adv._onMissionFinish(this)),
            this.update({ finishDate: TaliaDate.now() })
        ];
        await Promise.all(promises);


        //then display results
        await this.displayResults();    //todo displayResults()
        

        //then grant rewards
        await this.grantRewards();  //todo grantRewards()
    }

    async displayResults() {
        // Sort by adventurer name
        const sorted = Object.values(this.results)
            .sort((a, b) => a.adventurerName.localeCompare(b.adventurerName));

        for(const result of sorted) {
            await this._revealResult(result.id);
        }

        /*
            Infos to include in summary message:

            - who died
            
            - those who lived:
                - how much exp gained
                - any level ups?

            - rewards
        */
    }
    
    //#endregion

    //#region Results
    /**
     * @typedef {object} ResultRevealOptions
     * @property {boolean} updateResult         Should the result be updated (isRevealed set to true)? Default = `true`
     * @property {boolean} createMessage        Whether to automatically create the chat message, or only return the
     *                                          prepared chatData object. Default = `true`
     * @property {string} rollMode              The template roll mode to use for the message from CONFIG.Dice.rollModes
     *                                          Default = `CONST.DICE_ROLL_MODES.PUBLIC`
     */

    /**
     * Transform a result into a ChatMessage, displaying the roll result.
     * @param {string} resultId 
     * @returns {Promise<ChatMessage>}           A promise which resolves to the created ChatMessage document
     */
    async _revealResult(resultId) {


        const result = this.results[resultId];
        if(!result) throw new Error(`Result id "${resultId}" not found in mission id "${this.id}".`);

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

        if(!result.isRevealed && updateResult) {
            await this.update({[`results.${result.id}.isRevealed`]: true });
        }

        return await roll.toMessage(messageData, { rollMode: CONST.DICE_ROLL_MODES.PUBLIC });
    }

    /**
     * Transform all results into ChatMessages, displaying the roll result.
     */
    async revealAllResults() {
        /** @type {{[key: string]: CheckResult}} */
        const results = this.results;
        if(!result) throw new Error(`Results for mission id "${this.id}" undefined.`);

        // Sort by adventurer name
        const sorted = Object.values(results)
            .sort((a, b) => a.adventurerName.localeCompare(b.adventurerName));

        // Display rolls
        await Promise.all(sorted.map(r => this._revealResult(r.id)));

        // Display summary

        /*
            info to display:

            - rewards

        */
    }

    /**
     * Gets an array of itemObjects of item rewards.
     * The itemObjects' quantity is modified to match.
     */
    async getRewardItemObjects() {
        const rewardItemObjects = new foundry.utils.Collection();
        for(const record of Object.values(this.rewards.items)) {
            const item = await fromUuid(record.uuid);
            const itemObj = item.toObject();
            itemObj.system.quantity = record.quantity;
            rewardItemObjects.set(uuid, itemObj);
        }
        return rewardItemObjects;
    }

    get bestForMainChecks() {
        return Object.entries(this.dc).reduce((acc, [attr, dc]) => {
            if(attr === "reliability") return acc;
            acc[attr] = Resolver.getBestForCheck(this, attr);
            return acc;
        }, {});
    }

    //#endregion

    async edit() {
        const makeField = (path, options={}) => {
            const field = this.schema.getField(path);
            const value = foundry.utils.getProperty(source, path);
    
            return {
                field: field,
                value: value,
                ...options
            };
        }

        const { DialogV2 } = foundry.applications.api;
        const { DocumentUUIDField, NumberField } = foundry.data.fields;
        const source = this.toObject();

        const itemFields = Object.entries(this.rewards.items)
            .reduce((acc, [k, v]) => {
                const uuidField = new DocumentUUIDField({
                    type: "Item",
                    embedded: false,
                    label: `Reward Item ${k}`,
                    initial: v.uuid ?? null,
                }).toFormGroup({}, {name: `rewards.items.${k}.uuid`}).outerHTML;

                const quantityField = new NumberField({
                    min: 1,
                    required: true,
                    initial: v.quantity ?? null,
                    nullable: true,
                }).toFormGroup({stacked: false}, {name: `rewards.items.${k}.quantity`}).outerHTML;
                acc += uuidField + quantityField;
                return acc;
            }, "");

        // Fields that don't require special handling
        const fieldPaths = [
            "name", "dc.brawn", "dc.cunning", "dc.spellcraft", "dc.influence", "dc.reliability",
            "_risk", "rewards.gp", "rewards.other", "durationInDays", "description"
        ];

        // Paths for item fields
        for(const k of Object.keys(this.rewards.items)) {
            fieldPaths.push(`rewards.items.${k}.uuid`);
            fieldPaths.push(`rewards.items.${k}.quantity`);
        }

        const mainFields = fieldPaths.reduce((acc, curr) => {
            const field = makeField(curr);
            const element = field.field.toFormGroup({}, { value: field.value });
            acc += element.outerHTML;
            return acc;
        }, "");

        const changes = await DialogV2.prompt({
            window: { title: "Mission Editor" },
            position: { width: 500, height: "auto" },
            content: mainFields, 
            modal: false, 
            rejectClose: false, 
            ok: { callback: (event, button) => new FormDataExtended(button.form).object }
        });

        if(!changes) return;
        return this.update(changes);
    }
}

/**
 * @typedef {object} CheckResult
 * @property {string} id                A unique identifier for this result. `${adventurerId}_${attributeKey}`
 * @property {string} adventurerId      The id of the adventurer who rolled this result.
 * @property {string} adventurerName    The name of the adventurer who rolled this result.
 * @property {string} attributeKey      The attribute that this roll is for.
 * @property {boolean} isSuccess        Is this roll a success
 * @property {number} dc                The DC for the check.
 * @property {number} total             The total of the rolled check.
 * @property {number} margin            How much is the total over/under the DC?
 * @property {boolean} isFumble         Is this check a critical fail?
 * @property {boolean} isCritical       Is this check a critical success?
 * @property {object} rollObj           The roll as an object.
 * @property {boolean} isRevealed       Has this result been revealed to players in a chat message?
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

    /** 
     * Rolls all checks of the mission and returns the results.
     * Does not create ChatMessages so those can be revealed later. 
     * @param {Mission} mission 
     * @returns {Promise<{[key: string]: CheckResult}>}
     */
    static async createMissionResults(mission) {
        const resolver = new Resolver(mission);
        const resultsArray = await resolver._createResults();
        return resultsArray.reduce((acc, curr) => {
            acc[curr.id] = curr;
            return acc;
        }, {});
    }

    /** 
     * Rolls all checks of the mission and returns the results.
     * Does not create ChatMessages so those can be revealed later. 
     * @returns {Promise<CheckResult[]>}
     */
    async _createResults() {
        const checkPromises = Resolver.CONFIG.mainChecks.map((key) => {
            const adv = Resolver.getBestForCheck(this.mission, key);
            return this.#getCheckResult(key, adv); // Directly return the promise
        });
    
        const reliabilityPromises = this.mission.assignedAdventurers.map((adv) => 
            this.#getCheckResult("reliability", adv)
        );
    
        return Promise.all([...checkPromises, ...reliabilityPromises]);
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

        const rollData = {
            mod: adventurer.attributes[attributeKey].mod,
            exp: adventurer.expBonus,
        };

        return await dnd5e.dice.d20Roll({
            parts: ["@mod", "@exp"], 
            data: rollData,
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
     * @param {Mission} mission 
     * @param {string} attributeKey 
     * @returns {Adventurer}
     */
    static getBestForCheck(mission, attributeKey) {
        let best = null;
        for(const adv of mission.assignedAdventurers) {
            if (!best 
                || adv.attributes[attributeKey].totalRollMod > best.attributes[attributeKey].totalRollMod) {
                best = adv;
            }
        }
        return best;
    }

    /**
     * Rolls a check for a given attribute and adventurer and returns the result.
     * @param {string} attributeKey             
     * @param {Adventurer} adventurer
     * @returns {Promise<CheckResult>}
     */
    async #getCheckResult(attributeKey, adventurer ) {
        const id = `${adventurer.id}_${attributeKey}`;
        const dc = this.mission.dc[attributeKey];

        const roll = await this.#rollCheck({
            attributeKey, dc, adventurer
        });

        const { isFumble, isCritical, total } = roll;
        const rollObj = roll.toJSON();
        const isSuccess = Helpers.isRollSuccess(roll);
        const margin = total - dc;

        const causedDeath = (() => {
            const deathMargin = this.mission.risk.deathMargin;
            return this.isFumble || ( deathMargin + margin ) < 0;
        })();
        
        return {
            id,
            adventurerId: adventurer.id,
            adventurerName: adventurer.name,
            attributeKey,
            isSuccess,
            isFumble,
            isCritical,
            total,
            margin,
            dc,
            rollObj,
            causedDeath,
            isRevealed: false,
        };
    }
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
