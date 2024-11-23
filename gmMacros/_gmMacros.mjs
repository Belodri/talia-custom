import { TaliaCustomAPI } from "../scripts/api.mjs";
import playerInspirations from "./playerInspirations.mjs"
import pcItemsToJSON from "./pcItemsToJSON.mjs"
import monsterAttackDescriptionGen from "./monsterAttackDescriptionGen.mjs";
import restManager from "./restManager.mjs"


export default {
    registerSection() {
        TaliaCustomAPI.add({displayChoices: displayGmMacrosChoices}, "GmMacros");

        playerInspirations.register();
        pcItemsToJSON.register();
        monsterAttackDescriptionGen.register();
        restManager.register();
    }
}

/**
 * Displays a dialog to choose and execute GmMacros
 * @returns {Promise<any|undefined>} 
 */
async function displayGmMacrosChoices() {
    const {StringField} = foundry.data.fields;
    const {DialogV2} = foundry.applications.api;

    const gmMacroField = new StringField({
        label: "Function Name",
        choices: Object.keys(TaliaCustom.GmMacros)
            .filter(key => key !== "displayChoices")
            .reduce((acc, k) => {
                acc[k] = k;
                return acc;
            }, {}),
        required: true,
    }).toFormGroup({},{name: "functionName"}).outerHTML;

    const chosen = await DialogV2.prompt({
        window: { title: "Gm Macros" },
        content: gmMacroField,
        ok: {
            callback: (_, button) => new FormDataExtended(button.form).object,
        },
        rejectClose: false,
    });

    if(chosen) TaliaCustom.GmMacros[chosen.functionName]();
}
