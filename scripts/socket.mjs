import { MODULE } from "./constants.mjs";

/*
    each function here 
*/

export let socket;
export function setupSocket() {
    socket = socketlib.registerModule(MODULE.ID);
    Hooks.callAll("talia_registerSockets");
}

const socketFunctions = {
    createEmbeddedDocuments: _createEmbeddedDocuments
}


async function socket_createActiveEffect(actorUuid, effectData) {

}

/*
    Check for example of how to deal with socket effects
    https://github.com/DFreds/dfreds-convenient-effects/blob/main/scripts/effect-interface.js
 */