import { TaliaCustomAPI } from "../scripts/api.mjs";
export default {
    register() {
        RestManager.addExtendedRestToConfig();
        TaliaCustomAPI.add({rest: RestManager.rest}, "GmMacros");
    }
}

class RestManager {
    /*----------------------------------------------------------------------------
                    Static Methods            
    ----------------------------------------------------------------------------*/

    /**
     * Adds extended rest duration to CONFIG.DND5E
     */
    static addExtendedRestToConfig() {
        const minutesInADay = 24 * 60;    
        CONFIG.DND5E.restTypes.extended = {
            duration: {
                normal: minutesInADay * 14,     // 2 weeks
                gritty: minutesInADay * 60,     // 2 months (60 days in Talian Calendar)
                epic: minutesInADay,            // 1 day
            }
        };
    }

    // only method accessible from through the api; handles the entire resting workflow on the GM's side
    static async rest() {
        if(!game.user.isGM) throw new Error("Only the GM client can use this class.");

        const restManager = new RestManager()
            .setRestingActors();
        await restManager.configureRestOptions();
        return await restManager._rest();
    }

    /*----------------------------------------------------------------------------
                    Instanced Properties            
    ----------------------------------------------------------------------------*/

    /** @type {Actor5e[]}  Array of resting actors with unique uuids. */
    restingActors = [];

    /**
     * @type {Object | null}
     * @property {boolean = false} isInstantRest   - Is this rest instant (= no time passing)
     * @property {string} restType                 - One of the keys of CONFIG.DND5E.restTypes
     */
    restOptions = null;

    /*----------------------------------------------------------------------------
                    Instanced Methods            
    ----------------------------------------------------------------------------*/

    /**
     * Sets the actors of currently controlled tokens as resting actors.
     * Avoids duplicates if there's multiple tokens linked to the same actor.
     * @returns {this}
     */
    setRestingActors() {
        const addedActorUuids = new Set();
        this.restingActors = canvas.tokens.controlled
            .map(t => t.actor)
            .filter(a => {
                if(addedActorUuids.has(a.uuid)) return false;   //duplicate, so skip
                addedActorUuids.add(a.uuid);
                return true;
            });
        return this;
    }
    
    /**
     * Lets the GM configure rest options via a dialog.
     * @returns {Promise<this>}
     */
    async configureRestOptions() {
        const {StringField, BooleanField} = foundry.data.fields;
        const {DialogV2} = foundry.applications.api;

        const restTypeField = new StringField({
            label: "Rest Type",
            choices: Object.keys(CONFIG.DND5E.restTypes).reduce((acc, k) => {
                acc[k] = k;
                return acc;
            },{}),
            required: true,
        }).toFormGroup({},{name: "restType"}).outerHTML;

        const hoursPassingField = new BooleanField({
            label: "Is instant rest?",
        }).toFormGroup({},{name: "isInstantRest"}).outerHTML;

        this.restOptions = await DialogV2.prompt({
            window: { title: "Rest Options" },
            content: restTypeField+hoursPassingField,
            ok: {
                callback: (_, button) => new FormDataExtended(button.form).object,
            },
            rejectClose: false,
        });
        return this;
    }

    /**
     * Rests each actor and passes time.
     * @returns {Promise<Object[]>} An array of objects containing the results of the rest for each actor.
     */
    async _rest() {
        //validate rest
        if(this.restOptions === null 
            || typeof this.restOptions.restType !== "string" 
            || typeof this.restOptions.isInstantRest !== "boolean"
            || this.restingActors.length <= 0
        ) return null;

        //create the rest config
        const dnd5eRestConfig = {
            dialog: false,
            chat: false,
            duration: CONFIG.DND5E.restTypes[this.restOptions.restType]?.duration?.[game.settings.get("dnd5e", "restVariant")],
            newDay: this.restOptions.restType !== "short",  //any newDay stuff refreshes on any long or extended rest.
            advanceTime: !this.restOptions.isInstantRest,
            autoHD: false,
        };

        //let each actor rest
        const promises = [];
        for(let actor of this.restingActors) {
            promises.push(this._restSingleActor(actor, dnd5eRestConfig));
        }
        return await Promise.all(promises);
    }

    /**
     * Rests a single actor.
     * @param {Actor5e} actor 
     * @param {import("../system/dnd5e/dnd5e.mjs").RestConfiguration} config 
     * @returns {Promise<Object>}   Object containing Actor, Rest Result, and ChatMessage (only for normal rest variant setting).
     */
    async _restSingleActor(actor, config) {
        let result;
        if(this.restOptions.restType === "extended") {
            result = await RestManager.extendedRest(actor, config);
        } else if(this.restOptions.restType === "short") {
            result = await actor.shortRest(config);
        } else {
            result = await actor.longRest(config);
        }
        if(game.settings.get("dnd5e", "restVariant") !== "normal") return {actor, result};

        let flavor;
        let messagePart;
        if(this.restOptions.restType === "short") {
            flavor = "Short Rest (1 hour)";
            messagePart = "a short rest.";
        } else if (this.restOptions.restType === "long") {
            flavor = "Long Rest (8 hours)";
            messagePart = "a long rest.";
        } else {
            flavor = "Extended Rest (2 weeks)";
            messagePart = "an extended rest.";
        }

        let chatData = {
            user: game.user.id,
            speaker: {actor, alias: actor.name},
            flavor,
            rolls: result.rolls,
            content: `${actor.name} has taken ${messagePart}`,
            "flags.dnd5e.rest": {type: this.restOptions.restType}
        };
        ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
        const chatMessage = await ChatMessage.create(chatData);
        return {actor, result, chatMessage};
    } 


    /**
     * An awful imitation of the dnd actor._rest function.
     * @param {Actor5e} actor 
     * @param {import("../system/dnd5e/dnd5e.mjs").RestConfiguration} config    Configuration data for the rest occurring.
     * @returns {Promise<RestResult>}   Consolidated results of the rest workflow.
     */
    static async extendedRest(actor, config) {
        let hitPointsRecovered = 0;
        let result = {};
        let hpActorUpdates = {};
        let hitDiceRecovered = 0;
        let hdActorUpdates = {};
        let hdItemUpdates = [];
        const rolls = [];
        const newDay = true;

        // Recover hit points & hit dice on long rest
        const hpRecRes = actor._getRestHitPointRecovery();
        ({ updates: hpActorUpdates, hitPointsRecovered } = hpRecRes);
        const hdRecRes = actor._getRestHitDiceRecovery();
        ({ updates: hdItemUpdates, actorUpdates: hdActorUpdates, hitDiceRecovered } = hdRecRes);

        async function getItemUsesRecovery(actor, rolls) {
            let recovery = ["sr", "lr", "day"]
            let _updates = [];
            for( let item of actor.items ) {
                const uses = item.system.uses ?? {};

                if ( recovery.includes(uses.per) ) {
                    _updates.push({_id: item.id, "system.uses.value": uses.max});
                }
                if ( item.system.recharge?.value ) {
                    _updates.push({_id: item.id, "system.recharge.charged": true});
                }

                if(uses.recovery && CONFIG.DND5E.limitedUsePeriods[uses.per]?.formula) {
                    const roll = new Roll(uses.recovery, item.getRollData());
                    roll.alter(14, 0, {multiplyNumeric: true});
                    
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
                        _updates.push({_id: item.id, "system.uses.value": newValue});
                        rolls.push(roll);
                        await roll.toMessage({
                            user: game.user.id,
                            speaker: {actor, alias: actor.name},
                            flavor: game.i18n.format(locKey, {name: item.name, count: Math.abs(diff)})
                        });
                    }
                }
            }
            return _updates;
        } 



        // Figure out the rest of the changes
        foundry.utils.mergeObject(result, {
        dhd: (result.dhd ?? 0) + hitDiceRecovered,
        dhp: (result.dhp ?? 0) + hitPointsRecovered,
        updateData: {
            ...(hdActorUpdates ?? {}),
            ...hpActorUpdates,
            ...actor._getRestResourceRecovery(),
            ...actor._getRestSpellRecovery()
        },
        updateItems: [
            ...(hdItemUpdates ?? []),
            ...(await getItemUsesRecovery(actor, rolls))
        ],
        longRest: true,
        newDay
        });
        result.rolls = rolls;

        //perform updates
        await actor.update(result.updateData, {isRest: true});
        await actor.updateEmbeddedDocuments("Item", result.updateItems, { isRest: true });

        // Advance the game clock
        if ( config.advanceTime && (config.duration > 0) && game.user.isGM ) await game.time.advance(60 * config.duration);
        return result;
    } 
}