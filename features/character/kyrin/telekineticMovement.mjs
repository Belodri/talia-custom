import { ItemHookManager } from "../../../utils/ItemHookManager.mjs";

export default {
    register() {
        Hooks.on("dnd5e.preUseItem", telekineticMovementHook);
    }
}

/**
 * 
 * @param {Item} item 
 * @param {object} config 
 * @param {object} options 
 * @returns {false}
 */
function telekineticMovementHook(item, config, options) {
    if(item.name !== "Telekinetic Movement") return;
    if(options.skipItemMacro) return;

    (async() => {
        const newConfig = {...config};
        const newOptions = {...options, skipItemMacro: true};

        newConfig.consumeResource = item.system.uses.value === 0 ? true : null;
        newConfig.consumeUsage = item.system.uses.value !== 0 ? true : null;
        
        if(newConfig.consumeResource) newOptions["flags.dnd5e.use.consumedUsage"] = true;
        else newOptions["flags.dnd5e.use.consumedResource"] = true;

        await item.use(newConfig, newOptions);
    })();
    return false;
}

