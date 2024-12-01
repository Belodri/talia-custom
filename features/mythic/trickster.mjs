import { MODULE } from "../../scripts/constants.mjs";
import ChatCardButtons from "../../utils/chatCardButtons.mjs";
import { Helpers } from "../../utils/helpers.mjs";

export default {
    register() {
        register_masterOfChance();
        register_aSeriesOfUnfortunateEvents();
        register_convincingArguments();
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

/**
 * Registers a ChatCardButton of the item "Convincing Arguments".
 */
function register_convincingArguments() {
    /** Handles the deception roll and all following logic */
    async function rollDeception(item, card) {
        const target = game.user.targets.first();
        if(game.user.targets.size > 1 || !target?.actor) return ui.notifications.warn("Please target a single token.");
        
        //get conditions
        const conditionTypeKeys = Object.keys(CONFIG.DND5E.conditionTypes);
        const filteredStatuses = target.actor.statuses.intersection(new Set(conditionTypeKeys));

        //create the rolls and roll them
        const targetRD = target.actor.getRollData();
        const dc = targetRD.skills.ins.passive ?? 10;
        const rollResults = await Promise.all(
            filteredStatuses.map(async status => ({
                status,
                roll: await item.actor.rollSkill("dec", {
                    chooseModifier: false, 
                    targetValue: dc,
                    messageData: {
                        flavor: `Deception Skill Check (DC ${dc}): ${CONFIG.DND5E.conditionTypes[status].label}`
                    }
                })
            }))
        );

        // determine which status can get removed
        let hasNat20;
        const sortedStatuses = {
            toRemove: [], 
            toKeep: [], 
            invalid: []
        };

        for(let r of rollResults) {
            if(r === null) {
                sortedStatuses.invalid.push(r.status);
            }
            else if(r.roll.isCritical) {
                hasNat20 = true;
                break;
            }
            else if(Helpers.isRollSuccess(r.roll)) {
                sortedStatuses.toRemove.push(r.status);
            } else {
                sortedStatuses.toKeep.push(r.status);
            }
        }

        const messageContent = hasNat20 ? `<p><strong>Can be removed: ANY</strong> (${rollResults.map(r => r.status).join(", ")})</p>`
            : ` <p><strong>Can be removed:</strong> ${sortedStatuses.toRemove.join(", ") || "None"}</p>
                <p><strong>Cannot be removed:</strong> ${sortedStatuses.toKeep.join(", ") || "None"}</p>
                ${sortedStatuses.invalid.length ? `<p><strong>Cancelled Rolls (please resolve manually):</strong> ${sortedStatuses.invalid.join(", ")}</p>` : ""}
                `;
        
        await ChatMessage.implementation.create({
            content: messageContent,
            speaker: ChatMessage.implementation.getSpeaker({actor: item.actor}),
        });
    }

    ChatCardButtons.register({
        itemName: "Convincing Arguments",
        buttons: [
            {
                label: "Roll Deception",
                callback: (item, card) => rollDeception(item, card)
            }
        ]
    });
}
