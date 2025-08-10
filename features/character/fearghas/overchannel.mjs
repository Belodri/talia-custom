/**
 * @import AbilityUseDialog from "../../../system/dnd5e/module/applications/item/ability-use-dialog.mjs";
 * @import { Actor5e } from "../../../system/dnd5e/module/documents/_module.mjs";
 */

export default {
    register() {
        Overchannel.registerHooks();
    }
}

/*
    Feature Text:

    Starting at 14th level, you can increase the power of your simpler spells. 
    When you expend a spell slot to cast a spell of 1st through 5th level that deals damage, you can deal maximum damage with that spell.

    The first time you do so, you suffer no adverse effect. 
    If you use this feature again before you finish a long rest, you take 2d12 necrotic damage for each level of the spell,
    immediately after you cast it. 
    Each time you use this feature again before finishing a long rest, the necrotic damage per spell level increases by 1d12. 
    This damage ignores resistance and immunity.
*/

/*
    3rd-party module dependencies:
        - hard: Build-a-Bonus (BaB)
        - soft: Dice-So-Nice (dice3d)

    Implementation:

    BaB (on the Overchannel feature item): Maximizes all spells that have the flag "talia-custom.overchannel" === true

    1. preUseItem
        Tests if the item can be overchanneled and properties on the ItemUseConfiguration object
    2. renderAbilityUseDialog
        Adds a checkbox to the dialog for the user to choose whether to overchannel or not
    3. displayCard
        connects the item to the chatMessage
    4. useItem
        If the use chose to overchannel: 
            - gets the item data, and add the `"talia-custom.overchannel" === true` flag, 
                and stores it on the "dnd5e.itemData" flag on the chatMessage.
                This way damage rolls of this chat message use the itemData instead of the original item
            - adds the "Overchanneled" flavor to the chatMessage
            - rolls the overchannel damage and damages the actor (if not free use)
            - adds a 'use' to the overchannel item to track the uses

    - preRestCompleted
        Sets the uses of the overchannel item to 0 (to reset use count)
*/


class Overchannel {
    static FEATURE_NAME = "Overchannel";

    //#region Utils

    static async WaitForDiceAnimation(messageId) {
        return game.dice3d?.waitFor3DAnimationByMessageID?.(messageId);
    }

    //#endregion

    static registerHooks() {
        Hooks.on("dnd5e.preUseItem", Overchannel.onPreUseItem);
        Hooks.on("renderAbilityUseDialog", Overchannel.onRenderAbilityUseDialog);
        Hooks.on("dnd5e.useItem", Overchannel.onUseItem);
        Hooks.on("dnd5e.preRestCompleted", Overchannel.onPreRestCompleted);
        Hooks.on("dnd5e.displayCard", Overchannel.onDisplayCard);
    }

    /**
     * 
     * @param {Item} item 
     * @param {ItemUseConfiguration} config 
     * @param {ItemUseOptions} options 
     */
    static onPreUseItem(item, config, options) {
        // use _source to get the spell's original, non-upcast level
        const baseSpellLevel = item.system?._source?.level;
        const canOverchannel = config.consumeSpellSlot
            && item.type === "spell"
            && item.hasDamage
            && baseSpellLevel >= 1
            && baseSpellLevel <= 5;

        if(!canOverchannel) return;

        const overchannelItem = item.actor?.items?.getName(Overchannel.FEATURE_NAME);
        if(!overchannelItem) return;

        const damageFormula = Overchannel._getDamageFormula(baseSpellLevel, overchannelItem);

        // Set the properties on the config (as only the config is passed to the dialog)
        foundry.utils.setProperty(config, "talia.overchannel.use", false);
        foundry.utils.setProperty(config, "talia.overchannel.damageFormula", damageFormula)
        foundry.utils.setProperty(config, "talia.overchannel.itemId", overchannelItem.id);
    }


    /**
     * 
     * @param {number} baseLevelOfSpell
     * @param {Item} overchannelItem 
     * @returns {number}
     */
    static _getDamageFormula(baseLevelOfSpell, overchannelItem) {
        const charges = overchannelItem.system.uses;
        if(charges.value < charges.max) return ""; // Free uses

        const dicePerLevel = 2 + charges.value - charges.max;   // 2 + usesCount - freeUses
        const damageDice = Math.max(0, baseLevelOfSpell * dicePerLevel);     // 2d12 + 1d12 for each non-free use since last reset per spell level
        return `${damageDice}d12`;
    }

    /**
     * 
     * @param {AbilityUseDialog} app
     * @param {JQuery} jQuery 
     * @param {object} dialogData 
     */
    static onRenderAbilityUseDialog(app, [htmlEle], dialogData) {
        const use = foundry.utils.getProperty(app, "configuration.talia.overchannel.use");
        if(typeof use !== "boolean") return;

        // If the 'use' property exists and is a boolean on the config, we know this can overchannel
        // and don't need to do any futher null checks

        const damageFormula = foundry.utils.getProperty(app, "configuration.talia.overchannel.damageFormula");
        const label = `Use Overchannel? (${damageFormula ? `${damageFormula} necrotic damage` : "no adverse effects"})`;
        
        const checkboxHTML = `
            <label class="checkbox">
                <input type="checkbox" name="talia.overchannel.use" ${use ? `checked=""` : ""}>
                ${label}
            </label>
        `;

        const divEle = document.createElement("div");
        divEle.className = "form-group";
        divEle.innerHTML = checkboxHTML;

        htmlEle.querySelector("form")
            .appendChild(divEle);
    }


    /** @type {Map<string, string>} A map of Item uuids to ChatMessage ids */
    static #itemCardTracker = new Map();

    /**
     * 
     * @param {Item5e} item 
     * @param {ChatMessage|object} card 
     */
    static onDisplayCard(item, card) {
        Overchannel.#itemCardTracker.set(item.uuid, card.id);
    }

    /**
     * 
     * @param {Item} item 
     * @param {ItemUseConfiguration} config 
     * @param {ItemUseOptions} options 
     */
    static async onUseItem(item, config, options) {
        const cardId = Overchannel.#itemCardTracker.get(item.uuid);
        if(!cardId) return;

        const overchannel = config.talia?.overchannel;
        if(!overchannel?.use) return;

        Overchannel.getOverchannelItem(item.actor);
        const overchannelItem = item.actor.items.get(overchannel.itemId);
        if(!overchannelItem) throw new Error(`Overchannel | Could not find overchannel item with id '${overchannel.itemId}'`);

        const chatMessage = game.messages.get(cardId);
        if(!chatMessage) return;

        // get the item data, add the flag to the data, embed the data on a dnd5e.itemData flag on the message     
        const itemData = chatMessage.getFlag("dnd5e", "itemData") ?? item.toObject();
        foundry.utils.setProperty(itemData.flags, "talia-custom.overchannel", true);
        await chatMessage.update({
            "flavor": "Overchanneled",
            "flags.dnd5e.itemData": itemData,
        });

        // update overchannel item to track uses
        await overchannelItem.update({"system.uses.value": overchannelItem.system.uses.value + 1});
        // damage actor 
        if(overchannel.damageFormula) await Overchannel._damageActor(overchannel.damageFormula, item.actor);
    }


    /**
     * Rolls the damage, posts the message, and damages the actor, ignoring all damage modifications.
     * @param {string} damageFormula 
     * @param {Actor5e} actor 
     */
    static async _damageActor(damageFormula, actor) {
        const damageRoll = await dnd5e.dice.damageRoll({
            parts: [damageFormula],
            critical: false,
            fastForward: true,
            flavor: Overchannel.FEATURE_NAME,
            chatMessage: false,
        });

        const msg = await damageRoll.toMessage({
            speaker: ChatMessage.getSpeaker({actor}),
        });
        
        await Overchannel.WaitForDiceAnimation(msg.id);

        const damageDesc = {
            value: damageRoll.total,
            type: "necrotic"
        }

        await actor.applyDamage([{
            value: damageRoll.total,
            type: "necrotic"
        }], {
            ignore: true
        });
    }

    /**
     * Resets the charges on the overchannel item to 0 on a long rest.
     * @param {Actor5e} actor 
     * @param {RestResult} result 
     * @param {import("../../../system/dnd5e/module/config.mjs").RestConfiguration} config 
     */
    static onPreRestCompleted(actor, result, config) {
        if(!result.longRest) return;  // only on long/extended rest

        const overchannelItem = actor.items.getName(Overchannel.FEATURE_NAME);
        if(!overchannelItem) return;

        const uses = overchannelItem.system.uses;
        if(uses.value === 0) return; 

        result.updateItems.push({_id: overchannelItem.id, "system.uses.value": 0});
    }
}
