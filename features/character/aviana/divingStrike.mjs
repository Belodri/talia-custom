// functions are called via item macro chat buttons

import { TaliaCustomAPI } from "../../../scripts/api.mjs";

export default {
    register() {
        TaliaCustomAPI.add({ChatButtons_DivingStrike}, "ItemMacros");
    }
}

const ChatButtons_DivingStrike = {
    jump
}


/**
 *
 */
async function startBorderSequence(token, maxJumpDistInFt, minSpacingInFt) {
    const ftInGrid = canvas.scene.grid.distance;
    const tWidthInGU = Math.max(1, token.document.width);   //token width in GU; minimum of 1;
    const minDistInGU = ( tWidthInGU / 2 ) + Math.round(minSpacingInFt / ftInGrid);     //measured from token center
    const maxDistInGU = ( tWidthInGU / 2 )+ Math.round(maxJumpDistInFt / ftInGrid);

    return await new Sequence()
        .effect()
        .persist()
        .name("outerBorderEffect")
        .atLocation(token)
        .shape("roundedRect", {
            name: "outerRectShape",
            radius: 0.5,
            lineSize: 4,
            lineColor: game.user.color.toString(),
            gridUnits: true,
            fillAlpha: 0.15,
            //fillColor: "",
            height: 2 * maxDistInGU,
            width: 2 * maxDistInGU,
            offset: {
                x: -maxDistInGU,
                y: -maxDistInGU ,
                gridUnits: true
            }
        })
        .loopProperty("shapes.outerRectShape", "scale.x", {from: 0.995, to: 1.005, duration: 1500, pingPong: true, ease: "easeInOutSine"})
        .loopProperty("shapes.outerRectShape", "scale.y", {from: 0.995, to: 1.005, duration: 1500, pingPong: true, ease: "easeInOutSine"})
        .effect()
        .persist()
        .name("innerBorderEffect")
        .atLocation(token)
        .shape("roundedRect", {
            name: "innerRectShape",
            radius: 0.5,
            lineSize: 4,
            lineColor: game.user.color.toString(),
            gridUnits: true,
            fillAlpha: 0.3,
            fillColor: "#fa2511",
            height: 2 * minDistInGU,
            width: 2 * minDistInGU,
            offset: {
                x: -minDistInGU,
                y: -minDistInGU,
                gridUnits: true
            }
        })
        .loopProperty("shapes.innerRectShape", "scale.x", {from: 0.995, to: 1.005, duration: 1500, pingPong: true, ease: "easeInOutSine"})
        .loopProperty("shapes.innerRectShape", "scale.y", {from: 0.995, to: 1.005, duration: 1500, pingPong: true, ease: "easeInOutSine"})
        .play()
}

/**
 *
 */
async function endBorderSequence() {
    return await Sequencer.EffectManager.endEffects({ name: "*BorderEffect" });
}

/**
 *
 */
async function getAndVerifyLocation(token, maxJumpDistInFt, minSpacingInFt) {
    const tWidthInGU = Math.max(1, token.document.width);   //token width in GU; minimum of 1;

    const location = await Sequencer.Crosshair.show({
        location: {
            obj: token,
            limitMaxRange: maxJumpDistInFt - 1,
            limitMinRange: minSpacingInFt + 6,
            showRange: true,
            wallBehavior: Sequencer.Crosshair.PLACEMENT_RESTRICTIONS.LINE_OF_SIGHT
        },
        gridHighlight: true,
        snap: {
            position: tWidthInGU % 2 === 0 ? CONST.GRID_SNAPPING_MODES.VERTEX : CONST.GRID_SNAPPING_MODES.CENTER
        }    
    });
    token.control();
    if(location === false) return null; // false means it's been cancelled so we need to break the loop.

    const col = Sequencer.Crosshair.collect(location);
    if(!col.length || col[0]._id === token._id) {
        ui.notifications.info("You need to select a location which is occupied by a token.");
        return await getAndVerifyLocation(token, maxJumpDistInFt, minSpacingInFt);
    }
    return location;
}

/**
 *
 */
async function updateBabonus(item, pointA, pointB) {
    //calculate damage
    const bonusDamageDiceSize = "d6";
    const path = canvas.grid.measurePath([pointA, pointB], {});
    const dice = Math.floor(path.distance/10);
    const damageDiceString = dice ? `${dice}${bonusDamageDiceSize}` : "0";

    // get bonus
    const col = babonus.getCollection(item);
    const bonus = col.find(b => b.name === item.name);

    // update if needed
    if(bonus.bonuses.bonus !== damageDiceString) {
        await bonus.update({"bonuses.bonus": damageDiceString});
    }
    return ui.notifications.info(`Your ${path.distance}ft leap adds ${damageDiceString} damage to the attack.`);
}

/**
 *
 */
async function jump(token, item) {
    const maxJumpDistInFt = TaliaCustom.Other.getJumpDistance(token.actor);
    const minSpacingInFt = 5;

    //get location 
    startBorderSequence(token, maxJumpDistInFt, minSpacingInFt);    //display the range until a location is chosen or until it's aborted
    const location = await getAndVerifyLocation(token, maxJumpDistInFt, minSpacingInFt);
    await endBorderSequence();

    if(!location) return;   //if jump is cancelled
    const targetPosition = {
        x: location.x,
        y: location.y
    };

    return await Promise.all([
        updateBabonus(item, token.center, targetPosition),
        playJumpAnimation(token, targetPosition)
    ]);
}

/**
 *
 */
function adjustToTokenScale(token, dist) {
    const ftInGrid = canvas.scene.grid.distance;    //almost always = 5
    const tWidth = Math.max(1, token.document.width);    //token width in GU; minimum of 1

    const distInGU =  ( tWidth / 2 ) + Math.round(dist / ftInGrid);    //measured from token center
    return {
        distanceInGU: distInGU,
        shape: {
            height: 2 * distInGU,   //border width/height
            width: 2 * distInGU,
            offset: {
                x: -distInGU,  //border offset
                y: -distInGU,
                gridUnits: true
            }
        }
    }
}


/**
 *
 */
async function displayRange(token, config = {}) {
    const {
        maxDist = 20,
        minDist = 10,
        animDurationInMs = 10000
    } = config;

    new Sequence()
        .effect()
        .duration(animDurationInMs)
        .atLocation(token)
        .shape("roundedRect", {
            name: "outerRectShape",
            radius: 0.5,
            lineSize: 4,
            lineColor: game.user.color.toString(),
            gridUnits: true,
            fillAlpha: 0.15,
            //fillColor: "#fc8d83",
            ...adjustToTokenScale(token, maxDist).shape
        })
        .loopProperty("shapes.outerRectShape", "scale.x", {from: 0.995, to: 1.005, duration: 1500, pingPong: true, ease: "easeInOutSine"})
        .loopProperty("shapes.outerRectShape", "scale.y", {from: 0.995, to: 1.005, duration: 1500, pingPong: true, ease: "easeInOutSine"})
        .effect()
        .duration(animDurationInMs)
        .atLocation(token)
        .shape("roundedRect", {
            name: "innerRectShape",
            radius: 0.5,
            lineSize: 4,
            lineColor: game.user.color.toString(),
            gridUnits: true,
            fillAlpha: 0.3,
            fillColor: "#fa2511",
            ...adjustToTokenScale(token, minDist).shape
        })
        .loopProperty("shapes.innerRectShape", "scale.x", {from: 0.995, to: 1.005, duration: 1500, pingPong: true, ease: "easeInOutSine"})
        .loopProperty("shapes.innerRectShape", "scale.y", {from: 0.995, to: 1.005, duration: 1500, pingPong: true, ease: "easeInOutSine"})
        .play()
}


/**
 *
 */
async function playJumpAnimation(token, position) {
    await new Sequence()
        .canvasPan()
        .delay(100)
        .shake({duration: 500, strength: 2, rotation: true, fadeOut:500})

        .effect()
        .file("jb2a.impact.ground_crack.orange.01")
        .startTime(300)
        .scale(0.3)
        .randomRotation()
        .atLocation(token)
        .belowTokens()

        .effect()
        .file("jb2a.smoke.puff.side.02.white.1")
        .atLocation(token)
        .rotateTowards(position)
        .rotate(180)
        .belowTokens()

        .animation()
        .on(token)
        .opacity(0)

        .effect()   //salto
        .from(token)
        .scaleOut(3, 1500, {ease: "easeOutQuint"})
        .fadeOut(800, {ease: "easeOutQuint"})
        .rotateTowards(position, { rotate: false })
        .animateProperty("sprite", "position.x", { from: 0, to: 1, duration: 1250, gridUnits: true, ease: "easeOutQuint"})
        .waitUntilFinished()

        .animation()
        .on(token)
        .teleportTo(position)
        .snapToGrid()

        .effect()   //queda
        .from(token)
        .atLocation(position)
        .scaleIn(3, 1200, {ease: "easeInCubic"})
        .fadeIn(600, {ease: "easeInCubic"})
        .rotateTowards(token, { rotate: false })
        .animateProperty("sprite", "position.x", { from: 3, to: -0.5, duration: 1250, gridUnits: true, ease: "easeInCubic"})
        .waitUntilFinished(-50)

        .effect()
        .file("jb2a.smoke.puff.ring.01.white.1")
        .randomRotation()
        .atLocation(position)
        .belowTokens()

        .effect()
        .file("jb2a.impact.ground_crack.orange.01")
        .startTime(300)
        .randomRotation()
        .atLocation(position)
        .belowTokens()

        .canvasPan()
        .delay(100)
        .shake({duration: 1200, strength: 3, rotation: true, fadeOut:500})
        
        .animation()
        .delay(50)
        .on(token)
        .opacity(1)
            
        .play()
}
