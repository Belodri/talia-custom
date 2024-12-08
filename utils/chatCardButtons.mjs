/**
 * @typedef {object} Variables
 * @property {Event} event
 * @property {ChatMessage} message                  The message that was clicked.
 * @property {object} speaker                       The usual message.speaker object
 * @property {string} speaker.actor
 * @property {string} speaker.alias
 * @property {string | undefined} speaker.scene
 * @property {string | undefined} speaker.token
 * @property {Item} item                            The item associated with the message.
 * @property {Actor} actor                          The actor which is the author of the chat card.
 * @property {Scene} [scene]                        The scene specified in message.speaker
 * @property {Token} [token]                        The token specified in message.speaker
 */

/**
 * @typedef ChatCardButtonConfig
 * @property {string} label                         The label displayed on the button.
 * @property {string} [icon]                        An optional Font Awesome icon class to display alongside the label (e.g., 'fa-dice').
 * @property {(args: Variables) => void} callback   A function to execute when the button is clicked. Can be asynchronous. Receives a {@link Variables} object as its argument.                            
 */

/**
 * @typedef ItemRegConfig
 * @property {string} itemName                          The name of the item associated with the buttons.
 * @property {boolean} [isPartialName = false]          If true, matches items containing `itemName` as a substring.
 * @property {ChatCardButtonConfig[]} buttons           An array of `ChatCardButtonConfig` objects defining the buttons.
 * @property {Function} [displayFilter]                 Optional function to conditionally render buttons. Receives (item, chatData, options) and if it returns `false`, the buttons are not added. 
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
     * The callback function's argument is an object with { event: Event, message: Message, speaker: Speaker, item: Item, actor: Actor, scene: Scene?, token: Token? }
     * @param {object} options                          The configuration options for button registration
     * @param {string} options.itemName                 The name of the item for which buttons are added
     * @param {boolean} [options.isPartialName=false]   If false, requires an exact item name match, otherwise matches all items containing `itemName` as a substring
     * @param {ChatCardButtonConfig[]} options.buttons  An array of button configurations
     * @param {Function} [options.displayFilter]            Optional function to conditionally render buttons. Receives (item, chatData, options) and if it explicitly returns `false`, no buttons are added.
     * @throws {Error}                                  If `itemName` is invalid or if `buttons` are improperly defined.
     * @example
     * // Register buttons for a healing spell with exact name matching
     * ChatCardButtons.register({
     *   itemName: "Cure Wounds",
     *   buttons: [
     *     {
     *       label: "Example 1",
     *       icon: "fa-healing",
     *       callback: async () => {
     *         console.log("Example 1")
     *       }
     *     },
     *     {
     *       label: "Show Details",
     *       icon: "fa-info-circle",
     *       callback: async ({ item }) => {
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
     *       callback: async ({ item, actor, event }) => {
     *         console.log(item, actor, event);
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
        

        // validate config;
        if(!itemName || typeof itemName !== "string") throw new Error("Invalid itemName argument.");
        if(!buttons || !(buttons instanceof Array) || !buttons.length) throw new Error("Invalid buttons argument.");

        // Wrap buttons to ensure consistent callback signature
        const wrappedButtons = buttons.map(button => {
            // Validate individual button
            if (!button.label || typeof button.label !== "string") {
                throw new Error("Invalid button label.");
            }
            if (!(button.callback instanceof Function)) {
                throw new Error("Invalid button callback.");
            }
            return {
                ...button,
                callback: async function(context) {
                    // Wrap the original callback to ensure context is passed
                    const { item, actor, message, scene, token, speaker, event } = context;
                    return button.callback.call(this, { item, actor, message, scene, token, speaker, event });
                }
            };
        });

        // Validate display filter if provided
        if (displayFilter && typeof displayFilter !== "function") {
            throw new Error("Invalid type: displayFilter has to be a function.");
        }


        // Register item configuration
        if(!this.#registered.has(itemName)) {
            this.#registered.set(itemName, {
                itemName, 
                isPartialName, 
                buttons: wrappedButtons, 
                displayFilter
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
     * 
     * @param {Event} event             The originating click event.
     * @returns {Variables}
     */
    static #_getVariables(event) {
        const message = game.messages.get(event.currentTarget.dataset.messageId);
        const speaker = message.speaker;
        const item = message.getAssociatedItem();
        const actor = item.actor;
        const scene = game.scenes.get(message.speaker.scene) ?? null;
        const token = scene?.tokens.get(message.speaker.token) ?? null;
        return {event, message, item, actor, scene, token, speaker}
    }

    /**
     * 
     * @param {number} buttonIndex      The index of the button being activated.
     * @param {Item} item               The item associated with the message.
     * @returns {Function | null}       The registered callback function or null.
     */
    static #getButtonFunc(buttonIndex, item) {
        const itemRegConfig = (() => {
            for(let config of this.#registered.values()) {
                if(config.isPartialName ? item.name.includes(config.itemName) : item.name === config.itemName) {
                    return config;
                }
            }
            return null;
        })();
        if(!itemRegConfig) {
            console.warn(`No registered config found for item: ${item.name}`);
            return null;
        }

        const buttons = itemRegConfig.buttons || null;
        if(!buttons?.length) {
            console.warn("No buttons available for activation.");
            return null;
        }

        const buttonConfig = buttons[buttonIndex];
        const func = buttonConfig?.callback ?? null;
        if(typeof func !== "function") {
            console.warn(`No callback function registered for buttonIndex: ${buttonIndex}.`);
            return null;
        }

        return func;
    }

    /**
     * Handles button click events.
     * Identifies the clicked button and triggers its associated callback.
     *
     * @param {Event} event                            The click event.
     * @returns {Promise<void>}
     * @private
     */
    static async #buttonEventListener(event) {
        event.preventDefault();
        const button = event.currentTarget;
        button.disabled = true;

        try {
            // Retrieve contextual variables
            const variables = ChatCardButtons.#_getVariables(event);

            // Find the appropriate button configuration
            const callback = ChatCardButtons.#getButtonFunc(
                parseInt(button.dataset.macroButton), 
                variables.item
            );
            // If no callback is found, exit early
            if (!callback) return;

            // Execute the callback with the full context
            await callback(variables);
        } catch (err) {
            // Handle and log any errors during execution
            ui.notifications.error("Execute function error");
            console.error(err);
        } finally {
            // Re-enable the button
            button.disabled = false;
        }
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
                button.dataset.messageId = message.id;
                button.addEventListener("click", ChatCardButtons.#buttonEventListener)
            })
        })
    }
}
