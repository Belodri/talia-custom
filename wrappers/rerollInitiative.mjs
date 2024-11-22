import { MODULE } from "../scripts/constants.mjs";
export default {
    registerWrapper() {
        libWrapper.register(MODULE.ID, "Combat.prototype._onEndRound", wrap_Combat_prototype__onEndRound, "WRAPPER");
    }
}


async function wrap_Combat_prototype__onEndRound(wrapped, ...args) {
    await wrapped(...args);

    const isPlaceholder = (combatant) => combatant.flags["monks-combat-details"]?.placeholder ? true : false;
    const getInitativeOrder = () => this.combatants
        .map(c => ({_id: c._id, initiative: c.initiative, isPlaceholder: isPlaceholder(c)}))
        .sort((a, b) => a.initiative - b.initiative);

    

    

    /*
        - Reroll initiatives
        - update active effect durations of all combatants to match the new initiative
    */

    const previousInitiativeOrder = getInitativeOrder();

    const combatantIds = this.combatants.filter(c => !isPlaceholder(c)).map(c => c.id);
    await this.rollInitiative(combatantIds, {updateTurn: false});

    const newInitiativeOrder = getInitativeOrder();


    for(let combatantId of combatantIds) {
        const combatant = this.combatants.get(combatantId);
        const actor = combatant.actor;

        //go through all active effects applied on the actor and update their duration if needed
        let updates = [];
        for(let effect of actor.appliedEffects) {
            //skip any effects that don't have a duration or that won't expire next round
            if(
                (effect.duration?.type === "none") ||
                (effect.duration.type === "seconds" && effect.duration.remaining > 7) || 
                (effect.duration.type === "turns" && effect.duration.remaining > 1)
            ) continue;

            const start = {
                round: effect.duration.startRound,
                turn: effect.duration.startTurn,
            };

            //set the duration 
        }

    }
}


/*
    Would need to update a custom version of times-up to handle the disabling of effects based on combatant instead of time.
*/


class AE_CombatTracker {
    static init() {
        if(!game.user.isGM) return;
        Hooks.on("combatStart", (combat, updateData) => {
            
        })
    }
    static startCombat(combat) {

    }
}