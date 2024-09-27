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
    static checkIsSurge(chance = undefined) {
        const sceneChance = chance ?? canvas.scene.getFlag("talia-custom", "surgeChance") ?? 0.05;
        if(Math.random() > sceneChance) return false;
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
                if (roll.total <= cumulativeRange) {
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
    } = {}) {
        const severity = await WildMagic.determineSeverity(allowedSeverities);
        if(!hideRoll) await game.dice3d.showForRoll(severity.roll, game.user, true);

        const result = await WildMagic.rollOnTable(severity.severity, hideRoll);
        if(hideMessage) return result;
        return await WildMagic.createChatMessage(result, actor, severity.severity);
    }
    
    /**
     * @param {string} severity "minor", "moderate", "major"
     * @param {boolean} hideRoll should the roll animation be hidden?
     * @returns {Promise<string>} result from the chosen table
     */
    static async rollOnTable(severity, hideRoll = false) {
        const diceSize = Object.keys(surgesTable[severity]).length - 1;

        const roll = await new Roll(`1d${diceSize}`).evaluate();
        if(!hideRoll) await game.dice3d.showForRoll(roll, game.user, true);
        return surgesTable[severity][roll.total];
    }
    
    static async createChatMessage(messageString, actor, severity) {
        const severityStr = severity[0].toUpperCase() + severity.slice(1);
        await ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({actor: actor}),
            content: `<h2 style="text-align: center; font-weight: bold;">${severityStr} Wild Magic Surge</h2><p>${messageString}</p>`,
        });
    }

}