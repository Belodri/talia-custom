import { TaliaUtils } from "../utils/_utils.mjs";

export default {
    register() {
        //add "Soul-Bound" item property to indicate items that can only be used by the character it's been given to
        CONFIG.DND5E.itemProperties.soulBound = {
            label: "Soul-Bound",
            icon: "systems/dnd5e/icons/svg/items/equipment.svg"
        };
        //add item property "shareable" to all item types
        CONFIG.DND5E.validProperties.consumable.add("soulBound");
        CONFIG.DND5E.validProperties.container.add("soulBound");
        CONFIG.DND5E.validProperties.equipment.add("soulBound");
        CONFIG.DND5E.validProperties.loot.add("soulBound");
        CONFIG.DND5E.validProperties.weapon.add("soulBound");
        CONFIG.DND5E.validProperties.tool.add("soulBound");
        
        // register hook for changing the display of the item card.
        Hooks.on("dnd5e.preDisplayCard", (item, chatData, options) => {
            const validTypes = ["consumable", "container", "equipment", "loot", "weapon", "tool"];
            if(!validTypes.includes(item.type) || !item.system?.properties?.has("soulBound")) return;
        
            //add new labels to chatCard
            chatData.content = TaliaUtils.Helpers.insertListLabels(chatData.content, ["Soul-Bound"]);
        })
    }
    
}