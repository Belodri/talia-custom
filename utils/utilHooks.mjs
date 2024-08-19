export default {
    register() {
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
}