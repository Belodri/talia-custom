import { MODULE } from "../scripts/constants.mjs";
import { WildMagic } from "../world/wildMagic/wildMagic.mjs";
import { Helpers } from "./helpers.mjs";

/** @typedef {import("../system/dnd5e/module/documents/item.mjs").default} Item5e */
/** @typedef {import("../system/dnd5e/module/dice/dice.mjs").D20RollConfiguration} D20RollConfiguration */
/** @typedef {import("../system/dnd5e/module/dice/dice.mjs").DamageRollConfiguration} DamageRollConfiguration */
/** @typedef {import("../system/dnd5e/module/dice/d20-roll.mjs").default} D20Roll */
/** @typedef {import("../foundry/client-esm/dice/terms/operator.mjs").default} OperatorTerm*/
/** @typedef {import("../system/dnd5e/module/documents/chat-message.mjs").default} ChatMessage5e */
/** @typedef {import("../system/dnd5e/module/dice/damage-roll.mjs").default} DamageRoll*/

export default {
    register() {
        Manager.init();
    }
}


class Manager {
    static CONFIG = {
        flagKeys: {
            itemAttackCount: "repeatAttack.itemAttackCount",
        },
        validActionTypes: ["mwak", "msak", "rwak", "rsak"],
        maxRepeatAttacks: 10,
    }

    static attackUuidToCount = new Map();

    static registeredDamageItems = new Set();

    /**
     * Registers necessary hooks for GMs only.
     */
    static init() {
        Hooks.on("renderItemSheet5e", Manager.onRenderItemSheet5e);
        Hooks.on("tidy5e-sheet.renderItemSheet", Manager.onRenderTidy5eItemSheet);
        Hooks.on("dnd5e.preDisplayCard", Manager.onDnd5ePreDisplayCard);
        Hooks.on("renderChatMessage", Manager.onRenderChatMessage);
        Hooks.on("dnd5e.preRollAttack", Manager.onDnd5ePreRollAttack);
        Hooks.on("dnd5e.preRollDamage", Manager.onDnd5ePreRollDamage);
    }

    /*----------------------------------------------------------------------------
                    Chat Card Buttons            
    ----------------------------------------------------------------------------*/
    //#region 

    static onRenderChatMessage(message, [html]) {
        const button = html.querySelector("[data-action^='talia-repeat-attack']");
        if(!button) return;

        button.dataset.messageId = message.id;
        button.addEventListener("click", Manager.buttonEventListener);
    }

    static onDnd5ePreDisplayCard(item, chatData, options) {
        const attackCount = Manager.getItemAttackCount(item);
        if(!attackCount) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(chatData.content, "text/html");

        let buttonSection = doc.querySelector(".card-buttons");
        if(!buttonSection) {
            buttonSection = doc.createElement("div");
            buttonSection.className = "card-buttons";
            doc.querySelector("div.chat-card").insertBefore(buttonSection, doc.querySelector("section.card-header").nextSibling);
        }

        const button = doc.createElement("button");
        button.type = "button";
        button.dataset.action = "talia-repeat-attack";
        const icon = doc.createElement("i");
        icon.className =`fas fa-solid fa-repeat`
        button.appendChild(icon);
        const span = doc.createElement("span");
        span.innerText = "Multiattack";
        button.appendChild(span);
        buttonSection.appendChild(button);

        chatData.content = doc.documentElement.innerHTML;
    }

    static async buttonEventListener(event) {
        event.preventDefault();
        const button = event.currentTarget;
        button.disabled = true;
        const card = button.closest(".chat-card");
        const messageId = card.closest(".message").dataset.messageId;
        const message = game.messages.get(messageId);

        try {
            if(game.user.targets.size !== 1) {
                ui.notifications.warn("Multiattack feature only supports attacks against a single target.");
                return;
            }

            const associatedItem = message.getAssociatedItem();
            const attackCount = await Manager.selectAttackCount(associatedItem, event);
            if(!attackCount) return;

            Manager.attackUuidToCount.set(associatedItem.uuid, attackCount);

            // Click the attack button to trigger the hook dnd5e.preRollAttack hook with the correct event.
            const parentDiv = button.closest('div');
            if(parentDiv) {
                const attackButton = parentDiv.querySelector('button[data-action="attack"]');
                if (attackButton) {
                    const simulatedClick = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        clientX: event.clientX,
                        clientY: event.clientY 
                    });
                    attackButton.dispatchEvent(simulatedClick);
                }
            }
        } catch (err) {
            // Handle and log any errors during execution
            ui.notifications.error("Repeat attack error");
            console.error(err);
        } finally {
            // Re-enable the button
            button.disabled = false;
        }
    }

    /**
     * 
     * @param {Item5e} item 
     * @param {Event} event 
     * @returns {Promise<number | null>}
     */
    static async selectAttackCount(item, event) {
        let attackCount = Manager.getItemAttackCount(item);
        if(!attackCount) return null;
        if(!event.shiftKey) return attackCount;

        const countFieldGroup = new foundry.data.fields.NumberField({
            min: 1,
            integer: true,
            required: true,
            max: Manager.CONFIG.maxRepeatAttacks,
            label: "# of attacks"
        }).toFormGroup({},{name: "count", value: attackCount}).outerHTML;

        return foundry.applications.api.DialogV2.prompt({
            window: { title: `${item.name} Multiattack` },
            content: countFieldGroup,
            rejectClose: false,
            modal: true,
            ok: {
                callback: (event, button) => new FormDataExtended(button.form).object?.count ?? null
            }
        });
    }

    //#endregion

    /*----------------------------------------------------------------------------
                    Utils            
    ----------------------------------------------------------------------------*/
    //#region 

    /**
     * Checks if a given item has both an attack action type and an individual-type targetType
     * @param {Item} item 
     */
    static isValidAttackItem(item) {
        return Manager.CONFIG.validActionTypes.includes(item?.system?.actionType)
            && Object.keys(CONFIG.DND5E.individualTargetTypes).includes(item?.system?.target?.type);
    }

    /**
     * Returns the set attack count of an item.
     * 
     * If the item is not valid, returns null;
     * If the item is valid but does not (yet) have an attack count set, returns default of 1.
     * @param {Item5e} item 
     * @returns {number | null} The attack count of the item, minimum of 1.
     */
    static getItemAttackCount(item) {
        if(!Manager.isValidAttackItem(item)) return null;

        const attackCount = item.getFlag(MODULE.ID, Manager.CONFIG.flagKeys.itemAttackCount) ?? 1;
        return Math.max(attackCount, 1);
    }
    //#endregion


    /*----------------------------------------------------------------------------
                    Item Sheet           
    ----------------------------------------------------------------------------*/
    //#region 
    static onRenderTidy5eItemSheet(app, element, {item}, forced) {
        //change item sheet
        const html = $(element);

        const attackCount = Manager.getItemAttackCount(item);
        if(!attackCount) return;

        const extraCritDmgElem = html.find('div[data-form-group-for="system.critical.damage"]');
        if(!extraCritDmgElem) return;

        const markupToInject = `
                <div style="display: contents;" data-tidy-render-scheme="handlebars">
                    ${Manager.getAttackCountFieldHTML(attackCount)}
                </div>
            `;
        $(markupToInject).insertAfter(extraCritDmgElem);
    }

    static onRenderItemSheet5e(app, html, {item}={}) {
        if (app.options.classes.includes("tidy5e-sheet")) return;

        const attackCount = Manager.getItemAttackCount(item);
        if(!attackCount) return;

        const extraCritDmgElem = html.find('div[data-form-group-for="system.critical.damage"]');
        if(!extraCritDmgElem) return;

        $(Manager.getAttackCountFieldHTML(attackCount)).insertAfter(extraCritDmgElem);
    }

    /**
     * @param {number} attackCount 
     * @returns {string}
     */
    static getAttackCountFieldHTML(attackCount) {
        return new foundry.data.fields.NumberField({
            label: "Attack Count",
            min: 0,
            initial: 1,
            integer: true,
        }).toFormGroup({}, {
            name: `flags.${MODULE.ID}.${Manager.CONFIG.flagKeys.itemAttackCount}`,
            value: attackCount,
        }).outerHTML;
    }
    //#endregion


    /*----------------------------------------------------------------------------
                    Attack Rolls            
    ----------------------------------------------------------------------------*/
    //#region 

    /**
     * @param {Item5e} item 
     * @param {D20RollConfiguration} config
     */
    static onDnd5ePreRollAttack(item, config) {
        const count = Manager.attackUuidToCount.get(item.uuid);
        if(!count) return;

        Manager.makeRepeatAttack(item, config, count)
            .then(() => Manager.attackUuidToCount.delete(item.uuid));
        
        return false;   //return false to cancel the hook
    }    

    /**
     * 
     * @param {Item5e} item 
     * @param {D20RollConfiguration} rollConfig 
     * @param {number} attackCount 
     */
    static async makeRepeatAttack(item, rollConfig, attackCount) {
        const attackRolls = await Manager.rollAttacks(rollConfig, attackCount);
        if(!attackRolls) return;
        const attackMsg = await Manager.createAttackSummaryMessage(item, attackRolls, rollConfig);

        // Check WMS triggers
        if(WildMagic.canSurge(item)) {
            for(let i = 1; i < attackCount; i++) {
                if( WildMagic.surgeCheck() ) await WildMagic.surge(item.actor);
            }
        }

        const attackEvent = rollConfig.event;
        Manager.triggerDamageRolls(attackEvent, attackMsg, item);    //async
    }

    /**
     * Rolls a number of attack rolls with the given config, without creating chat messages.
     * @param {D20RollConfiguration} rollConfig 
     * @param {number} attackCount 
     * @returns {Promise<D20Roll[]>}    A promise that resolves to an array of d20 rolls.
     */
    static async rollAttacks(rollConfig, attackCount) {
        const config = foundry.utils.mergeObject(rollConfig, { chatMessage: false });

        //roll first roll normally so we can let the user configure advantage mode, etc.
        const firstRoll = await dnd5e.dice.d20Roll(config);
        if(firstRoll === null) return;

        /*
            Calling firstRoll.reroll() or firstRoll.clone().evaluate() doesn't work
            because that skips the D20Roll#configureModifiers() call in D20Roll since the roll
            would already be configured.
            
            The issue stems from the fact that cloning a D20Roll does not 
            clone the options property of the first dice term in the roll.
            That means any subsequent logic relying on those options existing (chat message rendering for example),
            does not work.

            The workaround is to just manually create new rolls from the first one;
         */
        
        const otherRollConfig = Helpers.extractProperties(firstRoll.options, [
            "flavor", "advantageMode", "defaultRollMode", "rollMode", "critical", 
            "fumble", "targetValue", "elvenAccuracy", "halflingLucky", "reliableTalent"
        ]);

        const promises = [];
        for(let i = 1; i < attackCount; i++) {  //start at 1 because we already made the first roll

            const roll = new CONFIG.Dice.D20Roll(firstRoll.formula, firstRoll.data, foundry.utils.deepClone(otherRollConfig));
            promises.push( roll.evaluate({ allowInteractive: (roll.options.rollMode ?? roll.options.defaultRollMode) !== CONST.DICE_ROLL_MODES.BLIND }) );
        }

        return [
            firstRoll,
            ...await Promise.all(promises)
        ];
    }

    /**
     * 
     * @param {Item5e} item 
     * @param {D20Roll[]} attackRolls 
     * @param {D20RollConfiguration} rollConfig 
     */
    static async createAttackSummaryMessage(item, attackRolls, rollConfig) {
        // Attach original message ID to the message
        // This is normally done in d20Roll() but since that function only returns a roll instead of a chatMessage, 
        // we have to do it again here
        const messageData = foundry.utils.expandObject(rollConfig.messageData);
        const messageId = rollConfig.event?.target.closest("[data-message-id]")?.dataset.messageId;
        if( messageId ) foundry.utils.setProperty(messageData, "flags.dnd5e.originatingMessage", messageId);

        // Get an object of the first roll's message as a baseline to modify.
        const msgDataObj = await attackRolls[0].toMessage(messageData, {create: false});

        // Add other rolls to the message
        msgDataObj.rolls = attackRolls.map(r => JSON.stringify( r.toJSON() ) );

        const msg = await   ChatMessage.implementation.create(msgDataObj);

        //wait for dice roll animations
        await game.dice3d.waitFor3DAnimationByMessageID(msg.id);
        return msg;
    }
    //#endregion

    /*----------------------------------------------------------------------------
                    Damage Rolls            
    ----------------------------------------------------------------------------*/
    //#region 

    static async triggerDamageRolls(attackEvent, attackMsg, item) {
        if( !attackMsg.rolls.some(r => Helpers.isRollSuccess(r)) ) return;

        const button = attackEvent.currentTarget;
        const card = button.closest(".chat-card");

        //to account for rollgroups
        const damageButtons = card.querySelectorAll('.card-buttons button[data-action*="damage"]');
        if(!damageButtons) throw new Error("No damage buttons found.");

        const chosenButton = damageButtons.length > 1  
            ? await Manager.selectDamageButtonDialog(damageButtons)
            : damageButtons[0];
        if(!chosenButton) return;

        // Add register item so the preRollDamage listener can use it.
        Manager.registeredDamageItems.add(item.uuid);
        
        // Click the damage button to trigger the hook dnd5e.preRollDamage hook with the correct event.
        const simulatedClick = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: attackEvent.clientX,
            clientY: attackEvent.clientY 
        });
        chosenButton.dispatchEvent(simulatedClick);
    }

    /**
     * 
     * @param {HTMLButtonElement[]} damageButtons 
     */
    static async selectDamageButtonDialog(damageButtons) {
        const choices = {};
        damageButtons.forEach((btn, index) => choices[index] = btn.childNodes[1].textContent )  //get the text after the icon

        const buttonIndexField = new foundry.data.fields.StringField({
            choices,
            label: "Choose damage group",
        }).toFormGroup({}, {name: "buttonIndex"}).outerHTML;

        const chosenIndex = await foundry.applications.api.DialogV2.prompt({
            content: buttonIndexField,
            rejectClose: false,
            modal: true,
            ok: {
                callback: (event, button) => new FormDataExtended(button.form).object?.buttonIndex ?? null
            }
        });

        if(chosenIndex === null) return null;
        else return damageButtons[chosenIndex];
    }
 
    /**
     * @param {Item5e} item 
     * @param {DamageRollCon} rollConfig
     */
    static onDnd5ePreRollDamage(item, rollConfig) {
        if(!Manager.registeredDamageItems.has(item.uuid)) return;

        const messageId = rollConfig.event?.currentTarget?.closest('[data-message-id]')?.dataset?.messageId;
        if(!messageId) return;

        const attackRollMessage = Manager.getAttackRollMessage(messageId);
        if(attackRollMessage) {
            Manager.handleDamage(item.uuid, attackRollMessage, rollConfig);  //async
            return false;
        }
    }

    /**
     * @param {string} messageId 
     * @returns {ChatMessage5e}
     */
    static getAttackRollMessage(messageId) {
        const matchingMessages = game.messages.contents
            .filter(m => 
                m.flags?.dnd5e?.originatingMessage === messageId 
                && m.flags?.dnd5e?.roll?.type === "attack"
            );
        return matchingMessages.length > 1
            ? matchingMessages.sort((a, b) => b.timestamp - a.timestamp)[0]
            : matchingMessages[0];
    }

    /**
     * @param {string} itemUuid 
     * @param {ChatMessage5e} attackRollMessage 
     * @param {DamageRollConfiguration} damageRollConfig 
     */
    static async handleDamage(itemUuid, attackRollMessage, damageRollConfig) {
        const damageRolls = await Manager.rollDamageRolls(attackRollMessage, damageRollConfig);
        Manager.createDamageSummaryMessage(damageRolls, attackRollMessage, damageRollConfig)
            .then(() => Manager.registeredDamageItems.delete(itemUuid));
    }

    /**
     * 
     * @param {DamageRoll[]} damageRolls 
     * @param {ChatMessage5e} attackRollMessage 
     * @param {DamageRollConfiguration} damageRollConfig 
     * @returns {Promise<ChatMessage5e>}
     */
    static async createDamageSummaryMessage(damageRolls, attackRollMessage, damageRollConfig) {
        // Attach original message ID to the message
        // This is normally done in damageRoll() but since that function only returns a roll instead of a chatMessage, 
        // we have to do it again here
        const messageData = foundry.utils.expandObject(damageRollConfig.messageData);
        const messageId = attackRollMessage.id;
        if ( messageId ) foundry.utils.setProperty(messageData, "flags.dnd5e.originatingMessage", messageId);

        const msgDataObj = await damageRolls[0].toMessage(messageData, {create: false});

        // Add other rolls to the message
        msgDataObj.rolls = damageRolls.map(r => JSON.stringify( r.toJSON() ) );
        return await ChatMessage.implementation.create(msgDataObj);
    }

    /**
     * @param {ChatMessage5e} attackRollMessage 
     * @param {DamageRollConfiguration} damageRollConfig 
     * @returns {Promise<DamageRoll[]>}
     */
    static async rollDamageRolls(attackRollMessage, damageRollConfig ) {
        const config = foundry.utils.mergeObject(damageRollConfig, {
            chatMessage: false, 
            fastForward: true,
            critical: false,
        }, {inplace: false});

        const critConfig =  foundry.utils.mergeObject(config, {
            critical: true
        }, {inplace: false});

        const rollPromises = attackRollMessage.rolls
            .filter(r => Helpers.isRollSuccess(r))
            .map(r => dnd5e.dice.damageRoll(r.isCritical ? critConfig : config) )

        return Promise.all(rollPromises);
    }
    //#endregion
}
