import { MODULE } from "../scripts/constants.mjs";

/**
 * @typedef {object} TriggerFunctionArgs
 * @property {string} event     The name of the triggered event.
 * @property {number} id        The registration number of the called function.
 * @property {Combat} combat    The combat which triggered the event.
 * @property {Actor} actor      The actor for which the event is trigged or null if actor couldn't be determined.
 */



export default class CombatTriggers {
    constructor() {
        throw new Error("CombatTriggers is not intended to be instantiated. Use the exposed static methods instead.");
    }

    static EVENTS = {
        none: { key: "none", label: "" },
        onTurnStart: { key: "onTurnStart", label: "On Turn Start" },                            // single combatant
        onTurnEnd: { key: "onTurnEnd", label: "On Turn End" },                                  // single combatant
        onEachTurn: { key: "onEachTurn", label: "On Each Turn" },                               // all combatants
        onRoundStart: { key: "onRoundStart", label: "On Round Start" },                         // all combatants
        onRoundEnd: { key: "onRoundEnd", label: "On Round End" },                               // all combatants
        onCombatStart: { key: "onCombatStart", label: "On Combat Start" },                      // all combatants
        onCombatEnd: { key: "onCombatEnd", label: "On Combat End" },                            // all combatants
        onCombatantDefeated: { key: "onCombatantDefeated", label: "On Combatant Defeated" },    // single combatant
    };

    static #debug = false;

    static get debug() { return CombatTriggers.#debug; }

    static set debug(value) { CombatTriggers.#debug = !!value; }

    /**
     * Registers the hooks for the active GM client only.
     * @returns {void}
     */
    static init() {
        Hooks.once("ready", () => {
            if (game.users.activeGM !== game.user) return;
            Hooks.on("preUpdateCombat", CombatTriggers.onPreUpdateCombat);
            Hooks.on("updateCombat", CombatTriggers.onUpdateCombat);
            Hooks.on("deleteCombat", CombatTriggers.onDeleteCombat);

            Hooks.callAll("talia.combatTriggersReady", CombatTriggers);
        });
    }


    //#region Event management
    /** @type {Map<string, Map<number, Function>>} */
    static #registered = new Map();

    static #idCount = 0;

    /**
     * Registers a combat trigger callback function.
     *
     * Callback functions are called with a `TriggerFunctionArgs` argument
     * containing:
     * - actor {Actor | null}       The actor for which the event is trigged or null if actor couldn't be determined.
     * - combat {Combat}            The combat which triggered the event.
     * - event {string}             The name of the triggered event.
     * - id {number}                The registration number of the called function.
     * @param {string} event
     * @param {Function} fn
     * @returns {number}        An id which can be used to turn off the registered function.
     */
    static on(event, fn) {
        if (!CombatTriggers.EVENTS[event]) throw new Error(`Invalid event: "${event}".`);
        if (typeof fn !== "function") throw new TypeError(`Argument fn "${fn}" must be a function.`);

        if (!CombatTriggers.#registered.has(event)) {
            CombatTriggers.#registered.set(event, new Map());
        }

        const eventFuncs = CombatTriggers.#registered.get(event);
        const id = CombatTriggers.#idCount;
        eventFuncs.set(id, fn);
        CombatTriggers.#idCount++;

        if (CombatTriggers.debug) console.debug(`CombatTriggers | Registered id "${id}" for event "${event}".`);
        return id;
    }

    /**
     * Unregisters a registered combat trigger callback.
     * @param {string} event
     * @param {number} id
     * @returns {void}
     */
    static off(event, id) {
        const eventFuncs = CombatTriggers.#registered.get(event);
        if (!eventFuncs) return;

        eventFuncs.delete(id);
        if (CombatTriggers.debug) console.debug(`CombatTriggers | Unregistered id "${id}" for event "${event}".`);
    }

    /**
     * Executes all registered callbacks for a given event.
     * @param {string} event                    The event to be executed.
     * @param {Combat} combat                   The handled combat
     * @param {Actor | null} [triggeringActor]  The triggering actor or null if none exists.
     * @returns {Promise<void>}
     */
    static async #executeEvents(event, combat, triggeringActor=null) {
        const eventFuncs = CombatTriggers.#registered.get(event);
        if (!eventFuncs) return;

        for (const [id, fn] of eventFuncs.entries()) {
            try {
                /** @type {TriggerFunctionArgs} */
                const funcArgs = {
                    event,
                    id,
                    combat,
                    actor: triggeringActor
                }

                await Promise.resolve(fn(funcArgs));
            } catch (err) {
                console.error(`CombatTriggers | Execute function error. Id: "${id}" for event "${event}".`, err);
            }
        }
    }

    //#endregion


    //#region Hooks

    /**
     * Hook `preUpdateCombat`
     *
     * Save data on updated combats.
     * @param {Combat} combat     The combat updated.
     * @param {object} update     The update performed.
     * @param {object} options    The update options.
     * @returns {Promise<void>}
     */
    static onPreUpdateCombat(combat, update, options) {
        const previousId = combat.combatant?.id;
        const path = `${MODULE.ID}.previousCombatant`;
        foundry.utils.setProperty(options, path, previousId);

        const prevPath = `${MODULE.ID}.previousTR`;
        const prevTR = { T: combat.turn, R: combat.round };
        foundry.utils.setProperty(options, prevPath, prevTR);

        const startedPath = `${MODULE.ID}.started`;
        const prevStarted = combat.started;
        foundry.utils.setProperty(options, startedPath, prevStarted);
    }

    /**
     * Hook `updateCombat`
     *
     * On turn start, turn end, each turn.
     * @param {Combat} combat     The combat updated.
     * @param {object} update     The update performed.
     * @param {object} options    The update options.
     * @returns {Promise<void>}
     */
    static async onUpdateCombat(combat, update, options) {
        const { turnForward, roundForward, isCombatStart } = CombatTriggers.#determineCombatState(combat, update, options);
        const undefeated = combat.combatants.filter(c => !c.isDefeated);

        /*
            Order:
            - combatStart   (immediately on combatStart)
            - turnEnd       (not immediately on combatStart)
            - roundEnd      (not immediately on combatStart)
            - eachTurn      (not immediately on combatStart)
            - roundStart
            - turnStart
        */

        // Execute combat start triggers for all.
        if (isCombatStart) for (const c of undefeated) await CombatTriggers.#executeEvents("onCombatStart", combat, c.actor);

        // Execute turn end triggers for previous combatant.
        if (turnForward && !isCombatStart) {
            const previousId = foundry.utils.getProperty(options, `${MODULE.ID}.previousCombatant`);
            const previousCombatant = combat.combatants.get(previousId) ?? null;
            await CombatTriggers.#executeEvents("onTurnEnd", combat, previousCombatant?.actor);
        } 

        // Execute round end triggers for all.
        if (roundForward && !isCombatStart) for (const c of undefeated) await CombatTriggers.#executeEvents("onRoundEnd", combat, c.actor);

        // Execute 'each turn' triggers for all.
        if (turnForward && !isCombatStart) for (const c of undefeated) await CombatTriggers.#executeEvents("onEachTurn", combat, c.actor);

        // Execute all round start triggers for all.
        if (roundForward) for (const c of undefeated) await CombatTriggers.#executeEvents("onRoundStart", combat, c.actor);

        // Execute turn start triggers for current combatant.
        if (turnForward) await CombatTriggers.#executeEvents("onTurnStart", combat, combat.combatant?.actor);

    }

    /**
     * Hook `deleteCombat`
     *
     * On combat ending (being deleted).
     * @param {Combat} combat     The combat deleted.
     * @returns {Promise<void>}
     */
    static async onDeleteCombat(combat) {
        if (!combat.started || !combat.isActive) return;
        for (const c of combat.combatants) if (!c.isDefeated) await CombatTriggers.#executeEvents("onCombatEnd", combat, c.actor);
    }

    /**
     * Hook `updateCombatant`
     * 
     * On combatant defeated.
     * @param {Combatant} combatant     The combatant updated.
     * @param {object} update           The update performed.
     */
    static async updateCombatant(combatant, update) {
        if (!update.defeated) return;
        await CombatTriggers.#executeEvents("onCombatantDefeated", combatant.combat, combatant.actor);
    }

    //#endregion


    //#region Logic
    
    /**
     * Determine whether a combat was started and whether it moved forward in turns or rounds.
     * @param {Combat} combat     The combat updated.
     * @param {object} update     The update performed.
     * @param {object} options    The update options.
     * @returns {{
     *  turnForward: boolean,
     *  roundForward: boolean,
     *  isCombatStart: boolean
     * }}
     */
    static #determineCombatState(combat, update, options) {
        let turnForward = true;
        let roundForward = true;
        let isCombatStart = true;

        const cTurn = combat.current.turn;
        const pTurn = foundry.utils.getProperty(options, `${MODULE.ID}.previousTR.T`);
        const cRound = combat.current.round;
        const pRound = foundry.utils.getProperty(options, `${MODULE.ID}.previousTR.R`);

        // No change in turns or rounds, not started combat, or went backwards.
        if ((update.turn === undefined) && (update.round === undefined)) turnForward = false;
        if (!combat.started || !combat.isActive) turnForward = false;
        if ((cRound < pRound) || ((cTurn < pTurn) && (cRound === pRound))) turnForward = false;

        roundForward = turnForward && (cRound > pRound);
        isCombatStart = combat.started && !foundry.utils.getProperty(options, `${MODULE.ID}.started`);

        return { turnForward, roundForward, isCombatStart };
    }

    //#endregion
}
