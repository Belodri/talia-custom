import { TaliaCustomAPI } from "../../../scripts/api.mjs";

/*  API

    TaliaCustom.Other.getJumpDistance(actor);
    TaliaCustom.ItemMacros.jump(item);
*/

export default {
    register() {
        TaliaCustomAPI.add({jump: Jump.itemMacro}, "ItemMacros");
    }
}

export class Jump {

    static async itemMacro(item) {
        const rollData = item.actor.getRollData();
        const sourceToken = rollData.token;
        const maxJumpDistInFt = rollData.talia.jumpDistance;

        const location = await Jump.selectLocation(sourceToken, maxJumpDistInFt);
        if(!location) return;

        await Jump.jumpAnimation(sourceToken, {x: location.x, y: location.y});
        return true;
    }

    static async selectLocation(token, maxJumpDistInFt = 5) {
        const location = await Sequencer.Crosshair.show({
            location: {
                obj: token,
                limitMaxRange: maxJumpDistInFt,
                showRange: true,
                wallBehavior: Sequencer.Crosshair.PLACEMENT_RESTRICTIONS.ANYWHERE,
                displayRangePoly: true,
                rangePolyLineColor: 0o000000,
                rangePolyLineAlpha: 1,
            },
            gridHighlight: true,
            snap: {
                position: Math.max(1, token.document.width) % 2 === 0 ? CONST.GRID_SNAPPING_MODES.VERTEX : CONST.GRID_SNAPPING_MODES.CENTER
            }
        }, {
            [Sequencer.Crosshair.CALLBACKS.INVALID_PLACEMENT]: async (crosshair) => {
                await Sequencer.Helpers.wait(100);
                token.control();
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
