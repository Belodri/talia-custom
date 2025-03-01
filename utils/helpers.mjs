export class Helpers {
    static SECONDS = {
        IN_ONE_MINUTE: 60,
        IN_TEN_MINUTES: 600,
        IN_ONE_HOUR: 3600,
        IN_SIX_HOURS: 21600,
        IN_EIGHT_HOURS: 28800,
        IN_ONE_DAY: 86400,
        IN_ONE_WEEK: 604800
    }

    /**
     * Retrieves an array of user IDs for all active players.
     * @returns {string[]} An array of user IDs of all active players.
     */
    static getUserIdsArray() {
        //get user _id from all active users
        return game.users.players.filter(user => user.active).map(user => user._id);
    }

    /**
     * Returns the actor pointed to by the uuid, or tokenDocument.actor if the uuid points to a tokenDocument.
     * @param {string} uuid The uuid of the actor
     * @returns {Actor} Actor | null
     */
    static getActorByUuid(uuid) {
        let doc = fromUuidSync(uuid);
        if(doc instanceof CONFIG.Token.documentClass) doc = doc.actor;
        if(doc instanceof CONFIG.Actor.documentClass) return doc;
        return null;
    }

    /**
     * Gets the assigned actors of all users currently online. 
     * If the DM does not have an assigned actor, it will not include the DM's characters.
     * @returns {Actor5e[]} Array of active user's characters
     */
    static getActiveUserCharacters() {
        //get active users
        /** @type {User5e[]} */
        return game.users.players.filter(user => user.active && user.character).map(user => user.character);
    }

    /**
     * Consumes a specified amount of an item, updating its quantity or uses accordingly. Optionally also deletes the item upon reaching 0 quantity.
     * If the item doesn't have uses, only consumes quantity.
     * If the item has uses, it will decrement the uses first and decrease the quantity only when the uses are exhausted.
     * The consumeCost parameter determines how much is consumed with each step.
     * 
     * @param {Item5e} item - The item to be consumed.
     * @param {number} amountToConsume - The amount of the item to consume.
     * @param {number} [consumeCost=1] - The cost per step for consuming the item.
     * @param {boolean} deleteOnEmpty - Should the item be deleted if it's quantity reaches 0?
     * @returns {Promise|null} A promise that resolves when the item's quantity or uses have been updated, or null if not enough uses & quantity are available to be consumed.
     */
    static async consumeItem(item, amountToConsume, consumeCost = 1, deleteOnEmpty = false) {
        const actualConsume = amountToConsume * consumeCost;
        const quantity = item.system.quantity;

        if(!item.hasLimitedUses) {  //item does not have uses, only quantity
            if(quantity < actualConsume) return null;
            const quant = Math.max(quantity - actualConsume, 0);
            if(quant === 0 && deleteOnEmpty === true) {
                return item.delete();
            } else {
                return item.update({"system.quantity": quant});
            }

        } else {    //item has uses
            const usesMax = item.system.uses.max;
            let usesValue = item.system.uses.value;
            let quant = quantity;

            const maxPossibleUses = usesValue + ( usesMax * (quant - 1) );  //how many uses are possible in total
            if(maxPossibleUses < actualConsume) return null;

            for(let i = 0; i < actualConsume; i++) {
                usesValue--;
                if(!usesValue) {
                    usesValue = usesMax;
                    quant--;
                }
            }
            const quantNew = Math.max(quant, 0);
            if(quantNew === 0 && deleteOnEmpty === true) {
                return item.delete();
            } else {
                return item.update({"system.uses.value": usesValue, "system.quantity": quantNew});
            }
        }
    }

    /**
     * Displays only the most basic item info in a chat message.
     * @param {Item5e} item 
     * @param {boolean} [createMessage=true] If false, returns the chatData without creating the message itself.
     * @returns {ChatMessage}
     */
    static async displayItemInfoOnly(item, createMessage = true) {
        const token = item.actor.token;
        const templateData = {
            hasButtons: false,
            actor: item.actor,
            config: CONFIG.DND5E,
            tokenId: token?.uuid || null,
            item: item,
            data: await item.system.getCardData(),
            labels: item.labels,
            consumeUsage: false,
            consumeResource: false
        };
        const html = await renderTemplate("systems/dnd5e/templates/chat/item-card.hbs", templateData);
        // Create the ChatMessage data object
        const chatData = {
            user: game.user.id,
            content: html,
            speaker: ChatMessage.getSpeaker({actor: item.actor, token}),
            flags: {"core.canPopout": true}
        };

        if(!createMessage) {
            return chatData;
        }
        return await ChatMessage.implementation.create(chatData);
    }


    // TODO Replace this with an 'inspect' button on the character sheet
    /**
     * Prompts the user to choose whether to use an item or just display it in chat.
     * If the user chooses to display the item, it will be displayed in chat.
     * @param {Item5e} item - The item to be used or displayed.
     * @returns {Promise<boolean>} - Returns true if the user chooses to use the item, false otherwise.
     */
    static async promptItemUse(item) {
        const result = await Dialog.wait({
            content: `Use the item or only display it to chat?`,
            buttons: {
                use: {label: "Use", callback: () => ( "use")},
                display: {label: "Display", callback: () => ( "display")},
            },
            close: () => ( null)
        });

        if(result === "use") return true;
        else if(result === "display") await Helpers.displayItemInfoOnly(item);
        return false;
    }

    /**
     * Draws a number of items from a table and grants them to an actor.
     *
     * @param {Actor5e} actor - The actor to which the items will be granted.
     * @param {string} tableUuid - The UUID of the table to draw items from.
     * @param {object} [options] - Optional parameters.
     * @param {number} [options.drawsNum=1] - The number of draws to make. Will be overwritten if fractionOfTableSize is provided.
     * @param {number} [options.fractionOfTableSize] - A fraction (0 to 1) or a percentage (1 to 100) representing the portion of the table to draw from.
     * @returns {Promise<Array<Item5e>>} - A promise that resolves to the array of created items, or null if the table or actor is missing, or fractionOfTableSize is invalid.
     */
    static async rollTableGrantItems(actor, tableUuid, {drawsNum = 1, fractionOfTableSize = undefined} = {}) {
        const table = await fromUuid(tableUuid);
        if (!table || !actor) {
            ui.notifications.warn("Missing table or actor.");
            return null;
        }

        if(typeof fractionOfTableSize === "number") {
            if(fractionOfTableSize >= 0 && fractionOfTableSize <= 1) {
                // If it's a number between 0 and 1, treat it as a fraction
                const totalItemsNum = table.results.size;
                drawsNum = Math.ceil(totalItemsNum * fractionOfTableSize);
            } else if(fractionOfTableSize > 1 && fractionOfTableSize <= 100) {
                // If it's a number between 1 and 100, treat it as a percentage
                const totalItemsNum = table.results.size;
                drawsNum = Math.ceil(totalItemsNum * (fractionOfTableSize / 100));
            } else {
                ui.notifications.warn("fractionOfTableSize is not a valid fraction.");
                return null;
            }
        }
        
        const draw = await table.drawMany(drawsNum);
        const promises = draw.results.map(i => {
            const key = i.documentCollection;
            const id = i.documentId;
            const uuid = `Compendium.${key}.Item.${id}`;
            return key === "Item" ? game.items.get(id) : fromUuid(uuid);
        });
        const items = await Promise.all(promises);
        const itemData = items.map(item => game.items.fromCompendium(item));

        //'stack' items of the same name
        const combinedItemsArray = Object.values(itemData.reduce((acc, item) => {
            if (acc[item.name]) {
            // If item with same name already exists, add the quantities
                acc[item.name].system.quantity += item.system.quantity;
            } else {
            // Otherwise, add new item to the accumulator
                acc[item.name] = { ...item };
            }
            return acc;
        }, {}));

        return actor.createEmbeddedDocuments("Item", combinedItemsArray);
    }

    /**
     * Grants items to an actor, stacking them if applicable.
     * @param {Actor} actor 
     * @param {object[]} itemDataArray          An array of itemData objects.
     * @param {object} [options]   
     * @param {boolean} [options.stack=true]    Should the granted items be stacked with other, items of the same name in the actor's inventory? 
     */
    static async grantItems(actor, itemDataArray, { stack=true }={}) {
        const promises = [];
        const create = [];
        for(const itemData of itemDataArray) {
            const /** @type {Item} */ existing = actor.items.find(i => i.name === itemData.name);

            // Stack existing items of the same name 
            if( existing 
                && stack 
                && foundry.utils.hasProperty(existing, "system.quantity")
                && foundry.utils.hasProperty(itemData, "system.quantity") 
            ) {
                const newQuant = existing.system.quantity + itemData.system.quantity;
                promises.push( existing.update({"system.quantity": newQuant}) );
            } else {
                create.push( itemData );
            }
        }
        if(create.length) promises.push( actor.createEmbeddedDocuments("Item", create) );
        return Promise.all(promises);
    }

    /**
     * Inserts new list items into an HTML string containing a ul element with class "card-footer pills unlist".
     * Each new item is added only if its label doesn't already exist in the list.
     * 
     * @param {string} htmlString - The original HTML string containing the ul element.
     * @param {string[]} newLabels - An array of strings to be added as new list item labels.
     * @returns {string} The modified HTML string with new list items added.
     */
    static insertListLabels(htmlString, newLabels) {
        // Create a temporary DOM element to parse the HTML string
        const tempElement = document.createElement('div');
        tempElement.innerHTML = htmlString;

        // Find the target ul element
        const ulElement = tempElement.querySelector('ul.card-footer.pills.unlist');

        if (ulElement) {
            // Get existing labels
            const existingLabels = Array.from(ulElement.querySelectorAll('li span.label'))
                .map(span => span.textContent.trim().toLowerCase());

            // Process each new label
            newLabels.forEach(label => {
                const normalizedLabel = label.trim().toLowerCase();
                
                // Check if the label already exists
                if (!existingLabels.includes(normalizedLabel)) {
                    // Create a new li element
                    const newLi = document.createElement('li');
                    newLi.className = 'pill pill-sm';
                    
                    // Create a new span element
                    const newSpan = document.createElement('span');
                    newSpan.className = 'label';
                    newSpan.textContent = label.trim();
                    
                    // Append the span to the li, and the li to the ul
                    newLi.appendChild(newSpan);
                    ulElement.appendChild(newLi);
                    
                    // Add to existing labels to prevent duplicates
                    existingLabels.push(normalizedLabel);
                }
            });

            // Return the modified HTML as a string
            return tempElement.innerHTML;
        } else {
            // If the target ul is not found, return the original string
            console.warn('Target ul not found');
            return htmlString;
        }
    }

    /**
     * Requests a roll to be made and sends the result as a chat message.
     * 
     * @param {object} options              Options for the roll request.
     * @param {string} options.type         The type of roll (e.g., "check", "save", "skill", "tool").
     * @param {string} [options.ability]    The ability used for the roll.
     * @param {string} [options.skill]      The skill used for the roll.
     * @param {string} [options.tool]       The name of the tool type (e.g., "weaver"). Requires `ability` to be set.
     * @param {number} [options.dc]         The difficulty class (DC) for the roll.
     * @param {boolean} [options.hideDC=true] Whether the DC should be hidden.
     * @param {object} [options.messageOptions] Additional options merged into the final message data.
     * @returns {Promise<ChatMessage>}      A promise that resolves when the chat message is created.
     */
    static async requestRoll({
        type,      
        ability,    
        skill,
        tool,   
        dc,     
        hideDC = true,   
        messageOptions, 
    } = {}) {
        const chatData = foundry.utils.mergeObject({
            user: game.user.id,
            flavor: "Roll Request",
            speaker: ChatMessage.implementation.getSpeaker({user: game.user.id}),
        }, messageOptions);

        const tDataset = { type, ability, skill, tool, dc, hideDC };

        const templateData = {
            buttonLabel: dnd5e.enrichers.createRollLabel({...tDataset, format: "short", icon: true,}),
            hiddenLabel: dnd5e.enrichers.createRollLabel({...tDataset, format: "short", icon: true, hideDC: true,}),
            dataset: {...tDataset, action: "rollRequest"},
        }
        chatData.content = await renderTemplate("systems/dnd5e/templates/chat/request-card.hbs", templateData);

        return ChatMessage.implementation.create(chatData);
    }

    /**
     * Helper function to check if a roll is successful against it's own target value.
     * @param {D20Roll} roll A roll instance
     * @returns {boolean | null} True if the roll is a success, fail if not, null if there is no target value.
     */
    static isRollSuccess(roll) {
        if(roll.isCritical) return true;
        if(roll.isFumble) return false;
        if(typeof roll.options.targetValue !== "number") return null;
        if(roll.total >= roll.options.targetValue) return true;
        else return false;
    }

    /**
     * Generates a random integer between (and including) min and max.
     * That means the return value could equal min or max.
     * @param {number} min (gets ceiled if not an integer)
     * @param {number} max (gets floored if not an integer)
     * @returns {number} Integer
     */
    static getRandomInt(min, max) {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        return Math.floor( ( Math.random() * (maxFloored - minCeiled + 1) ) + minCeiled); // The maximum is inclusive and the minimum is inclusive
    }

    /**
     * 
     * @param {Item5e} item 
     * @returns {boolean} true if the item is attuned if it requires attunement, true if the item does not require attunement, false otherwise
     */
    static checkAttunement(item) {
        if((item.system?.attunement === "required" && item.system.attuned) || item.system?.attunement !== "required") {
            return true;
        } else return false;
    }

    static async fallDamageDialog() {
        const {DialogV2} = foundry.applications.api;
        const {NumberField} = foundry.data.fields;

        const selectFallDistanceField = new NumberField({
            label: "Fall Distance (in ft)",
            required: true,
            min: 1,
            integer: true,
        }).toFormGroup({},{name: "fallDistance"}).outerHTML;

        const result = await DialogV2.prompt({
            window: { title: "Fall Damage" },
            content: selectFallDistanceField,
            rejectClose: false,
            ok: {
                callback: (event, button) => new FormDataExtended(button.form).object,
            }
        });
        if(!result?.fallDistance || result.fallDistance < 10) return;

        //round down to nearest multiple of 10
        const roundedDist = Math.floor(result.fallDistance / 10) * 10;
        
        // fall damage = 1d6 bludgeoning damage for each 10ft fall distance
        const diceNum = roundedDist / 10;

        const damageRoll = await dnd5e.dice.damageRoll({
            rollConfigs: [{
                parts: [`${diceNum}d6`],
                type: "bludgeoning",
            }],
            fastForward: true,
            rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
            messageData: {
                speaker: {
                    alias: "Environment"
                }
            },
            flavor: `Fall Distance: ${result.fallDistance}ft`
        });
    }

    /**
     * Opens a journal on the given page.
     * @param {string} journalName 
     * @param {string} pageName 
     */
    static openJournalPageView(journalName, pageName) {
        const jEntry = game.journal.getName(journalName);
        const jPage = jEntry?.pages?.getName(pageName);
        if(jPage) return jEntry.sheet.render(true, {pageId: jPage.id});
    }

    /**
     * Returns an array of a number of unique, random elements from an array.
     * The passed array is not modified.
     * @param {any[]} arr 
     * @param {number} [count=1]    The number of elements to be returned. 
     *                              Cannot be smaller than 1 or larger than `arr.length`, otherwise an error is thrown.
     * @returns {any[]}             An array of the randomly chosen elements.
     */
    static getRandomArrayElements(arr, count = 1) {
        if (!Array.isArray(arr)) throw new TypeError("First argument must be an array.");
        if (typeof count !== "number" || count < 1 || count > arr.length) {
            throw new RangeError("Count must be between 1 and the length of the array.");
        }

        const results = [];
        const seen = new Set();

        while (results.length < count) {
            const randIndex = Math.floor(Math.random() * arr.length);
            if (!seen.has(randIndex)) {
                seen.add(randIndex);
                results.push(arr[randIndex]);
            }
        }

        return results;
    }

    /**
     * Returns an array of randomly selected keys from a weighted object.
     * Keys may repeat based on their weights.
     * @param {object} weights      An object where keys are items and values are their weights.
     * @param {number} count        The number of keys to return.
     * @returns {string[]}          An array of randomly selected keys, respecting weights.
     */
    static getWeightedRandomKeys(weights, count) {
        if (typeof count !== "number" || count < 1) {
            throw new RangeError("Count must be a positive number.");
        }

        const entries = Object.entries(weights);
        const totalWeight = entries.reduce((sum, [_, weight]) => sum + weight, 0);

        const result = [];

        for (let i = 0; i < count; i++) {
            let random = Math.random() * totalWeight;

            for (const [key, weight] of entries) {
                if (random < weight) {
                    result.push(key);
                    break;
                }
                random -= weight;
            }
        }

        return result;
    }
}

