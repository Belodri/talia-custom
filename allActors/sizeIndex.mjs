import { MODULE } from "../scripts/constants.mjs";

export default {
    _onInit() {
        actorSizeIndexToConfig();
        addFlagKeysToDAE();
        Hooks.on("applyActiveEffect", customFlagsATLandSize);
    },
    _onSetup() {
        Hooks.on("updateActor", setSizeFlag);
        //Hooks.on("applyActiveEffect", updateActorSizeOnFlagUpdate);
    }
}

/**
 * Adds an index value to each size category inside CONFIG.DND5E
 */
function actorSizeIndexToConfig() {
    CONFIG.DND5E.actorSizes.grg.index = 5;
    CONFIG.DND5E.actorSizes.huge.index = 4;
    CONFIG.DND5E.actorSizes.lg.index = 3;
    CONFIG.DND5E.actorSizes.med.index = 2;
    CONFIG.DND5E.actorSizes.sm.index = 1;
    CONFIG.DND5E.actorSizes.tiny.index = 0;
}

function addFlagKeysToDAE() {
    Hooks.on("dae.modifySpecials", (specKey, specials, characterSpec) => {
        if(["npc", "character"].includes(specKey)) {
            specials["flags.talia-custom.actorSizeIndex"] = ["",2];
            specials["flags.talia-custom.modifyTokenHeight"] = ["", 0];
            specials["flags.talia-custom.modifyTokenWidth"] = ["", 0];
            specials["flags.talia-custom.modifyActorSize"] = ["", 0];
        }
    })
}



/*
    Make a custom active effect which sets ATL.width and ATL.height to match the actorSizeFlag (override), as well as sets the actor's size category
    This is fine since apart from the changes ATL makes, everything else is just in memory.
*/

function customFlagsATLandSize(actor, change, current, delta, changes) {
    if (!['flags.talia-custom.modifyTokenHeight', 'flags.talia-custom.modifyTokenWidth', 'flags.talia-custom.modifyActorSize'].includes(change.key)) return;

    console.log(actor);


    /*  TODO
            While testing I found that the actor that is provided to the hook is not the same as the actor that's in memory.
            I think the actor in the hook is the _source of the actor.
            That means I need another way to reference a value that is altered by an active effect...
    */



    const flagValue = actor.flags?.[MODULE.ID]?.actorSizeIndex;
    if(typeof flagValue !== "number") return;   //sizeIndex can be 0

    //lock the sizeIndex to 0 to 5
    const sizeIndex = Math.max(0, Math.min(flagValue, 5));

    //get the category name ('med', 'sm', etc)
    const adjustedSizeCategory = Object.keys(CONFIG.DND5E.actorSizes).find(key => CONFIG.DND5E.actorSizes[key].index === sizeIndex);


    change.mode = 5;    // OVERRIDE (same for all)
    switch (change.key) {
        case "flags.talia-custom.modifyTokenHeight":
            change.key = "ATL.height";
            change.value = `${CONFIG.DND5E.actorSizes[adjustedSizeCategory].token || 1}`;
            break;
        case "flags.talia-custom.modifyTokenWidth":
            change.key = "ATL.width";
            change.value = `${CONFIG.DND5E.actorSizes[adjustedSizeCategory].token || 1}`;
            break;
        case "flags.talia-custom.modifyActorSize":
            change.key = "system.traits.size";
            change.value = `${adjustedSizeCategory}`;
            break;
    }
}

/**
 * Sets the actorSizeIndex flag on the actor when it's updated if 
 */
function setSizeFlag(actor, data, options, userId) {
    if(userId !== game.user.id) return;

    const currentFlag = actor.flags?.[MODULE.ID]?.actorSizeIndex;
    const newSize = data?.system?.traits?.size;

    /*
        set the flag if
            - no flag present
            - newSize is defined AND newSizeIndex is different from currentFlag
    */
    if((currentFlag === undefined) || (typeof newSize !== "undefined" && CONFIG.DND5E.actorSizes[newSize].index !== currentFlag)) {
        actor.setFlag(MODULE.ID, "actorSizeIndex", CONFIG.DND5E.actorSizes[actor.system.traits.size].index);
    }
}

