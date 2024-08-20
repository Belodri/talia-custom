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
    const token = item.actor.getRollData().token;
    const dirRoll = await new Roll("1d8").evaluate();
    const distRoll = await new Roll("1d4").evaluate();

    const keys = Object.keys(TaliaUtils.Crosshairs.VECTORS);
    const direction = keys[dirRoll.total - 1];

    const crosshair = await new TaliaUtils
        .Crosshairs(token, 30, {showRangeIndicator: true, validateDistance: true})
        .setPosition();
    const position = crosshair
        .shiftPosition(direction, distRoll.total)
        .getPosition();
    if(!position) return;

    TaliaUtils.Helpers.displayItemInfoOnly(item);

    game.dice3d.showForRoll(dirRoll, game.user, true);
    game.dice3d.showForRoll(distRoll, game.user, true);

    await ChatMessage.create({
        user: game.user,
        speaker: ChatMessage.implementation.getSpeaker({actor: item.actor}),
        content: `${distRoll.total*5}ft ${direction}`
    });

    return teleportAnimation(token, position);

}
async function teleportAnimation(token, targetLocation) {
    const animFiles = ["jb2a.misty_step.01.blue", "jb2a.misty_step.02.blue"];
    
    new Sequence()
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
            //.snapToGrid()
            .offset({x: -1, y: -1})
            .waitUntilFinished(200)
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


function offsetPosition(position, dirNum, distNum) {
    const distance = canvas.scene.grid.size * distNum;
    // Define direction vectors
    const directions = [
        { x: 0, y: -1, msg: "North" },   
        { x: 1, y: -1, msg: "North-East" },   
        { x: 1, y: 0, msg: "East" },   
        { x: 1, y: 1, msg: "South-East" },    
        { x: 0, y: 1, msg: "South" },    
        { x: -1, y: 1, msg: "South-West" },  
        { x: -1, y: 0, msg: "West" },   
        { x: -1, y: -1, msg: "North-West" }  
    ];

    // Get the direction vector
    const vector = directions[dirNum - 1];

    //constrain by scene dimensions
    const constraints = {
        xMin: canvas.scene.dimensions.sceneX,
        xMax: canvas.scene.dimensions.sceneX + canvas.scene.dimensions.sceneWidth - canvas.scene.grid.size,
        yMin: canvas.scene.dimensions.sceneY,
        yMax: canvas.scene.dimensions.sceneY + canvas.scene.dimensions.sceneHeight - canvas.scene.grid.size
    }

    // Calculate new position
    const newPosition = {
        x: Math.min(constraints.xMax, Math.max(constraints.xMin, position.x + vector.x * distance)),
        y: Math.min(constraints.yMax, Math.max(constraints.yMin, position.y + vector.y * distance))
    };
    return {
        offsetPos: newPosition,
        msg: vector.msg
    }
}