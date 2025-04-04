export default {
    register() {
        Hooks.once("setup", () => {
            addFields();
        });
    }
}

/** Adds active effect fields to DAE */
function addFields() {
    DAE.addAutoFields([
        // add modifySpellLevel fields
        "flags.talia-custom.modifySpellLevel.all",
        "flags.talia-custom.modifySpellLevel.filter.underLevel",
        "flags.talia-custom.modifySpellLevel.filter.overLevel",

        // add modifySpellLevel.spellSchools._ fields
        ...Object.keys(CONFIG.DND5E.spellSchools)
            .map(k => `flags.talia-custom.modifySpellLevel.spellSchools.${k}`),

        //add jump dist fields
        "flags.talia-custom.jumpDist.bonus",
        "flags.talia-custom.jumpDist.countDoubled",
        "flags.talia-custom.jumpDist.countHalved",
        "flags.talia-custom.jumpDist.distMult",
    ]);
}
