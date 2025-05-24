import ChatCardButtons from "../../../utils/chatCardButtons.mjs"
import { Helpers } from "../../../utils/helpers.mjs";
import { ItemHookManager } from "../../../utils/ItemHookManager.mjs";

export default {
    register() {
        psyBolsteredKnack();
        psychicWhisper();
    }
}

const PSI_SCALE_DIE = "psionic-energy-dice";

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
        }]
    });
}

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
        }]
    })
}
