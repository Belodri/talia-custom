export default {
    register() {
        Hooks.on("dnd5e.calculateDamage", bladeWard)
    }
}

/**
 * If blade ward is active on an actor, this modifies the damage calculation accordingly.
 * Valid action types for this filter are: ["mwak", "msak", "rwak", "rsak"]
 * msak and rsak are included for weapons that use spell attack modifiers for their attacks.
 * 
 * Special exception is added for Aviana's Vice Grip since it's not an attack but uses a melee weapon attack's damage
 */
function bladeWard(actor, damages, options) {
    //check if blade ward is active
    if(!actor.appliedEffects.find(e => e.name === "Blade Ward")) return;

    //check if any damage is physical
    const physicalDamageTypes = Object.entries(CONFIG.DND5E.damageTypes)
        .filter(([_, v]) => v.isPhysical)
        .map(([k, _]) => k);
    
    
    const isValidDamageDesc = (damageDesc) => physicalDamageTypes.includes(damageDesc.type) 
        && !damageDesc.active?.resistance 
        && !damageDesc.active.immune
        && !options.ignore?.resistance?.has(damageDesc.type);
    //check if any of the daamges is physical and not already resisted or immune
    if(!damages.some(d => isValidDamageDesc(d))) return;
    

    //get the source item
    const originatingDamageRollMessage = game.messages.get(options.originatingMessageId);
    if(!originatingDamageRollMessage) return;
    const sourceItem = fromUuidSync(originatingDamageRollMessage.flags?.dnd5e?.roll?.itemUuid);
    if(!sourceItem) return;

    //add special exception for Aviana's Vice Grip
    if(sourceItem.name.includes("Vice Grip")) return;

    //check if the source item is a weapon and if it's action type is an attack type
    const validActionTypes = ["mwak", "msak", "rwak", "rsak"];  //include msak and rsak for weapons that use spell attack modifiers for their attacks 
    if(sourceItem.type !== "weapon" || !validActionTypes.includes(sourceItem.system.actionType)) return;

    //after passing all filters, the physical damages can be altered.
    for(let damage of damages) {
        if(!isValidDamageDesc(damage)) continue;    //skip over invalid ones

        damage.value = damage.value / 2;
        damage.active.multiplier = damage.active.multiplier / 2;
        damage.active.resistance = true;
    }
}
