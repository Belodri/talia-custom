import { MODULE } from "../scripts/constants.mjs";
import restrictMovement from "./restrictMovement.mjs";

export function registerWrappers() {
    libWrapper.register(MODULE.ID, "dnd5e.documents.Actor5e.prototype.getRollData", wrap_Actor_getRollData , "WRAPPER");
    libWrapper.register(MODULE.ID, 'dnd5e.applications.actor.ActorSheet5e.prototype.maximize', wrap_ActorSheet_maximize, "MIXED");
    libWrapper.register(MODULE.ID, 'dnd5e.canvas.AbilityTemplate.prototype._finishPlacement', wrap_AbilityTemplate_finishPlacement, "WRAPPER");
    libWrapper.register(MODULE.ID, "dnd5e.applications.components.DamageApplicationElement.prototype.getTargetOptions", wrap_DamageApplicationElement_getTargetOptions, "WRAPPER");
    restrictMovement.registerWrapper();
}

function wrap_Actor_getRollData(wrapped, ...args) {
    const rollData = wrapped(...args);
    // add an object to the rolldata
    const taliaObj = Hooks.call("talia_addToRollData", rollData);
    rollData.talia = taliaObj;
    return rollData;
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

/** Adds the message id of the originating message to the DamageApplicationsOptions object */
function wrap_DamageApplicationElement_getTargetOptions(wrapped, ...args) {
    const ret = wrapped(...args);
    ret.originatingMessageId = this.chatMessage?.id;
    return ret;
}