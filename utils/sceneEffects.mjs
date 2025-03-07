import { TaliaCustomAPI } from "../scripts/api.mjs";
import { MODULE } from "../scripts/constants.mjs";

export default {
    register() {
        TaliaCustomAPI.add({SceneEffectManager}, "none");
        SceneEffectManager.registerHooks();
    }
}

/*
    Effects are added to the token.actor so it works for both linked and unlinked actors.

    Add effects to:
    - a single token when that token is created on the active scene
    - all tokens on a scene when that scene is activated


    Remove effects from:
    - a single token when that token is removed from the active scene
        and the token actor has no other linked tokens on that scene
    - all tokens on a scene when another scene is activated

*/
class SceneEffectManager {
    static DEBUG = false;

    static sceneFlagKey = "sceneEffectUuids";

    static effectFlagKey = "sceneEffect";
    
    static registerHooks() {
        Hooks.on("renderSceneConfig", SceneEffectManager.renderSceneConfigHook);

        //These hooks fire for all connected clients after the update has been processed.
        Hooks.on("updateScene", SceneEffectManager.updateSceneHook);
        Hooks.on("createToken", SceneEffectManager.createTokenHook);
    }

    /**
     * Hook renderSceneConfig; adds a field to add effects via the gui.
     * @param {Application} app             The Application instance being rendered
     * @param {JQuery} html                 The inner HTML of the document that will be displayed and may be modified
     * @param {object} data                 The object of data used when rendering the application
     */
    static renderSceneConfigHook(app, html, data) {
        /*  
        This implementation works fine but ChaosOS's advised me to use the one below.
        Here's his explanation for why:

        "With flags, you don't actually have the field performing its runtime validation duties
        so you may as well cut out the middle man and just directly invoke what Foundry is doing with the toInput/toFormGroup calls
        you have both more control and better visibility into the actual process of creating the input and form group wrapper"


        const { DocumentUUIDField, SetField } = foundry.data.fields;
        const sceneEffectsField = new SetField(
            new DocumentUUIDField({ type: "ActiveEffect" }),
            { label: "Scene Effects" }
        ).toFormGroup({},{
            name: `flags.${MODULE.ID}.sceneEffectUuidsInput`,
            value: data.document.flags?.[MODULE.ID]?.sceneEffectUuidsInput ?? [] 
        }).outerHTML;
        */

        const input = foundry.applications.elements.HTMLDocumentTagsElement.create({
            value: data.document.getFlag(MODULE.ID, SceneEffectManager.sceneFlagKey),
            name: `flags.${MODULE.ID}.${SceneEffectManager.sceneFlagKey}`,
            type: "ActiveEffect"
        });
        const formGroup = foundry.applications.fields.createFormGroup({ input, label: "Scene Effects" })
        const sceneEffectsField = formGroup.outerHTML;

        const div = document.createElement("div");
        div.innerHTML = sceneEffectsField;

        const basicTab = html.find(`.tab[data-tab="basic"][data-group="main"]`)[0];
        if(!basicTab) return;
        basicTab.appendChild(div);

        app.setPosition({height: "auto"});
    }

    /**
     * Hook createToken
     * Applies scene effects to the token if:
     * - the user is a GM
     * - the token.parent is a Scene
     * - the scene is active
     * @param {Token} token                                 The new Document instance which has been created
     * @param {Partial<DatabaseUpdateOperation>} options    Additional options which modified the creation request
     * @param {string} userId                               The ID of the User who triggered the creation workflow
     * @returns {void}
     */
    static createTokenHook(token, options, userId) {
        if(!game.user.isGM
            || !(token.parent instanceof Scene)
            || !token.parent.active
        ) return;

        (async () => {
            const collect = await SceneEffectManager.applySceneEffectsToActor(token, token.parent).then(result => ({
                [token.actor.uuid]: result
            }));
            if(SceneEffectManager.DEBUG) {
                console.log(collect);
            }
        })();
    }
    
    /**
     * Hook updateScene
     * Applies scene effects to all tokens on the scene if:
     * - the user is a GM
     * - the scene was changed to be the active scene
     * @param {Scene} scene                                 The existing Document which was updated
     * @param {object} changed                              Differential data that was used to update the document
     * @param {Partial<DatabaseUpdateOperation>} options    Additional options which modified the update request
     * @param {string} userId                               The ID of the User who triggered the update workflow
     * @returns {void}
     */
    static updateSceneHook(scene, changed, options, userId) {
        if(!game.user.isGM
            || changed.active !== true
        ) return;

        (async () => {
            const promises = [];
            for(const token of scene.tokens) {
                promises.push(SceneEffectManager.applySceneEffectsToActor(token, scene).then(result => ({
                    [token.actor.uuid]: result
                })));
            }
            const collect = await Promise.all(promises);
            if(SceneEffectManager.DEBUG) {
                const combinedResults = Object.assign({}, ...collect);
                console.log(combinedResults);
            }
        })();
    }

    /**
     * Determines wheter a token is a valid target to add scene effects to.
     * @param {Token} token     The token to validate
     * @returns {boolean}       True if the token is valid, false if not.
     */
    static isValidToken(token) {
        return token.actor instanceof Actor 
            && !ItemPiles.API.isValidItemPile(token);
    }

    /**
     * @typedef {object} ApplyEffectsReturnObject
     * @property {ActiveEffect[] | null} created    An array of created active effects.
     * @property {ActiveEffect[] | null} deleted    An array of deleted active effects.
     */

    /**
     * Removes all other scene effects from the actor and applies the ones from the current scene.
     * @param {Token} token                         The token to which scene effects should be applied.
     * @param {Scene} scene                         The effects of this scene should be applied.
     * @return {Promise<ApplyEffectsReturnObject>}  The results of the operation.
     */
    static async applySceneEffectsToActor(token, scene) {
        if(!SceneEffectManager.isValidToken(token)) return;
        const actor = token.actor;

        const sceneEffectUuids = SceneEffectManager.getEffectUuids(scene);

        const effectUuidsToApply = new Set(sceneEffectUuids);
        const effectObjectsToAdd = [];
        const effectsToRemove = [];

        //iterate over actor effects to decide which ones to apply and which ones to skip
        for(const effect of actor.appliedEffects) {
            const effectFlag = effect.flags[MODULE.ID]?.[SceneEffectManager.effectFlagKey];
            //skip effects that are not sceneEffects
            if(!effectFlag) continue;

            //make sure already applied effects with the same sourceEffectUuid are not applied again
            if(sceneEffectUuids.has(effectFlag.sourceEffectUuid)) {
                effectUuidsToApply.delete(effectFlag.sourceEffectUuid);
                continue;
            }

            //remove all other scene effects
            effectsToRemove.push(effect);
        }
        
        //iterate over effectUuidsToApply
        for(const effectUuid of effectUuidsToApply) {
            //get the effect object
            const effectObj = await SceneEffectManager.#getSceneEffectObject(effectUuid);
            

            //add flag
            const effectFlag = {
                "sourceSceneUuid": scene.uuid,
                "sourceEffectUuid": effectUuid,
            }
            effectObj.flags[MODULE.ID] ??= {};
            effectObj.flags[MODULE.ID][SceneEffectManager.effectFlagKey] = effectFlag;

            //add the effect object to promises to create all at once later
            effectObjectsToAdd.push(effectObj);
        }

        //finally, if no errors occurred, prepare the updates
        const returnObj = {
            created: null,
            deleted: null,
        };
        if(effectsToRemove.length) {
            const removeIds = effectsToRemove.map(e => e.id);
            returnObj.deleted = await ActiveEffect.deleteDocuments(removeIds, {parent: actor});
        }
        if(effectObjectsToAdd.length) {
            returnObj.created = await ActiveEffect.createDocuments(effectObjectsToAdd, {parent: actor});
        }
        return returnObj;
    }

    /**
     * 
     * @param {string} effectUuid           The uuid of the active effect.
     * @returns {Promise<object | null>}    The plain object of the active effect or null if none was found.
     */
    static async #getSceneEffectObject(effectUuid) {
        const effect = await fromUuid(effectUuid);
        if(!effect) {
            throw new Error(`Invalid argument: effectUuid ["${effectUuid}"] could not be found.`);
        }
        return effect.toObject();
    }

    /**
     * @param {Actor} actor                         The actor from which scene effects should be removed.
     * @returns {Promise<ActiveEffect[] | null>}    An array of active effects that were deleted or null if none were deleted. 
     */
    static async removeAllSceneEffectsFromActor(actor) {
        const effectsToDelete = [];
        for(let effect of actor.appliedEffects) {
            const effectFlag = effect.flags[MODULE.ID]?.[SceneEffectManager.effectFlagKey];
            //skip effects that are not sceneEffects
            if(!effectFlag) continue;
            effectsToDelete.push(effect);
        }
        if(!effectsToDelete.length) return null;
        
        const deleteIds = effectsToDelete.map(e => e.id);
        return await ActiveEffect.deleteDocuments(deleteIds, {parent: actor});
    }

    /**
     * Adds the given effectUuids to the scene.
     * @param {Scene} scene                 The scene to which the effect uuids should be added.
     * @param {string[]} effectUuids        An array of uuids of active effects to add to the scene.
     * @returns {Promise<Scene>}            The scene to which the effect uuids were added.
     */
    static async setEffects(scene, effectUuids = []) {
        const sceneEffectUuids = SceneEffectManager.getEffectUuids(scene);
        for(let effectUuid of effectUuids) {
            if(!effectUuid.includes("ActiveEffect")) {
                throw new Error(`Invalid argument: effectUuid ["${effectUuid}"] does not belong to an active effect.`);
            }
            sceneEffectUuids.add(effectUuid);
        }
        return SceneEffectManager.#setEffectsFlag(scene, sceneEffectUuids);
    }

    /**
     * Removes the given effectUuids from the scene; or removes all.
     * @param {Scene} scene                 The scene from which the effect uuids should be removed.
     * @param {string[]} effectUuids        An array of uuids of active effects to remove from the scene.
     * @param {boolean} [unsetAll=false]    Should all scene effects on the given scene be removed?
     * @returns {Promise<Scene>}            The scene from which the effect uuids were removed.
     */
    static async unsetEffects(scene, effectUuids = [], unsetAll = false) {
        const sceneEffectUuids = unsetAll ? new Set() : SceneEffectManager.getEffectUuids(scene);
        if(!unsetAll) {
            for(let effectUuid of effectUuid) {
                sceneEffectUuids.delete(effectUuid);
            }
        }
        return SceneEffectManager.#setEffectsFlag(scene, sceneEffectUuids);
    }

    /**
     * Sets the flag on the scene
     * @param {Scene} scene                 The scene to which the effect uuids should be added.
     * @param {Set<string>} effectUuidsSet  A set of active effect uuids to add to the scene.
     * @returns {Promise<Scene>}            The scene to which the effect uuids were added.
     */
    static async #setEffectsFlag(scene, effectUuidsSet) {
        const flagArray = Array.from(effectUuidsSet);
        return scene.setFlag(MODULE.ID, SceneEffectManager.sceneFlagKey, flagArray);
    }

    /**
     * Gets a Set of all scene effect uuids of the given scene.
     * @param {Scene} scene         The scene of which to get the effect uuids for.
     * @returns {Set<string>}       Set of sceneEffectUuids or an empty set if none exist.
     */
    static getEffectUuids(scene) {
        const flagArray = scene.flags[MODULE.ID]?.[SceneEffectManager.sceneFlagKey] ?? [];
        return new Set(flagArray);
    }

    static hasSceneEffects(scene) {
        return !!scene.flags[MODULE.ID]?.[SceneEffectManager.sceneFlagKey]?.length
    }
}
