export default {
    register() {
        Hooks.on("dnd5e.preCalculateDamage", fixDamageAbsorption);
    }
}

/**
 * Sets all damage types the actor would be taking to healing if the actor has the appropriate absorption and no bypass.
 * @param {Actor} actor 
 * @param {DamageDescription[]} damages 
 * @param {DamageApplicationOptions} options 
 */
function fixDamageAbsorption(actor, damages, options) {
    const da = actor.system?.traits?.da;
    if(!da || !da.value?.size ) return;

    for(let damage of damages) {
        if(da.value.has(damage.type) && !da.bypasses.has(damage.type)) {
            damage.type = "healing";
        }
    }
}