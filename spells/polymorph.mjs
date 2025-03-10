export default {
    register() {
        Hooks.on("deleteActiveEffect", onDelete);
    }
}

/**
 * Handles the deletion of Polymorph effects, ensuring proper cleanup of related effects.
 * @param {import("../system/dnd5e/module/documents/active-effect.mjs").default} effect     The effect being deleted
 * @param {object} options                                                                  Deletion options
 * @param {string} userId                                                                   ID of the user triggering the deletion
 * @returns {Promise<void>}
 */
async function onDelete(effect, options, userId) {

    // Ignore if not from same user or not a polymorph effect
    if(userId !== game.userId) return;
    if(!["Polymorph", "Concentrating: Polymorph"].includes(effect.name)) return;

    const actor = effect.parent;
    if(!(actor instanceof Actor)) return;  // Avoid deleting effect on item
    if(!actor.getFlag("dnd5e", "isPolymorphed")) return;  // Not polymorphed, nothing to do

    const originalActorId = actor.getFlag("dnd5e", "originalActor");
    const originActorId = foundry.utils.parseUuid(effect.origin).primaryId;

    // If caster polymorphed themselves
    if(originalActorId === originActorId) {
        try {
            const originalActor = game.actors.get(originalActorId);
            
            // Try to find and delete concentration effect on the original first
            const originalConcentration = originalActor.appliedEffects
                .find(e => e.name === "Concentrating: Polymorph");
            
            if(originalConcentration) {
                await originalConcentration.delete();
            } else {
                // If no concentration found, try to delete the polymorph effect on the original
                const originalPoly = originalActor.appliedEffects
                    .find(e => e.name === "Polymorph");
                if(originalPoly) await originalPoly.delete();
            }

            // If this effect is the concentration effect
            if( effect.name === "Concentrating: Polymorph") {
                // Delete polymorph effect on transformed actor
                const poly = actor.appliedEffects.find(e => e.name === "Polymorph");
                if(poly) await poly.delete();
            }  
        } catch(error) {
            console.error("Error cleaning up polymorph effects:", error);
        }
    }

    // Revert the original form if the deleted effect was the main polymorph effect
    if(effect.name === "Polymorph") { 
        actor.revertOriginalForm();
    }
}
