export class Crosshairs {
    constructor(
        sourceToken, 
        range, 
        options = {
            showRangeIndicator: true,
            validateDistance: true,
        }
    ) {
        this.sourceToken = sourceToken;
        this.range = range;
        this.options = {
            showRangeIndicator: options.showRangeIndicator,
            validateDistance: options.validateDistance
        }
    } 
    
    async createBorderSequence() {
        const sourceTokenGS = this.sourceToken.w / canvas.grid.size;
        const borderSize = (sourceTokenGS / canvas.grid.size) + 0.5 + ( this.range /  canvas.dimensions.distance);

        const borderSeq = await new Sequence()
            .effect()
                .fadeIn(500)
                .fadeOut(500)
                .persist()
                .atLocation(this.sourceToken)
                .shape("circle", {
                    lineSize: 4,
                    lineColor: game.user.color.toString(),
                    radius: borderSize,
                    width: borderSize * 2,
                    height: borderSize * 2,
                    gridUnits: true,
                    name: "rangeIndicatorCircle"
                })
                .elevation(this.sourceToken?.document?.elevation + 1)
                .name("rangeIndicator")
                .opacity(0.75)
                .loopProperty("shapes.rangeIndicatorCircle", "scale.x", {from: 0.99, to: 1.01, duration: 1500, pingPong: true, ease: "easeInOutSine"})
                .loopProperty("shapes.rangeIndicatorCircle", "scale.y", {from: 0.99, to: 1.01, duration: 1500, pingPong: true, ease: "easeInOutSine"})

        this.borderSequence = borderSeq;
        return this;
    }

    async getPosition() {
        Hooks.call("talia_preCreateCrosshairs", this);
        
        if(this.options.showRangeIndicator) {
            await this.createBorderSequence();
            this.borderSequence.play();
        }

        let onClick; // Declare onClick in a higher scope so it's accessible in finally
        let position = null;
        const prom = new Promise((resolve) => {
            onClick = (event) => {
                if(event.data.button === 2) {
                    //Right-click: cancel the action
                    canvas.app.stage.removeListener("pointerdown", onClick);
                    ui.notifications.info("The selection has been cancelled.");
                    resolve(null);
                    return;
                }
                //ignore all other buttons
                if(event.data.button !== 0) return; 

                event.preventDefault();
                event.stopImmediatePropagation();

                const pos = event.data.getLocalPosition(canvas.app.stage);
                //any coordinates should refer to the topLeft corner of a square
                const topLeft = canvas.grid.getTopLeftPoint(pos);  

                //validity checks
                if(this.options.validateDistance && !this._isValidDistance(topLeft)) return;
                //TODO collision check
                //TODO elevation check

                //once we know the position is valid, remove the listener
                canvas.app.stage.removeListener("pointerdown", onClick);

                //resolve the promise with the valid position
                resolve(pos);
            }
            canvas.app.stage.addListener("pointerdown", onClick);
        });

        try {
            position = await prom;
        } finally {
            if(this.borderSequence) {
                Sequencer.EffectManager.endEffects({name: "rangeIndicator"});
                this.borderSequence = undefined;
            }
            // Ensure the listener is removed in any case
            canvas.app.stage.removeListener("pointerdown", onClick);
        }

        this.position = position;

        Hooks.call("talia_postGetPosition", this);
        return this.position;
    }

    _isValidDistance(topLeft) {
        const pathResult = canvas.grid.measurePath([this.sourceToken, topLeft], {});

        if(pathResult.cost > this.range) {
            ui.notifications.warn("Out of range. Try again.");
            return false;
        }
        return true;
    }
}