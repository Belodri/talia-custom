// @ts-check

/**
 * @import { parseUuid } from "../foundry/common/utils/helpers.mjs";
 */

import { TaliaCustomAPI } from "../scripts/api.mjs";
import TaliaDate from "../utils/TaliaDate.mjs";
import Building from "../world/settlement/building.mjs";
import Effect from "../world/settlement/effect.mjs";
import Settlement from "../world/settlement/settlement.mjs";
export default {
    register() {
        TaliaCustomAPI.add({
            websiteDataJSON: runMacro
        }, "GmMacros");
        TaliaCustomAPI.add({WebsiteDataCollector});
    }
}

/**
 * @returns {Promise<void>}
 */
async function runMacro() {
    const collector = new WebsiteDataCollector();
    await collector.configureViaDialog(["Player Documents", "Player Notes"], "Promise");
    await collector.collectData();
    await collector.exportJsonToClipboard();
}


class WebsiteDataCollector {
    /**
     * @type {{ users: User[], journals: JournalEntry[], settlement: Settlement | null }}
     */
    #config;

    /**
     * @type {JsonSchema.Schema}
     */
    #collectedData;

    /**
     * @param {string[]} userIds 
     * @param {string[]} journalIds 
     * @param {string | null} settlementName 
     * @returns {WebsiteDataCollector} Instance for chaining
     */
    configure(userIds, journalIds, settlementName) {
        const users = [...new Set(userIds)].map(id => game.users.get(id));
        const journals = [...new Set(journalIds)].map(id => game.journal.get(id));
        const settlement = Settlement.getName(settlementName);

        this.#config = { users, journals, settlement }

        return this;
    }

    /**
     * @returns {Promise<void>}
     */
    async collectData() {
        if(!this.#config)
            throw new Error("Collector is not configured.");

        try {
            const { actors, sharedStorage } = await ActorDataCollector.collect(this.#config.users);
            const journals = await JournalDataCollector.collect(this.#config.journals);
            const settlement = await SettlementDataCollector.collect(this.#config.settlement);

            const ingameDate = TaliaDate.now().displayString;

            this.#collectedData = { actors, sharedStorage, journals, settlement, ingameDate };

        } catch(err) {
            console.error("Exporter | Failed gathering data.");
            throw err;
        }
    }

    exportJson() {
        if(!this.#collectedData)
            throw new Error("Data must be collected before it can be exported to JSON.");

        return JSON.stringify(this.#collectedData, null, 2);
    }

    async exportJsonToClipboard() {
        const jsonString = this.exportJson();

        try {
            await navigator.clipboard.writeText(jsonString);
            // eslint-disable-next-line no-alert
            alert("JSON copied to clipboard!");
        } catch (err) {
            console.error("Exporter | Failed writing to clipboard.", err);
            throw err;
        }
    }

    /**
     * @param {string[]} journalFolderNames Journals within these folders will be included in the selection.
     * @param {string} defaultSettlementName 
     * @returns {Promise<void>}
     */
    async configureViaDialog(journalFolderNames, defaultSettlementName) {
        const { DialogV2 } = foundry.applications.api;
        const { StringField } = foundry.data.fields;
        const { createMultiSelectInput, createFormGroup } = foundry.applications.fields;

        const makeCheckboxes = (name, label, options) => 
            createFormGroup({
                label,
                input: createMultiSelectInput({ type: "checkboxes", name, options })
            }).outerHTML;

        const playerOptions = game.users.players
            .filter(u => u.character)
            .map(u => ({ label: u.name, value: u.id, selected: true }))
            .sort((a,b) => a.label.localeCompare(b.label));
        const playersCheckboxes = makeCheckboxes("playerIds", "Players", playerOptions);

        const journalOptions = journalFolderNames
            .flatMap(n => game.journal.folders.getName(n)?.contents ?? [])
            .filter(j => j.ownership.default >= 2)
            .map(j => ({ label: j.name, value: j.id, selected: true }))
            .sort((a, b) => a.label.localeCompare(b.label));
        const journalCheckboxes = makeCheckboxes("journalIds", "Journals", journalOptions);

        const settlementField = new StringField({
            initial: defaultSettlementName,
            blank: true,
            label: "Settlement Name",
        }).toFormGroup({},{name: "settlementName"}).outerHTML;


        const res = await DialogV2.prompt({
            content: playersCheckboxes + settlementField + journalCheckboxes,
            position: { width: 1200 },
            ok: { callback: (event, button) => new FormDataExtended(button.form).object },
            rejectClose: false,
            modal: true,
        });

        if(res) {
            this.configure(res.playerIds, res.journalIds, res.settlementName);
        }
    }
}


class SettlementDataCollector {
    /**
     * @param {Settlement} settlement
     * @returns {Promise<JsonSchema.SettlementData>}
     */
    static async collect(settlement) {
        settlement.prepareDerivedData();

        return {
            name: settlement.name,
            attributes: { ...settlement.attributes },
            capacity: { ...settlement.capacity },
            currentEffects: SettlementDataCollector.#processEffects(Object.values(settlement.effects)),
            buildings: SettlementDataCollector.#processBuildings(Object.values(settlement.buildings))
        }
    }

    /**
     * @param {Building[]} buildings 
     * @returns {JsonSchema.SettlementBuildingData[]} 
     */
    static #processBuildings(buildings) {
        return buildings
            .map(b => ({
                name: b.name,
                flavorText: b.flavorText,
                scale: b.scale,
                constructionDate: b.isBuilt ? b.constructionDate.displayString : null,
                effects: {
                    attributes: b.modifiers.attributes,
                    capacity: b.modifiers.capacity,
                    other: b.effectText
                },
                requirements: {
                    attributes: b.requirements?.attributes ?? {},
                    buildings: [...b.requirements.buildings].map(id => Building.database.get(id).name) ?? [],
                    unlocks: [...b.requirements.unlocked]
                }
            }));
    }

    /**
     * @param {Effect[]} effects 
     * @returns {JsonSchema.SettlementEffectData[]} 
     */
    static #processEffects(effects) {
        return effects
            .filter(e => e.isActive)
            .map(e => ({
                name: e.name,
                flavorText: e.flavorText,
                remainingDays: e.remainingDays,
                effects: {
                    attributes: e.modifiers.attributes,
                    capacity: e.modifiers.capacity,
                    other: e.effectText
                }
            }));
    }
}


class JournalDataCollector {
    /**
     * @param {JournalEntry[]} journals 
     * @returns {Promise<JsonSchema.JournalData[]>}
     */
    static async collect(journals) {
        return Promise.all(journals.map(JournalDataCollector.#processJournal));
    }

    /**
     * @param {JournalEntry} journal 
     * @returns {Promise<JsonSchema.JournalData>}
     */
    static async #processJournal(journal) {
        return {
            name: journal.name,
            pages: await Promise.all(journal.pages
                .filter(p => (p.ownership.default >= 2 || p.ownership.default === -1) 
                    && p.type === "text")
                .sort((a, b) => a.sort !== b.sort ? a.sort - b.sort : a._stats.createdTime - b._stats.createdTime)
                .map(async (p, i) => ({
                    name: p.name,
                    index: i,
                    htmlContent: HtmlCleaner.clean(await TextEditor.enrichHTML(p.text.content)),
                })))
        }
    }
}


class ActorDataCollector {
    /**
     * @param {User[]} users
     * @returns {Promise<{ actors: JsonSchema.ActorData[], sharedStorage: JsonSchema.SharedStorageData }>}
     */
    static async collect(users) {
        const collector = new ActorDataCollector(users);
        collector.#withOwnedItems();
        const result = await collector.#process();
        return result;
    }

    /**
     * @typedef {object} SharedDTO
     * @property {"sharedDto"} discriminator 
     * @property {JsonSchema.Currency} currency
     * @property {Item[]} physicalItemsStored
     */

    /**
     * @typedef {object} UserCharDTO
     * @property {"userCharDto"} discriminator 
     * @property {Actor} actor
     * @property {User} user
     * @property {JsonSchema.Currency} currency
     * @property {Item[]} spells
     * @property {Item[]} features
     * @property {Item[]} physicalItemsCarried
     * @property {Item[]} physicalItemsStored
     */

    /** @type {Map<string, UserCharDTO>} UserId to UserCharDTO map */
    #userDtos = new Map();

    /** @type {SharedDTO} */
    #shared;

    /**
     * @param {User[]} users 
     */
    constructor(users) {
        this.#userDtos = new Map(users.map(u => [u.id, ActorDataCollector.#createCharDto(u)]));

        this.#shared = {
            currency: { pp: 0, gp: 0, sp: 0, cp: 0 },
            physicalItemsStored: [],
            discriminator: "sharedDto"
        };
    }

    /**
     * 
     * @param {User} user 
     * @returns {UserCharDTO}
     */
    static #createCharDto(user) {
        const actor = user.character;
        const currency = actor.system.currency;

        const spells = [];
        const features = [];
        const physicalItemsCarried = [];

        for(const item of actor.items.contents) {
            switch(item.type) {
                case "spell":
                    spells.push(item); break;
                case "feat":
                    features.push(item); break;
                case "consumable":
                case "equipment":
                case "loot":
                case "container":
                case "tool":
                case "weapon":
                    physicalItemsCarried.push(item);
                    break;
                default: break;
            }
        }

        return {
            discriminator: "userCharDto",
            actor,
            user,
            currency: { 
                pp: currency.pp ?? 0,
                gp: currency.gp ?? 0,
                sp: currency.sp ?? 0,
                cp: currency.cp ?? 0,
            },
            spells,
            features,
            physicalItemsCarried,
            physicalItemsStored: []
        }
    }


    #withOwnedItems() {
        const userUuidsToIds = new Map();
        for(const dto of this.#userDtos.values()) userUuidsToIds.set(dto.user.uuid, dto.user.id);

        for(const actor of game.actors) {
            if(!ItemPiles.API.isValidItemPile(actor)) continue;

            const flags = ItemPiles.API.getActorFlagData(actor);
            if(!flags.enabled) continue;

            let ownerId;
            let ownerCount = 0;
            let ownsCurrency = false;
            let ownsItem = false;

            if(flags.type === "vault" && flags.restrictVaultAccess === true) {
                for(const va of flags.vaultAccess ?? []) {
                    const userOwnerId = userUuidsToIds.get(va.uuid);
                    if(!userOwnerId) continue;

                    ownerId = userOwnerId;
                    ownerCount++;
                    ownsCurrency = va.currencies.withdraw;
                    ownsItem = va.items.withdraw;
                }
            }
            else if(flags.type === "container" && actor.ownership.default > 0) {
                ownerCount = userUuidsToIds.size;
                ownsCurrency = true;
                ownsItem = true;
            }
            else if(flags.type === "container") {
                const ownerIds = getUserOwnerIds(actor);
                ownerCount = ownerIds.length;
                if(ownerIds.length === 1) ownerId = ownerIds[0];
                ownsCurrency = true;
                ownsItem = true;
            }

            if(ownerCount && (ownsCurrency || ownsItem)) {
                const ownerDto = ownerCount === 1
                    ? this.#userDtos.get(ownerId)
                    : this.#shared;

                if(ownsCurrency) addCurrency(actor, ownerDto);
                if(ownsItem) addItems(actor, ownerDto);
            }
        }

        /**
         * 
         * @param {Actor} pile 
         * @returns {string[]}
         */
        function getUserOwnerIds(pile) {
            const ownerIds = [];
            const defaultLevel = pile.ownership.default;

            for(const userId of userUuidsToIds.values()) {
                const level = pile.ownership[userId] ?? defaultLevel;
                if(level >= 1) ownerIds.push(userId); 
            }

            return ownerIds;
        }


        /**
         * @param {Actor} pile 
         * @param {UserCharDTO | SharedDTO} ownerDto 
         */
        function addItems(pile, ownerDto) {
            const isSharedDto = ownerDto?.discriminator === "sharedDto"

            for(const item of pile.items.contents) {
                switch(item.type) {
                    case "spell":
                        if(!isSharedDto) ownerDto.spells.push(item);
                        break;
                    case "feat":
                        if(!isSharedDto) ownerDto.features.push(item);
                        break;
                    case "consumable":
                    case "equipment":
                    case "loot":
                    case "container":
                    case "tool":
                    case "weapon":
                        ownerDto.physicalItemsStored.push(item);
                        break;
                    default: break;
                }
            }
        }

        /**
         * @param {Actor} pile 
         * @param {UserCharDTO | SharedDTO} ownerDto 
         */
        function addCurrency(pile, ownerDto) {
            const curr = pile.system.currency;
            ownerDto.currency.cp += curr.cp ?? 0;
            ownerDto.currency.sp += curr.sp ?? 0;
            ownerDto.currency.gp += curr.gp ?? 0;
            ownerDto.currency.pp += curr.pp ?? 0;
        }

        return this;
    }

    /**
     * @returns {Promise<{ actors: JsonSchema.ActorData[], sharedStorage: JsonSchema.SharedStorageData }>}
     */
    async #process() {
        return {
            actors: await Promise.all([...this.#userDtos.values()].map(ActorDataCollector.#processUserChar)),
            sharedStorage: await ActorDataCollector.#processShared(this.#shared)
        }
    }

    /**
     * 
     * @param {UserCharDTO} dto
     * @returns {Promise<JsonSchema.ActorData>} 
     */
    static async #processUserChar(dto) {
        return {
            name: dto.actor.name,
            currency: dto.currency,
            spells: await ActorDataCollector.#processSpells(dto.spells),
            features: await ActorDataCollector.#processFeatures(dto.features),
            items: await ActorDataCollector.#processPhysicalItems(dto.physicalItemsCarried, dto.physicalItemsStored)
        }
    }

    /**
     * @param {SharedDTO} dto 
     * @returns {Promise<JsonSchema.SharedStorageData>}
     */
    static async #processShared(dto) {
        return {
            currency: dto.currency,
            items: await ActorDataCollector.#processPhysicalItems([], dto.physicalItemsStored),
        }
    }

    /**
     * Process physical items of one actor or of shared storage.
     * @param {Item[]} physicalItems  May be empty for storage items.
     * @param {Item[]} storedItems
     * @returns {Promise<JsonSchema.ItemData[]>}
     */
    static async #processPhysicalItems(physicalItems, storedItems) {
        /** @type {Map<string, JsonSchema.ItemData} */
        const stacked = new Map();

        /**
         * @param {Item} item 
         * @returns {Promise<JsonSchema.ItemData>}
         */
        const getOrAddItem = async (item) => {
            let dto = stacked.get(item.name);
            if(!dto) {
                dto = {
                    name: item.name,
                    description: HtmlCleaner.clean(await TextEditor.enrichHTML(item.system.description.value)),
                    carried: 0,
                    stored: 0,
                    typeLabel: _getTypeLabel(item),
                    category: item.type,
                    requiresAttunement: item.system.attunement === "required"
                }
                stacked.set(item.name, dto);
            }
            return dto;
        }

        for(const item of physicalItems) {
            const dto = await getOrAddItem(item);
            dto.carried += item.system.quantity;
        }

        for(const item of storedItems) {
            const dto = await getOrAddItem(item);
            dto.stored += item.system.quantity;
        }

        return [...stacked.values()];

        /**
         * @param {Item} item 
         * @returns {string}
         */
        function _getTypeLabel(item) {
            const typeLabel = item.system.type?.label;
            const subtypeLabel = item.system.type?.subtype;
            return typeLabel && subtypeLabel
                ? `${typeLabel} (${subtypeLabel})` 
                : typeLabel
                    ? typeLabel : "Container";
        }
    }

    /**
     * @param {Item[]} spells
     * @returns {Promise<JsonSchema.SpellData[]>}
     */
    static async #processSpells(spells) {
        const processSpell = async (spell) => ({
            name: spell.name,
            description: HtmlCleaner.clean(await TextEditor.enrichHTML(spell.system.description.value)),
            spellLevel: spell.labels.level,
            range: spell.labels.range,
            spellSchool: spell.labels.school,
        });

        return Promise.all(spells.map(processSpell));
    }

    /**
     * @param {Item[]} features
     * @returns {Promise<JsonSchema.FeatureData[]>}
     */
    static async #processFeatures(features) {
        const processFeature = async (feature) => ({
            name: feature.name,
            description: HtmlCleaner.clean(await TextEditor.enrichHTML(feature.system.description.value)),
            requirements: feature.system.requirements
        });

        return Promise.all(features.map(processFeature));
    }
}


class HtmlCleaner {
    static #parser;

    static #getParser() {
        if(!HtmlCleaner.#parser) {
            HtmlCleaner.#parser = new DOMParser();
        }
        return HtmlCleaner.#parser;
    }

    static TAGS_TO_REMOVE = new Set(['IMG', 'LINK', 'SCRIPT', 'IFRAME', 'AUDIO', 'VIDEO', 'SOURCE', 'OBJECT', 'EMBED']);

    static clean(html) {
        const parser = HtmlCleaner.#getParser();
        const doc = parser.parseFromString(html, 'text/html');

        doc.querySelectorAll("*").forEach(e => {
            if(HtmlCleaner.TAGS_TO_REMOVE.has(e.tagName)) e.remove();
            else if (e.tagName === 'A' && e.parentNode) e.replaceWith(e.textContent);
            else Array.from(e.attributes).forEach(attr => e.removeAttribute(attr.name));
        });

        return doc.body.innerHTML;
    }
}
