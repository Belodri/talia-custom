import { TaliaCustomAPI } from "../scripts/api.mjs";
/**
 * @import Actor5e from "../system/dnd5e/module/documents/actor/actor.mjs";
 * @typedef {Parameters<Actor5e['shortRest']>[0]} RestConfiguration
 * @typedef {Awaited<ReturnType<Actor5e['shortRest']>>} RestResult
 */

export default {
    register() {
        TaliaCustomAPI.add({rest: RestManager.restMacro}, "GmMacros");
    }
}

class RestManager {
    static CONFIG = {
        resultMsgMode: CONST.DICE_ROLL_MODES.PUBLIC,
        postRestMsg: true,
    }

    /** How many days per type of rest. */
    static REST_INTERVAL_IN_D = {
        short: 1,
        long: 5,
        extended: 30
    };

    static REST_CONFIG_OVERRIDES = {
        dialog: false,
        autoHD: false,
    }

    static REST_METHOD_NAMES = {
        short: "shortRest",
        long: "longRest",
        extended: "extendedRest"
    };

    static SC_Timestamp() { return SimpleCalendar.api.timestamp(); }

    static SC_TimestampToDateDisplay(timestamp) { return SimpleCalendar.api.timestampToDate(timestamp).display; }

    /**
     * @returns {Promise<Map<[uuid: string], {actor: Actor5e, restResult: RestResult}>>}
     */
    static async restMacro() {
        if(!game.user.isGM) return;
        const choices = await RestManager.configureRestDialog();
        if(!choices?.actors.length) return;

        const prevRollMode = game.settings.get("core", "rollMode");
        if(prevRollMode !== RestManager.CONFIG.resultMsgMode) {
            game.settings.set("core", "rollMode", RestManager.CONFIG.resultMsgMode);
        }

        const preRestTimestamp = RestManager.SC_Timestamp();

        try {
            const results = await RestManager.rest(choices.actors, choices.config);
            if(RestManager.CONFIG.postRestMsg && results.size) {
                await RestManager.postRestMessage(choices.config, preRestTimestamp);
            }

            return results;
        } finally {
            game.settings.set("core", "rollMode", prevRollMode);
        }
    }

    /**
     * @param {Actor5e[]} restingActors
     * @param {RestConfiguration} [restConfiguration={}] 
     * @returns {Promise<Map<[uuid: string], {actor: Actor5e, restResult: RestResult}>>}
     */
    static async rest(restingActors, restConfiguration={}) {
        const config = foundry.utils.mergeObject(restConfiguration, this.REST_CONFIG_OVERRIDES, {inplace: false});
        const methodName = this.REST_METHOD_NAMES[config.type];

        const results = new Map();
        for(const actor of restingActors) {
            if(results.has(actor.uuid)) continue;

            let restResult = null;
            try {
                restResult = await actor[methodName](config);
            } catch(e) {
                console.error(`TaliaCustom RestManager | Failed to process ${config.type} rest for actor ${actor.name} (${actor.uuid})`, e);
            }
            results.set(actor.uuid, { actor, restResult });
        }

        return results;
    }

    /**
     * @param {RestConfiguration} config
     * @param {number} preRestTimestamp 
     * @returns {Promise<ChatMessage>}
     */
    static async postRestMessage(config, preRestTimestamp) {
        const { type, duration } = config;

        const postRestTimestamp = this.SC_Timestamp();
        const restEndStr = this.timestampToString(postRestTimestamp);
        
        const nextRestTimeout = this.REST_INTERVAL_IN_D[type];
        const nextRestTimestamp = preRestTimestamp + ( nextRestTimeout * 60 * 60 * 24 );
        const nextRestStr = this.timestampToString(nextRestTimestamp);

        const content = `
            <h2>${type.capitalize()} Rest</h2>
            <p><stong>Finished: ${restEndStr}</stong></p>
            <p><strong>Next on: ${nextRestStr}</strong></p>
        `;
        
        const msgData = {
            content,
            speaker: ChatMessage.implementation._getSpeakerFromUser({ user: game.user })
        };

        return ChatMessage.implementation.create(msgData);
    }


    static timestampToString(timestamp) {
        const { day, daySuffix, monthName, weekday, year, time } = this.SC_TimestampToDateDisplay(timestamp);
        const [hour, minute] = time.split(":");

        // End: Tuesday, Nonus 28th 1497 at 16:08
        return `${weekday}, ${monthName} ${day}${daySuffix} ${year} at ${hour}:${minute}`;
    }

    /**
     * @typedef {object} RestDialogChoices
     * @property {Actor[]} actors
     * @property {object} config
     * @property {"short"|"long"|"extended"} config.type
     * @property {boolean} config.newDay
     * @property {boolean} config.advanceTime
     * @property {number} config.duration
     */

    /**
     * @returns {Promise<RestDialogChoices | null>}
     */
    static async configureRestDialog() {
        const { StringField, BooleanField, NumberField } = foundry.data.fields;
        const { createMultiSelectInput, createFormGroup } = foundry.applications.fields;

        const restTypeField = new StringField({
            label: "Rest Type",
            choices: Object.fromEntries( Object.keys(CONFIG.DND5E.restTypes).map(k => [k, k]) ),
            required: true,
        }).toFormGroup({},{name: "type"}).outerHTML;

        const restingActorsField = createFormGroup({
            label: "Resting Actors",
            input: createMultiSelectInput({
                type: "checkboxes",
                name: "actorUuids",
                options: this._getRestActorOptions() 
            })
        }).outerHTML;

        const advanceTimeByHoursField = new NumberField({
            label: "Advance Time (h)",
            nullable: false,
            required: true,
            min: 0,
            initial: 0
        }).toFormGroup({}, {name:"advanceTimeByHours"}).outerHTML;

        const advanceTimeByDaysField = new NumberField({
            label: "Advance Time (d)",
            nullable: false,
            required: true,
            min: 0,
            initial: 0
        }).toFormGroup({}, {name:"advanceTimeByDays"}).outerHTML;

        return foundry.applications.api.DialogV2.prompt({
            window: { title: "Configure Rest" },
            position: { width: 1200 },
            content: restTypeField + advanceTimeByHoursField + advanceTimeByDaysField + restingActorsField,
            ok: { 
                callback: (_, button) => {
                    const chosen = new FormDataExtended(button.form).object;
                    const totalAdvanceTimeMin = ( chosen.advanceTimeByDays * 24 * 60 ) + ( chosen.advanceTimeByHours * 60 );

                    return {
                        actors: chosen.actorUuids.map(uuid => fromUuidSync(uuid)),
                        config: {
                            type: chosen.type,
                            newDay: chosen.type !== "short",    //any newDay stuff refreshes on any long or extended rest.
                            advanceTime: !!totalAdvanceTimeMin,
                            duration: totalAdvanceTimeMin
                        }
                    }
                }
            },
            rejectClose: false,
        });
    }

    /**
     * @returns {{label: [name: string], value: [uuid: string], selected: boolean}[]}
     */
    static _getRestActorOptions() {
        const seen = new Set();
        const options = [];
        for(const user of game.users) {
            if(!user.character || seen.has(user.character.uuid)) continue;
            seen.add(user.character.uuid);
            options.push({
                label: user.character.name,
                value: user.character.uuid,
                selected: user.active
            });
        }

        for(const token of canvas.tokens.controlled) {
            if(seen.has(token.actor.uuid)) continue;
            seen.add(token.actor.uuid);
            options.push({
                label: token.name,
                value: token.actor.uuid,
                selected: true
            });
        }

        return options.sort((a, b) => a.label.localeCompare(b.label));
    }
}
