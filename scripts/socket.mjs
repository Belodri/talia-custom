import { MODULE } from "./constants.mjs";
import { _registerEffectFunctionsToSocket } from "./effects.mjs";



export let talia_socket;
export function setupSocket() {
    talia_socket = socketlib.registerModule(MODULE.ID);
    _registerEffectFunctionsToSocket(talia_socket);
}