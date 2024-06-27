import { MODULE } from "./constants.mjs";

/**
 * TaliaCustomAPI class to manage adding methods to a global API object.
 */
export class TaliaCustomAPI {
    /**
     * Sets up the global API object.
     */
    static _setup() {
        globalThis[MODULE.globalThisName] = {};
    }

    /**
     * Retrieves the global API object.
     * @returns {Object} The global API object.
     */
    static get() {
        return globalThis[MODULE.globalThisName];
    }

    /**
     * Adds methods to the global API object. The methods can be nested within objects.
     * @param {Object} methodsObject - An object containing methods and nested objects with methods to add to the API.
     */
    static add(methodsObject) {
        const api = TaliaCustomAPI.get();
        foundry.utils.mergeObject(api, methodsObject);
    }
}