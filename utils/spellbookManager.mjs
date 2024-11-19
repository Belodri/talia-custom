import { TaliaCustomAPI } from "../scripts/api.mjs";
import { MODULE } from "../scripts/constants.mjs";

/**
 * @typedef SpellData
 * @property {string} name 
 * @property {string} uuid
 * @property {string} _id
 * @property {boolean} isLocked
 */

export default {
    register() {

        CONFIG.DND5E.equipmentTypes.spellbook = CONFIG.DND5E.miscEquipmentTypes.spellbook = "Spellbook";


        Hooks.on("talia-custom.postEquip", async (item) => {
            if(!Spellbook.isSpellbook(item)) return;
            return await new Spellbook(item).addSpellsToActor();
        });
        
        Hooks.on("talia-custom.postUnEquip", async (item) => {
            if(!Spellbook.isSpellbook(item)) return;
            return await new Spellbook(item).removeSpellsFromActor(false);
        });
        
        Hooks.on("talia-custom.postAttune", async (item) => {
            if(!Spellbook.isSpellbook(item) || !Spellbook.isEquipped(item)) return;
            return await new Spellbook(item).addSpellsToActor();
        })
        
        Hooks.on("talia-custom.postUnAttune", async (item) => {
            if(!Spellbook.isSpellbook(item)) return;
            return await new Spellbook(item).removeSpellsFromActor(true);
        });

        TaliaCustomAPI.add({SpellbookManager: {
            addSpell: Spellbook.addSpellToBookMacro,
            removeSpell: Spellbook.removeSpellFromBookMacro
        }}, "none");
    }
}

class Spellbook {
    constructor(item) {
        this.item = item;
    }

    static defaultChanges = {
        "system.preparation.mode": "always",
        "system.preparation.prepared": false
    }

    /**
     * @returns {SpellData[]}
     */
    get spellDataArray() {
        return this.item.flags?.["talia-custom"]?.spellbook?.spells || [];
    }

    static isSpellbook(item) {
        return item.type === "equipment" && item.system?.type?.value === "spellbook";
    }

    static isEquipped(item) {
        return item.system?.equipped === true;
    }

    get isAttuned() {
        return this.item.system?.attuned === true;
    }

    get requiresAttunement() {
        return this.item.system?.attunement === "required"
    }

    get grantedSpells() {
        return this.item.actor.items.filter(i => i.flags?.[MODULE.ID]?.spellbook?.source === this.item.uuid);
    }

    async addSpellToBook(uuid, isLocked = false, changes = {}) {
        const spell = await fromUuid(uuid);
        if(!spell) {
            ui.notifications.error("The spell wasn't found in the compendium.");
            return null;
        }

        const spells = this.spellDataArray;
        const spellData = spells.find(i => i.uuid === spell.uuid);
        if(spellData) {
            spellData.name = spell.name;
            spellData.uuid = spell.uuid;
            spellData._id = spell._id;
            spellData.isLocked = isLocked;
            spellData.changes = changes;
        } else {
            spells.push({
                name: spell.name,
                uuid: spell.uuid,
                _id: spell._id,
                isLocked,
                changes
            });
        }
        return this.updateSpellsOnBook(spells);
    }

    async removeSpellFromBook({name = "", uuid = ""}) {
        if(!name && !uuid) {
            ui.notifications.error("You need to provide either a name or a uuid.");
            return null;
        }
        const spells = this.spellDataArray.filter(i => i.name !== name && i.uuid !== uuid);
        return await this.updateSpellsOnBook(spells);
    }

    /**
     * Overrides the current SpellDataArray
     * @param {SpellData[]} spellDataArray 
     * @returns 
     */
    async updateSpellsOnBook(spellDataArray) {
        return await this.item.setFlag("talia-custom", "spellbook.spells", spellDataArray);
    }

    async addSpellsToActor() {
        const forbidLocked = this.requiresAttunement && !this.isAttuned;
        const pack = game.packs.get(MODULE.customItemsPackKey);
        const grantedSpellNames = this.grantedSpells.map(i => i.name);

        const spellObjectArray = [];
        for(const spellData of this.spellDataArray) {
            if(spellData.isLocked && forbidLocked) continue;
            if(grantedSpellNames.includes(spellData.name)) continue;

            const doc = await pack.getDocument(spellData._id);
            if(!doc) {
                ui.notifications.warn(`The item ${spellData.name} could not be found in the compendium.`);
                continue;
            }

            const spellObj = doc.toObject();
            const changesObj = foundry.utils.mergeObject(Spellbook.defaultChanges, {
                flags: {
                    [MODULE.ID]: {
                        spellbook: {
                            source: this.item.uuid,
                            isLocked: spellData.isLocked
                        }
                    }
                },
                ...spellData.changes
            });
            foundry.utils.mergeObject(spellObj, changesObj);
            spellObjectArray.push(spellObj);
        }

        //add spells to the actor
        return await Item.createDocuments(spellObjectArray, {parent: this.item.actor});
    }

    async removeSpellsFromActor(lockedOnly = false) {
        const spells = lockedOnly ? 
            this.grantedSpells.filter(i => i.flags?.[MODULE.ID]?.spellbook?.isLocked === true)
            : this.grantedSpells;
        const ids = spells.map(i => i.id);
        return await Item.deleteDocuments(ids, {parent: this.item.actor});
    }

    /**
     * Adds a single spell to a spellbook item.
     * @param {Item5e} bookItem The item to which the spells should be added
     * @param {string} spellUuid The uuid of the spell inside the compendium
     * @param {boolean} isLocked A locked spell requires the book to be attuned. 
     * @param {object} changes Changes that should be applied to the spell when it's added to the actor. Overrides default changes.
     * @returns {Promise<Item5e>}
     */
    static async addSpellToBookMacro(bookItem, spellUuid, isLocked = false, changes = {}) {
        if(!Spellbook.isSpellbook(bookItem)) {
            ui.notifications.warn("bookItem is not a spellbook");
            return;
        }
        const book = new Spellbook(bookItem);
        return await book.addSpellToBook(spellUuid, isLocked, changes);
    }

    /**
     * Removes a single spell to a spellbook item.
     * @param {Item5e} bookItem The item from which the spells should be removed
     * @param {string} spellName The name of the spell to be removed
     * @param {string} spellUuid The uuid of the spell to be removed
     * @returns {Promise<Item5e>}
     */
    static async removeSpellFromBookMacro(bookItem, spellName = "", spellUuid = "") {
        if(!spellName && !spellUuid) {
            ui.notifications.warn("A spellName or a spellUuid need to be provided.");
            return;
        }
        if(!Spellbook.isSpellbook(bookItem)) {
            ui.notifications.warn("bookItem is not a spellbook");
            return;
        }
        const book = new Spellbook(bookItem);
        return await book.removeSpellFromBook({name: spellName, uuid: spellUuid});
    }

}