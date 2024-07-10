import { TaliaCustomAPI } from "../scripts/api.mjs";

export default {
    _onInit() {
        CONFIG.DND5E.rules.alchemy = "Compendium.talia-custom.rules.JournalEntry.ZkD6R9Ye9Sr77OCt.JournalEntryPage.Z0XP4RuNUbFSIMVN";
        CONFIG.DND5E.lootTypes.ingredient = {label: "Ingredient" };
        CONFIG.DND5E.lootTypes.ingredient.subtypes = { 
            herb: "Herb",
            bodyPart: "Body Part"
        };
    },
    _onSetup() {
        TaliaCustomAPI.add({
        });
    }
}