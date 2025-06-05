import { TaliaCustomAPI } from "../../../scripts/api.mjs";
import { ItemHookManager } from "../../../utils/ItemHookManager.mjs";
import Mover from "../../../utils/Mover.mjs";

export default {
    register() {
        ItemHookManager.register("Fey Step", FeyStep.itemMacro);
        TaliaCustomAPI.add({feyStep: FeyStep.itemMacro}, "ItemMacros");
    }
}


class FeyStep extends Mover {
    static CONFIG = {
        maxRange: 30,
        distanceRollFormula: "(1d4)*5",
        animationTint: "#6aff4d"
    }

    static DIRECTIONS = {
        1: { degree: 270, label: "North" },    
        2: { degree: 315, label: "North-East" },   
        3: { degree: 0, label: "East" },     
        4: { degree: 45, label: "South-East" },    
        5: { degree: 90, label: "South" },      
        6: { degree: 135, label: "South-West" },   
        7: { degree: 180, label: "West" },    
        8: { degree: 225, label: "North-West" }
    };

    /**
     * @param {Item} item 
     * @returns {Promise<void>}
     */
    static async itemMacro(item) {
        const token = item.actor?.getRollData().token;
        if(!token) return;

        const {maxRange, animationTint} = FeyStep.CONFIG;
        const step = await new FeyStep(token).getAndSetLocation(maxRange);
        if(!step) return;

        await item.use({},{skipItemMacro: true});
        await step.createMessage();
        await step.executeMode("TELEPORT", {tint: animationTint});
    }

    /** @type {Roll} */
    #directionRoll;

    /** @type {Roll} */
    #distanceRoll;

    /** @type {{x: number, y: number, elevation: number}} */
    #originalTarget;

    /** @returns {string} Formula for direction roll. Based on the number of given directions. */
    get directionRollFormula() {
        const dirsCount = Object.keys(this.constructor.DIRECTIONS).length;
        return `1d${dirsCount}`;
    }

    /** @returns {number} Total offset distance in feet. Undefined before roll is evaluated. */
    get distance() { 
        return this.#distanceRoll?.total; 
    }

    /** @returns {{degree: number, label: string}} Offset direction. Undefined before roll is evaluated. */
    get direction() {
        return this.constructor.DIRECTIONS[this.#directionRoll?.total];
    }

    get originalTarget() {
        return foundry.utils.deepClone(this.#originalTarget);
    }

    /**
     * Lets the user select the target location via crosshair and sets the selected target.
     * Offsets the selected location by random direction and distance. 
     * @override
     * @param {number} maxRange 
     * @returns {Promise<this|null>}
     */
    async getAndSetLocation(maxRange) {
        this.setCrosshairOptions({
            "location.limitMaxRange": maxRange
        });
        if(!await super.getAndSetLocation()) return null;
        await this.#rollOffsets();
        return this.setTarget(this.#getShiftedTarget());
    }

    /**
     * Chat message detailing the offset location.
     * @returns {Promise<ChatMessage>}
     */
    async createMessage() {
        await Promise.all([
            game.dice3d.showForRoll(this.#directionRoll, game.user, true),
            game.dice3d.showForRoll(this.#distanceRoll, game.user, true)
        ]);

        const chatData = {
            speaker: ChatMessage.getSpeaker({token: this.token}),
            content: `${this.distance}ft to the ${this.direction.label}`,
        };
        ChatMessage.applyRollMode(chatData, game.settings.get("core", "rollMode"));
        return ChatMessage.create(chatData);
    }

    /**
     * Rolls the offsets for direction and distance.
     * @returns {Promise<this>}
     */
    async #rollOffsets() {
        const {distanceRollFormula} = this.constructor.CONFIG;
        const rollMode = game.settings.get("core", "rollMode");

        this.#directionRoll = await new Roll(this.directionRollFormula, {}, {
            flavor: "Direction",
            rollMode
        }).evaluate();
        this.#distanceRoll = await new Roll(distanceRollFormula, {}, {
            flavor: "Distance",
            rollMode
        }).evaluate();

        return this;
    }

    /**
     * Calculates the x and y coordinates of the target location shifted by the offset rolls.
     * @returns {{x: number, y: number}} 
     */
    #getShiftedTarget() {
        if(!this.#originalTarget) {
            this.#originalTarget = {
                x: this.targetPos.x,
                y: this.targetPos.y,
                elevation: this.targetElevation
            };
        }

        const topLeft = this.scene.grid.getTopLeftPoint(this.targetPos);
        return this.scene.grid.getTranslatedPoint(topLeft, this.direction.degree, this.distance);
    }
}
