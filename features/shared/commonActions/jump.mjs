import { TaliaCustomAPI } from "../../../scripts/api.mjs";
import { TaliaUtils } from "../../../utils/_utils.mjs";

/*  API

    TaliaCustom.Other.getJumpDistance(actor);
    TaliaCustom.ItemMacros.jump(item);
*/

export default {
    register() {
        Hooks.once("setup", () => {
            const fields = [];
            fields.push("flags.talia-custom.jumpDist.bonus");
            fields.push("flags.talia-custom.jumpDist.countDoubled");
            fields.push("flags.talia-custom.jumpDist.countHalved");
            DAE.addAutoFields(fields);
        });
        TaliaCustomAPI.add({jump: Jump.itemMacro}, "ItemMacros");
        TaliaCustomAPI.add({getJumpDistance: Jump.getDistance}, "Other");
    }
}

class Jump {
    static getDistance(rollData) {
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
        const distMult = Math.clamp(Math.pow(2, distDouble - distHalf), 0.25, 4);

        const calculatedDistance = (baseDistance + distAdd) * distMult;
        //round that to the nearest interval of 5
        return Math.round(calculatedDistance / 5) * 5;
    }

    static async itemMacro(item) {
        const rollData = item.actor.getRollData();
        const jumpDistanceInFt = Jump.getDistance(rollData);
    
        const sourceToken = rollData.token;
    
        const crosshairs = await new TaliaUtils
            .Crosshairs(sourceToken, jumpDistanceInFt, {showRangeIndicator: true, validateDistance: true})
            .setPosition();
        const position = crosshairs.getPosition();
        if(!position) return;
        await Jump.jumpAnimation(sourceToken, position);
        return true;
    }

    static async jumpAnimation(token, targetLocation) {
        new Sequence()
            .animation()
                .on(token)
                .moveTowards(targetLocation, { ease: "easeInOutQuint"})
                .duration(1200)
                .waitUntilFinished()
            .effect()
                .file("jb2a.impact.ground_crack.orange.02")
                .atLocation(token)
                .belowTokens()
                .scale(.5 * token.document.width)
            .play();
    }
}