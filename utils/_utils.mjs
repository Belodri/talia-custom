import { TaliaCustomAPI } from "../scripts/api.mjs";
import { Crosshairs } from "./crosshairs.mjs";
import { Helpers } from "./helpers.mjs";
import { ItemHookManager } from "./ItemHookManager.mjs";
import spellbookManager from "./spellbookManager.mjs";
import utilHooks from "./utilHooks.mjs";

export default {
    registerSection() {
        utilHooks.register();
        spellbookManager.register();
        TaliaCustomAPI.add(TaliaUtils, "none");
        ItemHookManager.registerManager();
    }
}

export const TaliaUtils = {
    Crosshairs,
    Helpers,
}