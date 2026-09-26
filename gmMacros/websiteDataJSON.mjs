// @ts-check

import { TaliaCustomAPI } from "../scripts/api.mjs";
import TaliaDate from "../utils/TaliaDate.mjs";
import Building from "../world/settlement/building.mjs";
import Effect from "../world/settlement/effect.mjs";
import Settlement from "../world/settlement/settlement.mjs";
export default {
    register() {
        TaliaCustomAPI.add({
            websiteDataJSON: Exporter.runMacro
        }, "GmMacros");
    }
}

class Exporter {
    static CONFIG = {
        /** Journals that have any of these strings in their names will be included in the selection. */
        journalFolderNamePartials: [
            "Player",
            "Rules",
        ],
        /** Whether to exclude items that are stored in personal item piles. */
        excludeItemsFromOwnedPiles: false
    }

    static DEFAULT_SETTLEMENT_NAME = "Promise";

    static async runMacro() { return new Exporter()._runMacro(); }

    #parser = new DOMParser();

    #configured = false;

    /** @type {User[]} */
    #playerUsers;

    /** @type {Journal[]} */
    #journals;

    #settlementName = "";

    async _runMacro(clipboard=true) {
        if(!game.user.isGM) return null;

        await this.configureOptions();
        if(!this.#configured) return null;

        let jsonString;
        try {
            const exportData = await this.getExportData();
            jsonString = JSON.stringify(exportData, null, 2);
        } catch (err) {
            console.error("Exporter | Failed data gathering.", err);
        }

        if(clipboard) {
            try {
                await navigator.clipboard.writeText(jsonString);
                // eslint-disable-next-line no-alert
                alert("JSON copied to clipboard!");
            } catch (err) {
                console.error("Exporter | Failed writing to clipboard.", err);
            }
        }
        
        return jsonString;
    }

    async configureOptions() {
        const { DialogV2 } = foundry.applications.api;
        const { StringField } = foundry.data.fields;
        const { createMultiSelectInput, createFormGroup } = foundry.applications.fields;

        const makeCheckboxes = (name, label, options) => {
            return createFormGroup({
                label,
                input: createMultiSelectInput({
                    type: "checkboxes",
                    name,
                    options
                })
            }).outerHTML;
        }

        const playerOptions = game.users.players
            .filter(u => u.character)
            .map(u => ({
                label: u.name,
                value: u.id,
                selected: true
            }))
            .sort((a,b) => a.label.localeCompare(b.label));
        const playersCheckboxes = makeCheckboxes("playerIds", "Players", playerOptions);

        const journalOptions = game.journal
            .filter(j => j.ownership.default >= 2 
                && Exporter.CONFIG.journalFolderNamePartials.some(str => j.folder?.name.includes(str))
            )
            .map(j => ({
                label: j.name,
                value: j.id,
                selected: true,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
        const journalCheckboxes = makeCheckboxes("journalIds", "Journals", journalOptions);

        const settlementField = new StringField({
            initial: Exporter.DEFAULT_SETTLEMENT_NAME,
            blank: true,
            label: "Settlement Name",
        }).toFormGroup({},{name: "settlementName"}).outerHTML;


        const res = await DialogV2.prompt({
            content: playersCheckboxes + settlementField + journalCheckboxes,
            position: {
                width: 1200,
            },
            ok: {
                callback: (event, button) => new FormDataExtended(button.form).object
            },
            rejectClose: false,
            modal: true,
        });

        if(res) {
            this.#settlementName = res.settlementName ?? "";
            this.#playerUsers = res.playerIds.map(id => game.users.get(id)) ?? [];
            this.#journals = res.journalIds.map(id => game.journal.get(id)) ?? [];
            this.#configured = true;
        }
    }

    /**
     * @returns {Promise<JsonSchema.Schema>}
     */
    async getExportData() {
        const actorsData = await Promise.all(this.#playerUsers
            .map(u => this.#getActorData(u)));

        return {
            actors: await Promise.all(this.#playerUsers
                .map(u => this.#getActorData(u))),
            settlement: await this.#getSettlementData(),
            journals: await Promise.all(this.#journals
                .map(j => this.#getJournalData(j))),
            ingameDate: TaliaDate.now().displayString,
        };
    }

    //#region Items

    /** @returns {Promise<JsonSchema.ActorData>} */
    async #getActorData(user) {
        const ownedItems = Exporter.CONFIG.excludeItemsFromOwnedPiles
            ? [...user.character.items]
            : [...user.character.items, ...this.#getOwnedItemPileItems(user)];
        
        const allowedItemTypes = [
            "feat", "spell", "consumable", "container", "equipment", "loot", "tool", "weapon"
        ];

        const sorted = ownedItems
            .reduce((acc, curr) => {
                switch(curr.type) {
                    case "spell":
                        acc.spells.push(curr); break;
                    case "feat":
                        acc.features.push(curr); break;
                    case "consumable":
                    case "equipment":
                    case "loot":
                    case "container":
                    case "tool":
                    case "weapon":
                        acc.physical.push(curr);
                        break;
                    default: break;
                }

                return acc;
            }, { spells: [], features: [], physical: [] });

        return {
            name: user.character.name,
            spells: await Promise.all(sorted.spells.map(i => this.#getSpellData(i))),
            features: await Promise.all(sorted.features.map(i => this.#getFeatureData(i))),
            physicalItems: await Promise.all(sorted.physical.map(i => this.#getPhysicalItemData(i, user))),
        }
    }

    /** @returns {Promise<JsonSchema.SpellData>} */
    async #getSpellData(item) {
        return {
            name: item.name,
            description: await this.#cleanPageHTML(await TextEditor.enrichHTML(item.system.description.value)),
            spellLevel: item.labels.level,
            range: item.labels.range,
            spellSchool: item.labels.school,
        }
    }

    /** @returns {Promise<JsonSchema.FeatureData>} */
    async #getFeatureData(item) {
        return {
            name: item.name,
            description: await this.#cleanPageHTML(await TextEditor.enrichHTML(item.system.description.value)),
            requirements: item.system.requirements
        }
    }

    /** @returns {Promise<JsonSchema.ItemData>} */
    async #getPhysicalItemData(item, user) {
        const typeLabel = item.system.type?.label;
        const subtypeLabel = item.system.type?.subtype;
        const combinedLabel = typeLabel && subtypeLabel
            ? `${typeLabel} (${subtypeLabel})` 
            : typeLabel
                ? typeLabel : "Container";

        return {
            name: item.name,
            description: await this.#cleanPageHTML(await TextEditor.enrichHTML(item.system.description.value)),
            quantity: item.system.quantity,
            inStorage: user.character.id !== item.parent.id,
            typeLabel: combinedLabel,
            requiresAttunement: item.system.attunement === "required"
        }
    }

    
    /**
     * Gets the items from item piles that are owned by the given user.
     * Item piles are considered owned by the user if the item pile is enabled and
     * a) the pile is a vault where the user is the only user with access
     * b) the pile actor is owned by the user, has no default ownership, and has no other player owners
     * @param {User} user 
     * @returns {Item[]}
     */
    #getOwnedItemPileItems(user) {
        return game.actors
            .filter(a => {
                if(!ItemPiles.API.isValidItemPile(a)) return false;
                
                const flags = ItemPiles.API.getActorFlagData(a);
                if(!flags.enabled) return false;

                const isOwnedVault = flags.type === "vault"
                    && flags.vaultAccess?.length === 1
                    && flags.vaultAccess[0].uuid === user.uuid;

                if(!isOwnedVault) {
                    const isSoleOwner = a.ownership[user.id] === 3
                        && a.ownership.default === 0
                        && !game.users.players
                            .filter(u => u.id !== user.id)
                            .some(u => a.ownership[u.id] > 0);

                    if(!isSoleOwner) return false;
                }

                return true;
            })
            .flatMap(a => a.items.contents);
    }

    //#endregion

    //#region Settlement

    /**
     * @returns {Promise<JsonSchema.SettlementData>}
     */
    async #getSettlementData() {
        const settlement = Settlement.getName(this.#settlementName);
        if(!settlement) return null;

        settlement.prepareDerivedData();

        /** @type {JsonSchema.SettlementData} */
        return {
            name: this.#settlementName,
            attributes: settlement.attributes,
            capacity: {
                max: settlement.capacity.max,
                available: settlement.capacity.available
            },
            currentEffects: Object.values(settlement.effects)
                .filter(e => e.isActive)
                .map(e => this.#getActiveEffectData(e)),
            buildings: Object.values(settlement.buildings)
                .map(b => this.#getBuildingData(b))
        };
    }

    /**
     * @param {Effect} effect 
     * @returns {JsonSchema.SettlementEffectData}
     */
    #getActiveEffectData(effect) {
        return {
            name: effect.name,
            flavorText: effect.flavorText,
            remainingDays: effect.remainingDays,
            effects: {
                modifiers: {
                    attributes: effect.modifiers.attributes,
                    capacity: effect.modifiers.capacity
                },
                other: effect.effectText
            }
        }
    }

    /** 
     * @param {Building} building 
     * @returns {JsonSchema.SettlementBuildingData}
     */
    #getBuildingData(building) {
        return {
            name: building.name,
            flavorText: building.flavorText,
            scale: building.scale,
            constructionDate: building.isBuilt ? building.constructionDate.displayString : undefined,
            effects: {
                modifiers: {
                    attributes: building.modifiers.attributes,
                    capacity: building.modifiers.capacity
                },
                other: building.effectText
            },
            requirements: {
                attributes: building.requirements?.attributes ?? {},
                buildings: [...building.requirements.buildings].map(id => Building.database.get(id).name) ?? [],
                unlocks: [...building.requirements.unlocked]
            }
        }
    }

    //#endregion
    
    //#region Journal

    /** 
     * @import {JournalEntryPage} from "../foundry/client/data/documents/journal-entry-page.js"
     * @import {JournalEntry} from "../foundry/client/data/documents/journal-entry.js"
     */

    /**
     * 
     * @param {JournalEntry} entry 
     * @returns {JsonSchema.JournalData}
     */
    async #getJournalData(entry) {
        return {
            name: entry.name,
            pages: await Promise.all(entry.pages
                .filter(p => (p.ownership.default >= 2 || p.ownership.default === -1) && p.type === "text")
                .sort((a, b) => a.sort !== b.sort ? a.sort - b.sort : a._stats.createdTime - b._stats.createdTime)
                .map(async p => ({
                    name: p.name,
                    htmlContent: this.#cleanPageHTML(await TextEditor.enrichHTML(p.text.content)),
                })))
        };
    }

    //#endregion

    //#region Utils

    #cleanPageHTML(html) {
        const tagsToRemove = ['IMG', 'LINK', 'SCRIPT', 'IFRAME',
            'AUDIO', 'VIDEO', 'SOURCE', 'OBJECT', 'EMBED',
        ];

        const doc = this.#parser.parseFromString(html, 'text/html');

        doc.querySelectorAll("*").forEach(e => {
            if(tagsToRemove.includes(e.tagName)) e.remove();
            else if (e.tagName === 'A' && e.parentNode) e.replaceWith(e.textContent);
            else Array.from(e.attributes).forEach(attr => e.removeAttribute(attr.name));
        });

        return doc.body.innerHTML;
    }

    //#endregion
}


