export default {
    register() {
        register_masterOfChance();
        register_aSeriesOfUnfortunateEvents();
    }
}

/**
 * Registers the preRollSkill hook for Master of Chance.
 * Triggers only when the actor has an the item with the same name and only 8.33% of the time (1 in 12).
 */
function register_masterOfChance() {
    Hooks.on("dnd5e.preRollSkill", (actor, rollData, skillId) => {
        let item = actor.items.getName("Master of Chance");
        if(!item || Math.random() > 0.0833) return;     //1d12 = 8.33% chance
        rollData.parts.push(`(5 * @abilities.cha.mod)`);
    });
}

/**
 * Registers the setup => createChatMessage hook for "A Series Of Unfortunate Events".
 * Triggers when the d20 of an initiative roll lands on a 1 or on a 20 and under the following conditions:
 * - The triggering token is visible
 * - The triggering token is not of friendly disposition (disposition !== 1)
 * - The combat exists and is active
 * - Plex is in the combat
 * - Plex has the feature
 */
function register_aSeriesOfUnfortunateEvents() {
    /**
     * Callback function triggered when the "createChatMessage" hook is called.
     * @param {ChatMessage} message  Chat message being rendered.
     * @param {object} options       
     * @param {string} userId       
     */
    async function chatMessageRenderHook(message, options, userId) {
        if(!message.flags.core?.initiativeRoll) return;

        const d20result = (() => {
            const term0 = message.rolls[0]?.terms?.[0];
            const activeResult = term0?.results?.find(result => result.active && !result.discarded);
            return activeResult ? activeResult.result : 0;
        })();

        //return if the result is not a nat 1 or a nat 20
        if(d20result !== 1 && d20result !== 20) return;

        //make sure only visible tokens of non-friendly disposition can trigger it
        const triggerTokenDoc = game.scenes.get(message.speaker.scene)?.tokens?.get(message.speaker.token);
        if(!triggerTokenDoc || triggerTokenDoc.hidden || triggerTokenDoc.disposition === 1) return;

        //check if Plex is in the combat
        const combat = game.combats.active;
        const plexCombatant = combat?.combatants?.find(c => c.name.includes("Plex"));
        if(!plexCombatant) return;

        //get the feature
        const plexActor = game.actors.get(plexCombatant.actorId);
        const featureItem = plexActor.itemTypes.feat.find(i => i.name === "A Series of Unfortunate Events");
        if(!featureItem) return;

        //use the feature and add the name of the triggering token to the message
        const card = await featureItem.use({},{createMessage: false});
        card.flavor = `<h3><strong>${triggerTokenDoc.name} ${d20result === 1 ? "dies!" : "duplicates!"}</strong></h3>`;
        await ChatMessage.implementation.create(card);
    }

    Hooks.once("setup", () => {
        if(!game.user.isGM) return;     //trigger only on GM client
        Hooks.on("createChatMessage", chatMessageRenderHook);
    });
}
