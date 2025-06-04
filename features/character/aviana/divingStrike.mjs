import ChatCardButtons from "../../../utils/chatCardButtons.mjs";
import Mover from "../../../utils/Mover.mjs";

export default {
    register() {
        ChatCardButtons.register({
            itemName: "Diving Strike",
            isPartialName: true,
            displayFilter: (item) => item.actor?.itemTypes?.subclass?.some(s => s.name === "Spirit Warrior"),
            buttons: [{
                label: "Jump",
                callback: ({token, item}) => new DivingStrike(token, item).runMacro()
            }]
        });
    }
}

class DivingStrike extends Mover {
    static CONFIG = {
        jump: { minSpacing: 10 },
        bonus: { 
            diceSize: "d6",
            distanceInterval: 10
        }
    }

    /**
     * @param {Token} token 
     * @param {Item} item 
     */
    constructor(token, item) {
        super(token);
        this.item = item;
        this.startCenter = this.token.center;
    }

    /** @type {number} Number to keep track of the last sent notification. */
    #notifId;

    /** @type {PIXI.Rectangle[]} */
    #tokenBounds;

    /**
     * Gets the bounds of all visible tokens on the scene except the executing token.
     * @returns {PIXI.Rectangle[]} 
     */
    get tokenBounds() {
        if(!this.#tokenBounds) {
            this.#tokenBounds = this.token.document.collection
                .filter(tDoc => !tDoc.hidden && tDoc._id !== this.token.document._id)
                .map(tDoc => tDoc.object.bounds);
        }
        return this.#tokenBounds;
    }

    /**
     * Runs the Diving Strike macro sequence.
     * @returns {Promise<void>}
     */
    async runMacro() {
        const maxJumpDist = this.item.actor.getRollData().talia.jumpDistance;
        const minJumpDist = (this.token.document.width * this.scene.grid.distance) 
            + this.constructor.CONFIG.jump.minSpacing;

        this.setCrosshairOptions({
            "location.limitMaxRange": maxJumpDist,
            "location.limitMinRange": minJumpDist
        });

        this.setCrosshairCallbacks({
            [Sequencer.Crosshair.CALLBACKS.MOVE]: this.#onCrosshairMove.bind(this),
            [Sequencer.Crosshair.CALLBACKS.INVALID_PLACEMENT]: this.#onCrosshairInvalidPlacement.bind(this)
        });

        const loc = await this.getLocation();
        if(!loc) return;

        const res = await this.setTarget(loc)
            .executeMode("JUMP");
        if(!res) return;

        await this.#updateBab();
    }

    /**
     * Displays notification on invalid crosshair placement, 
     * and returns user control over the token.
     * Avoids duplicate messages.
     * @returns {void}
     */
    #onCrosshairInvalidPlacement() {
        const notifActive = ui.notifications.active.some(li => li.data("id") === this.#notifId);
        if(!notifActive) this.#notifId = ui.notifications.info("You need to select a location which is occupied by a token.");
        this.#debounceControl();
    }

    /**
     * Returns control over the token upon invalid placement.
     */
    #debounceControl = foundry.utils.debounce(() => this.token.control(), 200);

    /**
     * Tests if the crosshair overlaps with any token during flight.
     * @param {object} crosshair
     * @returns {void}
     */
    #onCrosshairMove(crosshair) {
        crosshair.isValid = this.tokenBounds
            .some(tb => this.#interiorsIntersect(tb, crosshair.bounds));
    }

    /**
     * Test if the interior of rectangle t intersects with the interior of rectangle c.
     * Sharing an edge is not considered an intersection for this purpose.
     * @param {PIXI.Rectangle} t
     * @param {PIXI.Rectangle} c
     * @returns {boolean}
     */
    #interiorsIntersect(t, c) {
        return t.left < c.right
            && t.right > c.left
            && t.top < c.bottom
            && t.bottom > c.top;
    }

    /**
     * Updates the damage bonus on on the item based on the distance of the jump.
     */
    async #updateBab() {
        //calculate damage

        const { diceSize, distanceInterval } = this.constructor.CONFIG;
        const path = canvas.grid.measurePath([this.startCenter, this.token.center], {});
        const diceCount = Math.floor(path.distance/distanceInterval);
        const damageDiceString = diceCount ? `${diceCount}${diceSize}` : "0";

        // get bonus
        const col = babonus.getCollection(this.item);
        const bonus = col.find(b => b.name === this.item.name);

        // update if needed
        if(bonus.bonuses.bonus !== damageDiceString) {
            await bonus.update({"bonuses.bonus": damageDiceString});
        }

        ui.notifications.info(`Your ${path.distance}ft leap adds ${damageDiceString} damage to the attack.`);
    }

    /** @override */
    async _jump() {
        await new Sequence()
            .canvasPan()
            .delay(100)
            .shake({duration: 500, strength: 2, rotation: true, fadeOut:500})

            .sound()
            .file("TaliaCampaignCustomAssets/c_sounds/DivingStrike.mp3")
            .atLocation(this.token)
            .radius(120)    //can hear within 120ft
            .distanceEasing(true)

            .effect()
            .file("jb2a.impact.ground_crack.orange.01")
            .startTime(300)
            .scale(0.3)
            .randomRotation()
            .atLocation(this.token)
            .belowTokens()

            .effect()
            .file("jb2a.smoke.puff.side.02.white.1")
            .atLocation(this.token)
            .rotateTowards(this.targetPos)
            .rotate(180)
            .belowTokens()

            .animation()
            .on(this.token)
            .opacity(0)

            .effect()   //salto
            .from(this.token)
            .scaleOut(3, 1500, {ease: "easeOutQuint"})
            .fadeOut(800, {ease: "easeOutQuint"})
            .rotateTowards(this.targetPos, { rotate: false })
            .animateProperty("sprite", "position.x", { from: 0, to: 1, duration: 1250, gridUnits: true, ease: "easeOutQuint"})
            .waitUntilFinished()

            .animation()
            .on(this.token)
            .teleportTo(this.targetPos)
            .snapToGrid()

            .effect()   //queda
            .from(this.token)
            .atLocation(this.targetPos)
            .scaleIn(3, 1200, {ease: "easeInCubic"})
            .fadeIn(600, {ease: "easeInCubic"})
            .rotateTowards(this.token, { rotate: false })
            .animateProperty("sprite", "position.x", { from: 3, to: -0.5, duration: 1250, gridUnits: true, ease: "easeInCubic"})
            .waitUntilFinished(-50)

            .effect()
            .file("jb2a.smoke.puff.ring.01.white.1")
            .randomRotation()
            .atLocation(this.targetPos)
            .belowTokens()

            .effect()
            .file("jb2a.impact.ground_crack.orange.01")
            .startTime(300)
            .randomRotation()
            .atLocation(this.targetPos)
            .belowTokens()

            .canvasPan()
            .delay(100)
            .shake({duration: 1200, strength: 3, rotation: true, fadeOut:500})
            
            .animation()
            .delay(50)
            .on(this.token)
            .opacity(1)
                
            .play()
    }
}
