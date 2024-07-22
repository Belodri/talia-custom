import { MODULE } from "../scripts/constants.mjs";
import jump from "./jump.mjs";

/**
 * File for all libWrapper functions that wrap or override a function on the actor.
 */
export default {
    _onLibWrapperReady() {
        libWrapper.register(MODULE.ID, "dnd5e.documents.Actor5e.prototype.getRollData", getRollDataWrapper, "WRAPPER");
        
    },

}

function getRollDataWrapper(wrapped, ...args) {
    const data = wrapped(...args);
    const addToRollData = {
        talia: {
            jumpDistance: jump._addJumpDistToRollData(data),
        }
    }
    return foundry.utils.mergeObject(addToRollData, data);
}