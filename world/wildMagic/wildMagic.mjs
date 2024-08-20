/*  TODO
    - Surges to active effect
*/

import { surgesTable } from "./surgesTable.mjs";
import { TaliaCustomAPI } from "../../scripts/api.mjs";
import { TaliaUtils } from "../../utils/_utils.mjs";


export default {
    register() {
        WildMagic.addItemProperty();
        TaliaCustomAPI.add({
            wildMagicSurge: WildMagic.surge,
        }, "Macros");

        Hooks.on("dnd5e.useItem", WildMagic.hook_useItem);
        Hooks.on("dnd5e.preDisplayCard", WildMagic.hook_preDisplayCard)
    }
}


class WildMagic {
    static async hook_useItem(item, config, options) {
        if(!WildMagic.canSurge(item) || !WildMagic.checkIsSurge()) return;
        const actor = item.actor || canvas.tokens.controlled[0]?.actor;
        await WildMagic.surge(actor);
    }

    static hook_preDisplayCard(item, chatData, options) {
        if(!item.system?.properties.has("wild")) return;
        //add new labels to chatCard
        chatData.content = TaliaUtils.Helpers.insertListLabels(chatData.content, ["Wild"]);
    }

    static addItemProperty() {
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
    }

    static canSurge(item) {
        const hasWildProp = item.system.properties.has("wild");

        // ALWAYS allow items with the Wild tag, no matter what
        if(hasWildProp) return true;

        // ALWAYS allow spells and scrolls
        if(item.type === "spell" || (item.type === "consumable" && item.system.type.value === "scroll"))

        // NEVER allow ["spellGem", "potion", "poison", "food"]
        if(item.type === "consumable" && ["spellGem", "potion", "poison", "food"].includes(item.system.type.value)) return false;

        // NEVER allow non-wild items if it's a player character
        if(item.actor.type === "character" && !hasWildProp) return false;

        // NEVER allow items used by NPCs of type beast (unless they have the wild tag but that's handled above)
        if(item.actor.type === "npc" && item.actor.system.details?.type?.value === "beast") return false;

        return true;
    }

    /**
     * @param {number} chance A number between 0 and 1, representing a chance of 0% to 100%
     * @returns {boolean} True if the surge check failed (which would cause a surge).
     */
    static checkIsSurge(chance = 0.05) {
        if(Math.random() > chance) return false;
        else return true;
    }

    /**
     * @param {object} allowedSeverities 
     * @param {boolean} allowedSeverities.minor - can this surge be minor
     * @param {boolean} allowedSeverities.moderate  - can this surge be moderate
     * @param {boolean} allowedSeverities.major - can this surge be severe
     * @returns {object} contains properties: severity (string), roll (roll)
    */
    static async determineSeverity(allowedSeverities) {
        const ranges = {
            minor: 11,
            moderate: 6,
            major: 3
        };
        const diceSize = Object.entries(allowedSeverities)
            .reduce((sum, [severity, isAllowed]) => {
                return isAllowed ? sum + ranges[severity] : sum
            }, 0);
        if(diceSize === 0) throw new Error('No allowed severity');

        const roll = await new Roll(`1d${diceSize}`).evaluate();

        let cumulativeRange = 0;
        for (const severity of ['major', 'moderate', 'minor']) {
            if (allowedSeverities[severity]) {
                cumulativeRange += ranges[severity];
                if (result <= cumulativeRange) {
                    return { severity, roll };
                }
            }
        }
    }

    static async surge(actor, {
        allowedSeverities = {
            minor: true,
            moderate: true,
            major: true
        },
        hideRoll = false,
        hideMessage = false,
    }) {
        const severity = await WildMagic.determineSeverity(allowedSeverities);
        if(!hideRoll) await game.dice3d.showForRoll(severity.roll, game.user, true);

        const result = await WildMagic.rollOnTable(severity.severity, hideRoll);
        if(hideMessage) return result;
        return await WildMagic.createChatMessage(result, actor);
    }
    
    /**
     * @param {string} severity "minor", "moderate", "major"
     * @param {boolean} hideRoll should the roll animation be hidden?
     * @returns {Promise<string>} result from the chosen table
     */
    static async rollOnTable(severity, hideRoll = false) {
        const diceSize = Object.keys(surgesTable[severity]).length + 1;

        const roll = await new Roll(`1d${diceSize}`).evaluate();
        if(!hideRoll) await game.dice3d.showForRoll(roll, game.user, true);
        return surgesTable[severity][roll.total];
    }
    
    static async createChatMessage(messageString, actor) {
        await ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({actor: actor}),
            content: `<h2 style="text-align: center; font-weight: bold;">Wild Magic Surge</h2><p>${messageString}</p>`,
        });
    }

}





export class Surge {
    /**
     * 
     * @param {object} allowedSeverities 
     * @param {boolean} allowedSeverities.minor - can this surge be minor:   default true
     * @param {boolean} allowedSeverities.moderate  - can this surge be moderate:    default true
     * @param {boolean} allowedSeverities.severe - can this surge be severe:     default true
     * @param {boolean} hideRoll - should the roll animation be hidden? 
     */
    static async causeSurge({
        allowedSeverities = {
            minor: true,
            moderate: true,
            severe: true
        }, 
        hideRoll = false
    } = {}) {
        /*  Roll Ranges
            1-3 =  Severe
            4-9 = Moderate
            10-20 = Minor
        */

        const sev = await this._doSeverityRoll(allowedSeverities);
        if(!hideRoll) {
            await game.dice3d.showForRoll(sev.roll, game.user, true);
        }
        return await this.rollOnTable(sev.severity, hideRoll);
    }

    static async createChatMessage(resultString, actor) {
        const speaker = ChatMessage.getSpeaker({actor: actor});
        const flavor = `<h2 style="text-align: center; font-weight: bold;">Wild Magic Surge</h2><p>${resultString}</p>`;
        await ChatMessage.create({
            user: game.user.id,
            speaker: speaker,
            content: flavor
        });
    }

    /**
     * @param {string} severity "minor", "moderate", "severe"
     * @param {boolean} hideRoll should the roll animation be hidden?
     * @returns {Promise<string>} result from the chosen table
     */
    static async rollOnTable(severity, hideRoll = false) {
        const roll = await new Roll(`1d100`).evaluate();
        if(!hideRoll) {
            await game.dice3d.showForRoll(roll, game.user, true);
        }
        return surgesTable[severity][roll.total];
    }

    /**
     * @param {object} allowedSeverities 
     * @param {boolean} allowedSeverities.minor - can this surge be minor
     * @param {boolean} allowedSeverities.moderate  - can this surge be moderate
     * @param {boolean} allowedSeverities.severe - can this surge be severe
     * @returns {object} contains properties: severity (string), roll (roll)
    */
    static async _doSeverityRoll(allowedSeverities) {
        if (allowedSeverities.minor !== true && allowedSeverities.moderate !== true && allowedSeverities.severe !== true) {
            throw new Error('None of the values in allowedSeverities are true.');
        }
        const roll = await new Roll(`1d20`).evaluate();
        const result = roll.total;

        if(allowedSeverities.severe && this._isWithinRange(result, 1, 3)) return {severity: "severe", roll: roll};
        if(allowedSeverities.moderate && this._isWithinRange(result, 4, 9)) return {severity: "moderate", roll: roll};
        if(allowedSeverities.minor && this._isWithinRange(result, 10, 20)) return {severity: "minor", roll: roll};
        return await this._doSeverityRoll(allowedSeverities);
    }

    static _isWithinRange(number, min = 0, max = 20) {
        return number >= min && number <= max;
    }

    static surgeCheck(chance = 0.05) {
        if(Math.random() > chance) return false;
        else return true;
    }


    static canTrigger(item) {
        const hasWildProp = item.system.properties.has("wild");

        // ALWAYS allow items with the Wild tag, no matter what
        if(hasWildProp) return true;

        // ALWAYS allow spells and scrolls
        if(item.type === "spell" || (item.type === "consumable" && item.system.type.value === "scroll"))

        // NEVER allow ["spellGem", "potion", "poison", "food"]
        if(item.type === "consumable" && ["spellGem", "potion", "poison", "food"].includes(item.system.type.value)) return false;

        // NEVER allow non-wild items if it's a player character
        if(item.actor.type === "character" && !hasWildProp) return false;

        // NEVER allow items used by NPCs of type beast (unless they have the wild tag but that's handled above)
        if(item.actor.type === "npc" && item.actor.system.details?.type?.value === "beast") return false;

        return true;
    }
}

