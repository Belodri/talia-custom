import { MODULE } from "./constants.mjs";
import { gratefulFeyCharm } from "../aviana/items/gratefulFeyCharm.mjs";

export function createAPI() {
    globalThis[MODULE.globalThisName] = {};
    globalThis.taliaCustom_Items = {
        gratefulFeyCharm
    }
}