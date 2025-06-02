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

    static REST_CONFIG_OVERRIDES = {
        dialog: false,
        autoHD: false,
    }

    static REST_METHOD_NAMES = {
        short: "shortRest",
        long: "longRest",
        extended: "extendedRest"
    };

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

        try {
            const results = await RestManager.rest(choices.actors, choices.config);
            if(RestManager.CONFIG.postRestMsg && results.size) {
                await RestManager.postRestMessage(choices.config.type);
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
     * @param {string} restType 
     * @returns {Promise<ChatMessage>}
     */
    static async postRestMessage(restType) {
        const {start, end} = this._getStartEndFormat(restType);
        const sameDay = start.day === end.day 
            && start.monthName === end.monthName 
            && start.year === end.year;

        const msgData = {
            content: `<h2>${restType.capitalize()} Rest</h2>`,
            speaker: ChatMessage.implementation._getSpeakerFromUser({ user: game.user })
        };

        if(sameDay) {
            // Tuesday, Nonus 28th 1497 from 15:08 to 16:08
            msgData.content += `<p>${start.weekday}, ${start.monthName} ${start.day}${start.daySuffix} ${start.year} from ${start.hour}:${start.minute} to ${end.hour}:${end.minute}</p>`;
        } else {
            // From Tuesday, Nonus 28th 1497 at 15:08
            // To Wednesday, Nonus 29th 1497 at 15:08
            const startLine = `<p>From ${start.weekday}, ${start.monthName} ${start.day}${start.daySuffix} ${start.year} at ${start.hour}:${start.minute}</p>`;
            const endLine = `<p>To ${end.weekday}, ${end.monthName} ${end.day}${end.daySuffix} ${end.year} at ${end.hour}:${end.minute}</p>`;
            msgData.content += startLine + endLine;
        }

        return ChatMessage.implementation.create(msgData);
    }

    /**
     * @typedef {object} DateTimeFormat
     * @property {string} day
     * @property {string} daySuffix      
     * @property {string} monthName
     * @property {string} weekday   
     * @property {string} year   
     * @property {string} hour
     * @property {string} minute
     */

    /**
     * Gets the start and end date formats for the rest type.
     * Start date is calculated by subtracting the rest duration from the current date.
     * @param {"short"|"long"|"extended"} restType 
     * @returns {{end: DateTimeFormat, start: DateTimeFormat}}
     */
    static _getStartEndFormat(restType) {
        const { timestamp, timestampToDate } = SimpleCalendar.api;
        const durInMinutes = CONFIG.DND5E.restTypes[restType].duration[game.settings.get("dnd5e", "restVariant")];

        const endTimestamp = timestamp();
        const startTimestamp = endTimestamp - (durInMinutes * 60);

        const format = (timeInS) => {
            const { day, daySuffix, monthName, weekday, year, time } = timestampToDate(timeInS).display;
            const timeParts = time.split(":");
            return {
                day,
                daySuffix,
                monthName,
                weekday,
                year,
                hour: timeParts[0],
                minute: timeParts[1],
            }
        }

        return {
            end: format(endTimestamp),
            start: format(startTimestamp)
        }
    }

    /**
     * @typedef {object} RestDialogChoices
     * @property {Actor[]} actors
     * @property {object} config
     * @property {"short"|"long"|"extended"} config.type
     * @property {boolean} newDay
     * @property {boolean} advanceTime
     */

    /**
     * @returns {Promise<RestDialogChoices | null>}
     */
    static async configureRestDialog() {
        const { StringField, BooleanField } = foundry.data.fields;
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

        const advanceTimeField = new BooleanField({
            label: "Advance time?",
            initial: true,
        }).toFormGroup({},{name: "advanceTime"}).outerHTML;

        return foundry.applications.api.DialogV2.prompt({
            window: { title: "Configure Rest" },
            position: { width: 1200 },
            content: restTypeField + advanceTimeField + restingActorsField,
            ok: { 
                callback: (_, button) => {
                    const chosen = new FormDataExtended(button.form).object;
                    return {
                        actors: chosen.actorUuids.map(uuid => fromUuidSync(uuid)),
                        config: {
                            type: chosen.type,
                            newDay: chosen.type !== "short",    //any newDay stuff refreshes on any long or extended rest.
                            advanceTime: chosen.advanceTime,
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
