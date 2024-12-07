export default {
    register() {
        Hooks.once("setup",  () => {
            dnd5e.documents.Actor5e.prototype.getWealth = getWealth;
        });
    }
}

/**
 * @typedef {object} WealthItemClassObject
 * @property {number} _noType                               Combined value of items in this class without a specific type
 * @property {number} _total                                Total value of all items in this class
 * @property {{[key: string]: number}} [additionalTypes]    Dynamic additional types with their corresponding values
 */

/**
 * @typedef {object} ActorWealth
 * @property {string} denomination                          Currency denomination (default "gp")
 * @property {number} currency                              Total currency value
 * @property {WealthItemClassObject} consumable             Consumable items wealth breakdown
 * @property {WealthItemClassObject} container              Container items wealth breakdown
 * @property {WealthItemClassObject} equipment              Equipment items wealth breakdown
 * @property {WealthItemClassObject} loot                   Loot items wealth breakdown
 * @property {WealthItemClassObject} tool                   Tool items wealth breakdown
 * @property {WealthItemClassObject} weapon                 Weapon items wealth breakdown
 * 
 */

/**
 * 
 * @param {string} [denom = "gp"]        One of the keys of CONFIG.DND5E.currencies
 * @returns {ActorWealth}
 */

/**
 * Calculates the total wealth of an actor, breaking down values by item types and currencies.
 * @memberof dnd5e.documents.Actor5e.prototype
 * @param {string} [denom="gp"] - The denomination to convert all values to.
 *        Must be a key in CONFIG.DND5E.currencies (e.g., "gp", "pp", "sp", "cp", "ep").
 * @returns {ActorWealth} An object detailing the actor's wealth breakdown
 * @throws {Error} If the provided denomination is not valid
 * 
 * @example
 * // Get wealth breakdown in gold pieces (default)
 * const wealthInGP = actor.getWealth();
 * 
 * @example
 * // Get wealth breakdown in platinum pieces
 * const wealthInPP = actor.getWealth("pp");
 */
function getWealth(denom = "gp") {
    const VALID_ITEM_TYPES = ["consumable", "container", "equipment", "loot", "tool", "weapon"];

    const currencies = CONFIG.DND5E.currencies;
    if(!Object.keys(currencies).includes(denom)) throw new Error(`Inavid argument "denom": ${denom}`);

    const valuesByType = {
        denomination: denom,
    };

    for(let type of VALID_ITEM_TYPES) {
        const typeItems = this.itemTypes[type];    //array
        const systemConfigTypeKeys = Object.keys(CONFIG.DND5E[`${type}Types`]);

        //create an object with all system type keys as keys and set their values to 0
        //also has a key "_noType" for all items which don't fall into one of the system types 
        const systemTypeValues = systemConfigTypeKeys.reduce((acc, curr) => {
            acc[curr] = 0;
            return acc;
        }, { _noType: 0 });
        
        for(let item of typeItems) {
            const itemValue = ( item.system.price?.value ?? 0 )                         //get item price
                * ( item.system.quantity ?? 0)                                          //multiply by item quantity
                / ( currencies[item.system.price?.denomination]?.conversion ?? 1 )      //convert to gp
                * currencies[denom].conversion;                                         //convert to chosen denom
            const roundedItemValue = Math.round(itemValue);

            const sysType = item.system.type?.value;
            if(systemConfigTypeKeys.includes(sysType)) {
                systemTypeValues[sysType] += roundedItemValue;
            } else {
                systemTypeValues._noType += roundedItemValue;
            }
        }
        //add a _total value for the sum of all item values of this itemType
        systemTypeValues._total = Object.values(systemTypeValues).reduce((acc, curr) => acc += curr, 0);
        valuesByType[type] = systemTypeValues;
    }
    
    valuesByType.currency = Math.round(
        Object.entries(this.system.currency).reduce((acc, [k, v]) => {
            return acc +=  v                            //take the amount of coins the actor has of a given currency
                / currencies[k].conversion              //divide it by its own conversion factor to conver it to gp
                * currencies[denom].conversion          //multiply it be the conversion factor of the chosen denom to convert it to that
        }, 0)
    );
    return valuesByType;
}

