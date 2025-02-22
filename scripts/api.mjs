import { MODULE } from "./constants.mjs";

/**
 * TaliaCustomAPI class to manage adding classes, objects, and others to a global API object.
 */
export class TaliaCustomAPI {
    static CATEGORIES = ["none", "ItemMacros", "EffectMacros", "GmMacros", "Macros", "RegionMacros", "Other"];

    /**
     * Sets up the global API object.
     */
    static _setup() {
        globalThis[MODULE.globalThisName] = {};

        TaliaCustomAPI.CATEGORIES.forEach(category => {
            if(category !== "none") {
                globalThis[MODULE.globalThisName][category] = {};
            }
        });
    }

    /**
     * Retrieves the global API object.
     * @returns {object} The global API object.
     */
    static get() {
        return globalThis[MODULE.globalThisName];
    }

    /**
     * Adds methods to the global API object. The methods can be nested within objects.
     * Allowed categories are: "none", "ItemMacros", "EffectMacros", "GmMacros", "Macros", "RegionMacros", "Other"
     * @param {object} methodsObject - An object containing methods and nested objects with methods to add to the API.
     * @param {string} [category="none"] - The category under which to add the methods. 
     *                                     If "none", methods are added to the root of the API object.
     * 
     * @throws {Error} If an invalid category is provided.
     * 
     * @example
     * // Adding methods to the root of the API
     * TaliaCustomAPI.add({
     *   sayHello: () => console.log("Hello!"),
     *   math: {
     *     add: (a, b) => a + b,
     *     subtract: (a, b) => a - b
     *   }
     * });
     * 
     * // Adding methods to the 'ItemMacros' category
     * TaliaCustomAPI.add({
     *   applyDamage: (target, amount) => { },
     *   healTarget: (target, amount) => {  }
     * }, "ItemMacros");
     * 
     * // Adding methods to the 'GmMacros' category. GmMacros can never have non-optional arguments.
     * TaliaCustomAPI.add({
     *   spawnMonster: () => {  },
     *   changeWeather: () => {  }
     * }, "GmMacros");
     */
    static add(methodsObject, category = "none") {
        if (!TaliaCustomAPI.CATEGORIES.includes(category)) {
            throw new Error(`Invalid category: ${category}. Must be one of ${TaliaCustomAPI.CATEGORIES.join(", ")}`);
        }

        const api = TaliaCustomAPI.get();
        if(category === "none") {
            foundry.utils.mergeObject(api, methodsObject);
        } else {
            // Ensure the category object exists
            if (!api[category]) {
                api[category] = {};
            }
            // Merge the new methods into the category object
            foundry.utils.mergeObject(api[category], methodsObject);
        }
    }
}
