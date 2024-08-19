import { TaliaUtils } from "../../../utils/_utils.mjs"

export default {
    register() {

    }
}

async function feyStepTeleport(token) {
    const position = await new TaliaUtils.Crosshairs(token, 30, {showRangeIndicator: true, validateDistance: true}).getPosition();
    if(!position) return;

    const dirRoll = await new Roll("1d8").evaluate();
    const distRoll = await new Roll("1d4").evaluate();

    const newPos = offsetPosition(position, dirRoll.total, distRoll.total);

}
async function teleportAnimation(token, targetLocation) {
    new Sequence()
    
}


function offsetPosition(position, dirNum, distNum) {
    const distance = canvas.scene.grid.size * distNum;
    // Define direction vectors
    const directions = [
        { x: 0, y: -1 },   // 1: North
        { x: 1, y: -1 },   // 2: North-East
        { x: 1, y: 0 },    // 3: East
        { x: 1, y: 1 },    // 4: South-East
        { x: 0, y: 1 },    // 5: South
        { x: -1, y: 1 },   // 6: South-West
        { x: -1, y: 0 },   // 7: West
        { x: -1, y: -1 }   // 8: North-West
    ];

    // Get the direction vector
    const vector = directions[dirNum - 1];

    //constrain by scene dimensions
    const constraints = {
        xMin: canvas.scene.dimensions.sceneX,
        xMax: canvas.scene.dimensions.sceneX + canvas.scene.dimensions.sceneHeight,
        yMin: canvas.scene.dimensions.sceneY,
        yMax: canvas.scene.dimensions.sceneY + canvas.scene.dimensions.sceneWidth
    }

    // Calculate new position
    const newPosition = {
        x: Math.min(constraints.xMax, Math.max(constraints.xMin, position.x + vector.x * distance)),
        y: Math.min(constraints.yMax, Math.max(constraints.yMin, position.y + vector.y * distance))
    };
}