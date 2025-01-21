import { TaliaCustomAPI } from "../../scripts/api.mjs";
import { MODULE } from "../../scripts/constants.mjs";
import Settlement from "./settlement.mjs";
import Effect from "./effect.mjs";
import Building from "./building.mjs";
import TaliaDate from "../../utils/TaliaDate.mjs";
import SettlementApp from "./settlementApp.mjs";

export default {
    registerSubsection() {
        (async () => {
            const path = `modules/${MODULE.ID}/jsonData/settlementSourceData.json`;
            const response = await fetch(path);
            const sourceData = await response.json();

            Effect.initData(sourceData.effectsData);
            Building.initData(sourceData.buildingsData);

            TaliaCustomAPI.add({ Settlements: {
                SettlementApp, Settlement, Building, Effect
            }}, "none");
        })();
    }
}
