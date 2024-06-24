/*  TODO
    - Surges to active effect
    - rewrite the class to be able to call new Surge()
*/


import { surgesTable } from "./surgesTable.mjs";
import { MODULE } from "../scripts/constants.mjs";

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
        }, hideRoll = false
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
        //always disallow trigger
        const disallowedConsumableTypes = ["spellGem", "potion", "poison", "food"];

        if(item.type === "consumable" && disallowedConsumableTypes.includes(item.type.value)) return false;


        //always allow trigger
        const itemTypes = ["spell", "scroll"];  //item.type
        const itemLabels = ["Wild", "Magical"]; //item.labels.properties.label

        if(item.labels.properties.some(property => itemLabels.includes(property.label))
        || itemTypes.includes(item.type)) {
            return true;
        }

        //check npc
        if(item.actor.type === "npc") return this._doesNpcTrigger();

        //if it didn't return true by now, it should be false
        return false;
    }

    static _doesNpcTrigger(item) {
        const creatureType = item.actor.system.details?.type?.value;
        if(!creatureType) return false;

        //always disallow trigger
        const disallowNpcType = ["beast"];
        if(disallowNpcType.includes(creatureType)) return false;

        //always allow trigger
        const allowNpcType = ["abberation", "celestial", "construct", "dragon", "elemental", "fey", "fiend", "monstrosity", "ooze", "plant", "undead"];
        if(allowNpcType.includes(creatureType)) return true;

        //check CR for the rest (humanoid, giant, custom)
        const alwaysDisallowCrThreshold = 5;    //always disallow triggers of humanoids, giants and custom creatures below this CR
        if(item.actor.system?.details && item.actor.system.details <= alwaysDisallowCrThreshold) return false;

        //all other filters are passed so return true
        return true;
    }

}

export function initWildMagic() {
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

export function setupWildMagic() {
    globalThis[MODULE.globalThisName].wildMagic = {
        Surge
    }

    Hooks.on("dnd5e.useItem", async (item, config, options) => {
        if(!Surge.canTrigger(item) || !Surge.surgeCheck()) return;
        const surge = await Surge.causeSurge();
        const actor = item.actor || canvas.tokens.controlled[0]?.actor;
        await Surge.createChatMessage(surge, actor);
    });
}