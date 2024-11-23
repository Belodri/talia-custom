

export class ItemHookManager {
    /**
     * A map of itemNames with their respective function
     * @type {Map<string, Function>}
     */
    static #registered = new Map();

    static register(itemName, fn) {
        if(!this.#registered.has(itemName)) {
            this.#registered.set(itemName, fn);
        }
    }

    static registerManager() {
        Hooks.on("dnd5e.preUseItem", (item, config, options) => {
            //check if itemName is registered
            //if so, return false to cancel the hook

            const fn = this.#registered.get(item.name);
            if(!fn || typeof fn !== "function" ||options.skipItemMacro === true) return true;
            
            ItemHookManager.executeFunction(fn, item, config, options).then((result) => {
                if(result === true) {
                    options.skipItemMacro = true;
                    item.use(config, options);
                }
            });
            return false;
        });
    }

    /**
     * 
     * @param {Function} fn 
     * @param {Item5e} item 
     * @param {*} config 
     * @param {*} options 
     * @returns {Promise<any>}  return true to use the item normally
     */
    static async executeFunction(fn, item, config, options) {
        
        const speaker = ChatMessage.implementation.getSpeaker({actor: item.actor});
        const actor = item.actor ?? game.actors.get(speaker.actor);
        const token = canvas.tokens?.get(speaker.token);
        const character = game.user.character;
        
        try {
            return await fn(item, speaker, actor, token, character);
        } catch (err) {
            ui.notifications.error("Execute function error");
            console.error(err);
        }
    }

    
}
