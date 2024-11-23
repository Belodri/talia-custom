import { TaliaCustomAPI } from "../scripts/api.mjs"

export default {
    regsiter() {
        TaliaCustomAPI.add({daeMacro_sizeChange}, "Macros");
    }
}

/**
 *
 */
async function daeMacro_sizeChange(...args) {
    const lastArg = args[args.length-1];
    const steps = typeof args[1] === "number" ? args[1] : 0;
    const actor = game.actors.get(lastArg.actorId);
    const token = canvas.scene.tokens.get(lastArg.tokenId);
    
    const SIZES_ORDERED = ["tiny", "sm", "med", "lg", "huge", "grg"];
    const size = actor.system.traits.size;
    const index = SIZES_ORDERED.indexOf(size);
    
    const newIndex = args[0] === "on" ? Math.max(0, Math.min(SIZES_ORDERED.length - 1, index + steps)) :
        args[0] === "off" ? Math.max(0, Math.min(SIZES_ORDERED.length - 1, index - steps)) : index;
    
    const newSize = SIZES_ORDERED[newIndex];
    const newTokenSize = CONFIG.DND5E.actorSizes[newSize].token ?? 1;

    const promises = [
        actor.update({"system.traits.size": newSize}),
        token.update({height: newTokenSize, width: newTokenSize})
    ];
    await Promise.all(promises);
}
