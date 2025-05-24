import ChatCardButtons from "../../../utils/chatCardButtons.mjs"

export default {
    register() {
        psyBolsteredKnack();
    }
}

const PSI_SCALE_DIE = "psionic-energy-dice";

function psyBolsteredKnack() {
    ChatCardButtons.register({
        itemName: "Psy-Bolstered Knack",
        buttons: [
            {
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
            }
        ]
    });
}
