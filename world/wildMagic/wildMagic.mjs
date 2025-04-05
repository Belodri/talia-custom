import { MODULE } from "../../scripts/constants.mjs";
import { TaliaCustomAPI } from "../../scripts/api.mjs";
import { TaliaUtils } from "../../utils/_utils.mjs";
import { Helpers } from "../../utils/helpers.mjs";

export default {
    register() {
        WildMagic.init();
        Surge.init();
    }
}

export class WildMagic {
    static CONFIG = {
        surgeChance: 0.05,
    }

    static init() {
        //add "Wild" item property
        CONFIG.DND5E.itemProperties.wild = {
            abbreviation: "w",
            label: "Wild"
        };
        //add item property "wild" to all item types
        CONFIG.DND5E.validProperties.consumable.add("wild");
        CONFIG.DND5E.validProperties.container.add("wild");
        CONFIG.DND5E.validProperties.equipment.add("wild");
        CONFIG.DND5E.validProperties.feat.add("wild");
        CONFIG.DND5E.validProperties.loot.add("wild");
        CONFIG.DND5E.validProperties.weapon.add("wild");
        CONFIG.DND5E.validProperties.spell.add("wild");
        CONFIG.DND5E.validProperties.tool.add("wild");

        TaliaCustomAPI.add({
            wildMagicSurge: Surge.surge,
        }, "Macros");

        Hooks.on("dnd5e.useItem", WildMagic.useItemHook);
        Hooks.on("dnd5e.preDisplayCard", WildMagic.preDisplayCardHook);
    }

    static useItemHook(item, config, options) {
        if(options.canSurge === false) return;

        if(WildMagic.canSurge(item) && WildMagic.surgeCheck()) {
            Surge.surge(item.actor);
        }
    }

    static preDisplayCardHook(item, chatData, options) {
        if(!item.system?.properties?.has("wild")) return;
        chatData.content = Helpers.insertListLabels(chatData.content, ["Wild"]);
    }

    static surgeCheck(chanceOverride=null) {
        const chance = Math.min(1, Math.max(0, 
            chanceOverride ?? canvas.scene.getFlag("talia-custom", "surgeChance") ?? this.CONFIG.surgeChance
        ));
        return Math.random() <= chance;
    }

    static canSurge(item) {
        const wildProp = item?.system?.properties?.has("wild");

        // ALWAYS allow items with the Wild tag, no matter what
        if(wildProp) return true;

        // ALWAYS allow spells and scrolls
        if(item.type === "spell" || (item.type === "consumable" && item.system.type?.value === "scroll")) return true;

        // NEVER allow ["spellGem", "potion", "poison", "food"]
        if(item.type === "consumable" && ["spellGem", "potion", "poison", "food"].includes(item.system.type?.value)) return false;

        // NEVER allow non-wild items if it's a player character
        if(item.actor?.type === "character" && !wildProp) return false;

        // NEVER allow items used by NPCs of type beast (unless they have the wild tag but that's handled above)
        if(item.actor?.type === "npc" && item.actor.system.details?.type?.value === "beast") return false;

        return true;
    }
}

export class Surge {
    static SURGES_TABLE_PATH = `modules/${MODULE.ID}/jsonData/surgeTable.json`;

    static DFREDS = {
        effectIds: {
            permanent: "ce-wild-magic-permanent",
            temporary: "ce-wild-magic-temporary",
        },
        interface: undefined,
        dfredsId: "dfreds-convenient-effects"
    }

    static CONFIG = {
        allowedSeverities: {
            minor: true,
            moderate: true,
            major: true
        },
        severityRollRanges: {
            minor: 11,
            moderate: 6,
            major: 3
        }
    }

    static DURATIONS = {
        round: 1,   //not in seconds
        minute: 60,
        hour: 3600,
        day: 86400,
        week: 604800,
        month: 2419200,
        permanent: -1,
    }

    static SCALE_VALUES = {
        duration: {
            short: {
                minor: "minute",                    
                moderate: "hour",  
                major: "day",           
            },
            long: {
                minor: "week",         
                moderate: "month",    
                major: "permanent",            
            }
        },
        dice: {
            small: {
                minor: "d4",
                moderate: "d6",
                major: "d8",
            },
            big: {
                minor: "d8",
                moderate: "d10",
                major: "d12",
            }
        },
        distance: {   //in feet
            small: {
                minor: 10,
                moderate: 20,
                major: 30,
            },
            medium: {
                minor: 30,
                moderate: 60,
                major: 90,
            },
            big: {
                minor: 60,
                moderate: 120,
                major: 180,
            }
        }
    }

    static init() {
        Hooks.once("ready", Surge.readyHook);
        Hooks.on("renderChatMessage", Surge.renderChatMessageHook);
    }

    static readyHook() {
        if(game.modules.get(Surge.DFREDS.dfredsId)?.active) {
            Surge.DFREDS.interface = game.dfreds.effectInterface;
        } else {
            ui.notifications.warn("DFREDS Effects not found.");
            Surge.DFREDS = null;
        }
    }

    static #tablePromise;

    static async fetchTable() {
        if (!Surge.#tablePromise) {
            Surge.#tablePromise = fetch(Surge.SURGES_TABLE_PATH)
                .then(response => {
                    if (!response.ok) throw new Error("Failed to fetch surges table");
                    return response.json();
                })
                .catch(error => {
                    Surge.#tablePromise = undefined;
                    throw error;
                });
        }
        return Surge.#tablePromise;
    }

    static fromData(actor, surgeData) {
        return new Surge(actor, surgeData);
    }

    static async surge(actor, config={}, messageOptions={}) {
        actor ??= canvas.tokens.controlled[0]?.actor;
        if(!actor) throw new Error("No actor for surge.");

        const surge = await new Surge(actor, { config })
            .evaluate();
        const msg = await surge.toMessage(messageOptions);
        return msg;
    }

    
    #evaluated = false;

    #roll;

    #entry;

    #config;

    #diceSize = 0;

    #allowedRangeCutoffs = {};

    #id;

    #derived;

    /**
     * @typedef {object} SurgeData
     * @property {Surge.CONFIG} config
     * @property {object} [rollObject]
     * @property {object} [entry]
     * @property {string} [id]
     */

    /**
     * 
     * @param {Actor} actor 
     * @param {SurgeData} [surgeData] 
     */
    constructor(actor, surgeData={}) {
        this.actor = actor;

        this.#config = foundry.utils.mergeObject(Surge.CONFIG, surgeData.config, {inplace: false});

        for(const severity of ["major", "moderate", "minor"]) {
            const allowed = this.#config.allowedSeverities[severity];
            const range = this.#config.severityRollRanges[severity];
            if(!allowed || !range) continue;

            this.#diceSize += range;
            this.#allowedRangeCutoffs[severity] = this.#diceSize;
        }
        if(!this.#diceSize || !Object.values(this.#allowedRangeCutoffs).length) throw new Error('No allowed severity');

        this.rollObject = surgeData.rollObject ? Roll.fromData(surgeData.rollObject) : undefined;
        this.#entry = surgeData.entry;
        this.#evaluated = !!surgeData.evaluated;
        this.#id = surgeData.id || foundry.utils.randomID();

        this.#setDerivedData();
    }

    //#region Evaluation

    async evaluate() {
        if(this.#evaluated) throw new Error("This surge has already been evaluated.");
        this.#roll = await new Roll(`1d${this.#diceSize}`).evaluate();
        this.#entry = await this.#getTableEntry();

        this.#evaluated = true;
        this.#setDerivedData();
        return this;
    }

    async #getTableEntry() {
        const table = await Surge.fetchTable();
        const filtered = table.filter(e => !e.severity || e.severity?.includes?.(this.#derived.severity));
        const index = Helpers.getRandomInt(0, filtered.length - 1);
        return filtered[index];
    }

    //#endregion

    //#region Derived Data

    #setDerivedData() {
        if(!this.#evaluated) return;

        this.#derived = {};
        this.#derived.severity = this.#getSeverity();
        this.#derived.text = this.#getParsedText();
        this.#derived.duration = this.#getDuration();
        this.#derived.effectData = this.#getEffectData();
    }

    #getSeverity() {
        for(const [sev, cutoff] of Object.entries(this.#allowedRangeCutoffs)) {
            if(this.#roll.total <= cutoff) {
                return sev;
            }
        }
    }

    #getParsedText() {
        const {severity} = this.#derived;
        const regexPlaceholder = /\{(.*?)\}/g;
    
        return this.#entry.text.replace(regexPlaceholder, (match, contents) => {
            if(contents.includes("|")) {
                const split = contents.split("|");
                if(split.length !== 3) return match;

                const index = severity === "minor" 
                    ? 0
                    : severity === "moderate" 
                        ? 1
                        : 2;

                return split[index];
            }

            const trimmed = contents.trim();
            const value = foundry.utils.getProperty(Surge.SCALE_VALUES, `${trimmed}.${severity}`);
            if(value !== undefined) return value;

            return match;
        });
    }

    #getDuration() {
        const {text} = this.#derived;

        // Format "Duration: ${number} ${minute|minutes|hour|hours|...}";
        const durationRegex = /Duration: (\d+)?\s*(round|minute|hour|day|week|month|permanent)/i;

        const match = text.match(durationRegex);
        if(!match) return null;

        const [fullMatch, numberStr, unit] = match;
        const unitLower = unit.toLowerCase();

        if(unitLower === "permanent") {
            //modify text to replace the number
            this.#derived.text = text.replace(fullMatch, "Duration: permanent");

            return {
                unit: "permanent",
                value: -1
            }
        }

        // Convert plural form to singular for lookup (remove trailing 's' if present)
        const singularUnit = unitLower.replace(/s$/, '');
        const unitValue = Surge.DURATIONS[singularUnit] ?? null;
        if(unitValue === null) return null;

        const number = numberStr ? parseInt(numberStr, 10) : 1;
        const total = unitValue * number;
        return {
            unit: singularUnit,
            value: total,
        }
    }

    #getEffectData() {
        const {duration, severity, text} = this.#derived;
        const DFREDS = Surge.DFREDS;

        if(!duration || !DFREDS) return null;

        const isPermanent = duration.unit === "permanent";
        const effectId = isPermanent
            ? DFREDS.effectIds.permanent
            : DFREDS.effectIds.temporary;

        const eff = DFREDS.interface.findEffect({effectId});
        if(!eff) throw new Error("Unable to find wild magic effect in dfreds");

        const obj = eff.toObject();

        if(this.#entry.effect) {
            foundry.utils.mergeObject(obj, this.#entry.effect);
            if(obj.changes.length) obj.changes = this.#scaleEffectChanges(obj.changes);
        }

        foundry.utils.setProperty(obj, "flags.talia-custom.surge.surgeObject", this.toJSON());
        if(!isPermanent) {
            if(duration.unit === "round") obj.duration.rounds = duration.value;
            else obj.duration.seconds = duration.value;
        }

        obj.name = `${severity.capitalize()} Surge (${this.#id})`;
        obj.description = text;
        
        return obj;
    }

    #scaleEffectChanges(changes) {
        const replacerFunc = (match, contents) => {
            const split = contents.split("|");
            return split.length === 3 
                ? split[index]
                : match;
        }

        const regex = /\{(.*?)\}/g;

        const {severity} = this.#derived;
        const index = severity === "minor" 
            ? 0
            : severity === "moderate" 
                ? 1
                : 2;

        for(const change of changes) {
            change.key = change.key.replace(regex, replacerFunc);
            if(typeof change.value === "string") change.value = change.value.replace(regex, replacerFunc)
        }

        return changes;
    }

    //#endregion

    //#region Chat Messages

    async toMessage(options={}, operation={}) {
        if(!this.#evaluated) return;
        const {severity, text, effectData} = this.#derived; 

        const msgData = {
            user: game.user.id,
            speaker: ChatMessage.implementation.getSpeaker({actor: this.actor}),
            content: `<h2 style="text-align: center; font-weight: bold;">${severity.capitalize()} Wild Magic Surge</h2><p class="surge-text">${text}</p>`,
        }
        if(effectData) this.#addCardButton(msgData);
        
        const flagData = {
            surgeObject: this.toJSON(),
            effectData: effectData,
        };
        foundry.utils.setProperty(msgData, `flags.talia-custom.surge`, flagData);

        if(options.createMessage === false) return msgData;
        if(options.hideRolls !== false) await game.dice3d.showForRoll(this.#roll, game.user, true);
        return ChatMessage.implementation.create(msgData, operation);
    }

    #addCardButton(msgData) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(msgData.content, "text/html");

        const buttonSection = doc.createElement("div");
        buttonSection.className = "card-buttons";
        doc.querySelector("p.surge-text").insertAdjacentElement("afterend", buttonSection);

        const button = doc.createElement("button");
        button.dataset.action = "talia-button-surge-effect";
        
        const icon = doc.createElement("i");
        icon.className = "fas fa-reply-all fa-flip-horizontal";
        button.appendChild(icon);

        const span = doc.createElement("span");
        span.innerText = "Apply";
        button.appendChild(span);

        buttonSection.appendChild(button);

        msgData.content = doc.documentElement.innerHTML;
        return msgData;
    }

    /**
     * 
     * @param {ChatMessage} message 
     * @param {JQuery} html 
     */
    static renderChatMessageHook(message, [html]) {
        if(!Surge.DFREDS) return;
        
        const button = html.querySelectorAll("[data-action^='talia-button-surge-effect']")
            .forEach(button => {
                button.dataset.messageId = message.id;
                button.addEventListener("click", Surge.#buttonEventListener);
            });
    }

    /**
     * @param {Event} event 
     */
    static #buttonEventListener(event) {
        if(!Surge.DFREDS) return;

        event.preventDefault();
        const button = event.currentTarget;
        button.disabled = true;

        try {
            const msg = game.messages.get(button.dataset.messageId);
            const actor = msg.getAssociatedActor();
            const effectData = msg.getFlag("talia-custom", "surge.effectData");
            const tActorUuids = canvas.tokens.controlled.map(t => t.actor.uuid);

            tActorUuids.forEach(uuid => 
                Surge.DFREDS.interface.addEffect({effectData, uuid})
            );
        } catch (err) {
            ui.notifications.error("Wild Magic effect application error.");
            console.error(err);
        } finally {
            button.disabled = false;
        }
    }
    
    //#endregion
    
    toJSON() {
        return {
            id: this.#id,
            config: foundry.utils.deepClone(this.#config),
            evaluated: this.#evaluated,
            rollObject: this.#roll?.toJSON(),
            entry: this.#entry
        }
    }
}
