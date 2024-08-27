export default {
    register() {
        registerEquipAttuneHook();
        registerHideChatMessageHook();
    }
}

/**
 * custom on equip/unequip and on attune/unattune hooks
 */
function registerEquipAttuneHook() {
    Hooks.on("updateItem", (item, data, options, userId) => {
        if(userId !== game.userId || !item.actor) return;
        //equip hooks
        if(data.system?.equipped === true) Hooks.callAll("talia-custom.postEquip", item, data, options);
        else if(data.system?.equipped === false) Hooks.callAll("talia-custom.postUnEquip", item, data, options);

        //attune hooks
        if(data.system?.attuned === true) Hooks.callAll("talia-custom.postAttune", item, data, options);
        else if(data.system?.attuned === false) Hooks.callAll("talia-custom.postUnAttune", item, data, options);
    });
}

/**
 * Sets the display style of a chat message to "none" if the message has:
 * - flags.talia-custom.hideFromSelf = true
 * - user is not a gm
 * - user is the author of the message 
 */
function registerHideChatMessageHook() {
    Hooks.on("renderChatMessage", (msg, [html], msgData) => {
        if(msg.flags?.["talia-custom"]?.hideFromSelf === true && !game.user.isGM && msg.author?.id === game.userId) {
            html.style.display = "none";
        }
    });
}