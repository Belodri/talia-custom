


function addSizeIndexToConfig() {
    CONFIG.DND5E.actorSizes.grg.index = 5;
    CONFIG.DND5E.actorSizes.huge.index = 4;
    CONFIG.DND5E.actorSizes.lg.index = 3;
    CONFIG.DND5E.actorSizes.med.index = 2;
    CONFIG.DND5E.actorSizes.sm.index = 1;
    CONFIG.DND5E.actorSizes.tiny.index = 0;
}

async function enlarge(token, steps = 1) {
    const rollData = token.actor.getRollData();
    const newSizeIndex = Math.min( 0, Math.max( 5, CONFIG.DND5E.actorSizes[rollData.traits.size].index + steps));

    //find AE "Altered Size" or create one if not there (using dFred's CE)
    /*
        Each effect that changes an actor's size only changes the values of the "Altered Size" AE
        Those values are:
        - system.traits.size
        - ATL.height
        - ATL.width
    */

    let effect = rollData.effects.find(e => e.name === "Altered Size") ?? game.dfreds.effectInterface.findEffect({effectName: ""})
}