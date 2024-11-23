import { MODULE } from "../scripts/constants.mjs";
export default {
    registerWrapper() {
        libWrapper.register(MODULE.ID, "Token.prototype._canDrag", wrap_Token_prototype__canDrag, "WRAPPER");
    }
}

/** wraps canDrag to disable token dragging if needed; returns boolean */
function wrap_Token_prototype__canDrag(wrapped, ...args) {
    let result = wrapped(...args);
    return allowMovement(this.document) ? result: false;
}

/**
 * Determines if a token is allowed to move based on combat state and permissions.
 * Movement is allowed in the following cases:
 * - The user is a GM
 * - No token is specified
 * - No combat is active or combat hasn't started
 * - The token is the current combatant
 * - The current combatant is a vehicle owned by the user
 * - The token is controlled by the current combatant and not in the combat turn order
 * 
 * If movement is blocked, displays a warning notification with a 2-second cooldown.
 * 
 * @param {Token} token - The token attempting to move
 * @returns {boolean} True if movement is allowed, false otherwise
 */
function allowMovement(token) {
    //always allow movement for GM or undefined token
    // eslint-disable-next-line eqeqeq
    if(game.user.isGM || token == undefined) return true;       

    //always allow movement when there is no combat or it hasn't started yet
    const curCombat = game.combats.active;
    if(!curCombat || !curCombat.started) return true;       

    // always allow movement of the current combatant
    let entry = curCombat.combatant;

    // eslint-disable-next-line eqeqeq
    if(entry.tokenId == token.id) return true;

    // always allow vehicle movement in combat
    if(entry.actor?.type === "vehicle" && entry.actor?.isOwner) return true;

    // Allow the Active Combatant to move all their controlled tokens in a Combat Turn
    let curPermission = entry.actor?.ownership ?? {};
    let tokPermission = token.actor?.ownership ?? {};
    let ownedUsers = Object.keys(curPermission).filter(k => curPermission[k] === 3);    // Get all owners of the token
    const anyDoubleOwner = ownedUsers.some(u => tokPermission[u] === 3 && !game.users?.get(u)?.isGM);    //Does any non-gm user who owns the current combatant also have ownership of the token?
    const tokenNotInCombatTurnOrder = curCombat.turns.every(t => { return t.tokenId !== token.id; });    //Is the token NOT already in the combat turn order? (owned tokens, minions, etc should not be added to combat if they act on the owner's turn)
    if(anyDoubleOwner && tokenNotInCombatTurnOrder) return true;
      

    // If all previous checks failed to return true, return false now and prevent token movement.

    // Show a notification first through, with a timeout so it doesn't get spammed
    if(!(token._movementNotified ?? false)) {
        ui.notifications.warn("Movement blocked: It is currently not your turn.");
        token._movementNotified = true;
        setTimeout(function(token) {
            delete token._movementNotified;
        }, 5000, token);
    }
    return false;
}
