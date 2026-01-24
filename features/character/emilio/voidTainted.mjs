import { TaliaCustomAPI } from "../../../scripts/api.mjs";
import ChatCardButtons from "../../../utils/chatCardButtons.mjs";

export default {
    register() {
        addBoonsOfEldritchHunger();
        TaliaCustomAPI.add({addEssenceShards, onEnterVoidForm, onExitVoidForm}, "ItemMacros");

        ChatCardButtons.register({
            itemName: "Reaping Claws",
            displayFilter: (item) => item?.actor?.items?.some(i => i.name === "Essence Shards"),
            buttons: [{
                label: "Gain Essence Shard",
                callback: async({actor}) => await addEssenceShards(actor, 1)
            }]
        });
    }
}

/** Adds class feature subtype 'Boons of Eldritch Hunger' to the config. */
function addBoonsOfEldritchHunger() {
    CONFIG.DND5E.featureTypes.class.subtypes.boonsOfEldritchHunger = "Boons of Eldritch Hunger";
}

/**
 * 
 * @param {Actor} actor 
 * @param {number} amount
 * @returns {Promise<Item | undefined>} Updated item or null if unsuccessful.
 */
async function addEssenceShards(actor, amount) {
    const shardItem = actor?.items?.getName("Essence Shards");
    if(!shardItem) {
        ui.notifications.error("Error: Void Form cannot find Essence Shards.");
        return;
    }

    const change = { amount };


    if(Hooks.call("talia.preAddEssenceShards", shardItem, change ) === false) return;

    const { max, value } = shardItem.system.uses;
    const newValue = Math.min(max, value + (change?.amount ?? 0));
    
    if(newValue === value) return;

    await shardItem.update({"system.uses.value": newValue});
    ui.notifications.info(`Essence Shards: ${shardItem.system.uses.value}/${shardItem.system.uses.max}`);

    return shardItem;
}

/**  */
async function onExitVoidForm(actor) {
    const shardItem = actor?.items?.getName("Essence Shards");
    if(!shardItem) {
        ui.notifications.error("Error: Void Form cannot find Essence Shards.");
        return;
    }

    await shardItem.update({"system.uses.value": 0});
}

/**  */
async function onEnterVoidForm(actor) {
    const shardItem = actor?.items?.getName("Essence Shards");
    if(!shardItem) {
        ui.notifications.error("Error: Void Form cannot find Essence Shards.");
        return;
    }

    const level = actor.getRollData().classes?.warlock?.levels ?? 0;
    if(level < 6) return;

    let minShards = 6;

    if(level < 10) minShards = 2;
    else if(level < 14) minShards = 4;

    await addEssenceShards(actor, minShards);
}
