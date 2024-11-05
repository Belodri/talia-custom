import { TaliaCustomAPI } from "../../../scripts/api.mjs";
import { TaliaUtils } from "../../../utils/_utils.mjs"
import { ItemHookManager } from "../../../utils/ItemHookManager.mjs";

export default {
    register() {
        ItemHookManager.register("Fey Step", feyStepTeleportItemMacro);

        TaliaCustomAPI.add({feyStep: feyStepTeleportItemMacro}, "ItemMacros");
    }
}

async function feyStepTeleportItemMacro(item) {
    const DIRECTIONS = {
        1: { degree: 270, cardinal: "North" },    
        2: { degree: 315, cardinal: "North-East" },   
        3: { degree: 0, cardinal: "East" },     
        4: { degree: 45, cardinal: "South-East" },    
        5: { degree: 90, cardinal: "South" },      
        6: { degree: 135, cardinal: "South-West" },   
        7: { degree: 180, cardinal: "West" },    
        8: { degree: 225, cardinal: "North-West" }
    };

    const token = item.actor.getRollData().token;
    const location = await Sequencer.Crosshair.show({
        location: {
            obj: token,
            limitMaxRange: 30,
            showRange: true,
            wallBehavior: Sequencer.Crosshair.PLACEMENT_RESTRICTIONS.LINE_OF_SIGHT,
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
    if(!location) return;   

    const topLeftLoc = canvas.scene.grid.getTopLeftPoint({x: location.x, y: location.y});

    //shift position
    const dirRoll = await new Roll("1d8").evaluate();
    const distRoll = await new Roll("1d4").evaluate();
    const direction = DIRECTIONS[dirRoll.total].degree ?? 0;
    const distanceInFeet = distRoll.total * 5 ?? 0;
    const shiftedPosition = canvas.scene.grid.getTranslatedPoint(topLeftLoc, direction, distanceInFeet);

    //show rolls and messages
    game.dice3d.showForRoll(dirRoll, game.user, true);
    game.dice3d.showForRoll(distRoll, game.user, true);
    await TaliaUtils.Helpers.displayItemInfoOnly(item);
    await ChatMessage.implementation.create({
        user: game.user,
        speaker: ChatMessage.implementation.getSpeaker({actor: item.actor, token}),
        content: `${distanceInFeet}ft to the ${DIRECTIONS[dirRoll.total].cardinal}`
    });
    
    //resolve the teleport
    return await teleportAnimation(token, shiftedPosition);
}

async function teleportAnimation(token, targetLocation) {
    const animFiles = ["jb2a.misty_step.01.blue", "jb2a.misty_step.02.blue"];
    
    return await new Sequence()
        .animation()
            .delay(800)
            .on(token)
            .fadeOut(200) 
        .effect()
            .file(animFiles[0])
            .atLocation(token)
            .scaleToObject(2)
            .waitUntilFinished(-2000)
        .animation()
            .on(token)
            .teleportTo(targetLocation)
            .waitUntilFinished()
        .effect()
            .file(animFiles[1])
            .atLocation(token)
            .scaleToObject(2)
        .animation()
            .delay(1400)
            .on(token)
            .fadeIn(200)     
    .play();
}