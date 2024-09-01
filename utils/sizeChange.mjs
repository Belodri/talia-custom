import { TaliaCustomAPI } from "../scripts/api.mjs"

export default {
    regsiter() {
        TaliaCustomAPI.add({daeMacro_sizeChange}, "Macros");
    }
}

async function daeMacro_sizeChange(...args) {
    const lastArg = args[args.length-1];
    const isGrow = args[2] === "grow" ? true : args[2] === "shrink" ? false : null;
    if(isGrow === null) throw new Error("arg[2] invalid");
    const steps = typeof args[1] === "number" ? args[1] : 0;

    const actor = game.actors.get(lastArg.actorId);
    const token = canvas.scene.tokens.get(lastArg.tokenId);

    const SIZES_ORDERED = ["tiny", "sm", "med", "lg", "huge", "grg"];

    const size = actor.system.traits.size;
    const index = SIZES_ORDERED.indexOf(size);

    const growIndex = (sizeIndex, num) => Math.min(SIZES_ORDERED.length - 1, sizeIndex + num);
    const shrinkIndex = (sizeIndex, num) => Math.max(0, sizeIndex - num);

    let newIndex = index;
    if(args[0] === "on") {
        newIndex = isGrow ? growIndex(index, steps) : shrinkIndex(index, steps);
    } else if(args[0] === "off") {
        newIndex = isGrow ? shrinkIndex(index, steps) : growIndex(index, steps);
    } else return;

    const newSize = SIZES_ORDERED[newIndex];
    const newTokenSize = CONFIG.DND5E.actorSizes[newSize].token ?? 1;

    const promises = [
        actor.update({"system.traits.size": newSize}),
        token.update({height: newTokenSize, width: newTokenSize})
    ];
    await Promise.all(promises);
}