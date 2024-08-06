import { TaliaCustomAPI } from "../scripts/api.mjs"
import { revelationThroughBattle } from "./revelationThroughBattle.mjs"
import { skillEmpowerment } from "./skillEmpowerment.mjs"

export default {
    _onSetup() {
        TaliaCustomAPI.add({
            Spells: {
                skillEmpowerment,
                revelationThroughBattle
            }
        })
    }
}