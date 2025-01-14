import { TaliaCustomAPI } from "../../scripts/api.mjs";
import { MODULE } from "../../scripts/constants.mjs";

import Building from "./building.mjs"
import Effect from "./effect.mjs"
import Settlement   from "./settlement.mjs"

import SettlementApp from "./settlementApp.mjs";

export default {
    registerSubsection() {
        Settlement.init();

        (async () => {
            const fileName = "sourceData";
            const path = `modules/${MODULE.ID}/world/settlement/${fileName}.json`;
            const response = await fetch(path);
            const sourceData = await response.json();

            Effect.initDatabase(sourceData.effectsData);
            Building.initDatabase(sourceData.buildingsData);

            //testing only
            globalThis.setl = { Settlement, Effect, Building, SettlementApp };
        })();
    }
}

//todo rewrite GAS to reflect the new data structure (no longer passing effectIds, instead just specialEffectText)
