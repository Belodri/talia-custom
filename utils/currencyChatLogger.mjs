import { MODULE } from "../scripts/constants.mjs";

export default {
    register() {
        Logger.init();
    }
}

class Logger {
    /** @type {Map<string, Logger>} */
    static #tracked = new Map();

    static CONFIG = {
        actorFlag: "logCurrencyUpdates",
        settings: {
            debounceSettingKey: "currencyLog-debounceTime",
            displayActorSheetToggle: "currencyLog-actorSheetToggle"
        },
        icon: {
            enabled: {
                className: "fa-solid fa-clipboard-check", 
                style: "color: green"
            },
            disabled: {
                className: "fa-solid fa-clipboard", 
                style: ""
            }
        },
        messageLabels: {
            spent: "spent",
            gained: "gained",
        }
    }

    static init() {
        game.settings.register(MODULE.ID, Logger.CONFIG.settings.debounceSettingKey, {
            name: "Currency Log Debounce Time",
            hint: "How long to wait (in ms) before sending a chat message after currency changes",
            scope: "world",
            config: true,
            type: new foundry.data.fields.NumberField({nullable: false, min: 1000, max: 20000, step: 1000}),
            default: 10000,
        });

        game.settings.register(MODULE.ID, Logger.CONFIG.settings.displayActorSheetToggle, {
            name: "Currency Log Actor Sheet Toggle",
            hint: "Display a button on actor sheets to toggle logging.",
            scope: "client",
            config: true,
            type: Boolean,
            default: false
        });

        Hooks.on("tidy5e-sheet.renderActorSheet", Logger.onRenderTidy5eActorSheet);
        Hooks.on("preUpdateActor", Logger.onPreUpdateActor);
        Hooks.once("ready", () => {
            if(game.user.isGM) {
                Hooks.on("updateActor", Logger.onUpdateActor);
                Hooks.on("deleteActor", Logger.onDeleteActor);
            }
        });
    }

    /**
     * @param {any} app 
     * @param {HTMLElement} element 
     * @param {object} data 
     */
    static onRenderTidy5eActorSheet(app, element, data) {
        if(!app?.options?.classes?.includes?.("tidy5e-sheet") 
            || !game.settings.get(MODULE.ID, Logger.CONFIG.settings.displayActorSheetToggle)
        ) return;

        const currencyEle = element?.querySelector?.(".currency");
        if(!currencyEle) return;

        const actor = data.actor;
        const icon = Logger.CONFIG.icon[Logger.isEnabled(actor) ? "enabled" : "disabled"];

        const toInject = `<li class="currency-item convert" data-tidy-render-scheme="handlebars">
            <a class="currency-convert talia-log-changes" title="Log Changes">
                <i style="${icon.style}" class="${icon.className}"></i>
            </a>
        </li>`;
        currencyEle.insertAdjacentHTML("beforeend", toInject);

        currencyEle.querySelector(".talia-log-changes")
            ?.addEventListener("click", () => Logger.toggle(actor));
    }

    /**
     * @param {Actor} actor 
     * @returns {Promise<Actor>}
     */
    static async toggle(actor) {
        return actor.setFlag(MODULE.ID, Logger.CONFIG.actorFlag, !Logger.isEnabled(actor));
    }

    /**
     * Runs on initiating client only
     * @param {Actor} actor 
     * @param {object} changed 
     * @param {object} options 
     * @param {string} userId 
     */
    static onPreUpdateActor(actor, changed, options, userId) {
        if(changed.system?.currency) {
            const initialCurrency = foundry.utils.deepClone(actor.system.currency);
            options.talia = { initialCurrency };
        }
    } 

    /**
     * Runs on GM client only
     * @param {Actor} actor 
     * @param {object} changed 
     * @param {object} options 
     * @param {string} userId 
     */
    static onUpdateActor(actor, changed, options, userId) {
        if(changed.system?.currency && options.talia?.initialCurrency) {
            Logger.track(actor, options.talia.initialCurrency);
        }
    }

    /** @param {Actor} actor  */
    static onDeleteActor(actor) {
        Logger.untrack(actor.uuid);
    }

    /**
     * @param {Actor} actor 
     * @param {object} initialCurr 
     */
    static track(actor, initialCurr) {
        if(!Logger.#tracked.has(actor.uuid)) {
            const newLog = new Logger(actor, initialCurr);
            if(!Logger.isEnabled(actor)) return;

            Logger.#tracked.set(actor.uuid, newLog);
        }

        const log = Logger.#tracked.get(actor.uuid);
        log.setTimer();
    }

    /** @param {string} uuid  */
    static untrack(uuid) {
        Logger.#tracked.delete(uuid);
    }

    /** @param {Actor} actor  */
    static isEnabled(actor) {
        return !!actor?.getFlag(MODULE.ID, Logger.CONFIG.actorFlag);
    }
    
    /**
     * @param {Actor} actor 
     * @param {object} initialCurr 
     */
    constructor(actor, initialCurr) {
        this.actor = actor;
        this.actorUuid = actor.uuid;
        this.initialCurr = initialCurr;
    }

    setTimer = foundry.utils.debounce( async() => {
        try {
            if(Logger.isEnabled(this.actor)) await this.#createMessage();
        } finally {
            Logger.untrack(this.actorUuid);
        }
    }, game.settings.get(MODULE.ID, Logger.CONFIG.settings.debounceSettingKey) ?? 10000)

    async #createMessage() {
        const {diff, inMainCurrency} = this.#evaluateChange();
        if(!inMainCurrency) return;

        const diffDetails = Object.entries(diff)
            .filter(([_, v]) => v)
            .sort(([kA, vA], [kB, vB]) => 
                CONFIG.DND5E.currencies[kA].conversion - CONFIG.DND5E.currencies[kB].conversion
            )
            .map(([k, v]) => `${v} ${CONFIG.DND5E.currencies[k].abbreviation}`)
            .join(", ");
    
        const label = Logger.CONFIG.messageLabels[inMainCurrency < 0 ? "spent" : "gained"];
        const mainCurrency = Object.values(CONFIG.DND5E.currencies)
            .find(v => v.conversion === 1) ?? "gp";
        const content = `${label} <strong>${inMainCurrency}${mainCurrency.abbreviation}</strong> (${diffDetails})`;

        return ChatMessage.implementation.create({
            speaker: ChatMessage.implementation.getSpeaker({actor: this.actor}),
            content,
        }); //async
    }

    #evaluateChange() {
        let diff = {};
        let main = 0;

        for(const [k, v] of Object.entries(this.actor.system.currency)) {
            const diffValue = v - this.initialCurr[k];
            if(diffValue) {
                diff[k] = diffValue;
                main += diffValue / CONFIG.DND5E.currencies[k].conversion;
            }
        }

        const inMainCurrency = Math.round(main * 100) / 100;
        return {diff, inMainCurrency};
    }
}
