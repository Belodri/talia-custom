import { MODULE } from "../scripts/constants.mjs";
import Socket from "../scripts/Socket.mjs";

export default {
    register() {
        TetherEssence.init();
    }
}

class TetherEssence {
    static CONFIG = {
        effectName: "Tether Essence",
        animFuncs: {
            beam: null,
            flare: null,
        }
    }

    static init() {
        Hooks.once("ready", () => {
            if(game.user !== game.users.activeGM) return;

            Hooks.on("createActiveEffect", TetherEssence.onCreateEffect);
            Hooks.on("deleteActiveEffect", TetherEssence.onDeleteEffect);
        })
        Hooks.on("_dnd5e.onCallApplyDamage", TetherEssence.onCallApplyDamage);
        Socket.register("tetherGmApplyDamage", TetherEssence.gmApplyDamage);
        TetherEssence.CONFIG.animFuncs = {
            beam: TetherEssence.beamAnimation,
            flare: TetherEssence.flareAnimation
        }

    }

    /**
     * Socket function to apply damage to the given actor.
     * @param {string} actorUuid
     * @param {DamageDescription[]|number} damages 
     * @param {DamageApplicationOptions} options 
     * @returns {Promise<Actor>}    A Promise which resolves once the damage has been applied.
     */
    static async gmApplyDamage(actorUuid, damages, options) {
        const actor = fromUuidSync(actorUuid);  
        if( !(actor instanceof Actor) ) return;
        return await actor.applyDamage(damages, options);
    }

    /**
     * Hook on `_dnd5e.onCallApplyDamage`
     * 
     * If the damaged actor is under the effect of Tether Essence,
     * shares the damage with the other tethered actor.
     * Avoids potential race conditions by flagging the damage instance.
     * @param {Actor} actor 
     * @param {DamageDescription[]|number} damages 
     * @param {DamageApplicationOptions} options 
     * @returns {void}
     */
    static async onCallApplyDamage(actor, damages, options={}) {
        if(options.tetherTracked) return;   // Avoids race condition.

        const effect = actor.appliedEffects.find(e => e.name === TetherEssence.CONFIG.effectName);
        if(!effect) return;

        const otherEffect = TetherEssence.#getOtherTetherEffect(effect);
        if(!otherEffect) return;

        const otherActorUuid = otherEffect.uuid.split(".").slice(0, 2).join(".");

        const damagesClone = foundry.utils.deepClone(damages);
        const optionsClone = foundry.utils.deepClone(options);
        optionsClone.tetherTracked =  true;

        const otherActor = await Socket.executeAsGM("tetherGmApplyDamage", otherActorUuid, damagesClone, optionsClone);
        if(otherActor && TetherEssence.CONFIG.animFuncs.flare) {
            await TetherEssence.CONFIG.animFuncs.flare(actor, otherActor);
        }
    }

    /**
     * Gets the counterpart to the given tetherEffect.
     * @param {ActiveEffect} tetherEffect 
     * @returns {ActiveEffect}
     */
    static #getOtherTetherEffect(tetherEffect) {
        const otherUuid = tetherEffect.getFlag(MODULE.ID, "tetherPartnerEffect");
        if(!otherUuid) return null;

        const otherEffect = fromUuidSync(otherUuid); 
        return otherEffect instanceof ActiveEffect 
            ? otherEffect
            : null;
    }

    /**
     * GM only
     * 
     * Sets the tetherPartnerEffect flags on valid effects with the same origin,
     * if they are created within 5s of one another.
     * Starts the beam animation if one exists. 
     * @param {ActiveEffect} effect 
     * @returns {Promise<void>}
     */
    static async onCreateEffect(effect) {
        if(effect.name !== TetherEssence.CONFIG.effectName) return;

        const otherEffect = TetherEssence.#getTrackedPartner(effect);
        if(!otherEffect) return;

        await effect.setFlag(MODULE.ID, "tetherPartnerEffect", otherEffect.uuid);
        await otherEffect.setFlag(MODULE.ID, "tetherPartnerEffect", effect.uuid);

        if(TetherEssence.CONFIG.animFuncs.beam) {
            await TetherEssence.CONFIG.animFuncs.beam([effect, otherEffect]);
        }
    }

    /**
     * GM only
     * 
     * If one tether effect is deleted, this deletes the other.
     * @param {ActiveEffect} effect 
     * @returns {Promise<void>}
     */
    static async onDeleteEffect(effect) {
        if(effect.name !== TetherEssence.CONFIG.effectName) return;
        try {
            const other = TetherEssence.#getOtherTetherEffect(effect);
            if(other) await other.delete();
        } catch(e) {    // Will happen very often so we just print a warning.
            console.warn(`Error deleting tether partner:`, e);
        }  
    }

    static #tracked = new Map();

    /**
     * Gets the tracked partner of a given effect.
     * If none is found, tracks the effect instead.
     * @param {ActiveEffect} effect 
     * @returns {ActiveEffect|null} Either the partner effect or null if none is found.
     */
    static #getTrackedPartner(effect) {
        const origin = effect.origin;

        const otherEffect = TetherEssence.#tracked.get(origin);
        if(otherEffect) {
            TetherEssence.#tracked.delete(origin);
            return otherEffect;
        }
        
        TetherEssence.#tracked.set(origin, effect);
        setTimeout(() => {
            TetherEssence.#tracked.delete(origin);
        }, 5000);

        return null;
    }

    /**
     * Default beam animation for two given effects.
     * @param {ActiveEffect[]} effects 
     */
    static async beamAnimation(effects) {
        const tokenA = effects[0].parent?.getActiveTokens?.()?.[0];
        const tokenB = effects[1].parent?.getActiveTokens?.()?.[0];
        if(!tokenA || !tokenB) return;

        new Sequence({ moduleName: "Talia-Custom" })
            .effect()
            .file("jb2a.energy_beam.normal.bluepink.03")
            .attachTo(tokenA)
            .stretchTo(tokenB, {attachTo: true})
            .fadeIn(900, {ease: "easeInOutQuint"})
            .fadeOut(2000)
            .persist()
            .tieToDocuments(effects)
            .tint("#FF0000")
            .opacity(0.3)
            .playbackRate(0.7)

            .effect()
            .file("jb2a.energy_beam.normal.bluepink.03")
            .attachTo(tokenB)
            .stretchTo(tokenA, {attachTo: true})
            .fadeIn(900, {ease: "easeInOutQuint"})
            .fadeOut(2000)
            .persist()
            .tieToDocuments(effects)
            .tint("#FF0000")
            .opacity(0.3)
            .playbackRate(0.7)

            .play();
    }

    /**
     * Default flare animation for two affected actors.
     * @param {Actor} sourceActor   The source of the shared damage
     * @param {Actor} targetActor   The target of the shared damage
     */
    static async flareAnimation(sourceActor, targetActor) {
        const sourceToken = sourceActor.getActiveTokens()[0];
        const targetToken = targetActor.getActiveTokens()[0];

        new Sequence({ moduleName: "Talia-Custom" })
            .effect()
            .file("jb2a.energy_beam.normal.bluepink.03")
            .attachTo(sourceToken)
            .stretchTo(targetToken, {attachTo: true})
            .fadeIn(500, {ease: "easeInOutQuint"})
            .fadeOut(2000)
            .duration(3000)
            .tint("#FF0000")
            .play();
    }
}
