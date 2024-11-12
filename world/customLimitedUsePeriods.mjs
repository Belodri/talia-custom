export default {
    register() {
        addPeriodsToConfig();

        Hooks.once("setup", () => {
            registerGMHook();
        });
    }
}

/*  CONSIDER IMPROVING
    If performance turns out to be an issue, the functionality could be achieved by adding a function to the Item5e class which listens for a hook and updates itself if necessary.
*/

/**
 * Adds limitedUsePeriods "turn" and "round" to CONFIG.DND5E
 * @returns {void}
 */
function addPeriodsToConfig() {
    CONFIG.DND5E.limitedUsePeriods.turn = {
        abbreviation: "Turn",
        label: "Turn"
    };
    CONFIG.DND5E.limitedUsePeriods.round = {
        abbreviation: "Round",
        label: "Round"
    };
}

/**
 * Registers a GM-only hook that triggers on every combat turn change.
 * The hook is responsible for resetting the uses of items that are limited by turn or round usage.
 * 
 * The hook filters for active, alive, and visible combatants, and then checks their items for those 
 * that need to be refreshed. Only items with a `system.uses.per` of "turn" or "round" (if applicable) 
 * and with fewer than their maximum allowed uses are updated.
 * 
 * This function should only be executed for Game Masters (GMs).
 * 
 * @returns {void} Returns immediately if the user is not a GM.
 */
function registerGMHook() {
    if(!game.user.isGM) return;

    Hooks.on("combatTurnChange", async (combat, prior, current) => {
        if(!combat.isActive || !combat.started) return;
        console.time("combatTurnChange Hook Duration");

        const isRoundChange = current.round !== prior.round;

        //filter alive, visible combatants and get their actors
        const actors = combat.combatants.filter(c => c.defeated === false && c.hidden === false && typeof c.actorId === "string").map(c => c.actor);

        for(let actor of actors) {
            //only check itemTypes which can have a system.uses property
            const itemTypes = actor.itemTypes;
            const itemsToCheck = [
                ...itemTypes.consumable, 
                ...itemTypes.container, 
                ...itemTypes.equipment, 
                ...itemTypes.feat, 
                ...itemTypes.spell, 
                ...itemTypes.tool, 
                ...itemTypes.weapon
            ];

            const itemUpdates = itemsToCheck  
                .filter(i => (i.system?.uses?.per === "turn" || (isRoundChange && i.system?.uses?.per === "round")) //filter items which have a turn (or round, if applicable) limitedUsePeriod
                    && i.system.uses.value < i.system.uses.max)     //and which have less uses available than their max
                .map(i => ({_id: i.id, "system.uses.value": i.system.uses.max}));   //set their uses to equal their max
            if(!itemUpdates.length) continue;
            Item.updateDocuments(itemUpdates, {parent: actor});
        }

        console.timeEnd("combatTurnChange Hook Duration");
    });
}