export default {
    register() {
        
        
    }
}


/**
 *
 */
function registerHooks() {
    Hooks.on("renderChatMessage", (message, [html]) => {
        html.querySelectorAll("[data-action^='macro-button']").forEach(button => {
            button.addEventListener("click", macroButtonListener);
        });
    });

    Hooks.once("setup", () => {
        Item.prototype.useWithButtons = useWithButtons;
    });
}

class ChatCardButtonManager {
    static itemFlag = "";

    static #registered = new Map();

    static register(itemName, buttonsData) {
        if(!this.#registered.has(itemName)) {
            this.#registered.set(itemName, buttonsData);
        }
    }

    static registerManager() {
        Hooks.on("dnd5e.preUseItem", (item, config, options) => {
            //check if itemName is registered
            //if so, return false and cancel the hook


            //figure out how to make this play nice with ItemHookManager
            //maybe integrate it into that...?
            const buttonsData = this.#registered.get(item.name);
            if(!buttonsData || options.skipItemMacro) { /* empty */ }
        });
    }
}

/**
 *
 */
async function useWithButtons(args, buttons) {
    if(args[0] && args[0].macroButton !== undefined) {
        await buttons[args[0].macroButton].callback();
        return true;
    } else {
        const cardData = await this.use(args[0].config, {...args[0].options, skipItemMacro: true, createMessage: false, skipWildMagic: true});
        await ChatMessage.create(cardAddButtons(cardData, buttons));
        return false;
    }
}

/**
 *
 */
async function macroButtonListener(event) {
    event.preventDefault();
    const button = event.currentTarget;
    button.disabled = true;
    const card = button.closest(".chat-card");
    const actor = card.dataset.tokenId ?
        (await fromUuid(card.dataset.tokenId)).actor :
        game.actors.get(card.dataset.actorId);

    const item = actor.items.get(card.dataset.itemId)
    await item.executeMacro({macroButton: parseInt(button.dataset.macroButton)})
    button.disabled = false
}
