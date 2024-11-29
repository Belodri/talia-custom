export default {
    register() {
        Hooks.on("dnd5e.useItem", heroesFeast);
    }
}

/**
 * When the item has been used ("dnd5e.useItem" hook), this function rolls the formula,
 * updates the effect on the item to reflect the results of the roll (if successful),
 * and prints the roll to message.
 * @param {Item} item 
 * @returns {void}
 */
async function heroesFeast(item) {
    if(item.name !== "Heroes' Feast") return;
    
    const formula = "2d10";
    const roll = await new Roll(formula).evaluate();
    if(!roll) return;

    const effect = item.effects.getName(item.name);
    const changes = [
        { key: "system.traits.di.value", value: "poison", mode: 2, priority: 20 },
        { key: "system.traits.ci.value", value: "poisoned", mode: 2, priority: 20 },
        { key: "system.traits.ci.value", value: "frightened", mode: 2, priority: 20 },
        { key: "flags.midi-qol.advantage.ability.save.wis", value: "1", mode: 0, priority: 20 },
        { key: "system.attributes.hp.tempmax", value: roll.total, mode: 2, priority: 20 },
        { key: "macro.actorUpdate", value: `@targetUuid number "+${roll.total}" "system.attributes.hp.value" "+0"`, mode: 0, priority: 20 }
    ];
    await effect.update({"changes": changes});
    await roll.toMessage({
        speaker: ChatMessage.implementation.getSpeaker({ actor: item.actor }),
        flavor: item.name
    });
}
