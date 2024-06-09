export const _foundryHelpers = {
    getActorByUuid,
    getActiveUserCharacters,
    consumeItem,
    displayItemWithoutEffects,
    SECONDS: {
        IN_ONE_MINUTE: 60,
        IN_TEN_MINUTES: 600,
        IN_ONE_HOUR: 3600,
        IN_SIX_HOURS: 21600,
        IN_EIGHT_HOURS: 28800,
        IN_ONE_DAY: 86400,
        IN_ONE_WEEK: 604800
    },
};

/**
 * Gets the actor object by the actor UUID
 * @param {string} uuid - the actor UUID
 * @returns {Actor5e} the actor that was found via the UUID
 */
function getActorByUuid(uuid) {
    const actorToken = fromUuidSync(uuid);
    const actor = actorToken?.actor ? actorToken?.actor : actorToken;
    return actor;
}

/**
 * Gets the assigned actors of all users currently online. 
 * If the DM does not have an assigned actor, it will not include the DM's characters.
 * @returns {Actor5e[]} Array of active user's characters
 */
function getActiveUserCharacters() {
    //get active users
    /** @type {User5e[]} */
    const users = game.users.players.filter(user => user.active);
    return users.map((user) => {
        if(user.character) return user.character;
    });
}

/**
 * Consumes a specified amount of an item, updating its quantity or uses accordingly.
 * If the item doesn't have uses, only consumes quantity.
 * If the item has uses, it will decrement the uses first and decrease the quantity only when the uses are exhausted.
 * The consumeCost parameter determines how much is consumed with each step.
 * 
 * @param {Item5e} item - The item to be consumed.
 * @param {number} amountToConsume - The amount of the item to consume.
 * @param {number} [consumeCost=1] - The cost per step for consuming the item.
 * @returns {Promise|null} A promise that resolves when the item's quantity or uses have been updated, or null if not enough uses & quantity are available to be consumed.
 */
async function consumeItem(item, amountToConsume, consumeCost = 1) {
    const actualConsume = amountToConsume * consumeCost;
    const quantity = item.system.quantity;

    if(!item.hasLimitedUses) {  //item does not have uses, only quantity
        if(quantity < actualConsume) return null;
        const quant = Math.max(quantity - actualConsume, 0);
        return item.update({"system.quantity": quant});

    } else {    //item has uses
        const usesMax = item.system.uses.max;
        let usesValue = item.system.uses.value;
        let quant = quantity;

        const maxPossibleUses = usesValue + usesMax * (quant - 1);  //how many uses are possible in total
        if(maxPossibleUses < actualConsume) return null;

        for(let i = 0; i < actualConsume; i++) {
            usesValue--;
            if(!usesValue) {
                usesValue = usesMax;
                quant--;
            }
        }
        return item.update({"system.uses.value": usesValue, "system.quantity": Math.max(quant, 0)});
    }
}

/**
 * Displays an item in chat as if it had no active effects.
 * @param {Item5e} item 
 */
function displayItemWithoutEffects(item) {
    const itemData = item.toObject();
    itemData.effects.filter(u => u.name = "");  
    item.displayCard({"flags.dnd5e.itemData": itemData});
}