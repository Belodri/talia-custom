/*
    final heaven has has limited uses 0 of 1 charges.

    it has a transfer active effect
    it sets
        "flags.talia-custom.finalHeavenStacks" ADD 0
    at the start of each of the actor's turns in combat the AE runs an effectMacro which
        
    
        checks if the actor is raging and grappling
        updates it's own effect to add the stack count + 1
*/

async function effectMacro_onTurnStart(effect, actor) {
    const rd = actor.getRollData();
    const currentStacks = rd.flags["talia-custom"]?.finalHeavenStacks;
    const stillValid = rd.effects.find(e => e.name === "Rage") && rd.effects.find(e => e.name === "Grappling") ? true : false;

    if(!stillValid && currentStacks === 0) return;  //no change needed
    const clonedChanges = foundry.utils.deepClone(effect.changes);
    const ch = clonedChanges.find(c => c.key === "flags.talia-custom.finalHeavenStacks");
    if(!ch){
        ui.notifications.error(`No change with key "flags.talia-custom.finalHeavenStacks" found.`);
        return null;
    }
    ch.value = stillValid ? currentStacks + 1 : 0;
    const newName = ch.value === 0 ? "Final Heaven" : `Final Heaven ${ch.value}`;
    await effect.update({"changes": clonedChanges, "name": newName});   
}

