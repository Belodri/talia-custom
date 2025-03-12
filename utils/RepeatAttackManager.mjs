import { MODULE } from "../scripts/constants.mjs";
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
    }

    /**
     * Registers necessary hooks for GMs only.
     */
    static init() {
        Hooks.once("ready", () => {
            if(!game.user.isGM) return;

            Manager.registerRenderItemSheetHooks();
            Hooks.on("dnd5e.preRollAttack", Manager.onDnd5ePreRollAttack);
            Hooks.on("dnd5e.preRollDamage", Manager.onDnd5ePreRollDamage);
        });
    }

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
    static getAttackCount(item) {
        if(!Manager.isValidAttackItem(item)) return null;

        const attackCount = item.getFlag(MODULE.ID, Manager.CONFIG.flagKeys.itemAttackCount) ?? 1;
        return Math.max(attackCount, 1);
    }

    /*----------------------------------------------------------------------------
                    Item Sheet           
    ----------------------------------------------------------------------------*/
    //#region 
    static registerRenderItemSheetHooks() {
        Hooks.on("renderItemSheet5e", (app, html, {item}={}) => {
            if (app.options.classes.includes("tidy5e-sheet")) return;

            const attackCount = Manager.getAttackCount(item);
            if(!attackCount) return;

            const extraCritDmgElem = html.find('div[data-form-group-for="system.critical.damage"]');
            if(!extraCritDmgElem) return;

            $(Manager.getAttackCountFieldHTML(attackCount)).insertAfter(extraCritDmgElem);
        });

        Hooks.on("tidy5e-sheet.renderItemSheet", (app, element, {item}, forced) => {
            //change item sheet
            const html = $(element);

            const attackCount = Manager.getAttackCount(item);
            if(!attackCount) return;

            const extraCritDmgElem = html.find('div[data-form-group-for="system.critical.damage"]');
            if(!extraCritDmgElem) return;

            const markupToInject = `
                    <div style="display: contents;" data-tidy-render-scheme="handlebars">
                        ${Manager.getAttackCountFieldHTML(attackCount)}
                    </div>
                `;
            $(markupToInject).insertAfter(extraCritDmgElem);
        });
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
        const attackCount = Manager.getAttackCount(item);

        // If attack count > 1, call the attack handler and return false to stop the original attack
        if(attackCount > 1) {
            Manager.handleAttacks(item, config, attackCount);  //async
            return false;
        }
    }

    /**
     * 
     * @param {Item5e} item 
     * @param {D20RollConfiguration} rollConfig 
     * @param {number} attackCount 
     */
    static async handleAttacks(item, rollConfig, attackCount) {
        const attackRolls = await Manager.rollAttacks(rollConfig, attackCount);
        if(!attackRolls) return;
        const message = await Manager.createAttackSummaryMessage(item, attackRolls, rollConfig);
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
            const roll = new CONFIG.Dice.D20Roll(firstRoll.formula, firstRoll.data, otherRollConfig);
            promises.push( roll.evaluate({ allowInteractive: (roll.options.rollMode ?? defaultRollMode) !== CONST.DICE_ROLL_MODES.BLIND }) );
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
        const newMsg = await ChatMessage.implementation.create(msgDataObj);

        // For the damage roll part, just look for the last chat message from the same originating message id 
        // and work out the hits and crits from there.
    }
    //#endregion

    /*----------------------------------------------------------------------------
                    Damage Rolls            
    ----------------------------------------------------------------------------*/
    //#region 
    /**
     * @param {Item5e} item 
     * @param {DamageRollCon} rollConfig
     */
    static onDnd5ePreRollDamage(item, rollConfig) {
        const messageId = rollConfig.event?.currentTarget?.closest('[data-message-id]')?.dataset?.messageId;
        if(!messageId) return;

        const attackRollMessage = Manager.getAttackRollMessage(messageId);
        if(attackRollMessage) {
            Manager.handleDamage(attackRollMessage, rollConfig);  //async
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
     * @param {ChatMessage5e} attackRollMessage 
     * @param {DamageRollConfiguration} damageRollConfig 
     */
    static async handleDamage(attackRollMessage, damageRollConfig) {
        const damageRolls = await Manager.rollDamageRolls(attackRollMessage, damageRollConfig);
        const message = await Manager.createDamageSummaryMessage(damageRolls, attackRollMessage, damageRollConfig);        
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
