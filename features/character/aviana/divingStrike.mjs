// functions are called via item macro chat buttons

import { TaliaCustomAPI } from "../../../scripts/api.mjs";
import { Jump } from "../../shared/commonActions/jump.mjs";

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
async function getAndVerifyLocation(token, maxJumpDistInFt, minSpacingInFt) {
    const tWidthInGU = Math.max(1, token.document.width);   //token width in GU; minimum of 1;

    const location = await Sequencer.Crosshair.show({
        location: {
            obj: token,
            limitMaxRange: maxJumpDistInFt - 1,
            limitMinRange: minSpacingInFt + 6,
            showRange: true,
            wallBehavior: Sequencer.Crosshair.PLACEMENT_RESTRICTIONS.ANYWHERE,
            displayRangePoly: true,
            rangePolyLineColor: 0o000000,
            rangePolyLineAlpha: 1,
        },
        gridHighlight: true,
        snap: {
            position: tWidthInGU % 2 === 0 ? CONST.GRID_SNAPPING_MODES.VERTEX : CONST.GRID_SNAPPING_MODES.CENTER
        }    
    });
    await Sequencer.Helpers.wait(500);  //wait a little so the control works properly
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
    const maxJumpDistInFt = item.actor.getRollData().talia.jumpDistance;
    const minSpacingInFt = 5;

    //get location 
    const location = await getAndVerifyLocation(token, maxJumpDistInFt, minSpacingInFt);

    if(!location) return;   //if jump is cancelled
    const targetPosition = {
        x: location.x,
        y: location.y
    };

    await Promise.all([
        updateBabonus(item, token.center, targetPosition),
        playJumpAnimation(token, targetPosition)
    ]);

    await Jump.setElevationToGround(token, targetPosition);
}

/**
 *
 */
async function playJumpAnimation(token, position) {
    await new Sequence()
        .canvasPan()
        .delay(100)
        .shake({duration: 500, strength: 2, rotation: true, fadeOut:500})

        .sound()
        .file("TaliaCampaignCustomAssets/c_sounds/DivingStrike.mp3")
        .atLocation(token)
        .radius(120)    //can hear within 120ft
        .distanceEasing(true)

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
