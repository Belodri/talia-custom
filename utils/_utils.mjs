import { TaliaCustomAPI } from "../scripts/api.mjs";
import { Helpers } from "./helpers.mjs";
import { ItemHookManager } from "./ItemHookManager.mjs";
import sizeChange from "./sizeChange.mjs";
import spellbookManager from "./spellbookManager.mjs";
import utilHooks from "./utilHooks.mjs";
import ChatCardButtons from "./chatCardButtons.mjs";
import _methodAdditions from "./methodAdditions/_methodAdditions.mjs";
import sceneEffects from "./sceneEffects.mjs";
import TaliaDate from "./TaliaDate.mjs";

export default {
    registerSection() {
        utilHooks.register();
        spellbookManager.register();
        TaliaCustomAPI.add(TaliaUtils, "none");
        ItemHookManager.registerManager();
        sizeChange.regsiter();
        extendStringClass();
        ChatCardButtons.registerHooks();
        _methodAdditions.registerSection();
        sceneEffects.register();
    }
}

export const TaliaUtils = {
    Helpers,
    TaliaDate
}

/**
 *
 */
function extendStringClass() {
    String.prototype.toCamelCase = function() {
        return this
            // Insert a space between lowercase and uppercase letters to handle camelCase or PascalCase
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            // Split the string by non-alphanumeric characters or inserted spaces
            .split(/[^a-zA-Z0-9]+/)
            // Capitalize the first letter of each word except the first one
            .map((word, index) => 
                index === 0 
                    ? word.toLowerCase()
                    : word.charAt(0).toUpperCase() + word.slice(1)
            )
            // Join the words back together
            .join('');
    }
}
