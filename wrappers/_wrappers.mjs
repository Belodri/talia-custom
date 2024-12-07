import { MODULE } from "../scripts/constants.mjs";
import restrictMovement from "./restrictMovement.mjs";

/** registers all wrappers */
export function registerWrappers() {
    libWrapper.register(MODULE.ID, "dnd5e.documents.Actor5e.prototype.getRollData", wrap_Actor_getRollData , "WRAPPER");
    libWrapper.register(MODULE.ID, 'dnd5e.applications.actor.ActorSheet5e.prototype.maximize', wrap_ActorSheet_maximize, "MIXED");
    libWrapper.register(MODULE.ID, 'dnd5e.canvas.AbilityTemplate.prototype._finishPlacement', wrap_AbilityTemplate_finishPlacement, "WRAPPER");
    libWrapper.register(MODULE.ID, "dnd5e.applications.components.DamageApplicationElement.prototype.getTargetOptions", wrap_DamageApplicationElement_getTargetOptions, "WRAPPER");
    libWrapper.register(MODULE.ID, "CONFIG.Dice.D20Roll.prototype.configureModifiers", wrap_CONFIG_Dice_D20Roll_prototype_configureModifiers, "WRAPPER");
    libWrapper.register(MODULE.ID, "dnd5e.documents.ChatMessage5e.prototype._highlightCriticalSuccessFailure", wrap_dnd5e_documents_ChatMessage5e_prototype__highlightCriticalSuccessFailure, 'OVERRIDE');
    restrictMovement.registerWrapper();
}

/** Lets other parts of the module hook into talia_addToRollData and mutate the taliaObj which is then appended to rollData */
function wrap_Actor_getRollData(wrapped, ...args) {
    const rollData = wrapped(...args);
    // add an object to the rolldata
    const taliaObj = {};
    Hooks.callAll("talia_addToRollData", this, rollData, taliaObj);
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

/** Replaces the original function, keeping the functionality the same apart from adding saves and checks to the list of rolls that can crit or fumble. */
function wrap_dnd5e_documents_ChatMessage5e_prototype__highlightCriticalSuccessFailure(html) {
    if ( !this.isContentVisible || !this.rolls.length ) return;
    const originatingMessage = game.messages.get(this.getFlag("dnd5e", "originatingMessage")) ?? this;
    const displayChallenge = originatingMessage?.shouldDisplayChallenge;
    const displayAttackResult = game.user.isGM || (game.settings.get("dnd5e", "attackRollVisibility") !== "none");

    /**
     * Create an icon to indicate success or failure.
     * @param {string} cls  The icon class.
     * @returns {HTMLElement}
     */
    function makeIcon(cls) {
        const icon = document.createElement("i");
        icon.classList.add("fas", cls);
        icon.setAttribute("inert", "");
        return icon;
    }

    // Highlight rolls where the first part is a d20 roll
    for ( let [index, d20Roll] of this.rolls.entries() ) {

        const d0 = d20Roll.dice[0];
        if ( (d0?.faces !== 20) || (d0?.values.length !== 1) ) continue;

        d20Roll = dnd5e.dice.D20Roll.fromRoll(d20Roll);
        const d = d20Roll.dice[0];

        const isModifiedRoll = ("success" in d.results[0]) || d.options.marginSuccess || d.options.marginFailure;
        if ( isModifiedRoll ) continue;

        // Highlight successes and failures
        const total = html.find(".dice-total")[index];
        if ( !total ) continue;
        
        /* ORIGINAL

        // Only attack rolls and death saves can crit or fumble.
        const canCrit = ["attack", "death"].includes(this.getFlag("dnd5e", "roll.type"));
        
        */

        //REPLACEMENT START

        // Can crit or fumble: attack rolls; skill/tool/ability checks, saving throws, death saves
        // Possible types for "flags.dnd5e.roll.type": "attack", "damage", "other", "skill", "tool", "ability", "save", "death", "hitDie", "hitPoints"
        const canCrit = ["attack", "skill", "tool", "ability", "save", "death"].includes(this.getFlag("dnd5e", "roll.type"));

        //REPLACEMENT END

        const isAttack = this.getFlag("dnd5e", "roll.type") === "attack";
        const showResult = isAttack ? displayAttackResult : displayChallenge;
        if ( d.options.target && showResult ) {
            if ( d20Roll.total >= d.options.target ) total.classList.add("success");
            else total.classList.add("failure");
        }
        if ( canCrit && d20Roll.isCritical ) total.classList.add("critical");
        if ( canCrit && d20Roll.isFumble ) total.classList.add("fumble");

        const icons = document.createElement("div");
        icons.classList.add("icons");
        if ( total.classList.contains("critical") ) icons.append(makeIcon("fa-check"), makeIcon("fa-check"));
        else if ( total.classList.contains("fumble") ) icons.append(makeIcon("fa-xmark"), makeIcon("fa-xmark"));
        else if ( total.classList.contains("success") ) icons.append(makeIcon("fa-check"));
        else if ( total.classList.contains("failure") ) icons.append(makeIcon("fa-xmark"));
        if ( icons.children.length ) total.append(icons);
    }
}
