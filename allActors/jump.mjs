//make jump distance available in actor.getRollData();
import { MODULE } from "../scripts/constants.mjs";

export default {
    _onLibWrapperReady,
    _onDAESetup
}

function _onLibWrapperReady() {
    libWrapper.register(MODULE.ID, "dnd5e.documents.Actor5e.prototype.getRollData", function (wrapped, ...args) {
        const data = wrapped(...args);

        //rollData.talia.jumpDistance
        return foundry.utils.mergeObject(data, {
            talia: {
                jumpDistance: calculateJumpDistance(data),
            }
        });
    }, "WRAPPER");
}

//add flags to DAE
function _onDAESetup() {
    const fields = [];
    fields.push("flags.talia-custom.jumpDist.bonus");
    fields.push("flags.talia-custom.jumpDist.countDoubled");
    fields.push("flags.talia-custom.jumpDist.countHalved");
    window.DAE.addAutoFields(fields);
}


function calculateJumpDistance(rollData) {
    const acr = Math.max(foundry.utils.getProperty(rollData, "skills.acr.total") ?? 0, 0);
    const ath = Math.max(foundry.utils.getProperty(rollData, "skills.ath.total") ?? 0, 0);

    //the distance is based off either Athletics or Acrobatics skill, whichever one is higher
    const higherSkill = acr > ath ? acr : ath;

    //(Base (+0) = 5ft; +5ft per +2) (i.e. Athletics 8 = 25ft)
    //round to next lower even number if odd
    const workingSkillValue = higherSkill - (higherSkill % 2);
    const baseDistance =  5 + ((workingSkillValue / 2) * 5);

    const distAdd = foundry.utils.getProperty(rollData, "flags.talia-custom.jumpDist.bonus") ?? 0;
    const distDouble = foundry.utils.getProperty(rollData, "flags.talia-custom.jumpDist.countDoubled") ?? 0;
    const distHalf = foundry.utils.getProperty(rollData, "flags.talia-custom.jumpDist.countHalved") ?? 0;

    //caps the multiplier at 0.25 and 4.
    const distMult = Math.clamped(Math.pow(2, distDouble - distHalf), 0.25, 4);

    const calculatedDistance = (baseDistance + distAdd) * distMult;
    //round that to the nearest interval of 5
    return Math.round(calculatedDistance / 5) * 5;
}

