import ChatCardButtons from "../../../utils/chatCardButtons.mjs";

export default {
    register() {
        addBoonsOfEldritchHunger();
        reapingClawsButton();
    }
}

/** Adds class feature subtype 'Boons of Eldritch Hunger' to the config. */
function addBoonsOfEldritchHunger() {
    CONFIG.DND5E.featureTypes.class.subtypes.boonsOfEldritchHunger = "Boons of Eldritch Hunger";
}

/** Adds a button to the 'Reaping Claws' item which adds 1 Essence Shard. */
function reapingClawsButton() {
    ChatCardButtons.register({
        itemName: "Reaping Claws",
        displayFilter: (item) => item?.actor?.items?.some(i => i.name === "Essence Shards"),
        buttons: [{
            label: "Gain Essence Shard",
            callback: async({actor}) => {
                const shardItem = actor.items.getName("Essence Shards");
                if(!shardItem?.system?.uses) return ui.notifications.error("Reaping Claws | Unable to find item 'Essence Shards'.");

                const { uses } = shardItem.system;
                if(uses.value < uses.max) await shardItem.update({"system.uses.value": uses.value + 1});
                ui.notifications.info(`Essence Shards: ${shardItem.system.uses.value}/${shardItem.system.uses.max}`);
            }
        }]
    })
}
