export default {
    register() {
        registerCategories();
    }
}

/**
 *
 */
function registerCategories() {
    CONFIG.DND5E.lootTypes.livestock = {label: "Livestock"};
    CONFIG.DND5E.lootTypes.wood = {label: "Logs and Lumber"};
    CONFIG.DND5E.lootTypes.stone = {label: "Stone"};
    CONFIG.DND5E.consumableTypes.exoticCurrency = {label: "Exotic Currency"}
}
