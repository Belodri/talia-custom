import { _foundryHelpers } from "./_foundryHelpers.mjs";

export function _registerEffectFunctionsToSocket(socket) {
    socket.register('talia_addActiveEffect', talia_addActiveEffect);
}

export const taliaEffectHelpers = {
    createActiveEffect
}


/**
 * Adds the effect with the provided name to an actor matching the provided
 * UUID
 *
 * @param {object} params - the effect parameters
 * @param {object} params.effect - the object form of an ActiveEffect to add
 * @param {string} params.uuid - the uuid of the actor to add the effect to
 * @param {string} params.origin - the origin of the effect
 * @param {boolean} params.overlay - if the effect is an overlay or not
 */
async function talia_addActiveEffect({effect, uuid, origin, overlay}) {
    const actor = _foundryHelpers.getActorByUuid(uuid);

    const activeEffectsToApply = [];
    activeEffectsToApply.push(effect);

    if(origin) {
        effect.origin = origin;
    }

    if(overlay) {
        let coreFlags = {
            core: {
                overlay,
            },
        };
        effect.flags = foundry.utils.mergeObject(effect.flags, coreFlags);
    }

    const retProm = await actor.createEmbeddedDocuments('ActiveEffect', activeEffectsToApply);
    console.log(`Talia-Custom: Added ActiveEffect ${effect.name} to ${actor.name} - ${actor.id}`);
    return retProm;
}




function createActiveEffect({
    name,
    description = '',
    icon = 'icons/svg/aura.svg',
    duration = {},
    tint = null,
    seconds = null,
    rounds = null,
    turns = null,
    origin = null,
    changes = [],
    atlChanges = []
}) {
    changes.push(...atlChanges);
    let effectDuration = isEmpty(duration)
      ? {
          rounds,
          seconds,
          turns,
        }
      : duration;

    let effect = new CONFIG.ActiveEffect.documentClass({
        changes,
        description,
        disabled: false,
        duration: effectDuration,
        icon,
        name,
        origin,
        tint,
        transfer: false
    });
    return effect;
}