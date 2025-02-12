/** @typedef {import("../foundry/client-esm/canvas/sources/point-vision-source.mjs").default} PointVisionSource */


class DetectionCheckerUtils {
    /**
     * Checks whether a token is isolated.
     * A token is isolated if it cannot see any ally.
     * @param {Token | TokenDocument} sourceToken 
     * @returns {boolean}
     */
    static isIsolated(sourceToken) {
        const config = {
            excludedDetectionModeIds: Object.values(CONFIG.Canvas.detectionModes)
                .filter(mode => mode.type !== DetectionMode.DETECTION_TYPES.SIGHT)
                .map(mode => mode.id)
        };
        
        const source = sourceToken.object ?? sourceToken;
        const checker = new DetectionChecker(source);

        const dispos = source.document.disposition;
        for(const tokenDoc of canvas.scene.tokens) {
            if( tokenDoc.disposition === source.document.disposition 
                && tokenDoc.uuid !== source.document.uuid
                && checker.canDetect(tokenDoc.object, config)
            ) return false; 
        }
        return true;
    }
}

/**
 * @typedef {object} DetectionConfig
 * @property {string[]} excludedDetectionModeIds    An array of DetectionMode id strings to exclude from the evaluation.
 * @property {object} excludeDetectionTypes             
 * @property {boolean} [excludeDetectionTypes.SIGHT=false]
 * @property {boolean} [excludeDetectionTypes.SOUND=false]
 * @property {boolean} [excludeDetectionTypes.MOVE=false]
 * @property {boolean} [excludeDetectionTypes.OTHER=false]
 */

export default class DetectionChecker {
    //#region Static

    static utils = DetectionCheckerUtils;

    /** Default values for DetectionConfig */
    static DEFAULT_CONFIG = {
        excludedDetectionModeIds: [],
        excludeDetectionTypes: {
            SIGHT: false,
            SOUND: false,
            MOVE: false,
            OTHER: false
        }
    };

    /**
     * @param {Token} tokenObject 
     * @returns {PointVisionSource}
     */
    static prepareVisionSource(tokenObject) {
        const visionData = tokenObject._getVisionSourceData();
        visionData.object = tokenObject;
        const visionSource = new CONFIG.Canvas.visionSourceClass(visionData);
        foundry.utils.mergeObject(visionSource.data, tokenObject.center);
        visionSource.initialize();
        return visionSource;
    }

    //#endregion

    //#region Instance

    #source;

    #sourceVisionSource;

    /**
     * @param {Token} source        TokenObject of the token who's ability to detect others is checked
     */
    constructor(source) {
        this.#source = source;
        this.#sourceVisionSource = DetectionChecker.prepareVisionSource(source);
    }

    get source() { return this.#source }
    
    get sourceVisionSource() { return this.#sourceVisionSource }

    /**
     * Can the source detect this target?
     * @param {Token} target 
     * @param {DetectionConfig} [config] 
     * @returns {boolean}
     */
    canDetect(target, config={}) {
        const evaluation = this.evaluate(target, config);
        return Object.values(evaluation).some(Boolean);
    }

    /**
     * @param {Token} target 
     * @param {DetectionConfig} [config] 
     * @returns {{[key: string]: boolean}}      An object where keys are detection mode IDs and values indicate whether the target can be detected by the source.
     */
    evaluate(target, config={}) {
        const workingConfig = foundry.utils.mergeObject(DetectionChecker.DEFAULT_CONFIG, config);
        
        const excludedModes = new Set(workingConfig.excludedDetectionModeIds); 
        const DETECTION_TYPES_INVERTED = foundry.utils.invertObject(DetectionMode.DETECTION_TYPES);

        const {tests} = canvas.visibility._createVisibilityTestConfig(target.center, { object: target });

        const results = {};
        for(const mode of this.#source.document.detectionModes) {
            const canvasMode = CONFIG.Canvas.detectionModes[mode.id];
            if( canvasMode && !excludedModes.has(mode.id) && !workingConfig.excludeDetectionTypes[DETECTION_TYPES_INVERTED[canvasMode.type]] ) {
                results[mode.id] = canvasMode.testVisibility(this.sourceVisionSource, mode, { object: target, tests })
            }
        }
        return results;
    }

    //#endregion
}


