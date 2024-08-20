import { MODULE } from "../scripts/constants.mjs";

export function registerWrappers() {
    libWrapper.register(MODULE.ID, "dnd5e.documents.Actor5e.prototype.getRollData", wrap_Actor_getRollData , "WRAPPER");
    libWrapper.register(MODULE.ID, 'dnd5e.applications.actor.ActorSheet5e.prototype.maximize', wrap_ActorSheet_maximize, "MIXED");
    libWrapper.register(MODULE.ID, 'dnd5e.canvas.AbilityTemplate.prototype._finishPlacement', wrap_AbilityTemplate_finishPlacement, "WRAPPER");
}

function wrap_Actor_getRollData(wrapped, ...args) {
    const talia = {};
    // allows mutating the additions object before rollData is calculated
    Hooks.callAll("talia_preGetRollData", talia);

    const data = wrapped(...args);

    const rollData = foundry.utils.deepClone(data);

    // allows mutating the talia object
    Hooks.call("talia_postGetRollData", rollData, talia);    

    // additions to rollData can be found under 
    return foundry.utils.mergeObject(data, {
        talia: talia
    });
}

/** Prevents the character sheet from being maximised again after a template has been placed. */
function wrap_ActorSheet_maximize(wrapped, ...args) {
    if(game.user.getFlag(MODULE.ID, 'preventActorSheetMax')) return;
    else return wrapped(...args);
}

/** Prevents the character sheet from being maximised again after a template has been placed. */
async function wrap_AbilityTemplate_finishPlacement(wrapped, ...args) {
    //set flag on user to disable maximising the sheet
    await game.user.setFlag(MODULE.ID, 'preventActorSheetMax', true);
    //call the original
    const ret = await wrapped(...args);
    //unset flag on user to enable maximising the sheet again
    await game.user.unsetFlag(MODULE.ID, 'preventActorSheetMax')
    return ret;
}
