import { MODULE } from "../scripts/constants.mjs";
import CombatTriggers from "./CombatTriggers.mjs";

export default class RepeatingEffect {
    static CONFIG = {
        effectFlagKey: "repeatEffects",
        messageFlagKey: "isRepeatEffect",
        templatePath: `modules/${MODULE.ID}/templates/repeatingEffectsConfig.hbs`,
    }

    static init() {
        Hooks.once("ready", () => {
            if(game.users.activeGM !== game.user ) return;

            Hooks.on("renderActiveEffectConfig", RepeatingEffect.onRenderActiveEffectConfig);
            for(const event of Object.values(CombatTriggers.EVENTS)) {
                CombatTriggers.on(event.key, RepeatingEffect.onCombatTrigger);
            }
        });
    }

    //#region Combat Triggers

    /**
     * Callback for CombatTriggers.
     * 
     * Executes repeating effects with matching event triggers on the actor.
     * @param {import("./CombatTriggers.mjs").TriggerFunctionArgs} arg
     * @param {string} arg.event 
     * @param {Actor | null} arg.actor 
     * @returns {Promise<void>}
     */
    static async onCombatTrigger({event, actor=null}) {
        if(!actor) return;
        for (const effect of actor.appliedEffects) {
            if(RepeatingEffect.#shouldExecute(effect, event)) {
                await RepeatingEffect.#execute(actor, effect, event)
            }
        }
    }

    /**
     * Executes a given effect and handles potential errors.
     * @param {Actor} actor 
     * @param {ActiveEffect} effect 
     * @param {string} event 
     * @returns {Promise<void>}
     */
    static async #execute(actor, effect, event) {
        try {
            const rep = RepeatingEffect.create(effect);
            if(rep.useItem) await rep.triggerItemUse(event, actor);
            if(rep.hasDamages) await rep.triggerDamageRolls(event, actor);
        } catch(err) {
            console.error(`Repeating Effects | Execution error for effect uuid "${effect.uuid}" for event "${event}".`, err);
        }
    }

    /**
     * Determines if a given effect should be executed.
     * @param {ActiveEffect} effect     
     * @param {string} event            The trigger name.
     * @returns {boolean}
     */
    static #shouldExecute(effect, event) {
        if(!RepeatingEffect.isValid(effect)) return false;

        const isTrigger = event === effect.getFlag(MODULE.ID, `${RepeatingEffect.CONFIG.effectFlagKey}.trigger`);
        if(!isTrigger) return false;

        // Active Auras integration
        if(effect.getFlag("ActiveAuras", "isAura")
            &&  effect.getFlag("ActiveAuras", "ignoreSelf")
            && !effect.getFlag("ActiveAuras", "applied")
        ) return false;

        //return true if all checks are passed
        return true;
    }

    //#endregion


    //#region Config Template

    /**
     * Hook `renderActiveEffectConfig`
     * 
     * Injects the configuration template for a repeating effect into the active effect config.
     * @param {Application} app             The Application instance being rendered
     * @param {jQuery} html                 The inner HTML of the document that will be displayed and may be modified
     * @param {object} data                 The object of data used when rendering the application
     * @returns {Promise<void>}
     */
    static async onRenderActiveEffectConfig(app, html, data) {
        const rep = RepeatingEffect.create(app.object);
        if(!rep) return;

        const template = await renderTemplate(RepeatingEffect.CONFIG.templatePath, rep.getTemplateData());
        const tabStr = `<a class="item" data-tab="RepeatingEffects"><i class="fa-solid fa-repeat"></i> Repeating</a>`;

        html.find(".tabs .item").last().after(tabStr);
        html.find(".tab").last().after(template);
        html.css({height: "auto"});
    }

    /** 
     * @typedef {object} TemplateData
     * @property {string} basePath
     * @property {{[key: string]: { key: string, label: string }}} triggerOptions
     * @property {{[type: string]: RollConfig}} labeledConfigs
     * @property {string} trigger
     * @property {boolean} useItem
     * @property {boolean} useTargetRolldata
     */

    /** 
     * Gets the data for the configuration template.
     * @returns {TemplateData}
     */
    getTemplateData() {
        return {
            basePath: `flags.${MODULE.ID}.${RepeatingEffect.CONFIG.effectFlagKey}`,
            triggerOptions: CombatTriggers.EVENTS,
            rollConfigs: this.rollConfigs,
            trigger: this.trigger,
            useItem: this.useItem,
            useTargetRolldata: this.useTargetRolldata,
            rollModes: [
                {value: "default", label: "Default"}, 
                ...Object.entries(CONFIG.Dice.rollModes)
                    .map(([k, v]) => ({ value: k, label: v }))
            ],
            rollMode: this.rollMode
        }
    }
    
    //#endregion


    //#region Instance

    /**
     * Creates a new instance of RepeatingEffect from a valid ActiveEffect.
     * @param {ActiveEffect} effect 
     * @returns {RepeatingEffect | null}
     */
    static create(effect) {
        return RepeatingEffect.isValid(effect)
            ? new RepeatingEffect(effect)
            : null;
    }

    /**
     * Checks if a given active effect is valid to be a repeating effect.
     * @param {ActiveEffect} effect 
     * @returns {boolean}
     */
    static isValid(effect) {
        return effect instanceof ActiveEffect
            && effect.getFlag("dnd5e", "type") !== "enchantment"
    }

    /**
     * @typedef {object} RollConfig
     * @property {string} formula       The dice roll formula.
     * @property {string} [type]        A damage or healing type. True damage if undefined.
     * @property {string} label         The label for the type. "Untyped" if type is undefined.
     */

    /** @param {ActiveEffect} effect */
    constructor(effect) {
        const flagData = effect.getFlag(MODULE.ID, RepeatingEffect.CONFIG.effectFlagKey) ?? {};

        this.effect = effect;

        /** @type {string} */
        this.trigger = flagData.trigger ?? CombatTriggers.EVENTS.none.key;

        /** @type {boolean} */
        this.useItem = flagData.useItem ?? false;

        /** @type {boolean} */
        this.useTargetRolldata = flagData.useTargetRolldata ?? false;

        /** @type {"publicroll"|"gmroll"|"blindroll"|"selfroll"|"default"}  */
        this.rollMode = flagData.rollMode ?? "default";

        const allTypes = {
            untyped: { label: "Untyped" },
            ...CONFIG.DND5E.damageTypes,
            ...CONFIG.DND5E.healingTypes
        }

        /** @type {{[type: string]: RollConfig}} */
        this.rollConfigs = {};

        this.hasDamages = false;

        for(const [k, v] of Object.entries(allTypes)) {
            const formula = flagData.rollConfigs?.[k]?.formula ?? "";
            if(formula) this.hasDamages = true;

            const cfg = { formula, label: v.label };
            if(k !== "untyped") cfg.type = k;

            this.rollConfigs[k] = cfg;
        }
    }

    /**
     * Returns `this.rollMode` unless it's blank, 
     * in which case the user's current roll mode is returned. 
     * @returns {"publicroll"|"gmroll"|"blindroll"|"selfroll"}
     */
    determineRollMode() {
        return this.rollMode === "default"
            ? game.settings.get("core", "rollMode") 
            : this.rollMode
    }

    //#endregion


    //#region Trigger Calls

    /**
     * Rolls all damages of this effect (if any) and creates the chat message.
     * @param {string} event 
     * @param {Actor} affectedActor   The actor directly affected by this effect.
     * @returns {Promise<DamageRoll | null>}
     */
    async triggerDamageRolls(event, affectedActor) {
        const rollConfigs = Object.values(this.rollConfigs)
            .filter(cfg => cfg.formula)
            .map(cfg => ({
                parts: [cfg.formula],
                type: cfg.type,
                properties: cfg.properties ?? []
            }));
        if(!rollConfigs.length) return null;

        const rollingActor = this.effect.transfer || this.useTargetRolldata
            ? affectedActor
            : this.getOriginActor();

        if(!rollingActor) {
            const msg = `RepeatingEffect | Unable to find rollingActor. See console for details.`;
            ui.notifications.error(msg);
            console.error(msg, {instance: this, effect: this.effect, event, affectedActor});
            return null;
        }

        return dnd5e.dice.damageRoll({
            rollConfigs,
            data: rollingActor?.getRollData() ?? {},
            rollMode: this.determineRollMode(),
            fastForward: true,
            chatMessage: true,
            messageData: {
                flavor: this.getMsgFlavor(event, affectedActor),
                speaker: ChatMessage.implementation.getSpeaker({ rollingActor }),
            }
        });
    }

    /**
     * Gets the origin actor synchronously or returns null if unable to.
     * @returns {Actor | null}
     */
    getOriginActor() {
        if(!this.effect.origin) return null;

        const parts = this.effect.origin.split(".");
        const actorIndex = parts.findIndex(s => s === "Actor");
        const actorUuid = parts.slice(actorIndex, actorIndex + 2).join(".");
        const actor = fromUuidSync(actorUuid);
        return actor instanceof Actor ? actor : null;
    }

    /**
     * Recreates the chat card that was used to apply this effect.
     * If the original card can't be found, recreate it if possible.
     * @param {string} event 
     * @param {Actor} affectedActor 
     * @returns {Promise<ChatMessage>}
     */
    async triggerItemUse(event, affectedActor) {
        const baseMsg = this.getApplicationMessage();
        const msgData = baseMsg 
            ? baseMsg.toObject() 
            : await this.recreateItemUseMsgData();
        if(!msgData) return;

        // Note that this message is triggered.
        foundry.utils.setProperty(msgData, `flags.${MODULE.ID}.${RepeatingEffect.CONFIG.messageFlagKey}`, true);
        msgData.flavor = this.getMsgFlavor(event, affectedActor);

        const cls = getDocumentClass("ChatMessage");
        const msg = new cls(msgData);
        msg.applyRollMode(this.determineRollMode());
        return cls.create(msg.toObject());
    }

    //#endregion


    //#region Chat Message

    /** 
     * Get the chat message that likely applied this effect. 
     * @returns {ChatMessage | null}
     */
    getApplicationMessage() {
        //if the effect wasn't created by an item, it cannot have been applied by a chat message
        if(!this.effect.origin?.split?.(".")?.includes?.("Item")) return null;

        const msg = game.messages.filter(m => 
            m._stats.createdTime < this.effect._stats.createdTime
            && this.effect.origin.includes(m.getFlag("dnd5e", "use.itemUuid"))
            && !m.getFlag(MODULE.ID, RepeatingEffect.CONFIG.messageFlagKey)
        ).sort((a, b) => a._stats.createdTime - b._stats.createdTime )[0];

        return msg ?? null;
    }

    /**
     * Get the flavor text for messages created by this effect.
     * @param {string} event 
     * @param {Actor} affectedActor 
     */
    getMsgFlavor(event, affectedActor) {
        const [tokenDoc] = affectedActor.getActiveTokens(false, true);
        return `<strong>${CombatTriggers.EVENTS[event].label}</strong>: ${this.effect.name} on <strong>${tokenDoc?.name ?? affectedActor.name}</strong>`;
    }

    /**
     * Recreates the chat message data for a use of the source item.
     * @returns {object | null} Chat message data for the recrated item use.
     */
    async recreateItemUseMsgData() {
        let sourceItem = await this.effect.getSource();
        if(sourceItem instanceof ActiveEffect) sourceItem = sourceItem.parent;

        if( !(sourceItem instanceof Item) ) {
            const msg = `RepeatingEffect | Unable to find source item. See console for details.`;
            ui.notifications.error(msg);
            console.error(msg, {instance: this, effect: this.effect, });
            return null;
        }

        const options = { createMessage: false };
        if(sourceItem.hasLimitedUses) foundry.utils.setProperty(options, "flags.dnd5e.use.consumedUsage", true);
        if(sourceItem.hasResource) foundry.utils.setProperty(options, "flags.dnd5e.use.consumedResource", true);

        // handle upcasting
        const spellLevel = this.effect.getFlag("dnd5e", "spellLevel");
        if( sourceItem.type === "spell" && spellLevel !== sourceItem.system.level ) {
            sourceItem = sourceItem.clone({"system.level": spellLevel}, {keepId: true});
            sourceItem.prepareData();
            sourceItem.prepareFinalAttributes();
        }
        if(sourceItem.type === "spell") foundry.utils.setProperty(options, "flags.dnd5e.use.spellLevel", sourceItem.system.level);

        //get the chat data to modify
        return sourceItem.displayCard(options);
    }

    //#endregion
}
