import { TaliaCustomAPI } from "../../../scripts/api.mjs";
import ChatCardButtons from "../../../utils/chatCardButtons.mjs";

export default {
    register() {
        TaliaCustomAPI.add({Jump})
        ChatCardButtons.register({
            itemName: "Jump",
            buttons: [{
                label: "Jump",
                callback: async({token}) => {
                    if(!token) {
                        ui.notifications.warn("You need to select a token to jump.");
                        return;
                    }
                    await Jump.jump(token);
                }
            }]
        });
    }
}

export class Jump {
    static async jump(token) {
        const rollData = token.actor.getRollData();
        const sourceToken = rollData.token;
        const maxJumpDistInFt = rollData.talia.jumpDistance;

        const location = await Jump.selectLocation(sourceToken, maxJumpDistInFt);
        if(!location) return;

        const targetLocation = {
            x: location.x,
            y: location.y
        };

        await Jump.jumpAnimation(sourceToken, targetLocation);
        return await Jump.setElevationToGround(sourceToken, targetLocation);
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

    /**
     * Updates a given token's elevation to equal that of the ground elevation closest to the targetLocation.
     * @param {Token} token                                                 The token to update
     * @param {{[key: "x"]: number, [key: "y"]: number }} targetLocation    The x and y coordinates of the targetLocation
     * @returns {Promise<Token>}                                            The updated? token
     */
    static async setElevationToGround(token, targetLocation) {
        const groundElevation = game.modules.get("terrainmapper")?.api?.ElevationHandler?.nearestGroundElevation(targetLocation) ?? 0;
        if(token.document.elevation !== groundElevation) {
            await token.document.update({"elevation": groundElevation});
        }
        return token;
    }

    static async jumpAnimation(token, targetLocation) {
        await new Sequence()
            .canvasPan()
            .delay(100)

            .animation()
            .on(token)
            .moveTowards(targetLocation, { ease: "easeInOutQuint"})
            .duration(1200)
            .snapToGrid(true)
            .waitUntilFinished()

            .effect()
            .file("jb2a.impact.ground_crack.orange.02")
            .atLocation(token)
            .belowTokens()
            .scale(.5 * token.document.width)

            .play();
    }
}
