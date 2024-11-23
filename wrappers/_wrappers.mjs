import { MODULE } from "../scripts/constants.mjs";
import restrictMovement from "./restrictMovement.mjs";

/** registers all wrappers */
export function registerWrappers() {
    libWrapper.register(MODULE.ID, "dnd5e.documents.Actor5e.prototype.getRollData", wrap_Actor_getRollData , "WRAPPER");
    libWrapper.register(MODULE.ID, 'dnd5e.applications.actor.ActorSheet5e.prototype.maximize', wrap_ActorSheet_maximize, "MIXED");
    libWrapper.register(MODULE.ID, 'dnd5e.canvas.AbilityTemplate.prototype._finishPlacement', wrap_AbilityTemplate_finishPlacement, "WRAPPER");
    libWrapper.register(MODULE.ID, "dnd5e.applications.components.DamageApplicationElement.prototype.getTargetOptions", wrap_DamageApplicationElement_getTargetOptions, "WRAPPER");
    libWrapper.register(MODULE.ID, "CONFIG.Dice.D20Roll.prototype.configureModifiers", wrap_CONFIG_Dice_D20Roll_prototype_configureModifiers, "WRAPPER");
    restrictMovement.registerWrapper();
}

/** Lets other parts of the module hook into talia_addToRollData and mutate the taliaObj which is then appended to rollData */
function wrap_Actor_getRollData(wrapped, ...args) {
    const rollData = wrapped(...args);
    // add an object to the rolldata
    const taliaObj = {};
    Hooks.callAll("talia_addToRollData", rollData, taliaObj);
    rollData.talia = taliaObj;
    return rollData;
}

/** Prevents the character sheet from being maximised again after a template has been placed. */
function wrap_ActorSheet_maximize(wrapped, ...args) {
    if(game.user.getFlag(MODULE.ID, 'preventActorSheetMax')) return undefined;
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

/** Adds a hook to configure the dice modifiers of a D20Roll. The hook can mutate the roll! */
function wrap_CONFIG_Dice_D20Roll_prototype_configureModifiers(wrapped, ...args) {
    wrapped(...args);
    Hooks.callAll("talia_postConfigureD20Modifiers", this);

    // Re-compile the underlying formula
    this._formula = this.constructor.getFormula(this.terms);
}
