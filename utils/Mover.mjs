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
        elevation: -1,
    }

    #crosshairOptions;

    #crosshairCallbacks;

    get targetPos() {
        return {
            x: this.#target.x,
            y: this.#target.y
        }
    }

    get targetElevation() { return this.#target.elevation; }

    get snapMode() {
        return Math.max(1, this.token.document.width) % 2 === 0 ? CONST.GRID_SNAPPING_MODES.VERTEX : CONST.GRID_SNAPPING_MODES.CENTER;
    }

    constructor(token) {
        if(token instanceof TokenDocument) token = token.object;
        if( !(token instanceof Token) ) throw new Error(`Argument 'token' must be instance of Token or TokenDocument`);

        this.token = token;
        this.scene = token.scene;

        this.setCrosshairOptions();
        this.setCrosshairCallbacks();
    }

    /**
     * Rounds a given number to the nearest multiple of the grid distance.
     * @param {number} number The number to round.
     * @returns {number} The rounded number.
     */
    roundToGridDistance(number) {
        return Math.round(number / this.scene.grid.distance) * this.scene.grid.distance;
    }

    /**
     * Sets the options for the crosshair. Provided options override the defaults.
     * @param {object} [options]    Options object. Can be in dot notation.
     * @returns {this}
     */
    setCrosshairOptions(options={}) {
        options = foundry.utils.expandObject(options);

        // Ensure that min and max range limits are always rounded to grid.
        for(let locKey of ["limitMaxRange", "limitMinRange"]) {
            const val = options.location?.[locKey];
            if(typeof val === "number") options.location[locKey] = this.roundToGridDistance(val);
        }

        this.#crosshairOptions = foundry.utils.mergeObject({
            distance: (this.token.document.width * canvas.grid.distance) / 2,
            location: {
                obj: this.token,
                showRange: true,
                wallBehavior: Sequencer.Crosshair.PLACEMENT_RESTRICTIONS.ANYWHERE,
                displayRangePoly: true,
                rangePolyLineColor: 0o000000,
                rangePolyLineAlpha: 1,
            },
            gridHighlight: true,
            snap: {
                position: this.snapMode,
                resolution: 1,
                size: this.snapMode,    //has to be same as snap mode for some reason?
            }
        }, options);

        return this;
    }

    /**
     * Sets the callbacks for the crosshair. Provided callbacks override the default.
     * @param {object} [callbacks]
     * @returns {this}
     */
    setCrosshairCallbacks(callbacks={}) {
        this.#crosshairCallbacks = foundry.utils.mergeObject({
            [Sequencer.Crosshair.CALLBACKS.INVALID_PLACEMENT]: async (crosshair) => {
                await Sequencer.Helpers.wait(100);
                this.token.control();
            }
        }, callbacks);

        return this;
    }

    /**
     * @typedef {object} TargetData
     * @property {number} x
     * @property {number} y
     * @property {number} [targetElevation]
     */

    /**
     * Sets the target location for the teleport.
     * @param {TargetData}
     * @returns {this}
     */
    setTarget({x, y, targetElevation}={}) {
        if(!Number.isFinite(x) || !Number.isFinite(y)) throw new Error("Invalid arguments. x and y must be finite numbers.");
        const rect = this.scene.dimensions.sceneRect;
        this.#target.x = Math.clamp(x, rect.x, rect.x + rect.width);
        this.#target.y = Math.clamp(y, rect.y, rect.y + rect.height);
        if(Number.isSafeInteger(targetElevation)) this.#target.elevation = Math.max(targetElevation, -1);
        return this;
    }

    /**
     * Lets the user select the target location via crosshair on a square grid.
     * @returns {Promise}   The crosshairPlaceable in-flight. Resolves to a location when one is selected or null if cancelled. 
     */
    async getLocation() {
        if(this.scene.grid.type !== CONST.GRID_TYPES.SQUARE) throw new Error("Selecting location only possible with square grids.");
        return Sequencer.Crosshair.show(this.#crosshairOptions, this.#crosshairCallbacks);
    }

    /**
     * Lets the user select the target location via crosshair and sets the selected target.
     * @returns {Promise<this|null>}            Null if the selection of a location was cancelled.
     */
    async getAndSetLocation() {
        const location = await this.getLocation()
        return location ? this.setTarget(location) : null
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
     * @returns {Promise<boolean>}  A promise that resolves to false if there was an error with the sequence, or true if the sequence was successful.
     */
    async executeMode(mode, ...modeArgs) {
        this.validateReady(mode, true);
        const {callback, fixElevation} = this.constructor.MODES[mode];
        const fn = this[callback];

        try {
            await fn.call(this, ...modeArgs);
        } catch(err) {
            console.error(err);
            return false;
        }

        this.token.control();
        this.token.layer._sendToBackOrBringToFront(true);

        if(fixElevation) await this.fixElevation(this.targetElevation);
        return true;
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
