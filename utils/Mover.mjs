export default class Mover {
    static MODES = {
        TELEPORT: {
            callback: "_teleport",   
            fixElevation: false,
        },
        JUMP: {
            callback: "_jump",
            fixElevation: true
        }
    }

    #target = {
        x: null,
        y: null,
        elevation: null,
    }

    get targetPos() {
        return {
            x: this.#target.x,
            y: this.#target.y
        }
    }

    get targetElevation() { return this.#target.elevation; }

    constructor(token) {
        if(token instanceof TokenDocument) token = token.object;
        if( !(token instanceof Token) ) throw new Error(`Argument 'token' must be instance of Token or TokenDocument`);

        this.token = token;
        this.scene = token.scene;
    }


    /**
     * Sets the target location for the teleport directly.
     * @param {number} x 
     * @param {number} y 
     * @param {number} [elevation] 
     */
    setTarget(x, y, elevation = null) {
        const rect = this.scene.dimensions.sceneRect;
        this.#target.x = Math.clamp(x, rect.x, rect.x + rect.width);
        this.#target.y = Math.clamp(y, rect.y, rect.y + rect.height);
        if(Number.isSafeInteger(elevation)) this.#target.elevation = Math.max(elevation, -1);
        return this;
    }

    /**
     * Lets the user select the target location via crosshair.
     * @param {number} maxDist                  The maximum distance the user is allowed to select. Is rounded to the nearest minimum grid distance.
     * @param {object} crosshairOptions         Options to override the default crosshair options.
     * @param {object} crosshairCallbackOptions Options to override the default crosshair callback options.
     * @returns {Promise<this|null>}            Null if the selection of a location was cancelled.
     */
    async selectTarget(maxDist = 5, crosshairOptions = {}, crosshairCallbackOptions = {}) {
        if(this.scene.grid.type !== CONST.GRID_TYPES.SQUARE) throw new Error("Select target only possible with square grids.");
        maxDist = Math.round(maxDist / this.scene.grid.distance) * this.scene.grid.distance;

        const snapMode = Math.max(1, this.token.document.width) % 2 === 0 ? CONST.GRID_SNAPPING_MODES.VERTEX : CONST.GRID_SNAPPING_MODES.CENTER;

        const options = foundry.utils.mergeObject({
            location: {
                obj: this.token,
                limitMaxRange: maxDist,
                showRange: true,
                wallBehavior: Sequencer.Crosshair.PLACEMENT_RESTRICTIONS.ANYWHERE,
                displayRangePoly: true,
                rangePolyLineColor: 0o000000,
                rangePolyLineAlpha: 1,
            },
            gridHighlight: true,
            snap: {
                position: snapMode,
                resolution: 1,
                size: snapMode,
            }
        }, crosshairOptions);

        const callbacks = foundry.utils.mergeObject({
            [Sequencer.Crosshair.CALLBACKS.INVALID_PLACEMENT]: async (crosshair) => {
                await Sequencer.Helpers.wait(100);
                this.token.control();
            }
        }, crosshairCallbackOptions);

        const location = await Sequencer.Crosshair.show(options, callbacks);
        if(!location) return null;

        return this.setTarget(location.x, location.y);
    }

    /**
     * Validates if the mover is ready to move the token.
     * @param {string} mode             The movement mode for which the readiness is checked.
     * @param {boolean} [strict=true]   In strict mode, throws an error if the mover is not ready.
     * @returns {boolean}               True if the mover is ready, or false if it isn't and strict mode is off.
     */
    validateReady(mode, strict=true) {
        const reasons = [];

        const modeCfg = this.constructor.MODES[mode];
        if(!modeCfg) reasons.push(`Invalid mode '${mode}'`);
        else {
            if(typeof modeCfg.callback !== "string" 
            || typeof this[modeCfg.callback] !== "function"
            ) reasons.push(`No valid function for callback '${modeCfg.callback}' of mode '${mode}'`);

            if(modeCfg.fixElevation 
                && typeof this.targetElevation !== "number"
            ) reasons.push(`Missing expected elevation`);
        }

        if(typeof this.targetPos.x !== "number" 
            || typeof this.targetPos.y !== "number"
        ) reasons.push(`Invalid position`);

        if(!reasons.length) return true;
        if(strict) throw new Error(`${this.constructor.name} | ${reasons.join(" | ")}`);
        return false;
    }

    /**
     * Executes a given mode sequence function.
     * @param {string} mode     The chosen mode.
     * @param {...any} modeArgs  Any arguments to be passed to the mode sequence function.
     * @returns {Promise<any>}  A promise that resolves to the mode sequence. 
     */
    async executeMode(mode, ...modeArgs) {
        this.validateReady(mode, true);
        const {callback, fixElevation} = this.constructor.MODES[mode];

        const fn = this[callback];
        const prom = await fn.call(this, ...modeArgs);
        if(fixElevation) await this.fixElevation(this.targetElevation);
        return prom;
    }

    /**
     * Updates the elevation of a token
     * @returns {Promise<TokenDocument|void>} A promise that resolves to the updated token document or void if no update was required.
     */
    async fixElevation(elevation) {
        if(!Number.isSafeInteger(elevation)) throw new Error(`Elevation must be a valid integer.`);
        if(elevation === -1) elevation = this.#getGroundElevation();    // defaults to 0 if the no target is set
        if(this.token.document.elevation !== elevation) {
            return this.token.document.update({"elevation": elevation});    //async
        }
    }

    /**
     * Gets the ground elevation near the target from `terrainmapper` module if it's active.
     * Defaults to 0;
     * @returns {number}
     */
    #getGroundElevation() {
        const mapper = game.modules.get("terrainmapper");
        let elevation = 0;
        if(mapper?.active) {
            try {
                const ret = mapper.api?.ElevationHandler?.nearestGroundElevation?.({
                    x: this.targetPos.x,
                    y: this.targetPos.y
                });
                if(Number.isSafeInteger(ret)) elevation = ret;
            } catch (err) {
                console.error(err);
            }
        }
        return elevation;
    }

    //#region Modes & Animation

    async _jump({targetAnimation = "jb2a.impact.ground_crack.orange.02"}={}) {
        return new Sequence()
            .canvasPan()
            .delay(100)

            .animation()
            .on(this.token)
            .moveTowards(this.targetPos, { ease: "easeInOutQuint"})
            .duration(1200)
            .snapToGrid(true)
            .waitUntilFinished()

            .effect()
            .file(targetAnimation)
            .atLocation(this.token)
            .belowTokens()
            .scale(.5 * this.token.document.width)

            .play();    //async
    }

    async _teleport({tokenAnimation = "jb2a.misty_step.01.blue", targetAnimation = "jb2a.misty_step.02.blue", tint = ""}={}) {    
        return new Sequence()
            .animation()
            .delay(800)
            .on(this.token)
            .fadeOut(200) 

            .effect()
            .file(tokenAnimation)
            .atLocation(this.token)
            .scaleToObject(2)
            .tint(tint)
            .waitUntilFinished(-2000)

            .animation()
            .on(this.token)
            .teleportTo(this.targetPos)
            .snapToGrid()
            .waitUntilFinished()

            .effect()
            .file(targetAnimation)
            .atLocation(this.token)
            .tint(tint)
            .scaleToObject(2)

            .animation()
            .delay(1400)
            .on(this.token)
            .fadeIn(200)     

            .play();    //async
    }
}
