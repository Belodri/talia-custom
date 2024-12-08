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
}
