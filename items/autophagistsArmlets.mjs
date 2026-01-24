import ActiveEffect5e from "../system/dnd5e/module/documents/active-effect.mjs";
import { Actor5e, Item5e } from "../system/dnd5e/module/documents/_module.mjs";
import CombatTriggers from "../utils/CombatTriggers.mjs";
import { Helpers } from "../utils/helpers.mjs";

export default {
    register() {
        Hooks.on("talia.preAddEssenceShards", onPreAddEssenceShards)
    }
}

/*
    Item Text:

    "When you gain one or more Essence Shards for the first time during each turn, you gain one additional Essence Shard and take 4d4 slashing damage. 
    This damage ignores resistance and immunity."

    Notes:
    - This script only consumes item uses. Recharging consumed uses must be handled elsewhere.
*/

/**
 * 
 * @param {Item5e} shardItem 
 * @param {{amount: number}} change 
 */
function onPreAddEssenceShards(shardItem, change) {
    const actor = shardItem.actor;

    const armletItem = actor.items.getName("Autophagist's Armlet");
    if(!armletItem?.system?.equipped || !Helpers.checkAttunement(armletItem)) return;
    if((armletItem?.system?.uses?.value ?? 0) <= 0) return;

    change.amount++;

    (async() => {
        try {
            await armletItem.update({"system.uses.value": 0});
        } catch(err) {
            ui.notifications.error(`Error: Autophagist's Armlet failed to consume a use.`);
            console.error(err);
        }

        let damageRoll;
        try {
            damageRoll = await armletItem.rollDamage({ options: { fastForward: true }});
        } catch(err) {
            ui.notifications.error(`Error: Autophagist's Armlet failed to roll damage.`);
            console.error(err);
        }

        try {
            if(damageRoll) await actor.applyDamage(damageRoll.total, { ignore: true });
        } catch(err) {
            ui.notifications.error(`Error: Autophagist's Armlet failed to apply rolled damage.`);
            console.error(err);
        }

        ui.notifications.info(`Autophagist's Armlet added 1 Essence Shard.`);
    })();
}
