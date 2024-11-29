import ChatCardButtons from "../utils/chatCardButtons.mjs";

export default {
    register() {
        Hooks.once("setup", () => {
            ChatCardButtons.register({
                itemName: "Absorb Elements",
                buttons: ["acid", "cold", "fire", "lightning", "thunder"].reduce((acc, curr) => {
                    const label = CONFIG.DND5E.damageTypes[curr].label;
                    acc.push({
                        label: CONFIG.DND5E.damageTypes[curr].label,
                        callback: (item, card) => absorbElements(item, card, curr)
                    });
                    return acc;
                }, []),
            });
        });
    }
}

/** */
async function absorbElements(item, card, type) {
    const spellLevel = Number(card.dataset.spellLevel)
    const typeLabel = CONFIG.DND5E.damageTypes[type].label;
    const formula = `${spellLevel}d6`;
    const target = game.user.targets.first();
    if(!target) return ui.notifications.warn("You need to target a token first.");
    const uuid = target.actor.uuid;

    const createDamageAE = async () => {
        const effectData = game.dfreds.effectInterface.findEffect({ effectName: "Absorb Elements" }).toObject();

        effectData.description = `<p>The first time you hit with a melee attack on your next turn, the target takes an extra ${formula} ${type} damage and the spell ends.</p>`;
        effectData.flags.babonus.bonuses[0].bonuses.bonus = formula;
        effectData.flags.babonus.bonuses[0].bonuses.damageType = type;
        effectData.flags.babonus.bonuses[0].description = effectData.description;
        
        return game.dfreds.effectInterface.addEffect({ effectData, uuid });
    };

    const createResistanceAE = async () => {
        const effectData = game.dfreds.effectInterface.findEffect({ effectName: "Absorb Elements - Resistance" }).toObject();
        
        effectData.description = `<p>You have resistance to ${type} damage until the start of your next turn.</p>`;
        effectData.changes[0].value = type;
        return game.dfreds.effectInterface.addEffect({ effectData, uuid });
    }
    
    Promise.all([
        createDamageAE(),
        createResistanceAE()
    ]);
}
