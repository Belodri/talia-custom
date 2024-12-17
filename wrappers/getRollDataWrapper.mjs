import { MODULE } from "../scripts/constants.mjs";
import { Helpers } from "../utils/helpers.mjs";

export default {
    registerWrapper() {
        libWrapper.register(MODULE.ID, "dnd5e.documents.Actor5e.prototype.getRollData", wrap_Actor_getRollData , "WRAPPER");
    }
}

/** Adds rollData.talia to rollData */
function wrap_Actor_getRollData(wrapped, ...args) {
    const rollData = wrapped(...args);
    // add an object to the rolldata
    const taliaObj = {};

    // add jump distance to rollData
    taliaObj.jumpDistance = _getJumpDistance(rollData);

    // add magical bonuses from armor and shield to rollData
    taliaObj.magicalArmorBonus = ( rollData?.attributes?.ac?.equippedArmor && Helpers.checkAttunement(rollData.attributes.ac.equippedArmor) ) 
        ? rollData.attributes.ac.equippedArmor.system.armor.magicalBonus : 0;
    taliaObj.magicalShieldBonus = ( rollData?.attributes?.ac?.equippedShield && Helpers.checkAttunement(rollData.attributes.ac.equippedShield) )
        ? rollData.attributes.ac.equippedShield.system.armor.magicalBonus : 0;

    Hooks.callAll("talia_addToRollData", this, rollData, taliaObj);
    rollData.talia = taliaObj;
    return rollData;
}

/**
 * Calculates the actor's jump distance for a given rollData.
 * @param {object} rollData     
 * @returns {number}            Jump Distance in feet
 */
function _getJumpDistance(rollData) {
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
    const distMult = foundry.utils.getProperty(rollData, "flags.talia-custom.jumpDist.distMult") ?? 0;

    //sums the multipliers, capping the double/half multiplier at 0.25 and 4.
    const finalDistMult = distMult + Math.clamp(Math.pow(2, distDouble - distHalf), 0.25, 4); 

    const calculatedDistance = (baseDistance + distAdd) * finalDistMult;

    //round that to the nearest interval of 5
    const roundedDistance = Math.round(calculatedDistance / 5) * 5;

    return roundedDistance;
}
