export default {
    register() {
        register_masterOfChance();
    }
}

/**
 * Registers the preRollSkill hook for Master of Chance.
 * Triggers only when the actor has an the item with the same name and only 8.33% of the time (1 in 12).
 */
function register_masterOfChance() {
    Hooks.on("dnd5e.preRollSkill", (actor, rollData, skillId) => {
        let item = actor.items.getName("Master of Chance");
        if(!item || Math.random() > 0.0833) return;     //1d12 = 8.33% chance
        rollData.parts.push(`(5 * @abilities.cha.mod)`);
    });
}
