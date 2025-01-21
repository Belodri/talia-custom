import { _defineAttributesSchema, _defineDateSchema } from "./sharedSchemas.mjs";
import { MappingField } from "../../utils/mappingField.mjs"; 
import Building from "./building.mjs";
import Effect from "./effect.mjs"
import TaliaDate from "../../utils/TaliaDate.mjs";
import { MODULE } from "../../scripts/constants.mjs";
import SettlementApp from "./settlementApp.mjs";


export default class Settlement extends foundry.abstract.DataModel {
    static FLAG_KEY = "Settlement";

    static BASE_VALUES = {
        ATTRIBUTES: {
            authority: 0,
            economy: 0, 
            community: 0,
            progress: 0,
            intrigue: 0,
        },
        MAX_CAPACITY: 4
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
            founding: new SchemaField( _defineDateSchema() ),
            unlocked: new SetField( new StringField() ),
            buildings: new MappingField( 
                new EmbeddedDataField(  Building, { nullable: true } ), { initial: {}, nullable: false }
            ),
            effects: new MappingField( 
                new EmbeddedDataField( Effect, { nullable: true }  ), { initial: {}, nullable: false } 
            )
        }
    }

    /**
     * Creates a new Settlement with a unique name by creating a new JournalEntry with default data and pages.
     * @param {string} name 
     * @returns {Promise<Settlement>}
     */
    static async create(name) {
        if(Settlement.getName(name)) throw new Error(`Settlements must have unique names. "${name}" already exists.`);

        const newJournalEntry = await JournalEntry.create({type: "base", name, ownership: { default: 3 }});
        const publicNotesPage = await JournalEntryPage.create({type: "text", name: "Notes" }, 
            {parent: newJournalEntry});
        const privateNotesPage = await JournalEntryPage.create({type: "text", name: "GM Notes", ownership: { default: 0 }}, 
            {parent: newJournalEntry});

        const allBuildings = Building.database.reduce((acc, curr) => {
            acc[curr.id] = curr;
            return acc;
        }, {});

        const allEffects = Effect.database.reduce((acc, curr) => {
            acc[curr.id] = curr;
            return acc; 
        }, {});

        const initData = {
            buildings: allBuildings,
            effects: allEffects,
            founding: TaliaDate.now(),
        }

        const settlement = new Settlement(initData, {parent: newJournalEntry});
        await newJournalEntry.setFlag(MODULE.ID, Settlement.FLAG_KEY, settlement);
        return settlement;
    }

    /**
     * Gets an existing Settlement instance by name.
     * @param {string} name 
     * @returns {Settlement}
     */
    static getName(name) {
        const journalEntry = game.journal.getName(name);
        const flagData = journalEntry?.getFlag(MODULE.ID, Settlement.FLAG_KEY);
        if(flagData) return new Settlement(flagData, {parent: journalEntry});
    }

    /**
     * Gets a Settlement from a given document. Returns undefined if none is found.
     * @param {Document} document 
     * @returns {Settlement}
     */
    static getFromDoc(document) {
        if( !(document instanceof JournalEntry) ) return;
        const flagData = document?.getFlag(MODULE.ID, Settlement.FLAG_KEY);
        if(flagData) return new Settlement(flagData, {parent: document});
    }

    /** 
     * A Collection of constructed buildings. Evaluated in prepareDerivedData.
     * @type {import("../../foundry/common/utils/collection.mjs").default<string, Building>} 
     */
    constructedBuildings = new foundry.utils.Collection();

    /** 
     * A Collection of effects that are currently active. Evaluated in prepareDerivedData.
     * @type {import("../../foundry/common/utils/collection.mjs").default<string, Effect>} 
     */
    activeEffects = new foundry.utils.Collection();

    /** @returns {string} */
    get name() { return this.parent.name;  }

    /**
     * Gets the SettlementApp instance of this Settlement instance.
     * If none exists, a new one is created.
     * @returns {SettlementApp}
     */
    get app() { 
        if(!this.#app) {
            const app = new SettlementApp(this);
            this.#app = app;
        }
        return this.#app;
    }

    /**
     * Update this Settlement, propagating the data to the parent journal.  
     * @param {object} changes 
     * @param {object} options 
     * @returns {Promise<this>}
     */
    async update(changes, options = {}) {
        changes = foundry.utils.expandObject(changes);
        this.updateSource(changes, options);
        await this.parent.setFlag(MODULE.ID, Settlement.FLAG_KEY, this.toObject());
        return this; 
    }

    async addUnlocked(idString) {
        if(!this.unlocked.has(idString)) {
            const newSet = new Set([...this.unlocked]);
            newSet.add(idString);
            return await this.update({"unlocked": newSet});
        }
    }

    async removeUnlocked(idString) {
        if(this.unlocked.has(idString)) {
            const newSet = new Set([...this.unlocked]);
            newSet.delete(idString);
            return await this.update({"unlocked": newSet});
        }
    }

    /**
     * Syncs this instance of Settlement with the data on the flag on the parent document.
     * Called by an updateDocument hook to keep instances in sync across clients.
     */
    syncWithDocument() {
        const sourceData = this.parent.getFlag(MODULE.ID, "Settlement");
        this.updateSource(sourceData);
    }

    _initialize(...args) {
        super._initialize(...args);
        this.prepareDerivedData();
    }

    prepareDerivedData() {
        const attributes = { ...Settlement.BASE_VALUES.ATTRIBUTES };
        const constructedBuildings = new foundry.utils.Collection();
        const activeEffects = new foundry.utils.Collection();

        let maxCapacity = Settlement.BASE_VALUES.MAX_CAPACITY;
        let takenCapacity = 0;


        const _prepareModifiers = (modifiers) => {
            maxCapacity += modifiers.capacity;
            for(const [k, v] of Object.entries(modifiers.attributes)) {
                attributes[k] += v;
            }
        }

        for(const building of Object.values(this.buildings)) {
            if(building.isBuilt) {
                constructedBuildings.set(building.id, building);
                _prepareModifiers(building.modifiers);
                if( building.isRecentlyConstructed ) takenCapacity += building.scale;
            }
        }

        for(const effect of Object.values(this.effects)) {
            if(effect.isActive) {
                activeEffects.set(effect.id, effect);
                _prepareModifiers(effect.modifiers);
            }
        }

        this.attributes = attributes;
        this.constructedBuildings = constructedBuildings;
        this.activeEffects = activeEffects;
        this.capacity = {
            max: maxCapacity,
            available: maxCapacity - takenCapacity,
        }
    }
}
