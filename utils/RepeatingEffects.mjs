import { MODULE } from "../scripts/constants.mjs";

export default {
    register() {
        Hooks.on("renderActiveEffectConfig", renderActiveEffectConfigHook);
        //Hooks.on("preCreateActiveEffect", preCreateActiveEffectHook);
        CombatTriggers.registerHooks();
    }
}

const hooksToNames = {
    none: "",
    onTurnStart: "On Turn Start",
    onTurnEnd: "On Turn End",
    onEachTurn: "On Each Turn",
    onRoundStart: "On Round Start",
    onRoundEnd: "On Round End"
};


class CombatTriggers {

    static registerHooks() {
        Hooks.once("ready", () => {
            if(!game.user.isGM) return;
            Hooks.on("preUpdateCombat", CombatTriggers.preUpdateCombat);
            Hooks.on("updateCombat", CombatTriggers.updateCombat);
        });
    }

    /**
     * Save data on updated combats.
     * @param {Combat} combat     The combat updated.
     * @param {object} update     The update performed.
     * @param {object} options    The update options.
     */
    static preUpdateCombat(combat, update, options) {
        const previousId = combat.combatant?.id;
        const path = `${MODULE.ID}.previousCombatant`;
        foundry.utils.setProperty(options, path, previousId);
    
        const prevPath = `${MODULE.ID}.previousTR`;
        const prevTR = {T: combat.turn, R: combat.round};
        foundry.utils.setProperty(options, prevPath, prevTR);
    
        const startedPath = `${MODULE.ID}.started`;
        const prevStarted = combat.started;
        foundry.utils.setProperty(options, startedPath, prevStarted);
    }

    /**
     * Determine whether a combat was started and whether it moved forward in turns or rounds.
     * @param {Combat} combat     The combat updated.
     * @param {object} update     The update performed.
     * @param {object} options    The update options.
     * @returns {{
     *  turnForward: boolean, 
     *  roundForward: boolean, 
     *  combatStarted: boolean
     * }}
     */
    static _determineCombatState(combat, update, options) {
        let turnForward = true;
        let roundForward = true;
        let combatStarted = true;

        const cTurn = combat.current.turn;
        const pTurn = foundry.utils.getProperty(options, `${MODULE}.previousTR.T`);
        const cRound = combat.current.round;
        const pRound = foundry.utils.getProperty(options, `${MODULE}.previousTR.R`);

        // No change in turns or rounds, not started combat, or went backwards.
        if ((update.turn === undefined) && (update.round === undefined)) turnForward = false;
        if (!combat.started || !combat.isActive) turnForward = false;
        if ((cRound < pRound) || ((cTurn < pTurn) && (cRound === pRound))) turnForward = false;

        roundForward = turnForward && (cRound > pRound);
        combatStarted = combat.started && !foundry.utils.getProperty(options, `${MODULE}.started`);

        return {turnForward, roundForward, combatStarted};
    }

    /**
     * On turn start, turn end, each turn.
     * @param {Combat} combat     The combat updated.
     * @param {object} update     The update performed.
     * @param {object} options    The update options.
     */
    static async updateCombat(combat, update, options) {

        const {turnForward, roundForward, combatStarted} = CombatTriggers._determineCombatState(combat, update, options);
        const undefeated = combat.combatants.filter(c => !c.isDefeated);

        if (turnForward) {
            // Retrieve combatants.
            const previousId = foundry.utils.getProperty(options, `${MODULE.ID}.previousCombatant`);
            const previousCombatant = combatStarted ? combat.combatants.get(previousId) : null;

            // Execute turn start and turn end triggers.
            CombatTriggers._executeAppliedEffects(combat.combatant?.actor, "onTurnStart");
            CombatTriggers._executeAppliedEffects(previousCombatant?.actor, "onTurnEnd");

            // Execute all 'each turn' triggers.
            for (const c of undefeated) CombatTriggers._executeAppliedEffects(c.actor, "onEachTurn");
        }

        if (roundForward) {
            for (const c of undefeated) {
                if (!combatStarted) CombatTriggers._executeAppliedEffects(c.actor, "onRoundEnd");
                CombatTriggers._executeAppliedEffects(c.actor, "onRoundStart");
            }
        }
    }

    /**
     * Execute all repeating effects that affect an actor and contain this trigger.
     * @param {Actor} actor     The actor with the effects.
     * @param {string} hook     The trigger name.
     */
    static async _executeAppliedEffects(actor, hook) {
        if(!actor) return;
        for (const e of actor.appliedEffects) {
            if( CombatTriggers._shouldExecute(e, hook) ) {
                if(e.flags?.[MODULE.ID]?.repeatEffects?.enableItem) {
                    await createItemMessage(actor, e, hook);
                }
                await rollDamage(actor, e, hook);
            }
        }
    }

    /**
     * Decides if a given effect should be executed.
     * @param {ActiveEffect} effect     
     * @param {string} hook             The trigger name.
     */
    static _shouldExecute(effect, hook) {
        if(effect.flags?.[MODULE.ID]?.repeatEffects?.trigger !== hook) return false;

        // Active Auras integration
        const aa = effect.flags.ActiveAuras;
        if(aa?.isAura 
            && aa.ignoreSelf 
            && !aa.applied
        ) return false;

        //return true if all checks are passed
        return true;
    }
}

//#region Shared

/** */
function getDefaultFlagData() {
    const combinedTypes = {
        ...CONFIG.DND5E.damageTypes,
        ...CONFIG.DND5E.healingTypes
    };
    const damageRollConfigs = Object.keys(combinedTypes)
        .reduce((acc, k) => {
            acc[k] = "";
            return acc;
        }, { untyped: "" });
    
    return {
        trigger: "none",
        damageRollConfigs,
        enableItem: false,
    }
}

/**
 * Creates the string for the chat message flavor text
 * @param {string} hook 
 * @param {ActiveEffect} effect 
 * @param {Actor} actor 
 */
function getMsgFlavor(hook, effect, actor) {
    const [tokenDoc] = actor.getActiveTokens(false, true);
    return `<strong>${hooksToNames[hook]}</strong>: ${effect.name} on <strong>${tokenDoc?.name ?? actor.name}</strong>`;
}

/**
 * Hook renderActiveEffectConfig;
 * @param {Application} app             The Application instance being rendered
 * @param {jQuery} html                 The inner HTML of the document that will be displayed and may be modified
 * @param {object} data                 The object of data used when rendering the application
 */
async function renderActiveEffectConfigHook(app, html, data) {
    const flags = app.object.flags ?? {};
    if(flags.dnd5e?.type === "enchantment") return;

    if(!flags[MODULE.ID]?.repeatEffects) {
        const defaultFlagData = getDefaultFlagData();
        await app.object.setFlag(MODULE.ID, "repeatEffects", defaultFlagData);
        app.render();
    }
    const mFlag = flags[MODULE.ID]?.repeatEffects;
    if(!mFlag) return;

    const rollFormulaConfigs = Object.entries(mFlag.damageRollConfigs)
        .reduce((acc, [k, v]) => {
            return acc += `
                <div class="form-group input-select">
                    <label>${k}: </label>
                    <input id="type" name="flags.talia-custom.repeatEffects.damageRollConfigs.${k}" type="text" value="${mFlag.damageRollConfigs[k]}" placeholder=""></input>
                </div>
            `;
        }, "");

    const triggerSelectOptions = Object.entries(hooksToNames)
        .reduce((acc, [k, v]) => acc += `<option value="${k}" ${mFlag.trigger === k ? "selected" : ""}>${v}</option>`, "");

    const tab = `<a class="item" data-tab="RepeatingEffects"><i class="fa-solid fa-repeat"></i> Repeating</a>`;
    const contents = `
        <div class="tab" id="repeatingEffectsContent" data-tab="RepeatingEffects">
            <div class="form-group">
                <label>Trigger</label>
                <select name="flags.talia-custom.repeatEffects.trigger" data-dtype="String" value=${mFlag.trigger}>
                ${triggerSelectOptions}
                </select>
            </div>
            <h3>Damages</h3>
            ${rollFormulaConfigs}
            <h3>Item Use</h3>
            <div class="form-group">
                <label>Use source item?</label>
                <input id="enableItem" name="flags.talia-custom.repeatEffects.enableItem" type="checkbox" ${mFlag.enableItem ? "checked" : ""}>
            </div>
        </div>
    `;

    html.find(".tabs .item").last().after(tab);
    html.find(".tab").last().after(contents);
    html.css({ height: "auto" });
}
//#endregion

//#region Damage Roll

/**
 * Rolls all damages of a given effect (if any) and creates the chat message.
 * @param {Actor} actor 
 * @param {ActiveEffect} effect 
 * @param {string} hook 
 */
async function rollDamage(actor, effect, hook) {
    const typeConfigs = effect.flags[MODULE.ID].repeatEffects?.damageRollConfigs;
    if(!typeConfigs) return;

    const rollConfigs = Object.entries(typeConfigs)
        .filter(([_, v]) => v)
        .map(([k, v]) => ({ parts: [v], type: k === "untyped" ? "" : k }));
    const targetActorRollData = actor.getRollData();
    
    const rolls = await dnd5e.dice.damageRoll({
        rollConfigs, 
        data: targetActorRollData,
        fastForward: true,
        rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
        chatMessage: true,
        returnMultiple: true,
        messageData: {
            flavor: getMsgFlavor(hook, effect, actor),
            speaker: ChatMessage.implementation.getSpeaker({ actor }),
        }
    });
} 

//#endregion

//#region Repeating Item Use

/**
 * Gets the source item of an effect. Logs errors and returns undefined if a source item cannot be found.
 * @param {ActiveEffect} effect 
 * @returns {Promise<Item | undefined>}
 */
async function getSourceItem(effect) {
    const errLog = (msg) => { console.error(`Cannot repeat effect | ${msg}`, {effect, actor, hook}) }

    const source = await effect.getSource();

    if(source instanceof Item) return source;

    else if(source instanceof ActiveEffect && source.parent instanceof Item) return source.parent;

    else if(source instanceof Actor) return errLog("Actors are not a valid effect source");

    else if(source === null) {
        //try to find chat message with item data if the item was consumed and destroyed in the process
        const parsed = foundry.utils.parseUuid(effect.origin);
        if(parsed.primaryType !== "Actor") return errLog("Source could not be resolved");

        const itemUuid = parsed.embedded?.[0] === "Item"
            ? [parsed.primaryType, parsed.primaryId, parsed.embedded[0], parsed.embedded[1]].join(".")
            : null;

        if(!itemUuid) return errLog("Source could not be resolved");

        const useMsg = game.messages.find(m => m.flags?.dnd5e?.use?.itemUuid === itemUuid);
        if(!useMsg) return errLog(`Source item uuid not be found in messages`);

        //if found, create the item in memory and return it
        return useMsg.getAssociatedItem();
    }
    else return undefined;
}

/**
 * @param {import ("../system/dnd5e/module/documents/actor/actor.mjs").default} actor 
 * @param {import ("../system/dnd5e/module/documents/active-effect.mjs").default} effect 
 * @param {string} hook 
 */
async function createItemMessage(actor, effect, hook) {
    let sourceItem = await getSourceItem(effect);
    if(!sourceItem) return;

    //display options
    const options = {
        createMessage: false,
        rollMode: CONST.DICE_ROLL_MODES.PUBLIC
    };
    if(sourceItem.hasLimitedUses) foundry.utils.setProperty(options, "flags.dnd5e.use.consumedUsage", true);
    if(sourceItem.hasResource) foundry.utils.setProperty(options, "flags.dnd5e.use.consumedResource", true);

    // handle upcasting
    const spellLevel = effect.flags?.dnd5e?.spellLevel;
    if( sourceItem.type === "spell" && spellLevel !== sourceItem.system.level ) {
        sourceItem = sourceItem.clone({"system.level": spellLevel}, {keepId: true});
        sourceItem.prepareData();
        sourceItem.prepareFinalAttributes();
    }
    if(sourceItem.type === "spell") foundry.utils.setProperty(options, "flags.dnd5e.use.spellLevel", sourceItem.system.level);

    //get the chat data and modify it
    const chatData = await sourceItem.displayCard(options);
    chatData.flavor = getMsgFlavor(hook, effect, actor);

    //create the chat message
    await ChatMessage.create(chatData);
}
//#endregion
