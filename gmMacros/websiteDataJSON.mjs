import { TaliaCustomAPI } from "../scripts/api.mjs";
import TaliaDate from "../utils/TaliaDate.mjs";
import Settlement from "../world/settlement/settlement.mjs";
export default {
    register() {
        TaliaCustomAPI.add({
            websiteDataJSON: Exporter.runMacro
        }, "GmMacros");
    }
}

class Exporter {
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

        await this.#configureOptions();
        if(!this.#configured) return null;

        let jsonString;
        try {
            const actorItems = this.#getActorItems();
            const settlementData = await this.#getSettlementData();
            const journalData = this.#getJournalData();

            const exportData = {
                actorItems,
                settlementData,
                journalData,
                ingameDate: TaliaDate.now().displayString,
            };

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

    async #configureOptions() {
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
            }));
        const playersCheckboxes = makeCheckboxes("playerIds", "Players", playerOptions);

        const journalOptions = game.journal
            .filter(j => j.folder?.name.includes("Player") && j.ownership.default >= 2)
            .map(j => ({
                label: j.name,
                value: j.id,
                selected: true,
            }));
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

    //#region Items

    #getActorItems() {
        const actorItems = {};
        for(const user of this.#playerUsers) {
            const itemsArray = [];
            for(const item of user.character.items) {
                const itemData = this.#getItemData(item);
                if(itemData) itemsArray.push(itemData);
            }
            actorItems[user.character.name] = itemsArray
        }
        return actorItems;
    }

    /**
     * 
     * @param {Item} item 
     */
    #getItemData(item) {
        const allowedTypes = [
            "feat", "spell", "consumable", "container", "equipment", "loot", "tool", "weapon"
        ];
        if(!allowedTypes.includes(item.type)) return null;

        const data = {
            name: item.name,
            description: this.#cleanPageHTML(item.system.description.value),
        };

        if(item.type === "spell") {
            data.section = "spell-items";
            data.spellLevel = item.labels.level;
            data.spellRange = item.labels.range;
            data.spellSchool = item.labels.school;
        } else if(item.type === "feat") {
            data.section = "feature-items";
            data.requirements = item.system.requirements;
        } else {
            data.section = "physical-items";
            data.quantity = item.system.quantity;

            const typeLabel = item.system.type?.label;
            const subtypeLabel = item.system.type?.subtype;
            data.combinedLabel = typeLabel && subtypeLabel
                ? `${typeLabel} (${subtypeLabel})`
                : typeLabel
                    ? typeLabel
                    : "Container";

            data.attunementLabel = item.system.attunement === "required" 
                ? "Requires Attunement" 
                : "";
        }

        return data;
    }

    //#endregion

    //#region Settlement

    async #getSettlementData() {
        const settlement = Settlement.getName(this.#settlementName);
        if(!settlement) return null;

        const app = settlement.app;
        const context = await app._prepareContext();

        const general = {
            name: this.#settlementName,
            attributes: { ...settlement.attributes },
            capacity: { ...settlement.capacity },
        };

        const effects = context.effectsContext
            .filter(e => e.isActive)
            .map(e => ({
                section: "effect-items",
                endDateStr: e.endDateStr,
                flavorText: e.flavorText,
                grants: e.grants,
                isTemporary: e.isTemporary,
                name: e.name,
                remainingDays: e.remainingDays
            }));
        
        const buildings = context.buildingsContext
            .map(b => ({
                section: "building-items",
                constructionDateDisplay: b.constructionDateDisplay,
                effectText: b.effectText,
                flavorText: b.flavorText,
                grants: b.grants,
                name: b.name,
                isRecent: b.isRecent,
                requires: b.requires,
                scale: b.scale
            }));
        
        return {
            general,
            effects,
            buildings,
        };
    }

    //#endregion
    
    //#region Journal

    #getJournalData() {
        return this.#journals
            .map(j => ({
                name: j.name,
                pages: j.pages
                    .filter(p => (p.ownership.default >= 2 || p.ownership.default === -1) 
                        && p.type === "text" && p.text.format === 1)
                    .sort((a,b) => a.sort !== b.sort ? a.sort - b.sort : a._stats.createdTime - b._stats.createdTime)
                    .map(p => ({
                        name: p.name,
                        section: "journal-pages",
                        content: this.#cleanPageHTML(p.text.content),
                    }))
            }))
            .filter(obj => obj.pages.length)
            .sort((a,b) => a.name.localeCompare(b.name));
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
