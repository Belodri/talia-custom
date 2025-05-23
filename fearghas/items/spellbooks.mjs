import { MODULE } from "../../scripts/constants.mjs";

export default {
    _onInit() {
        CONFIG.DND5E.equipmentTypes.spellbook = CONFIG.DND5E.miscEquipmentTypes.spellbook = "Spellbook";
    },
    _onSetup() {
        Hooks.on("updateItem", (item, data, options, userId) => {
            //to prevent the code from executing on other clients, check for userId
            if(game.user.id !== userId) return; 

            if(!item.actor) return;

            if(item.type !== "equipment" || item.system?.type?.value !== "spellbook") return;
        
            if (
                // The item is equipped after the update
                item.system.equipped &&
                // And either attunement is not required, or it is required and the item is attuned
                (item.system.attunement !== "required" || item.system.attuned) &&
                // And either the equipped status changed, or the attuned status changed
                (data.system.equipped !== undefined || data.system.attuned !== undefined)
            ) {
                // Add spells to the actor
                Spellbooks.addSpells(item)
            } else if (
                // The item is now unequipped
                !item.system.equipped ||
                // Or attunement is required and the item is no longer attuned
                ( (item.system.attunement === "required" && !item.system.attuned) &&
                // And either the equipped status changed, or the attuned status changed
                (data.system.equipped !== undefined || data.system.attuned !== undefined) )
            ) {
                // Remove spells from the actor
                Spellbooks.removeSpells(item)
            }
        });
    }
}

export class Spellbooks {
    /**
     * @typedef {{[key: string]: string[]}} SpellbookDatabase
     * @property {string[]} "Strength through suffering (of others)" - A list of spells.
     */

    /**
     * A database of all spellbooks.
     * Each key is a string with the name of the spellbook.
     * Each value is an array of strings that contains the names of the spells inside that spellbook.
     * 
     * @type {SpellbookDatabase}
     */
    static bookDatabase = {
        "Strength through suffering (of others)": {
            spellList: [
                "Toll the Dead",
                "Armor of Agathys",
                "Life from Death",
                "Vampiric Touch",
                "Shadow of Moil",
                "Magic Mirror",
            ],
            changes: {
                "system.preparation.mode": "always", 
                "system.preparation.prepared": false,
            }
        },
        "Unholy Grimoire of Blood": {
            spellList: [
                "Bloody Rites",
                "Blood Barrier",
                "Traitorous Blood"
            ],
            changes: {
                "system.preparation.mode": "always",
                "system.preparation.prepared": false
            }
        }
        
    };

    static spellItemFlag = `grantedByUuid`;    //the flag to be added to each spell that's being added by a spellbook

    /**
     * 
     * @param {Item5e} item 
     * @returns 
     */
    static async addSpells(item) {
        if(!(item.name in this.bookDatabase)) return;

        const spellList = this.bookDatabase[item.name].spellList;

        //create an array of spells that the current spellbook should contain from the compendium
        const spells = await game.packs.get(MODULE.customItemsPackKey).getDocuments({name__in: spellList});

        //warn which spells have not been found in the compendium (if any)
        if(!spells || spellList.length !== spells.length) {
            // Create a Set of spell names from the spells array, then filter the spellList to include only those names not in the Set
            const notFound = spellList.filter(spellName => 
                !new Set(spells.map(spell => spell.name)).has(spellName)
            );
            ui.notifications.warn(`One or more of these spells could not be found in the compendium: ${notFound.join(`, `)}`);
            throw new Error(`One or more of these spells could not be found in the compendium: ${notFound.join(`, `)}`);
        }

        //default changes applied to each spell that's added to an actor
        const defaultChanges = {
            [`flags.${MODULE.ID}.${this.spellItemFlag}`]: item.uuid,
        };

        //merge the default changes with the changes that are specific to each spellbook
        const changes = foundry.utils.mergeObject(defaultChanges, this.bookDatabase[item.name].changes ?? {});

        const spellObjects = spells.map(spell => {
            //convert spells to objects and apply changes to each
            const spellObj = spell.toObject();
            foundry.utils.mergeObject(spellObj, changes);

            return spellObj;
        });

        //check if the actor already has spells with that flag and if so, remove those from spellObjects

        //add spells to actor
        const created = await Item.createDocuments(spellObjects, {parent: item.actor});
    }

    static async removeSpells(item) {
        if(!(item.name in this.bookDatabase)) return;
        const actor = item.actor;

        //find items on actor with module flag that match the uuid of the item
        const foundSpells = actor.items.filter(i => i.getFlag(MODULE.ID, this.spellItemFlag) === item.uuid);
        const foundSpellsIds = foundSpells.map(spell => spell.id);

        const deleted = await Item.deleteDocuments(foundSpellsIds, {parent: item.actor});
    }
}
