import { TaliaCustomAPI } from "../scripts/api.mjs"
import { viceGrip } from "./viceGrip.mjs"


/**
 * Used to set up all item macros added by this module.
 */
export default {
    _onSetup() {
        TaliaCustomAPI.add({
            ItemMacros: {
                viceGrip,
            }
        })
    }
}