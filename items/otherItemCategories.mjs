export default {
    register() {
        registerLootCategories();
    }
}

/**
 *
 */
function registerLootCategories() {
    CONFIG.DND5E.lootTypes.livestock = {label: "Livestock"};
    CONFIG.DND5E.lootTypes.wood = {label: "Logs and Lumber"};
    CONFIG.DND5E.lootTypes.stone = {label: "Stone"};
    CONFIG.DND5E.lootTypes.exoticCurrency = {label: "Exotic Currency"};
}
