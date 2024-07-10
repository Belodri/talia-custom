import { MODULE } from "../scripts/constants.mjs";

/**
 * Prevents the actor sheet from being maximised after an ability template has been placed.
 */
export default {
    _onLibWrapperReady() {
        libWrapper.register(MODULE.ID, 'dnd5e.applications.actor.ActorSheet5e.prototype.maximize', 
            async function(wrapped, ...args) {
                if(game.user.getFlag(MODULE.ID, 'preventActorSheetMax')) return;
                else return wrapped(...args);
            }, "MIXED"
        );

        libWrapper.register(MODULE.ID, 'dnd5e.canvas.AbilityTemplate.prototype._finishPlacement', 
            async function(wrapped, ...args) {
                //set flag on user to disable maximising the sheet
                await game.user.setFlag(MODULE.ID, 'preventActorSheetMax', true);
                //call the original
                const ret = await wrapped(...args);
                //unset flag on user to enable maximising the sheet again
                await game.user.unsetFlag(MODULE.ID, 'preventActorSheetMax')
                return ret;
            }, "WRAPPER"
        );
    }
}