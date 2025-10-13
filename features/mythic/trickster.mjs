import { MODULE } from "../../scripts/constants.mjs";
import ChatCardButtons from "../../utils/chatCardButtons.mjs";
import { Helpers } from "../../utils/helpers.mjs";

/** 
 * @import { Actor5e, Item5e } from "../../system/dnd5e/module/documents/_module.mjs";
 */

export default {
    register() {
        register_masterOfChance();
        register_aSeriesOfUnfortunateEvents();
        register_convincingArguments();
        BorrowedLuck.register();
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
    async function rollDeception(item) {
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
                callback: ({item}) => rollDeception(item)
            }
        ]
    });
}

class BorrowedLuck {
    static #CONFIG = {
        anchorId: "players",
        elementId: "borrowed-luck",
        elementStyles: {
            "display": "block",
            "width": "var(--players-width)",
            "margin": "0 5px 5px 15px",
            "padding": "0",
            "padding-inline": "10px",
            "border": "1px solid var(--color-border-dark)",
            "backgroundColor": 'rgba(0, 0, 0, 0.7)',
            "color": 'white',
            "border-radius": "5px",
            "pointer-events": "all"
        },
        entryStyles: {
            "display": "block"
        }
    }

    /** @type {HTMLElement} */
    static #element;

    /** @type {Map<string, HTMLSpanElement>} */
    static #displayedItems = new Map();

    static register() {
        Hooks.on("dnd5e.useItem", (item) => {
            if(BorrowedLuck.#isValidItem(item)) BorrowedLuck.#createRollMessage(item);
        });

        Hooks.once("ready", () => {
            if(game.user.isGM) {
                BorrowedLuck.#initDisplay();
                Hooks.on("updateItem", BorrowedLuck.#onUpdateItem);
            }
        });
    }

    static #initDisplay() {
        const element = BorrowedLuck.#createRootElement();

        const { anchorId } = BorrowedLuck.#CONFIG;
        const anchorElement = document.getElementById(anchorId);
        if (!anchorElement) throw new Error(`Anchor element with id "${anchorId}" not found`);
        anchorElement.parentElement.insertBefore(element, anchorElement);

        BorrowedLuck.#element = element;

        for(const actor of game.actors) {
            const item = actor.items.find(BorrowedLuck.#isValidItem);
            if(item) BorrowedLuck.#updateItemSpan(item);
        }
    }

    static #onUpdateItem(item, changed) {
        if(typeof changed?.system?.uses?.value !== "number") return;
        if(BorrowedLuck.#isValidItem(item)) BorrowedLuck.#updateItemSpan(item);
    }

    /**
     * @param {Item5e} item 
     * @returns {boolean}
     */
    static #isValidItem(item) {
        return item?.name === "Borrowed Luck"
            && item.system?.type?.value === "mythic"
            && item.actor;
    }

    /** @param {Item5e} item  */
    static #updateItemSpan(item) {
        const span = BorrowedLuck.#displayedItems.get(item.uuid) ?? (() => {
            const spanEle = BorrowedLuck.#createItemSpanElement(item);
            BorrowedLuck.#element.appendChild(spanEle);
            BorrowedLuck.#displayedItems.set(item.uuid, spanEle);
            return spanEle;
        })();


        const { value, max } = item.system.uses;
        const gmUses = max - value;
        span.textContent = `GM ${gmUses} - ${value} ${item.actor.name}`;
    }

    static #createRootElement() {
        const { anchorId, elementId, elementStyles } = BorrowedLuck.#CONFIG;

        const element = document.createElement("div");
        element.id = elementId;
        Object.assign(element.style, elementStyles);
        return element;
    }

    /** @param {Item5e} item  */
    static #createItemSpanElement(item) {
        const span = document.createElement("span");
        span.dataset.borrowedLuckItemUuid = item.uuid;
        Object.assign(span.style, BorrowedLuck.#CONFIG.entryStyles);

        span.addEventListener("click", BorrowedLuck.#onClick);

        return span;
    }

    /** @param {MouseEvent} event  */
    static async #onClick(event) {
        const uuid = event.currentTarget.dataset?.borrowedLuckItemUuid;
        if(!uuid) return;

        const item = fromUuidSync(uuid, { strict: false });
        if(!(item instanceof dnd5e.documents.Item5e)) return;

        event.preventDefault();

        const { value, max } = item.system.uses;
        const gmUses = max - value;

        if(gmUses) {
            await item.update({"system.uses.value": item.system.uses.value + 1});
            await BorrowedLuck.#createRollMessage();
        } else ui.notifications.warn("No GM uses remaining.");
    }

    static async #createRollMessage(item = undefined) {
        const roll = await new Roll("1d20").evaluate();

        const chatData = {
            user: game.user.id,
            flavor: `<h2>Borrowed Luck${item ? "" : " - GM"}</h2>`,
            content: roll.total,
            speaker: item ? ChatMessage.getSpeaker({ actor: item.actor, token: item.actor.token }) : { alias: game.user.name },
            rolls: [roll]
        };

        ChatMessage.applyRollMode(chatData, CONFIG.Dice.rollModes.publicroll);
        await ChatMessage.create(chatData);
    }
}
