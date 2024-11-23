export default {
    register() {
        Hooks.on("updateItem", (item, change) => {
            if(item.system?.type?.value === "hat" && typeof (change.system?.equipped) === "boolean") {
                updateEffect(item.actor);
            }
        });
    }
}

/**
 *
 */
function updateEffect(actor) {
    const effect = actor.appliedEffects.find(e => e.name === "Towering Pillar of Hats");
    if(!effect) return;
    
    const eqHats = actor.itemTypes.equipment.filter(i => i.system?.type?.value === "hat" && i.system?.equipped === true);
    const updateObj = {
        changes: [{
            key: effect.changes[0].key,
            mode: effect.changes[0].mode,
            priority: effect.changes[0].priority,
            value: eqHats.length
        }],
        description: `<p>The ${eqHats.length > 0 ? "majestic" : "tragically absent"} tower of hats upon your head currently grants you a +${eqHats.length} bonus to your Charisma score.</p>`
    }
    return effect.update(updateObj);
}
