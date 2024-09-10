export default {
    register() {
        registerLootCategories();
    }
}

function registerLootCategories() {
    CONFIG.DND5E.lootTypes.tradeGood = {
        label: "Trade Good",
        subtypes: {
            livestock: "Livestock"
        }
    }
}