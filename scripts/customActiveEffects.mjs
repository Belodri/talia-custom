export default {
    _onInit() {
        sizeIndex();
    }
}
/**
 * used to change an actor's size, stacks with other effects
 * @example 
 * `active effect: "flags.talia-custom.sizeIndex" | CUSTOM | "+1"
 * value can be + or - followed by any other string
 * if the rest of the string cannot be converted to a number, no change is made`
 */
function sizeIndex() {
    Hooks.on("applyActiveEffect", (actor, change) => {
        if(change.key !== "flags.talia-custom.sizeIndex") return;
    
        change.value = change.value.trim();
        const mod = change.value[0];
        if(!["+","-"].includes(mod)) return;
        
        const indexChange = Number(change.value.substring(1));
        if(!indexChange) return;
        
        const SIZES_ORDERED = ['tiny', 'sm', 'med', 'lg', 'huge', 'grg'];
        const indexOld = SIZES_ORDERED.indexOf(actor.system.traits.size);
        

        const calc = change.value[0] === "+" ? indexOld + indexChange : indexOld - indexChange;
        const newIndex = Math.max(0, Math.min(calc, SIZES_ORDERED.length - 1));

        const newSize = SIZES_ORDERED[newIndex];
        actor.system.traits.size = newSize;
        return true;
    });

    Hooks.on("dae.modifySpecials", (specKey, specials, characterSpec) => {
        if(["npc", "character"].includes(specKey)) {
            specials["flags.talia-custom.sizeIndex"] = ["",0];
        }
    })
}