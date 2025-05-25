import ChatCardButtons from "../../../utils/chatCardButtons.mjs"
import Mover from "../../../utils/Mover.mjs";

export default {
    register() {
        psyBolsteredKnack();
        psychicWhisper();
        psychicTeleportation();
    }
}

const PSI_SCALE_DIE = "psionic-energy-dice";


/**
 * Registers a chat card button for the "Psy-Bolstered Knack" feature for Soulknife subclass actors.
 * When the button is clicked, it checks the consumption target item's uses,
 * restores one use if possible, and notifies the user of the result.
 */
function psyBolsteredKnack() {
    ChatCardButtons.register({
        itemName: "Psy-Bolstered Knack",
        buttons: [{
            label: "Regain Psionic Energy Die",
            callback: async({item}) => {
                const targetId = item.system.consume.target;
                const targetItem = item.actor.items.get(targetId);
                if(!targetItem) return ui.notifications.error("Psy-Bolstered Knack | Missing consume target.");

                const currentUses = foundry.utils.getProperty(targetItem, "system.uses.value");
                const maxUses = foundry.utils.getProperty(targetItem, "system.uses.max");
                if(!maxUses) return ui.notifications.error("Psionic Energy | No uses configured.");

                if(currentUses === maxUses) ui.notifications.info(`Psy-Bolstered Knack | No dice expended.`);

                const newUses = Math.clamp(currentUses + 1, 0, maxUses);
                await targetItem.update({"system.uses.value": newUses});
                ui.notifications.info(`Psy-Bolstered Knack | Regained expended die.`);
            }
        }],
        displayFilter: (item) => item.actor?.itemTypes?.subclass?.find(s => s.name === "Soulknife")
    });
}

/**
 * Registers the hook and chat card button for the "Psychic Whispers" feature for Soulknife subclass actors.
 * Sets consumption to prefer uses over resources and adjusts chat card button display accordingly.
 * When the "Roll Duration" button is clicked, a Psionic Energy die is rolled to determine the duration of
 * the effect in hours.
 */
function psychicWhisper() {
    Hooks.on("dnd5e.preUseItem", (item, config, options) => {
        if(item.name !== "Psychic Whispers" || !item.actor?.itemTypes?.subclass?.find(s => s.name === "Soulknife")) return;

        const hasUses = item.system.uses.value !== 0;
        config.consumeResource = hasUses ? null : true;
        config.consumeUsage = hasUses ? true : null;

        item.setFlag("talia-custom", "hideChatCardButtons", {
            consumeResources: hasUses,
            consumeUses: !hasUses
        });
    });

    ChatCardButtons.register({
        itemName: "Psychic Whispers",
        buttons: [{
            label: "Roll Duration",
            callback: async({item, message}) => {
                const formula = `@scale.soulknife.${PSI_SCALE_DIE}`;
                const roll = await new Roll(`@scale.soulknife.${PSI_SCALE_DIE}`, item.actor.getRollData()).evaluate();
                const durInSec = roll.total * 60 * 60;
                const eff = item.effects.contents[0];
                await eff.update({"duration.seconds": durInSec});
                await roll.toMessage({
                    speaker: message.speaker,
                    flavor: `Psychic Whispers: Duration in hours`,
                });
                ui.notifications.info(`Psychic Whispers | Set duration to ${roll.total} hours.`);
            }
        }],
        displayFilter: (item) => item.actor?.itemTypes?.subclass?.find(s => s.name === "Soulknife")
    })
}

/**
 * Registers a chat card button for the Psychic Teleportation" feature for Soulknife subclass actors.
 * When clicked, allows the user to teleport to a location within range.  
 *
 * Upon successful teleportation, a Psionic Energy die is rolled. If this roll is 6 or higher, 
 * restores an expended Psionic Energy die.
 */
function psychicTeleportation() {
    ChatCardButtons.register({
        itemName: "Psychic Teleportation",
        buttons: [{
            label: "Teleport",
            callback: async({item, message, token}) => {
                const rd = item.actor.getRollData();
                const scaleDie = rd.scale.soulknife[PSI_SCALE_DIE];
                const maxDistance = scaleDie.faces * 10;

                const mover = await new Mover(token).selectTarget(maxDistance);
                if(!mover) return;

                const res = await mover.executeMode("TELEPORT", {tint: "#00030d"});
                if(!res) return;

                const roll = await new Roll(`@scale.soulknife.${PSI_SCALE_DIE}`, item.actor.getRollData()).evaluate();
                await roll.toMessage({
                    speaker: message.speaker,
                    flavor: `Psychic Teleportation`,
                });

                if(roll?.total >= 6) {
                    const targetId = item.system.consume.target;
                    const targetItem = item.actor.items.get(targetId);
                    if(!targetItem) return ui.notifications.error("Psychic Teleportation | Missing consume target.");

                    const currentUses = foundry.utils.getProperty(targetItem, "system.uses.value");
                    const maxUses = foundry.utils.getProperty(targetItem, "system.uses.max");
                    if(!maxUses) return ui.notifications.error("Psionic Energy | No uses configured.");

                    const newUses = Math.clamp(currentUses + 1, 0, maxUses);
                    if(newUses !== currentUses) {
                        await targetItem.update({"system.uses.value": newUses});
                        ui.notifications.info(`Psychic Teleportation | Regained expended die.`);
                    }
                }
            }
        }],
        displayFilter: (item) => item.actor?.itemTypes?.subclass?.find(s => s.name === "Soulknife")
    })
}
