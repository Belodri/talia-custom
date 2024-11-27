/**
 * @typedef ChatCardButtonConfig
 * @property {string} label         The label displayed on the button.
 * @property {string} [icon]        An optional Font Awesome icon class to display alongside the label (e.g., 'fa-dice').
 * @property {Function} callback    A function to execute when the button is clicked. Receives (item, card) as arguments and can be asynchronous.
 */

/**
 * @typedef ItemRegConfig
 * @property {string} itemName                          The name of the item associated with the buttons.
 * @property {boolean} [isPartialName = false]          If true, matches items containing `itemName` as a substring.
 * @property {ChatCardButtonConfig[]} buttons           An array of `ChatCardButtonConfig` objects defining the buttons.
 * @property {Function} [displayFilter]             Optional function to conditionally render buttons. Receives (item, chatData, options) and if it returns `false`, the buttons are not added. 
 */

/**
 * A utility class for managing interactive buttons on chat cards.
 * This class provides methods to register buttons for specific items, display them dynamically,
 * and handle button interactions.
 */
export default class ChatCardButtons {
    /**
     * A map of item names to their respective registration configurations.
     * Each key is the item name, and the value is an `ItemRegConfig` object.
     * 
     * @type {Map<string, ItemRegConfig>}
     * @private
     */
    static #registered = new Map();

    /**
     * Registers an array of buttons to a chat card for a specific item.
     * 
     * @param {object} options                          The configuration options for button registration
     * @param {string} options.itemName                 The name of the item for which buttons are added
     * @param {boolean} [options.isPartialName=false]   If false, requires an exact item name match, otherwise matches all items containing `itemName` as a substring
     * @param {ChatCardButtonConfig[]} options.buttons  An array of button configurations
     * @param {Function} [displayFilter]            Optional function to conditionally render buttons. Receives (item, chatData, options) and if it explicitly returns `false`, no buttons are added.
     * @throws {Error}                                  If `itemName` is invalid or if `buttons` are improperly defined.
     * @example
     * // Register buttons for a healing spell with exact name matching
     * ChatCardButtons.register({
     *   itemName: "Cure Wounds",
     *   buttons: [
     *     {
     *       label: "Example 1",
     *       icon: "fa-healing",
     *       callback: async (item, card) => {
     *         console.log("Example 1")
     *       }
     *     },
     *     {
     *       label: "Show Details",
     *       icon: "fa-info-circle",
     *       callback: async (item, card) => {
     *         // Display detailed spell information
     *         item.sheet.render(true);
     *       }
     *     }
     *   ]
     * });
     * 
     * // Register buttons for all healing-related items with partial matching and a filter function
     * ChatCardButtons.register({
     *   itemName: "Healing",
     *   isPartialName: true,
     *   buttons: [
     *     {
     *       label: "Log to console",
     *       icon: "fa-search-plus",
     *       callback: async (item, card) => {
     *         console.log(item, card);
     *       }
     *     }
     *   ],
     *   displayFilter: (item, chatData, options) => {
     *      // Show button only for actors with the exact name "Aviana Winterwing"
     *      return item.actor.name === "Aviana Winterwing";
     *   }
     * });
     * 
     * @returns {void}
     */
    static register({itemName, isPartialName = false, buttons, displayFilter = undefined}) {
        const config = {
            itemName, 
            isPartialName, 
            buttons, 
            displayFilter
        };

        // validate config;
        if(!config.itemName || typeof config.itemName !== "string") throw new Error("Invalid itemName argument.");
        if(!config.buttons || !(config.buttons instanceof Array) || !config.buttons.length) throw new Error("Invalid buttons argument.");
        for(const button of config.buttons) {
            if(!button.label || typeof config.label !== "string") throw new Error("Invalid button label.");
            if(!(button.callback instanceof Function)) throw new Error("Invalid button callback.");
        }
        if(displayFilter && typeof displayFilter !== "function") throw new Error("Invalid type: displayFilter has to be a function.");

        // register item
        if(!this.#registered.has(itemName)) {
            this.#registered.set(itemName, {
                itemName, isPartialName, buttons, displayFilter
            });
        } else {
            console.warn(`itemName: "${itemName}" already registered. Skipping button register.`);
        }
    }

    /**
     * Retrieves the registered config for a given item.
     * Matches by full name or partial name depending on the registration configuration.
     * @param {Item} item                               The item object to search for.
     * @returns {ItemRegConfig | null}                  The ItemRegConfig of the item or null if none exists.
     * @private
     */
    static #getItemRegConfigForItem(item) {
        for(const itemRegConfig of this.#registered.values()) {
            if(itemRegConfig.isPartialName ? item.name.includes(itemRegConfig.itemName) : item.name === itemRegConfig.itemName) {
                return itemRegConfig;
            }
        }
        return null;
    }

    /**
     * Activates the callback of a button based on its index.
     * Passes item to the callback.
     * @param {number} buttonIndex                      The index of the button being activated.
     * @param {Item} item                               The item associated with the button.
     * @returns {Promise<void>}                         Resolves after the callback is executed.
     * @private 
     */
    static async #activateButton(buttonIndex, item, card) {
        const itemRegConfig = ChatCardButtons.#getItemRegConfigForItem(item);
        const buttons = itemRegConfig.buttons || null;
        if(!itemRegConfig || !buttons || !buttons.length) return console.warn("No buttons available for activation.");
        
        const buttonConfig = buttons[buttonIndex];
        const fn = buttonConfig.callback ?? null;
        if(!fn || typeof fn !== "function") return;

        try {
            await fn(item, card)
        } catch (err) {
            ui.notifications.error("Execute function error");
            console.error(err);
        }
    }

    /**
     * Handles button click events.
     * Identifies the clicked button and triggers its associated callback.
     *
     * @param {Event} event                            The click event.
     * @private
     */
    static async #buttonEventListener(event) {
        event.preventDefault();
        const button = event.currentTarget;
        button.disabled = true;
        const card = button.closest(".chat-card");
        const actor = card.dataset.tokenId ? 
            (await fromUuid(card.dataset.tokenId)).actor :
            game.actors.get(card.dataset.actorId);
        const item = actor.items.get(card.dataset.itemId);
        const buttonIndex = parseInt(button.dataset.macroButton);

        await ChatCardButtons.#activateButton({buttonIndex, item, card})

        button.disabled = false;
    }

    /**
     * Create the buttons on a chat card when an item is used. Hooks on 'dnd5e.preDisplayCard'.
     * @param {Item} item                   The item being displayed 
     * @param {object} chatData             The data object of the message to be created 
     * @param {ItemUseOptions} options      Options which configure the display of the item chat card.
     */
    static #manageCardButtons(item, chatData, options) {
        const itemRegConfig = ChatCardButtons.#getItemRegConfigForItem(item);

        // If no itemRegConfig found, or filter exists and returns false, abort button creation
        if (!itemRegConfig || 
            (itemRegConfig.displayFilter && itemRegConfig.displayFilter(item, chatData, options) === false)) {
            return;
        }

        const buttons = itemRegConfig.buttons;
        if(!buttons) return;


        const parser = new DOMParser();
        const doc = parser.parseFromString(chatData.content, "text/html");

        let buttonSection = doc.querySelector(".card-buttons");
        if(!buttonSection) {
            buttonSection = doc.createElement("div");
            buttonSection.className = "card-buttons";
            doc.querySelector("div.chat-card").insertBefore(buttonSection, doc.querySelector("section.card-header").nextSibling);
        }
        for (let i = 0; i < buttons.length; i += 1) {
            const config = buttons[i];
            const button = doc.createElement("button");
            button.type = "button";
            button.dataset.action = "talia-button-macro";
            button.dataset.macroButton = i;
            if(config.icon) {
                const icon = doc.createElement("i");
                icon.className = `fas ${config.icon}`;
                button.appendChild(icon);
            }
            const span = doc.createElement("span");
            span.innerText = config.label;
            button.appendChild(span);
            buttonSection.appendChild(button);
        }
        chatData.content = doc.documentElement.innerHTML;
    }

    /**
     * Registers hooks for integrating buttons into chat cards.
     * Hooks include:
     * - `dnd5e.preDisplayCard`: Adds buttons when an item is used.
     * - `renderChatMessage`: Adds click event listeners to buttons after rendering.
     * @returns {void}
     */
    static registerHooks() {
        Hooks.on("dnd5e.preDisplayCard", ChatCardButtons.#manageCardButtons);

        Hooks.on("renderChatMessage", (message, [html]) => {
            html.querySelectorAll("[data-action^='talia-button-macro']").forEach(button => {
                button.addEventListener("click", ChatCardButtons.#buttonEventListener)
            })
        })
    }
}
