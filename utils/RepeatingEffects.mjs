import { MODULE } from "../scripts/constants.mjs";

export default {
    register() {
        Hooks.on("renderActiveEffectConfig", renderActiveEffectConfigHook);
        //Hooks.on("preCreateActiveEffect", preCreateActiveEffectHook);
        CombatTriggers.registerHooks();
    }
}

/* 
    # General Guidelines and Assumptions
    - A repeating effect does NOT wait for user interaction to execute. 
    - An enchantment cannot be a repeating effect.
    - A repeating effect does not snapshot rollData

    A repeating effect CAN:
    - use the origin item (with configureDialog = false, all ItemUseConfiguration set to null)
    - directly roll and apply damage/healing from a roll formula (using the origin actor's rollData)

    # Triggers:
    - Not Repeating (default)
    - Start of Turn
    - End of Turn
    - Start of every Turn
    - Start of Round

    # Actions:
    - Use Item (skip WMS trigger, resource consumption, item uses, etc)
    - Apply Damage/Healing


    # UI/UX
    ActiveEffect config:
    - Dropdown menu for triggers
    - Dropdown menu for Actions

    Action "Use Item"
    - TextBox for originItem UUID 
        by default automatically filled by the UUID of the item the effect is embedded on
        can be changed so an effect on one item can use another item to roll
    - Checkbox "Consume Uses"
    - Checkbox "Consume Resources"
    - Checkbox "

    Action "Apply Damage/Healing"
    - TextBox for roll formula
    - Dropdown menu for damage type


    # Implementation:

    - Simple Version: Only roll & apply damage/healing
    - Only execute on GM client 
        Since a player might not be able to use an item owned by another actor that is the origin of the effect.

    There's basically three parts to this:
    1) Shared Code
        - Triggers
        - UI for AE config for triggers
        - References to: 
            - origin item
            - origin actor
            - target actor
    2) Apply Damage/Healing
        - UI for AE config
        - ChatMessage creation
        - Rolling
        - Applying
    3) Use Item
        - UI for AE config
        - managing usage configuration
        - manage upcast spells
        - manage itemMacro and similar

    # Checks:
*/

/*
    TO DO
    - rolldata of origin actor
        (check how DAE does it)

    - Action: Use Item
*/


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
            const previousCombatant = !combatStarted ? combat.combatants.get(previousId) : null;

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
            if( CombatTriggers._shouldExecute(e, hook) ) await rollDamage(actor, e);
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

class RepeatedItemUse {
    /* UI

        Display documentUuid field that's populated with the originItem uuid (if applicable)

    */

    /*
        - get spell level
        - handle item use config
        - bypass wild magic surge
        - make sure the rolldata that's used is from the origin actor, not the target
    */
}

async function rollDamage(actor, effect) {
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
            flavor: `${effect.name}`,
            speaker: ChatMessage.implementation.getSpeaker({ actor }),
        }
    });
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
    }
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

    const rollFormulaConfigs = Object.entries(mFlag.damageRollConfigs)
        .reduce((acc, [k, v]) => {
            return acc += `
                <div class="form-group input-select">
                    <label>${k}: </label>
                    <input id="type" name="flags.talia-custom.repeatEffects.damageRollConfigs.${k}" type="text" value="${mFlag.damageRollConfigs[k]}" placeholder=""></input>
                </div>
            `;
        }, "");

    const tab = `<a class="item" data-tab="RepeatingEffects"><i class="fa-solid fa-repeat"></i> Repeating</a>`;
    const contents = `
        <div class="tab" id="repeatingEffectsContent" data-tab="RepeatingEffects">
            <div class="form-group">
                <label>Trigger</label>
                <select name="flags.talia-custom.repeatEffects.trigger" data-dtype="String" value=${mFlag.trigger}>
                    <option value="none" ${mFlag.trigger === "none" ? "selected" : ""}></option>
                    <option value="onTurnStart" ${mFlag.trigger === "onTurnStart" ? "selected" : ""}>On Turn Start</option>
                    <option value="onTurnEnd" ${mFlag.trigger === "onTurnEnd" ? "selected" : ""}>On Turn End</option>
                    <option value="onEachTurn" ${mFlag.trigger === "onEachTurn" ? "selected" : ""}>On Each Turn</option>
                    <option value="onRoundStart" ${mFlag.trigger === "onRoundStart" ? "selected" : ""}>On Round Start</option>
                    <option value="onRoundEnd" ${mFlag.trigger === "onRoundEnd" ? "selected" : ""}>On Round End</option>
                </select>
            </div>
            <h3>Damages</h3>
            ${rollFormulaConfigs}
            <h3>Item Use</h3>
            <span>Not implemented</span>
        </div>
    `;

    html.find(".tabs .item").last().after(tab);
    html.find(".tab").last().after(contents);
    html.css({ height: "auto" });
}
//#endregion
