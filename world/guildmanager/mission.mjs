import { Helpers } from "../../utils/helpers.mjs";
import Guild from "./guild.mjs";
import Adventurer from "./adventurer.mjs";
import TaliaDate from "../../utils/TaliaDate.mjs";
import shared from "./shared.mjs";
import { MODULE } from "../../scripts/constants.mjs";
import { MappingField } from "../../utils/mappingField.mjs";
import { Resolver } from "./Resolver.mjs";
import GuildApp from "./guildApp.mjs";

/** @typedef {import("../../foundry/common/utils/collection.mjs").default} Collection */

/*
    TO DO
    - Chat Message: Show Adventurer image
*/


export default class Mission extends foundry.abstract.DataModel {
    static init() {
        Hooks.on("dnd5e.renderChatMessage", Mission.onDnd5eRenderChatMessageHook);
    }

    constructor(...args) {
        
        super(...args);

        /** @type {Collection<string, Adventurer>} */
        this.assignedAdventurers ??= new foundry.utils.Collection();
    }
    
    static CONFIG = {
        dc: {
            min: 10,
            max: 25
        },
        durationInDays: {
            min: 30,
            max: 90,
        },
        maxRewardItems: 3,
        minAdventurers: 2,
        maxAdventurers: 4,
        risk: {
            low: {
                key: "low",
                explanation: "Failing a check with a natural 1 results in death.",
                label: "Low",
                deathMargin: 99,
            },
            medium: {
                key: "medium",
                explanation: "Failing a check by 5 or more results in death.",
                label: "Medium",
                deathMargin: 5,
            },
            high: {
                key: "high",
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
            _dc: new SchemaField( shared.defineAttributesSchema(), {label: "DC"}),
            hidden: new BooleanField({ label: "Hidden"}),
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
            _grantedRewards: new BooleanField(),
            durationInDays: new NumberField({ integer: true, initial: 1, positive: true, label: "Duration (days)"}),
            description: new StringField({ required: false, blank: true, initial: "", label: "Description" }),
            summaryFlavor: new StringField({ required: false, blank: true, initial: "", label: "Summary Flavor", hint: "The parameters [missionName], [duration], [startDate], [returnDate], [assigned], and [survived] are replaced with the mission's values in the final text." }),
            _assignedAdventurerIds: new SetField( new StringField() ),
            results: new SchemaField({ 
                /** @type {import("./Resolver.mjs").CheckResults} */
                checkResults: new ObjectField(),
                /** @type {import("./Resolver.mjs").AdventurerResults} */
                adventurerResults: new ObjectField(),
                summary: new StringField(),
                isSuccess: new BooleanField(),
            }, { required: false, initial: undefined }),
            startDate: new EmbeddedDataField( TaliaDate, { required: false, nullable: true, initial: null } ), 
            returnDate: new EmbeddedDataField( TaliaDate, { required: false, nullable: true, initial: null } ), 
            finishDate: new EmbeddedDataField( TaliaDate, { required: false, nullable: true, initial: null }),
            _creationDate: new EmbeddedDataField( TaliaDate, { initial: TaliaDate.now() }),
        }
    }

    //#region Getters

    /** @returns {Guild} */
    get guild() { return this.parent; }

    /** Can an adventurer be assigned to this mission. */
    get canAssign() {
        return !this.hasStarted 
            && this._assignedAdventurerIds.size <= Mission.CONFIG.maxAdventurers
    }

    /** Can this mission start? */
    get canStart() {
        return !this.hasStarted
            && this._assignedAdventurerIds.size >= Mission.CONFIG.minAdventurers
            && this._assignedAdventurerIds.size <= Mission.CONFIG.maxAdventurers
    }

    /** Has this mission been started? */
    get hasStarted() { return !!this.startDate && !!this.returnDate; }

    /** Has this mission returned? */
    get hasReturned() { 
        const retDays = this.duration.remaining;
        return retDays !== null && retDays <= 0;
    }

    /** Has this mission been finished, finalized, and logged? */
    get hasFinished() { return !!this.finishDate; }

    /** Does this mission have results? */
    get hasResults() { 
        const { isEmpty } = foundry.utils;
        return !isEmpty(this.checkResults) 
            && !isEmpty(this.adventurerResults)
    }

    /** @type {import("./Resolver.mjs").CheckResults} */
    get checkResults() { return this.results?.checkResults; }

    /** @type {import("./Resolver.mjs").AdventurerResults} */
    get adventurerResults() { return this.results?.adventurerResults; }

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

    /** Checks whether the mission was a success. Returns undefined if the mission hasn't started yet. */
    get isSuccess() {
        if (!this.hasStarted) return undefined;
    
        // Get all main attribute keys
        const mainAttKeys = Object.values(Resolver.CONFIG.attributes)
            .filter(att => att.isMain)
            .map(att => att.key);
        
        // Check if at least one main attribute check was successful
        const anyMainSuccess = Object.values(this.checkResults)
            .some(res => res.isSuccess && mainAttKeys.includes(res.attributeKey));
        
        // Check if at least one adventurer with successful reliability check survived
        const anySurvivorWithReliability = Object.values(this.checkResults)
            .some(res => 
                res.isSuccess && 
                res.attributeKey === 'reliability' && 
                !this.adventurerResults[res.adventurerId].died
            );
        
        return anyMainSuccess && anySurvivorWithReliability;
    }

    //#endregion

    /**
     * Update this Mission, propagating the changes to the parent Guild.  
     * @param {object} changes          New values which should be applied to the data model
     * @param {object} [options={}]     Options which determine how the new data is merged
     * @returns {Promise<object>}       An object containing the changed keys and values
     */
    async update(changes, options = {}) {
        return this.guild.updateEmbedded(this, changes, options);
    }


    //#region Data preparation
    _initialize(...args) {
        super._initialize(...args);
        this.prepareDerivedData();
    }

    prepareDerivedData() {
        this.seed = this._prepareSeed();
        this.duration = this._prepareDuration();
        this.estimated = this._prepareEstimated();
        this.rewards.itemRecords = this._prepareItemRecords();
        this.dc = this._prepareDC();

        // Adventurers already have their derived data prepared at this point!
        this.assignedAdventurers = new foundry.utils.Collection(
            this._assignedAdventurerIds.map(id => {
                const adv = this.parent._adventurers[id];
                return [id, adv];
            }) 
        );
        this.assignmentsData = this._prepareAssignmentsData();

    }

    /**
     * Computes a deterministic floating-point seed value between 0 and 1 
     * based on the FNV-1a hash of `this.id`. The same `id` will always 
     * produce the same seed, while different `id`s will produce 
     * different values with low collision probability.
     * 
     * @returns {number} A floating-point number in the range [0, 1).
     */
    _prepareSeed() {
        let hash = 2166136261; // FNV-1a 32-bit offset basis
        for (let i = 0; i < this.id.length; i++) {
            hash ^= this.id.charCodeAt(i);
            hash = ( hash * 16777619 ) >>> 0; // Multiply by FNV prime and ensure unsigned 32-bit
        }
        return hash / 0x100000000; // Normalize to range [0, 1)
    }

    _prepareDuration() {
        const total = this.durationInDays;
        const remaining = this.startDate && this.returnDate 
            ? this.returnDate.inDays - this.startDate.inDays
            : undefined;

        return { total, remaining };
    }

    _prepareEstimated() {
        const lowerBound = 1;
        const upperBound = Math.floor(this.durationInDays * 1.5);
        const durationInDays = Math.floor(lowerBound + ( this.seed * (upperBound - lowerBound)) );

        const returnDate = this.startDate 
            ? TaliaDate.fromDays(this.startDate.inDays + durationInDays)
            : undefined;

        const remaining = returnDate 
            ? returnDate.inDays - this.startDate.inDays
            : undefined;

        return {
            durationInDays, returnDate, remaining
        };
    }

    _prepareItemRecords() {
        return Object.entries(this.rewards.items)
            .reduce((acc, [key, values]) => {
                let name = "";
                if(values.uuid) {
                    const record = fromUuidSync(values.uuid);
                    name = record.name;
                }

                acc[key] = {
                    uuid: values.uuid,
                    name,
                    quantity: values.quantity
                };
                return acc;
            }, {});
    }

    /**
     * @typedef {object} DCObject
     * @property {string} attribute     The attribute key of the DC 
     * @property {number} value         The DC itself
     * @property {string} label
     * @property {string} explanation
     */

    /** @returns {{[attributeKey: string]: DCObject}} */
    _prepareDC() {
        const entryArray = Object.entries(this._dc)
            .map(([attrKey, numberValue]) => {
                const dcObject = {
                    value: numberValue,
                    attribute: attrKey,
                    label: Adventurer.ATTRIBUTE_LABELS[attrKey].label,
                    explanation: Adventurer.ATTRIBUTE_LABELS[attrKey].explanation,
                };
                return [attrKey, dcObject]
            })

        return Object.fromEntries( entryArray );
    }

    _prepareAssignmentsData() {
        const bestForMainChecks = Resolver.getBestForMainChecks(this.assignedAdventurers);
        return this.assignedAdventurers.map(adv => ({
            id: adv.id,
            name: adv.name,
            img: adv.img,
            attributes: Object.values(Resolver.CONFIG.attributes)
                .reduce((acc, curr) => {
                    const makesRoll = curr.isMain
                        ? bestForMainChecks[curr.key]?.id === adv.id
                        : true;
                    
                    acc[curr.key] = {
                        totalBonus: adv.attributes[curr.key].totalRollModDisplay,
                        makesRoll,
                    }
                    return acc;
                }, {}),
        }));
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
            _dc: Mission._getRandomDCs(),
            durationInDays: Mission._getRandomDuration(),
            _risk: Mission._getRandomRisk(),
        }

        return data;
    }

    static _getRandomDuration() {
        const { min, max } = Mission.CONFIG.durationInDays;
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

    //#region Start

    async start() {
        if(!this.canStart) throw new Error(`Unable to start mission id "${this.id}".`);
        
        const startDate = TaliaDate.now();
        const returnDate = TaliaDate.fromOffset(startDate, {days: this.durationInDays});

        const resolver = await new Resolver(this).evaluate();
        const { adventurerResults, checkResults } = resolver.results;

        const isSuccess = this.#determineSuccess({ adventurerResults, checkResults });
        const summary = this.#getSummaryFlavor({ adventurerResults, startDate, returnDate, isSuccess });

        const changes = {
            results: {
                adventurerResults, 
                checkResults,
                summary,
                isSuccess
            },
            startDate,
            returnDate
        }
        await this.update(changes);
    }

    #determineSuccess({checkResults, adventurerResults}) {
        // Get all main attribute keys
        const mainAttKeys = Object.values(Resolver.CONFIG.attributes)
            .filter(att => att.isMain)
            .map(att => att.key);
        
        // Check if at least one main attribute check was successful
        const anyMainSuccess = Object.values(checkResults)
            .some(res => res.isSuccess && mainAttKeys.includes(res.attributeKey));
        
        // Check if at least one adventurer with successful reliability check survived
        const anySurvivorWithReliability = Object.values(checkResults)
            .some(res => 
                res.isSuccess && 
                res.attributeKey === 'reliability' && 
                !adventurerResults[res.adventurerId].died
            );
        
        return anyMainSuccess && anySurvivorWithReliability;
    }

    static ICONS = {
        crit: "fa-light fa-dice-d20",
        death: "fa-solid fa-skull-crossbones",
        success: "fa-solid fa-check",
        fail: "fa-solid fa-xmark",
        levelUp: "fa-solid fa-star"
    }

    static FAIL_SUMMARIES = {
        survivors: `The mission was unsuccessful over [duration] days, from [startDate] to [returnDate]. The returned members report of significant obstacles that prevented completion of the primary objective. The guild has recorded all relevant details for future reference and risk assessment. This contract is formally closed as unfulfilled.`,
        noSurvivors: `The mission is recorded as failed after [duration] days from its commencement on [startDate]. None of the [assigned] dispatched members returned by [returnDate]. Search parties discovered evidence confirming the loss of all personnel. The guild has documented available information and formally closed this contract as unfulfilled with complete casualties.`,
    }

    #getSummaryFlavor({adventurerResults, startDate, returnDate, isSuccess}) {
        const args = {
            duration: this.duration.total,
            startDate: startDate.displayString,
            returnDate: returnDate.displayString,
            assigned: this.assignedAdventurers.size,
        }

        const rawString = isSuccess 
            ? this.summaryFlavor
            : Object.values(adventurerResults).some(advRes => !advRes.died)
                ? Mission.FAIL_SUMMARIES.survivors
                : Mission.FAIL_SUMMARIES.noSurvivors;

        return Helpers.replacePlaceholders(rawString, args);
    }

    //#endregion

    //#region Finish

    async finish() {
        if( !this.hasReturned || this.hasFinished ) throw new Error(`Unable to finish mission id "${this.id}".`);

        await this.grantRewards();
        const promises = [
            ...this.assignedAdventurers.map(adv => adv._onMissionFinish(this)),
            this.update({ finishDate: TaliaDate.now() })
        ];
        await Promise.all(promises);
        await this.displayResults(); 
    }

    /**
     * Grants the mission's rewards to the guild's vault actor.
     * @param {boolean} [force=false]   Grant rewards even if rewards have already been granted?
     */
    async grantRewards(force=false) {
        if(this._grantedRewards && !force) throw new Error(`Rewards for mission id "${this.id}" have already been granted.`);

        const itemDataObjects= [];
        for(const {uuid, quantity} of Object.values(this.rewards.items)) {
            if(!uuid || !quantity) continue;

            const item = await fromUuid(uuid);
            if(!item) throw new Error(`Invalid item uuid "${uuid}" in mission id ${this.id}.`);

            const itemObj = item.toObject();

            if(foundry.utils.hasProperty(itemObj, "system.quantity")) {
                itemObj.system.quantity = quantity;
                itemDataObjects.push(itemObj);
            } else {    // If the item doesn't have a quantity, just add that many items.
                for(let i = 0; i < quantity; i++) itemDataObjects.push(itemObj);
            }
        }

        const vaultActor = await this.guild.getVaultActor();

        if(this.rewards.gp) await vaultActor.update({"system.currency.gp": vaultActor.system.currency.gp + this.rewards.gp})
        if(itemDataObjects.length) await Helpers.grantItems(vaultActor, itemDataObjects);

        await this.update({_grantedRewards: true});
    }

    //#endregion

    //#region ChatMessages

    async displaySummaryMessage() {
        const path = 'modules/talia-custom/templates/guildTemplates/partials/missionReportMessage.hbs';
        const template = await renderTemplate(path, this);

        await ChatMessage.implementation.create({
            content: template,
            speaker: { alias: this.parent.name },
        });
    }

    /**
     * @returns {Promise<ChatMessage[]>}
     */
    async displayRolls() {
        if(!this.hasResults) throw new Error(`Mission id "${this.id}" does not have results to display.`);
        
        const sorted = Object.values(this.adventurerResults)
            .sort((a, b) => a.name.localeCompare(b.name));

        const allChatMessages = [];
        for(const advRes of sorted) {
            const promises = advRes.checkResults.map(checkRes => this._createSingleRollMessage(checkRes.id));
            const ret = await Promise.all(promises);
            allChatMessages.push(...ret);
        }

        return allChatMessages;
    }

    async displayResults() {    // called from 'Mission#finish' when a mission is first finished and via a button in the mission log ui 
        if(!this.hasResults) throw new Error(`Mission id "${this.id}" does not have results to display.`);

        const rollDisplays = await this.displayRolls();

        //wait for dice roll animations
        const promises = rollDisplays.map(m => game.dice3d.waitFor3DAnimationByMessageID(m.id));
        await Promise.all(promises);

        await this.displaySummaryMessage();
        
    }

    /**
     * Transform a checkResult into a ChatMessage, displaying the roll result.
     * @param {string} resultId 
     * @returns {Promise<ChatMessage>}           A promise which resolves to the created ChatMessage document
     */
    async _createSingleRollMessage(resultId) {
        const /** @type {CheckResult} */ result = this.checkResults[resultId];
        if(!result) throw new Error(`Result id "${resultId}" not found in mission id "${this.id}".`);

        const { rollObj, attributeKey, dc, adventurerName, adventurerId, adventurerImg } = result;

        const roll = dnd5e.dice.D20Roll.fromData(rollObj);
        const flavor = `DC ${dc} ${attributeKey.capitalize()} Check`;
  
        const messageData = {
            flavor: flavor,
            speaker: {
                alias: adventurerName,
            },
            flags: { "talia-custom": { checkResult: result } }
        };

        return await roll.toMessage(messageData, { rollMode: CONST.DICE_ROLL_MODES.PUBLIC });
    }

    /**
     * Hook on dnd5e.renderChatMessage for chat messages with the "talia-custom.checkResult" flag
     * to modify the avatar image to match the adventurer image
     * @param {ChatMessage5e} chatMessage 
     * @param {HTMLElement} html 
     */
    static onDnd5eRenderChatMessageHook(chatMessage, html, messageData) {
        const result = chatMessage.flags?.["talia-custom"]?.checkResult;
        if(!result) return;

        const { adventurerName, adventurerImg } = result;

        const imgEle = html.querySelector(`img[alt="${adventurerName}"]`);
        if(imgEle) imgEle.setAttribute("src", adventurerImg);
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
            "name", "_dc.brawn", "_dc.cunning", "_dc.spellcraft", "_dc.influence", "_dc.reliability",
            "_risk", "rewards.gp", "rewards.other", "durationInDays", "description", "summaryFlavor",
            "hidden"
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

    async delete() {
        return this.guild.deleteEmbedded([this.id]);
    }

    async toggleHidden() {
        return this.update({hidden: !this.hidden});
    }
}
