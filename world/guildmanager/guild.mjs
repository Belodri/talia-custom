import { MappingField } from "../../utils/mappingField.mjs"; 
import { MODULE } from "../../scripts/constants.mjs";
import Adventurer from "./adventurer.mjs";
import Mission from "./mission.mjs";
import GuildApp from "./guildApp.mjs";

/** @typedef {import("../../foundry/common/utils/collection.mjs").default} Collection */

/**
 * @typedef {object} GuildConfig
 * @property {number} daysPerRound                  The number of ingame days in each round.
 * 
 * Mission Board
 * @property {number} boardSlotsMax                 The maximum number of missions available on the board at any given time 
 * @property {number} boardFillPerRound             The number of new missions to fill empty board slots each round.  
 * 
 * Mustering Hall                                       
 * @property {number} hallSlotsMax                  The maximum number of adventurers that can be at the guild at any given time.
 * @property {number} hallFillPerRound              The number of new adventurers to fill empty hall slots each round.
 * 
 * 
 */

/*  NOTES ABOUT MISSIONS

    Mission Getter:
    - hasStarted()   Has this mission started (does it have a start date?)
    - isFinished()  Has this mission finished (is the current date more than DURATION days after the start date?)
    - isResolved()  Has this mission been resolved (finished & rewards granted)
    
    Mission States:
    - available     The mission is available at the board but hasn't started yet
        getter: !isRunning && !isRunning
    - running       The mission has started but hasn't finished yet
        getter: isRunning && !isFinished
    - finished      The mission has finished, successfully or not

    Mission Workflow
    1) assign adventurers to mission
    2) start mission
    3) wait until mission has finished
    4) resolve mission
 */

/*  NOTES ABOUT ADVENTURERS

    Adventurer States:
    - available     The adventurer is available at the hall but has not been assigned to a mission
        getter: !isAssigned && !isDead
    - assigned      The adventurer is assigned to a mission
        getter: isAssigned && !isDead
    - dead          The adventurer is dead
        getter: isDead
 */


export default class Guild extends foundry.abstract.DataModel {
    constructor(...args) {
        super(...args);

        //for type annotations
        /** @type {Collection<string, Adventurer>} */
        this.adventurers ??= new foundry.utils.Collection();

        /** @type {Collection<string, Mission>} */
        this.missions ??= new foundry.utils.Collection();
    }

    static FLAG_KEY = "Guild";

    /** @type {GuildConfig} */
    static CONFIG = {
        daysPerRound: 30,

        boardSlotsMax: 8,
        boardFillPerRound: 4,

        hallSlotsMax: 12,
        hallFillPerRound: 8,
    }

    /** @override */
    static metadata = Object.freeze({
        label: "Settlement",
        documentName: "settlement",
        icon: null,
        defaultImg: null
    });

    #app = null;

    static defineSchema() {
        const {
            StringField, SetField, SchemaField, HTMLField, NumberField, EmbeddedDataField, BooleanField
        } = foundry.data.fields;

        return {
            _adventurers: new MappingField(
                new EmbeddedDataField( Adventurer, { nullable: true} ), { initial: {}, nullable: false }
            ),
            _missions: new MappingField( 
                new EmbeddedDataField(  Mission, { nullable: true } ), { initial: {}, nullable: false }
            ),
        }
    }

    //#region Getters

    /** @returns {string} */
    get name() { return this.parent.name; }

    //#endregion

    //#region CRUD
    /**
     * Creates a new Guild with a unique name by creating a new JournalEntry with default data and pages.
     * @param {string} name 
     * @returns {Promise<Guild>}
     */
    static async create(name) {
        if(Guild.getName(name)) throw new Error(`Guilds must have unique names. "${name}" already exists.`);

        const newJournalEntry = await JournalEntry.create({type: "base", name, ownership: { default: 3 }});
        const publicNotesPage = await JournalEntryPage.create({type: "text", name: "Notes" }, 
            {parent: newJournalEntry});
        const privateNotesPage = await JournalEntryPage.create({type: "text", name: "GM Notes", ownership: { default: 0 }}, 
            {parent: newJournalEntry});

        const guild = new Guild({}, {parent: newJournalEntry});
        await newJournalEntry.setFlag(MODULE.ID, Guild.FLAG_KEY, guild);
        return guild;
    }

    /**
     * Gets an existing Guild instance by name.
     * @param {string} name 
     * @returns {Guild}
     */
    static getName(name) {
        const journalEntry = game.journal.getName(name);
        const flagData = journalEntry?.getFlag(MODULE.ID, Guild.FLAG_KEY);
        if(flagData) return new Guild(flagData, {parent: journalEntry});
    }

    /**
     * Gets a Guild from a given document. Returns undefined if none is found.
     * @param {Document} document 
     * @returns {Guild}
     */
    static getFromDoc(document) {
        if( !(document instanceof JournalEntry) ) return;
        const flagData = document?.getFlag(MODULE.ID, Guild.FLAG_KEY);
        if(flagData) return new Guild(flagData, {parent: document});
    }

    /**
     * Update this Guild, propagating the data to the parent journal.  
     * @param {object} changes      New values which should be applied to the data model
     * @param {object} options      Options which determine how the new data is merged
     * @returns {Promise<object>}     An object containing the changed keys and values
     */
    async update(changes, options = {}) {
        changes = foundry.utils.expandObject(changes);
        const diff = this.updateSource(changes, options);
        await this.parent.setFlag(MODULE.ID, Guild.FLAG_KEY, this.toObject());
        return diff; 
    }

    /** 
     * Deletes embedded Missions or Adventurers by their ids.
     * @param {string[]} ids 
     */
    async deleteEmbedded(ids) {
        const changes = {};

        for(const id of ids) {
            const inst = this._missions[id] ?? this._adventurers[id] ?? null;
            if(!inst) throw new Error(`Invalid id "${id}".`);

            const key = inst instanceof Mission ? "_missions" : "_adventurers";
            changes[`${key}.-=${id}`] = null;
        }

        return this.update(changes);
    }

    /**
     * Syncs this instance of Guild with the data on the flag on the parent document.
     * Called by an updateDocument hook to keep instances in sync across clients.
     */
    syncWithDocument() {
        const sourceData = this.parent.getFlag(MODULE.ID, Guild.FLAG_KEY);
        this.updateSource(sourceData);
    }
    //#endregion

    //#region Embedded Data CRUD

    /**
     * Crates a new Mission with this Guild as the parent
     * @param {object} data 
     * @returns {Promise<Mission>}
     */
    async createMissionFromData(data) {
        const id = foundry.utils.randomID(16);
        data.id = id;
        const mission = new Mission(data, {parent: this});
        await this.update({[`_missions.${id}`]: mission });
        return this.missions.get(id);
    }

    async createRandomMission() {
        const randomData = Mission.getRandomData();
        return this.createMissionFromData(randomData);
    }

    /**
     * Crates a new Adventurer with this Guild as the parent
     * @param {object} data 
     * @returns {Promise<Adventurer>}
     */
    async createAdventurerFromData(data) {
        const id = foundry.utils.randomID(16);
        data.id = id;
        const adventurer = new Adventurer(data, {parent: this});
        await this.update({[`_adventurers.${id}`]: adventurer });
        return this.adventurers.get(id);
    }

    async createRandomAdventurer() {
        const randomData = await Adventurer.getRandomData();
        return this.createAdventurerFromData(randomData);
    }

    /**
     * Updates an embedded data model.
     * @param {Mission | Adventurer} embedded   The embedded data model to be updated 
     * @param {object} changes                  New values which should be applied to the data model
     * @param {object} options                  Options which determine how the new data is merged
     * @returns {object}                        An object containing the changed keys and values
     */
    async updateEmbedded(embedded, changes, options={}) {
        const key = embedded instanceof Mission
            ? "_missions"
            : embedded instanceof Adventurer
                ? "_adventurers"
                : null;
        if(!key) throw new Error("Invalid embedded");

        changes = foundry.utils.expandObject(changes);
        const diff = embedded.updateSource(changes, options);
        const guildChanges = {
            [`${key}.${embedded.id}`]: diff,
        };
        await this.update(guildChanges);
        return diff;
    }

    //#endregion

    //#region Data preparation
    _initialize(...args) {
        super._initialize(...args);
        this.prepareDerivedData();
    }

    prepareDerivedData() {
        this.adventurers = new foundry.utils.Collection(
            Object.values(this._adventurers).map(adv => [adv.id, adv])
        );
        this.missions = new foundry.utils.Collection(
            Object.values(this._missions).map(mission => [mission.id, mission])
        );
    }
    //#endregion

    //#region App
    /**
     * Gets the GuildApp instance of this Guild instance.
     * If none exists, a new one is created.
     * @returns {GuildApp}
     */
    get app() { 
        if(!this.#app) {
            const app = new GuildApp(this);
            this.#app = app;
        }
        return this.#app;
    }
    //#endregion

}
