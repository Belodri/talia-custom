import { MappingField } from "../../utils/mappingField.mjs"; 
import { MODULE } from "../../scripts/constants.mjs";
import Adventurer from "./adventurer.mjs";
import Mission from "./mission.mjs";
import GuildApp from "./guildApp.mjs";
import TaliaDate from "../../utils/TaliaDate.mjs";
import { Helpers } from "../../utils/helpers.mjs";

/** @typedef {import("../../foundry/common/utils/collection.mjs").default} Collection */


export default class Guild extends foundry.abstract.DataModel {
    constructor(...args) {
        super(...args);

        //for type annotations
        /** @type {Collection<string, Adventurer>} */
        this.adventurers ??= new foundry.utils.Collection();

        /** @type {Collection<string, Mission>} */
        this.missions ??= new foundry.utils.Collection();
    }

    static TESTING = {
        misDesc: "The village of Gloomhollow has been plagued by spectral apparitions that vanish upon confrontation. The guild has traced the source to an ancient crypt beneath the village. Investigate the crypt, identify the cause of the hauntings, and eliminate the threat. Be warned: the crypt is rumored to be riddled with traps and cursed relics.",
        misSum: "Over [duration] days, from [startDate] to [returnDate], the [assigned] adventurers explored the crypt beneath Gloomhollow. They uncovered a cursed artifact responsible for the hauntings, dispelled the lingering spirits, and neutralized the artifact. The team's efforts restored peace to the village, though further investigation into the crypt's origins is recommended.",
        misName: "The Phantom Menace of Gloomhollow"
    }

    static FLAG_KEY = "Guild";

    static CONFIG = {
        daysPerRound: 30,

        boardSlotsMax: 8,
        boardFillPerRound: 4,

        hallSlotsMax: 12,
        hallFillPerRound: 8,

        scribeTitle: "Guild Scribe",
        scribeImg: "TaliaCampaignCustomAssets/c_Icons/Linzi_token.png",

        requiredModulesKeys: {
            itemPiles: "item-piles"
        }
    }

    /** @override */
    static metadata = Object.freeze({
        label: "Guild",
        documentName: "guild",
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

        const obj = this.toObject();
        const flattened = foundry.utils.flattenObject(diff);
        const deletions = Object.entries(flattened)
            .filter(([k, v]) => v === null && k.split(".").pop().startsWith("-=") )
            .reduce((acc, [k, v]) => {
                acc[k] = v;
                return acc;
            }, {});
        const objWithDeletions = foundry.utils.mergeObject(obj, deletions);
        
        await this.parent.setFlag(MODULE.ID, Guild.FLAG_KEY, objWithDeletions);
        return diff; 
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
        const choices = await Adventurer.createAdventurerDataDialog() ?? {};
        const randomData = await Adventurer.getRandomData(this, choices);
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

    //#endregion

    //#region Vault

    /**
     * Gets an existing item pile actor of this guild or creates one if none exists.
     * @returns {Promise<Actor>}
     * @throws {Error}              If itempiles is not active or if no default actor could be found if a new vaultActor needs to be created.
     */
    async getVaultActor() {
        Helpers.isModuleActive(Guild.CONFIG.requiredModulesKeys.itemPiles, {strict: true});    //throws if not active;

        const itemPileActor = game.actors.find(a => a.flags["talia-custom"]?.vaultOfGuildName === this.name);
        if(itemPileActor) return itemPileActor;

        const pack = game.packs.get("talia-custom.talia-actors");
        const [packActorDoc] = await pack.getDocuments({name: "DefaultGuildVault"});
        if(!packActorDoc) throw new Error("Unable to find actor 'DefaultGuildVault' in pack 'talia-custom.talia-actors'.");

        const changes = {
            "flags.talia-custom.vaultOfGuildName": this.name,
            "name": `${this.name} Vault`
        }
        const obj = foundry.utils.mergeObject(packActorDoc.toObject(), changes);
        return await Actor.implementation.create(obj);
    }

    /**
     * Opens the vault interface for the vault actor.
     */
    async openVault() {
        const vaultActor = await this.getVaultActor();

        /**
         * Renders the appropriate interface for a given actor
         *
         * @param {Actor|TokenDocument} target                      The actor whose interface to render
         * @param {object} [options]                                An object containing the options for this method
         * @param {Array<string|User>} [options.userIds]            An array of users or user ids for each user to render the interface for (defaults to only self)
         * @param {Actor|TokenDocument} [options.inspectingTarget]  Sets what actor should be viewing the interface
         * @param {boolean} [options.useDefaultCharacter]           Whether other users should use their assigned character when rendering the interface
         *
         * @returns {Promise<void>}                                 A promise that resolves when the interface has been rendered.
         */
        const renderItemPileInterface = /** 
        * @type {(
        *   target: Actor | TokenDocument, 
        *   options?: { 
        *     userIds?: Array<string | User>;
        *     inspectingTarget?: Actor | TokenDocument;
        *     useDefaultCharacter?: boolean;
        *   }
        * ) => Promise<void>} 
        */ game.itempiles.API.renderItemPileInterface;

        return await renderItemPileInterface(vaultActor, {useDefaultCharacter: true});
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

        this.currentDate = TaliaDate.now();
        
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
