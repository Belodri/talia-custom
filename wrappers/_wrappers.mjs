import { MODULE } from "../scripts/constants.mjs";
import restrictMovement from "./restrictMovement.mjs";
import { Helpers } from "../utils/helpers.mjs";
import getRollDataWrapper from "./getRollDataWrapper.mjs";

/** registers all wrappers */
export function registerWrappers() {
    libWrapper.register(MODULE.ID, 'dnd5e.applications.actor.ActorSheet5e.prototype.maximize', wrap_ActorSheet_maximize, "MIXED");
    libWrapper.register(MODULE.ID, 'dnd5e.canvas.AbilityTemplate.prototype._finishPlacement', wrap_AbilityTemplate_finishPlacement, "WRAPPER");
    libWrapper.register(MODULE.ID, "dnd5e.applications.components.DamageApplicationElement.prototype.getTargetOptions", wrap_DamageApplicationElement_getTargetOptions, "WRAPPER");
    libWrapper.register(MODULE.ID, "CONFIG.Dice.D20Roll.prototype.configureModifiers", wrap_CONFIG_Dice_D20Roll_prototype_configureModifiers, "WRAPPER");
    libWrapper.register(MODULE.ID, "dnd5e.documents.ChatMessage5e.prototype._highlightCriticalSuccessFailure", wrap_dnd5e_documents_ChatMessage5e_prototype__highlightCriticalSuccessFailure, 'OVERRIDE');
    restrictMovement.registerWrapper();
    getRollDataWrapper.registerWrapper();
    libWrapper.register(MODULE.ID, "Actor.prototype.toggleStatusEffect", wrap_Actor_prototype_toggleStatusEffect, "OVERRIDE");
    libWrapper.register(MODULE.ID, "Tile.prototype._refreshMesh", wrap_Tile_prototype__refreshMesh, "WRAPPER");
    libWrapper.register(MODULE.ID, "dnd5e.documents.Actor5e.prototype.applyDamage", listen_Actor5e_prototype_applyDamage, "LISTENER");
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

        if ( canCrit && d20Roll.isCritical ) total.classList.add("critical");
        else if ( canCrit && d20Roll.isFumble ) total.classList.add("fumble");
        else if ( d.options.target && showResult ) {
            if ( d20Roll.total >= d.options.target ) total.classList.add("success");
            else total.classList.add("failure");
        }
        /* 
        if ( d.options.target && showResult ) {
            if ( d20Roll.total >= d.options.target ) total.classList.add("success");
            else total.classList.add("failure");
        }
        if ( canCrit && d20Roll.isCritical ) total.classList.add("critical");
        if ( canCrit && d20Roll.isFumble ) total.classList.add("fumble");
        */
        const icons = document.createElement("div");
        icons.classList.add("icons");
        if ( total.classList.contains("critical") ) icons.append(makeIcon("fa-check"), makeIcon("fa-check"));
        else if ( total.classList.contains("fumble") ) icons.append(makeIcon("fa-xmark"), makeIcon("fa-xmark"));
        else if ( total.classList.contains("success") ) icons.append(makeIcon("fa-check"));
        else if ( total.classList.contains("failure") ) icons.append(makeIcon("fa-xmark"));
        if ( icons.children.length ) total.append(icons);
    }
}

/** 
 * Replaces original function, keeping the functionality the same apart from incorporating a chosenDuration (if given).  
 * Lets the user set the duration of the status effect (in seconds) when the 'Apply Status to Selected Tokens' button of an enricher is shift-clicked.
 * 
 * Had to modify the `applyAction` function in dnd5e source code (in `dnd5e/enrichers`) to get this to work!  
 * Modified function:
 * ```js
 *  async function applyAction(event) {
 *      const target = event.target.closest('[data-action="apply"][data-status]');
 *      const status = target?.dataset.status;
 *      const effect = CONFIG.statusEffects.find(e => e.id === status);
 *      if ( !effect ) return;
 *      event.stopPropagation();
 *
 *      let duration;
 *      if (event.shiftKey) {
 *          const {DialogV2} = foundry.applications.api;
 *
 *          const selectDurationGroup = new foundry.data.fields.NumberField({
 *              label: "Duration in s",
 *              required: true,
 *              min: 1,
 *              integer: true,
 *              nullable: true,
 *              initial: null
 *          }).toFormGroup({}, {name: "duration"}).outerHTML;
 *
 *          const result = await DialogV2.prompt({
 *              window: {
 *                  title: `${effect.name} Duration`
 *              },
 *              content: selectDurationGroup,
 *              modal: true,
 *              rejectClose: false,
 *              ok: {
 *                  label: "Ok",
 *                  callback: (event, button) => new FormDataExtended(button.form).object
 *              }
 *          });
 * 
 *          if (result?.duration > 0) duration = result.duration;
 *      }
 *
 *      for ( const token of canvas.tokens.controlled ) {
 *          await token.actor.toggleStatusEffect(effect.id, {chosenDuration: duration});
 *      }
 *  }
 * ```
 */
async function wrap_Actor_prototype_toggleStatusEffect(statusId, {active, overlay=false, chosenDuration=undefined}={}) {
    const status = CONFIG.statusEffects.find(e => e.id === statusId);
    if ( !status ) throw new Error(`Invalid status ID "${statusId}" provided to Actor#toggleStatusEffect`);
    const existing = [];

    // Find the effect with the static _id of the status effect
    if ( status._id ) {
        const effect = this.effects.get(status._id);
        if ( effect ) existing.push(effect.id);
    }

    // If no static _id, find all single-status effects that have this status
    else {
        for ( const effect of this.effects ) {
            const statuses = effect.statuses;
            if ( (statuses.size === 1) && statuses.has(status.id) ) existing.push(effect.id);
        }
    }

    // Remove the existing effects unless the status effect is forced active
    if ( existing.length ) {
        if ( active ) return true;
        await this.deleteEmbeddedDocuments("ActiveEffect", existing);
        return false;
    }

    // Create a new effect unless the status effect is forced inactive
    if ( !active && (active !== undefined) ) return;
    const effect = await ActiveEffect.implementation.fromStatusEffect(statusId);
    if ( overlay ) effect.updateSource({"flags.core.overlay": true});
    if ( chosenDuration ) effect.updateSource({"duration.seconds": chosenDuration});    //added line
    return ActiveEffect.implementation.create(effect, {parent: this, keepId: true});
}

/**
 * If the flag is set, the tile is rendered invisible for gms only.
 * @this {Tile}
 */
function wrap_Tile_prototype__refreshMesh(wrapped, ...args) {
    const ret = wrapped(...args);
    if(game.user.isGM 
        && this.mesh
        && this.document.flags?.[MODULE.ID]?.gmIgnoreOcclusion
    ) {
        this.mesh.unoccludedAlpha = 0;
    }
    return ret;
}

/**
 * Listener wrapper for Actor5e.prototype.applyDamage
 * @this {Actor5e}
 * @param {DamageDescription[]|number} damages 
 * @param {DamageApplicationOptions} options 
 */
function listen_Actor5e_prototype_applyDamage(damages, options) {
    /**
     * A hook event that fires immediately when Actor#applyDamage is called.
     * @param {Actor5e} actor                       Actor the damage will be applied to.
     * @param {DamageDescription[]|number} damages  Damages to apply.
     * @param {DamageApplicationOptions} options    Damage application options.
     * @function _dnd5e.onCallApplyDamage
     * @memberof hookEvents
     */
    Hooks.callAll("_dnd5e.onCallApplyDamage", this, damages, options);
}
