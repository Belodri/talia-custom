export default {
    register() {
        ExtendedRest.init();
    }
}

/**
 * Results from a rest operation.
 *
 * @typedef {object} RestResult
 * @property {number} dhp            Hit points recovered during the rest.
 * @property {number} dhd            Hit dice recovered or spent during the rest.
 * @property {object} updateData     Updates applied to the actor.
 * @property {object[]} updateItems  Updates applied to actor's items.
 * @property {Roll[]} rolls          Any rolls that occurred during the rest process, not including hit dice.
 */

/**
 * Configuration options for a rest.
 *
 * @typedef {object} RestConfiguration
 * @property {string} type               Type of rest to perform.
 * @property {boolean} chat              Should a chat message be created to summarize the results of the rest?
 * @property {number} duration           Amount of time passed during the rest in minutes.
 * @property {boolean} [advanceTime]     Should the game clock be advanced by the rest duration?
 */

class ExtendedRest {
    static init() {
        // Add extended rest duration to CONFIG.DND5E
        const minutesInADay = 24 * 60;    
        CONFIG.DND5E.restTypes.extended = {
            duration: {
                normal: minutesInADay * 14,     // 2 weeks
                gritty: minutesInADay * 60,     // 2 months (60 days in Talian Calendar)
                epic: minutesInADay,            // 1 day
            }
        };

        // Add extended rest to CONFIG.DND5E.limitedUsePeriods 
        CONFIG.DND5E.limitedUsePeriods.er = {
            abbreviation: "ER",
            label: "Extended Rest"
        };

        Hooks.once("setup", () => {
            dnd5e.documents.Actor5e.prototype.extendedRest = ExtendedRest.extendedRest
        });
    }

    /**
     * @this {import("../system/dnd5e/module/documents/_module.mjs").Actor5e}
     * @param {Partial<RestConfiguration>} config 
     * @returns 
     */
    static async extendedRest(config={}) {
        return new ExtendedRest(this).extendedRest(config);
    }

    /**
     * @param {import("../system/dnd5e/module/documents/_module.mjs").Actor5e} actor 
     */
    constructor(actor) {
        this.actor = actor;
    }

    /**
     * Take an extended rest, recovering hit points, hit dice, resources, item uses, and spell slots.
     * @param {Partial<RestConfiguration>} config 
     * @returns {Promise<RestResult>}
     * @interface
     */
    async extendedRest(config={}) {
        if ( this.actor.type === "vehicle" ) return;

        config = foundry.utils.mergeObject({
            type: "extended", chat: true, advanceTime: false,
            duration: CONFIG.DND5E.restTypes.extended.duration[game.settings.get("dnd5e", "restVariant")]
        }, config);


        /**
         * A hook event that fires before an extended rest is started.
         * @function dnd5e.preExtendedRest
         * @memberof hookEvents
         * @param {Actor5e} actor             The actor that is being rested.
         * @param {RestConfiguration} config  Configuration options for the rest.
         * @returns {boolean}                 Explicitly return `false` to prevent the rest from being started.
         */
        if ( Hooks.call("dnd5e.preExtendedRest", this.actor, config) === false ) return;

        /**
         * A hook event that fires after an extended rest has started, after the configuration is complete.
         * @function dnd5e.extendedRest
         * @memberof hookEvents
         * @param {Actor5e} actor             The actor that is being rested.
         * @param {RestConfiguration} config  Configuration options for the rest.
         * @returns {boolean}                 Explicitly return `false` to prevent the rest from being continued.
         */
        if ( Hooks.call("dnd5e.extendedRest", this.actor, config) === false ) return;

        return this._rest(config);
    }

    /**
     * Perform all of the changes needed for an extended rest.
     *
     * @param {RestConfiguration} config  Configuration data for the rest occurring.
     * @param {RestResult} [result={}]    Results of the rest operation being built.
     * @returns {Promise<RestResult>}  Consolidated results of the rest workflow.
     * @private
     */
    async _rest(config, result={}) {
        // handle group actors
        if(this.actor.type === "group" && (await this._handleGroupRest(config, result) === false) ) return;

        let hitPointsRecovered = 0;
        let hpActorUpdates = {};
        let hitDiceRecovered = 0;
        let hdActorUpdates = {};
        let hdItemUpdates = [];
        const rolls = [];

        // Recover hit points & hit dice on extended rest
        ({ updates: hpActorUpdates, hitPointsRecovered } = this.actor._getRestHitPointRecovery());
        ({ updates: hdItemUpdates, actorUpdates: hdActorUpdates, hitDiceRecovered } = this.actor._getRestHitDiceRecovery());

        // Figure out the rest of the changes
        foundry.utils.mergeObject(result, {
            dhd: (result.dhd ?? 0) + hitDiceRecovered,
            dhp: (result.dhp ?? 0) + hitPointsRecovered,
            updateData: {
                ...(hdActorUpdates ?? {}),
                ...hpActorUpdates,
                ...this.actor._getRestResourceRecovery(),
                ...this.actor._getRestSpellRecovery()
            },
            updateItems: [
                ...(hdItemUpdates ?? []),
                ...(await this._getRestItemUsesRecovery({ rolls }))
            ],
        });
        result.rolls = rolls;

        /**
         * A hook event that fires after rest result is calculated, but before any updates are performed.
         * @function dnd5e.preRestCompleted
         * @memberof hookEvents
         * @param {Actor5e} actor             The actor that is being rested.
         * @param {RestResult} result         Details on the rest to be completed.
         * @param {RestConfiguration} config  Configuration data for the rest occurring.
         * @returns {boolean}                 Explicitly return `false` to prevent the rest updates from being performed.
         */
        if ( Hooks.call("dnd5e.preRestCompleted", this.actor, result, config) === false ) return result;

        // Perform updates
        await this.actor.update(result.updateData, { isRest: true });
        await this.actor.updateEmbeddedDocuments("Item", result.updateItems, { isRest: true });

        // Advance the game clock
        if ( config.advanceTime && (config.duration > 0) && game.user.isGM ) await game.time.advance(60 * config.duration);

        // Display a Chat Message summarizing the rest effects
        if ( config.chat ) await this._displayRestResultMessage(result);

        /**
         * A hook event that fires when the rest process is completed for an actor.
         * @function dnd5e.restCompleted
         * @memberof hookEvents
         * @param {Actor5e} actor             The actor that just completed resting.
         * @param {RestResult} result         Details on the rest completed.
         * @param {RestConfiguration} config  Configuration data for that occurred.
         */
        Hooks.callAll("dnd5e.restCompleted", this.actor, result, config);

        // Return data summarizing the rest effects
        return result;
    }


    /**
     * Recovers item uses during short or long rests.
     * @param {object} [options]
     * @param {boolean} [options.recoverShortRestUses=true]     Recover uses for items that recharge after a short rest.
     * @param {boolean} [options.recoverLongRestUses=true]      Recover uses for items that recharge after a long rest.
     * @param {boolean} [options.recoverExtendedRestUses=true]  Recover uses for items that recharge after an extended rest.
     * @param {boolean} [options.recoverDailyUses=true]         Recover uses for items that recharge on a new day.
     * @param {Roll[]} [options.rolls]                          Rolls that have been performed as part of this rest.
     * @returns {Promise<object[]>}                             Array of item updates.
     * @private
     */
    async _getRestItemUsesRecovery({
        recoverShortRestUses=true, recoverLongRestUses=true,
        recoverDailyUses=true, recoverExtendedRestUses=true, rolls
    }={}) {
        let recovery = [];
        if ( recoverShortRestUses ) recovery.push("sr");
        if ( recoverLongRestUses ) recovery.push("lr");
        if ( recoverExtendedRestUses ) recovery.push("er");
        if ( recoverDailyUses ) recovery.push("day");
        
        let updates = [];
        for ( let item of this.actor.items ) {
            const uses = item.system.uses ?? {};
            if ( recovery.includes(uses.per) ) {
                updates.push({_id: item.id, "system.uses.value": uses.max});
            }
            if ( recoverLongRestUses && item.system.recharge?.value ) {
                updates.push({_id: item.id, "system.recharge.charged": true});
            }

            // Items that roll to gain charges via a formula
            if ( recoverDailyUses && uses.recovery && CONFIG.DND5E.limitedUsePeriods[uses.per]?.formula ) {
                const roll = new Roll(uses.recovery, item.getRollData());

                const restVariant = game.settings.get("dnd5e", "restVariant");
                const numberOfDays = Math.floor( CONFIG.DND5E.restTypes.extended.duration[restVariant] / ( 24 * 60 ) );
                if ( recoverLongRestUses && numberOfDays > 1 ) {
                    roll.alter(numberOfDays, 0, {multiplyNumeric: true});
                }

                let total = 0;
                try {
                    total = (await roll.evaluate()).total;
                } catch(err) {
                    ui.notifications.warn(game.i18n.format("DND5E.ItemRecoveryFormulaWarning", {
                        name: item.name,
                        formula: uses.recovery
                    }));
                }

                const newValue = Math.clamp(uses.value + total, 0, uses.max);
                if ( newValue !== uses.value ) {
                    const diff = newValue - uses.value;
                    const isMax = newValue === uses.max;
                    const locKey = `DND5E.Item${diff < 0 ? "Loss" : "Recovery"}Roll${isMax ? "Max" : ""}`;
                    updates.push({_id: item.id, "system.uses.value": newValue});
                    rolls.push(roll);
                    await roll.toMessage({
                        user: game.user.id,
                        speaker: {actor: this.actor, alias: this.actor.name},
                        flavor: game.i18n.format(locKey, {name: item.name, count: Math.abs(diff)})
                    });
                }
            }
        }
        return updates;
    }

    /**
     * Display a chat message with the result of the rest.
     *
     * @param {RestResult} result         Result of the rest operation.
     * @returns {Promise<ChatMessage>}    Chat message that was created.
     * @private
     */
    async _displayRestResultMessage(result) {
        const { dhd, dhp } = result;
        const diceRestored = dhd !== 0;
        const healthRestored = dhp !== 0;
        const name = this.actor.name;
        
        let message;
        if (diceRestored && healthRestored) {
            message = `${name} takes an extended rest and recovers ${dhp} Hit Points and ${dhd} Hit Dice.`;
        } else if (healthRestored) {
            message = `${name} takes an extended rest and recovers ${dhp} Hit Points.`;
        } else if (diceRestored) {
            message = `${name} takes an extended rest and recovers ${dhd} Hit Dice.`;
        } else {
            message = `${name} takes an extended rest.`;
        }
    
        const chatData = {
            user: game.user.id,
            speaker: {actor: this.actor, alias: name},
            flavor: ExtendedRest.messageFlavor,
            rolls: result.rolls,
            content: message,
            "flags.dnd5e.rest": { type: "extended" }
        };
        ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
        return ChatMessage.create(chatData);
    }

    static get messageFlavor() {
        const minutes = CONFIG.DND5E.restTypes.extended.duration[game.settings.get("dnd5e", "restVariant")];
        const units = {
            minute: 0,
            hour: 60,
            day: 60 * 24,
            week: 60 * 24 * 7,
            month: 60 * 24 * 7 * 4,
        };
        const unit = Object.keys(units)
            .reduce((acc, unit) => ( minutes >= units[unit] ? unit : acc ), "minute");
        const value = Math.floor( minutes / units[unit] );
        const unitStr = value === 1 ? unit : `${unit}s`;
        
        return `Extended Rest (${value} ${unitStr})`;
    }

    /**
     * Initiate a rest for all members of this group.
     * @param {RestConfiguration} config  Configuration data for the rest.
     * @param {RestResult} result         Results of the rest operation being built.
     * @returns {boolean}                 Returns `false` to prevent regular rest process from completing.
     * @private
     */
    async _handleGroupRest(config, result) {
        const results = new Map();
        for ( const member of this.actor.system.members ) {
            results.set(
                member.actor,
                await member.actor.extendedRest({
                    ...config, dialog: false, advanceTime: false
                }) ?? null
            );
        }

        // Advance the game clock
        if ( config.advanceTime && (config.duration > 0) && game.user.isGM ) await game.time.advance(60 * config.duration);

        /**
         * A hook event that fires when the rest process is completed for a group.
         * @function dnd5e.groupRestCompleted
         * @memberof hookEvents
         * @param {Actor5e} group                         The group that just completed resting.
         * @param {Map<Actor5e, RestResult|null>} results Details on the rests completed.
         */
        Hooks.callAll("dnd5e.groupRestCompleted", this.actor, results);

        return false;
    } 
}

