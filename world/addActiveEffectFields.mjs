export default {
    register() {
        Hooks.once("setup", () => {
            const fields = [];
            getDaeAutoFields(fields);
            DAE.addAutoFields(fields);
        });
    }
}

/**
 * 
 * @param {[]} fields   Gets mutated;
 */
function getDaeAutoFields(fields) {
    // add modifySpellLevel.spellSchools._ fields
    fields.push(
        ...Object.keys(CONFIG.DND5E.spellSchools)
            .map(k => `flags.talia-custom.modifySpellLevel.spellSchools.${k}`)
    );

    //add jump dist fields
    const jumpDistFields = [
        "flags.talia-custom.jumpDist.bonus",
        "flags.talia-custom.jumpDist.countDoubled",
        "flags.talia-custom.jumpDist.countHalved",
        "flags.talia-custom.jumpDist.distMult"
    ];
    fields.push(...jumpDistFields);
}
