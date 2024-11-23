import { TaliaCustomAPI } from "../../../scripts/api.mjs";

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
    static getDistance(actor) {
        const rollData = actor.getRollData();
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
        let roundedDistance = Math.round(calculatedDistance / 5) * 5;

        //lets other scripts modify the final calculated and rounded distance
        const distanceObj = {
            rounded: roundedDistance,
            newValue: null
        };
        Hooks.callAll("talia_postCalculateJumpDistance", actor, distanceObj );
        return distanceObj.newValue ?? distanceObj.rounded;
    }

    static async itemMacro(item) {
        const rollData = item.actor.getRollData();
        const sourceToken = rollData.token;

        const location = await Jump.selectLocation(sourceToken);
        if(!location) return;

        await Jump.jumpAnimation(sourceToken, {x: location.x, y: location.y});
        return true;
    }

    static async selectLocation(token) {
        const maxJumpDistInFt = Jump.getDistance(token.actor);

        const location = await Sequencer.Crosshair.show({
            location: {
                obj: token,
                limitMaxRange: maxJumpDistInFt,
                showRange: true,
                wallBehavior: Sequencer.Crosshair.PLACEMENT_RESTRICTIONS.NO_COLLIDABLES,
                displayRangePoly: true,
                rangePolyLineColor: 0o000000,
                rangePolyLineAlpha: 1,
            },
            gridHighlight: true,
            snap: {
                position: Math.max(1, token.document.width) % 2 === 0 ? CONST.GRID_SNAPPING_MODES.VERTEX : CONST.GRID_SNAPPING_MODES.CENTER
            }
        });
        await Sequencer.Helpers.wait(500);  //wait a little so the control works properly
        token.control();
        return location;    //can be false if cancelled
    }

    static async jumpAnimation(token, targetLocation) {
        new Sequence()
            .animation()
            .on(token)
            .moveTowards(targetLocation, { ease: "easeInOutQuint"})
            .duration(1200)
            .waitUntilFinished()
            .snapToGrid(true)
            .effect()
            .file("jb2a.impact.ground_crack.orange.02")
            .atLocation(token)
            .belowTokens()
            .scale(.5 * token.document.width)
            .play();
    }
}
