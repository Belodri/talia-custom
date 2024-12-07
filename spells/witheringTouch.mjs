export default {
    register() {
        Hooks.on("dnd5e.preCalculateDamage", curseOfFragiliyEffect);
    }
}

/**
 * Description of a source of damage.
 *
 * @typedef {object} DamageDescription
 * @property {number} value            Amount of damage.
 * @property {string} type             Type of damage.
 * @property {Set<string>} properties  Physical properties that affect damage application.
 * @property {object} [active]
 * @property {number} [active.multiplier]      Final calculated multiplier.
 * @property {boolean} [active.modifications]  Did modification affect this description?
 * @property {boolean} [active.resistance]     Did resistance affect this description?
 * @property {boolean} [active.vulnerability]  Did vulnerability affect this description?
 * @property {boolean} [active.immunity]       Did immunity affect this description?
 */

/**
 * Options for damage application.
 *
 * @typedef {object} DamageApplicationOptions
 * @property {boolean|Set<string>} [downgrade]  Should this actor's resistances and immunities be downgraded by one
 *                                              step? A set of damage types to be downgraded or `true` to downgrade
 *                                              all damage types.
 * @property {number} [multiplier=1]         Amount by which to multiply all damage.
 * @property {object|boolean} [ignore]       Set to `true` to ignore all damage modifiers. If set to an object, then
 *                                           values can either be `true` to indicate that the all modifications of
 *                                           that type should be ignored, or a set of specific damage types for which
 *                                           it should be ignored.
 * @property {boolean|Set<string>} [ignore.immunity]       Should this actor's damage immunity be ignored?
 * @property {boolean|Set<string>} [ignore.resistance]     Should this actor's damage resistance be ignored?
 * @property {boolean|Set<string>} [ignore.vulnerability]  Should this actor's damage vulnerability be ignored?
 * @property {boolean|Set<string>} [ignore.modification]   Should this actor's damage modification be ignored?
 * @property {boolean} [invertHealing=true]  Automatically invert healing types to it heals, rather than damages.
 * @property {"damage"|"healing"} [only]     Apply only damage or healing parts. Untyped rolls will always be applied.
 */

/**
 * 
 * @param {Actor5e} actor 
 * @param {DamageDescription[]|number} damages      Damages to apply.
 * @param {DamageApplicationOptions} options        Damage application options.
 * @returns {void}
 */
function curseOfFragiliyEffect(actor, damages, options) {
    const effect = actor.appliedEffects.find(e => e.name.includes("Curse of Fragility"));
    if(!effect) return;

    const types = ["bludgeoning", "slashing", "piercing"];
    const chosenType = types.find(t => effect.name.toLowerCase().includes(t));
    if(!chosenType) return;

    const downgrade = () => options.downgrade === true || options.downgrade?.has?.(chosenType); 
    const ignore = (category) => {
        return options.ignore === true
            || options.ignore?.[category] === true
            || options.ignore?.[category]?.has?.(chosenType)
    }
    
    const traits = actor.system.traits;
    /*
        .   di && !dr && !dv    => downgrade di
        .   di && dr && !dv     => downgrade di
        .   di && !dr && dv     => downgrade di
        .   di && dr && dv      => downgrade di

        .   !di && !dr && !dv   => add dv
        .   !di && dr && !dv    => downgrade dr
        .   !di && !dr && dv    => no change
        .   !di && dr && dv     => downgrade dr
    */

    const hasDi = traits.di.value.has(chosenType);
    const hasDr = traits.dr.value.has(chosenType);
    const hasDv = traits.dv.value.has(chosenType);

    for(let d of damages) {
        if(d.type !== chosenType) continue;

        if(( hasDi || hasDr )){
            if(typeof options.downgrade !== "boolean") {
                options.downgrade ??= new Set();
                options.downgrade.add(chosenType);
            }
        }
        else if(!hasDi && !hasDr && !hasDv && !ignore("vulnerability") && !downgrade()) {
            d.active ??= {};
            d.active.multiplier = (options.multiplier ?? 1) * 2;
            d.active.vulnerability = true;
            d.value = d.value * 2;
        }
    }
}
