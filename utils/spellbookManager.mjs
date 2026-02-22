import { TaliaCustomAPI } from "../scripts/api.mjs";
import { MODULE } from "../scripts/constants.mjs";
import Item5e from "../system/dnd5e/module/documents/item.mjs";

// TODO: Fix performance issue caused by Handlebars rendering repeatedly when dropping items. 
// Number of rerenders increases exponentially with each dropped item and resets on closing the sheet.
// Deleting an item does not seem to cause this issue.

export default {
    register() {
        CONFIG.DND5E.equipmentTypes.spellbook = CONFIG.DND5E.miscEquipmentTypes.spellbook = "Spellbook";
        Spellbook.registerHooks();
        SpellbookTab.init();
    }
}

/**
 * @typedef {{
 *  img: string,
 *  name: string,
 *  uuid: string,
 *  localId?: string
 * }} SpellData
 */

/**
 * @typedef {{[key: string]: spellData}} SpellsData
 */

class SpellbookTab {
    constructor(app, [html]) {
        this.app = app;
        this.item = app.item;
        this.sheetHtml = html;
    }

    static instances = new Map();

    static TEMPLATES = {
        spellbookTab: `modules/${MODULE.ID}/templates/spellbookTab.hbs`
    };

    static preloadTemplates() {
        loadTemplates(SpellbookTab.TEMPLATES);
    }

    // Caching instances and deleting them manually, 
    // otherwise handlebars keeps them alive and tanks performance.
    static #instances = new Map();

    static init() {
        SpellbookTab.preloadTemplates();

        Hooks.once("tidy5e-sheet.ready", (api) => {
            const myTab = new api.models.HtmlTab({
                title: "Spellbook",
                tabId: `${MODULE.ID}`,
                html: "",
                enabled(data) {
                    return Spellbook.isSpellbook(data.item);
                },
                onRender(params) {
                    const item = params.data.item;
                    if(!Spellbook.isSpellbook(item)) return;

                    const app = params.app;
                    const html = [params.element];
                    const instance = SpellbookTab.#instances.get(app.appId);
                    if(instance) {
                        instance.render(params.tabContentsElement);
                    } else {
                        const newInstance = new SpellbookTab(app, html);
                        SpellbookTab.instances.set(app.appId, newInstance);
                        newInstance.render(params.tabContentsElement);
                    }
                }
            });

            api.registerItemTab(myTab, { autoHeight: true });
        });

        Hooks.on("closeItemSheet", async(app) => {
            SpellbookTab.#instances.delete(app.appId);
        })
    }

    async _dragEnd(event) {
        if(!this.app.isEditable) return;
        const data = TextEditor.getDragEventData(event);
        if(data.type !== "Item") return;
        return this.#addSpellToItem(data.uuid);
    }

    async _handleRemoveClick(event) {
        const sourceUuid = event.currentTarget.closest("[data-source-uuid]").dataset.sourceUuid;
        return this.#removeSpellFromItem(sourceUuid);
    }

    #lastRender;

    /**
     * @param {HTMLElement} spellsTab 
     */
    async render(spellsTab) {
        const DEBOUNCE_MS = 50;
        if(this.#lastRender && (Date.now() - this.#lastRender) < DEBOUNCE_MS) return;

        this.#render(spellsTab);
        this.#lastRender = Date.now();
    }

    async #render(spellsTab) {
        const div = document.createElement("div");
        div.innerHTML = await this.#renderSpellList();
        const c = div.firstElementChild;
        spellsTab.appendChild(c);

        c.querySelectorAll(".item-delete").forEach(n => n.addEventListener("click", this._handleRemoveClick.bind(this)));

        const dragDrop = {
            dragSelector: ".item",
            dropSelector: `.${MODULE.ID}`,
            permissions: {drop: () => this.app.isEditable},
            callbacks: {drop: this._dragEnd},
        };
        spellsTab.addEventListener("drop", dragDrop.callbacks.drop.bind(this));
    }

    async #renderSpellList() {
        return renderTemplate(SpellbookTab.TEMPLATES.spellbookTab, {
            sources: this.sources,
            isOwner: this.item.isOwner
        });
    }

    async #addSpellToItem(uuid) {
        const currentSources = this.sources;
        if(currentSources.some(s => s.uuid === uuid)) return;

        const item = await fromUuid(uuid);
        if(item.type !== "spell") return;
        if(item.pack === null) return;  // not in compendium

        const { name, img } = item;
        await this.#setSourcesFlag([...currentSources, { name, img, uuid }]);
    }

    async #removeSpellFromItem(uuid) {
        const newSources = this.sources.filter(s => s.uuid !== uuid);
        await this.#setSourcesFlag(newSources);
    }

    async #setSourcesFlag(newSources = []) {
        await this.item.setFlag(MODULE.ID, Spellbook.FLAGS.BOOK_SPELL_SOURCES, newSources);
    }

    /**
     * @returns {SpellSource[]}
     */
    get sources() {
        return this.item.getFlag(MODULE.ID, Spellbook.FLAGS.BOOK_SPELL_SOURCES) ?? [];
    }
}

/**
 * @typedef {object} SpellSource
 * @property {string} name
 * @property {string} img
 * @property {string} uuid
 */

/**
 * @typedef {object} SpellOriginFlag
 * @property {string} bookUuid
 * @property {string} sourceUuid
 */

export class Spellbook {
    static FLAGS = {
        BOOK_SPELL_SOURCES: "spellbook.sources",
        SPELL_ORIGIN: "spellbook.origin"
    }

    static registerHooks() {
        Hooks.on("updateItem", async (item, changed, options, userId) => {
            const proceed = userId === game.user.id
                && item.isEmbedded
                && item.actor instanceof Actor
                && Spellbook.isSpellbook(item)
                && item.actor.permission === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
            if(!proceed) return;

            // Has changes to equipment status?
            const equipmentChanged = foundry.utils.hasProperty(changed, "system.equipped");
            const attunementChanged = foundry.utils.hasProperty(changed, "system.attuned");
            if(equipmentChanged || attunementChanged) await new Spellbook(item).syncSpellsWithParentActor();
        });
    }

    static getSpellbookItemUuid(spellItem) {
        const origin = Spellbook.#getSpellOriginFlag(spellItem);
        return origin?.bookUuid;
    }

    static isSpellbook(item) {
        return item.type === "equipment" && item.system?.type?.value === "spellbook";
    }

    /**
     * @param {Item} spell 
     * @returns {SpellOriginFlag | null}
     */
    static #getSpellOriginFlag(spell) {
        return spell.getFlag(MODULE.ID, Spellbook.FLAGS.SPELL_ORIGIN) ?? null;
    }

    constructor(item) {
        if(!Spellbook.isSpellbook(item)) throw new Error(`Argument "item" is not a valid Spellbook.`);
        /** @type {Item & Item5e} */
        this.item = item;
    }

    /** @returns {Actor} */
    get actor() { return this.item.actor; }

    /**
     * @returns {SpellSource[]}
     */
    get sources() {
        return this.item.getFlag(MODULE.ID, Spellbook.FLAGS.BOOK_SPELL_SOURCES) ?? [];
    }

    get canActorAccessSpells() {
        if(!this.item.isEmbedded) return false;
        if(!(this.item.actor instanceof Actor)) return false;
        if(!this.item.system.equipped) return false;
        if(this.item.system.attunement === "required") {
            if(!this.item.system.attuned) return false;
        }

        return true;
    }

    /**
     * 
     * @param {string[]} sourceUuids 
     */
    async addSpellSources(sourceUuids = []) {
        const currentSources = this.sources;
        const currentSourceUuids = new Set(currentSources.map(s => s.uuid));

        const toAdd = [];
        for(const uuid of sourceUuids) {
            if(currentSourceUuids.has(uuid)) continue;
            if(!uuid.startsWith("Compendium")) continue;
            
            const itemOrIndex = fromUuidSync(uuid, { strict: false });
            if(!itemOrIndex || itemOrIndex.type !== "spell") continue;

            const { name, img } = itemOrIndex;
            toAdd.push({ name, img, uuid })
        }

        if(toAdd.length) await this.#setSourcesFlag([...currentSources, ...toAdd]);
        if(this.item.isEmbedded && this.actor instanceof Actor) await this.syncSpellsWithParentActor();
    }

    /**
     * 
     * @param {string[]} sourceUuids 
     */
    async removeSpellSources(sourceUuids = []) {
        const currentSources = this.sources;

        const toRemove = new Set(sourceUuids);
        const newSources = this.sources.filter(s => !toRemove.has(s.uuid));

        if(newSources.length !== currentSources.length) await this.#setSourcesFlag(newSources);
        if(this.item.isEmbedded && this.actor instanceof Actor) await this.syncSpellsWithParentActor();
    }

    async #setSourcesFlag(newSources = []) {
        return await this.item.setFlag(MODULE.ID, Spellbook.FLAGS.BOOK_SPELL_SOURCES, newSources);
    }

    async syncSpellsWithParentActor() {
        if(!this.item.isEmbedded || !(this.actor instanceof Actor)) return;

        const allowAccess = this.canActorAccessSpells;
        const sourceUuids = new Set(this.sources.map(s => s.uuid));

        const toRemoveIds = [];
        const alreadyAddedSourceUuids = new Set();

        for(const spell of this.actor.itemTypes.spell) {
            const origin = spell.getFlag(MODULE.ID, Spellbook.FLAGS.SPELL_ORIGIN);
            // Is the spell from THIS spellbook?
            if(origin?.bookUuid !== this.item.uuid) continue;

            // Remove if not in source map or if access is denied.
            if(!allowAccess || !sourceUuids.has(origin.sourceUuid)) toRemoveIds.push(spell.id);

            // Track if the spell is already added if access is allowed.
            if(allowAccess) alreadyAddedSourceUuids.add(origin.sourceUuid);
        }

        // Create spells as needed
        if(allowAccess) {
            const toAddSourceUuids = sourceUuids.filter(uuid => !alreadyAddedSourceUuids.has(uuid));
            await this.#createSpellsOnParentActor(toAddSourceUuids);
        }
        
        // Delete spells as needed
        if(toRemoveIds.length) await this.#deleteSpellsFromParentActor(toRemoveIds);
    }

    async #createSpellsOnParentActor(sourceUuids = []) {
        if(!this.item.isEmbedded || !(this.actor instanceof Actor)) return;

        const sourceItems = await Promise.all(sourceUuids.map(fromUuid));

        const spellObjects = [];
        for(const item of sourceItems) {
            const obj = item.toObject();

            const origin = {
                sourceUuid: item.uuid,  // is source uuid as it comes from compendium
                bookUuid: this.item.uuid
            }

            foundry.utils.mergeObject(obj, {
                [`flags.${MODULE.ID}.${Spellbook.FLAGS.SPELL_ORIGIN}`]: origin,
                "system.preparation.mode": "always",
                "system.preparation.prepared": false
            });

            spellObjects.push(obj);
        }

        return Item.createDocuments(spellObjects, { parent: this.actor });
    }

    async #deleteSpellsFromParentActor(idsToDelete = []) {
        if(this.item.isEmbedded && this.actor instanceof Actor) 
            return Item.deleteDocuments(idsToDelete, { parent: this.actor });
    }
}
