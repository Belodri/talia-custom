import { MODULE } from "../scripts/constants.mjs";
import { WildMagic } from "../world/wildMagic/wildMagic.mjs";
import { Helpers } from "./helpers.mjs";

/** @typedef {import("../system/dnd5e/module/documents/item.mjs").default} Item5e */
/** @typedef {import("../system/dnd5e/module/documents/chat-message.mjs").default} ChatMessage5e */
/** @typedef {import("../system/dnd5e/module/dice/d20-roll.mjs").default} D20Roll */
/** @typedef {import("../system/dnd5e/module/dice/dice.mjs").D20RollConfiguration} D20RollConfiguration */
/** @typedef {import("../system/dnd5e/module/dice/damage-roll.mjs").default} DamageRoll*/
/** @typedef {import("../system/dnd5e/module/dice/dice.mjs").DamageRollConfiguration} DamageRollConfiguration */

export default {
    register() {
        Multiattack.init();
    }
}

class Multiattack {
    static CONFIG = {
        itemFlag: "repeatAttack.itemAttackCount",
        attackActionTypes: ["mwak", "msak", "rwak", "rsak"],
        maxRepeatAttacks: 10,
        timeoutInMs: 60000,
    }

    /**
     * Hook on `init`
     * 
     * Handles initialisation and registration of hooks.
     * @returns {void}
     */
    static init() {
        Hooks.on("renderItemSheet5e", Multiattack.onRender5eSheet);
        Hooks.on("tidy5e-sheet.renderItemSheet", Multiattack.onRenderTidySheet);
        Hooks.on("renderChatMessage", Multiattack.onRenderChatMessage5e);

        const timedHookName = game.modules.get("babonus")?.active
            ? "babonus.initializeRollHooks"
            : "ready";

        Hooks.once(timedHookName, () => {
            Hooks.on("dnd5e.preDisplayCard", Multiattack.preDisplayCard);
            Hooks.on("dnd5e.preRollAttack", Multiattack.onPreRollAttack);
            Hooks.on("dnd5e.preRollDamage", Multiattack.onPreRollDamage);
        });
    }


    //#region Instance Tracking

    /** @type {Map<string, Multiattack>} Map of itemUuids to Multiattack instances */
    static #tracked = new Map();

    /** @returns {Map<string, Multiattack>} Map of itemUuids to Multiattack instances  */
    static get tracked() { return Multiattack.#tracked; }

    /**
     * Tracks a new instance and sets its timer.
     * @param {Multiattack} instance 
     */
    static track(instance) {
        const itemUuid = instance.baseItem.uuid;
        this.#tracked.set(itemUuid, instance);
        instance.setTimer();
    }

    /**
     * Untracks a tracked instance and re-enables 
     * its multiattack button if it is disabled.
     * @param {Multiattack | string} instanceOrUuid 
     */
    static untrack(instanceOrUuid) {
        const instance = instanceOrUuid instanceof Multiattack
            ? instanceOrUuid
            : this.#tracked.get(instanceOrUuid);
        if(instance?.multiattackButton?.disabled) instance.multiattackButton.disabled = false;

        const itemUuid = instance?.baseItemUuid ?? instanceOrUuid;
        this.#tracked.delete(itemUuid);
    }

    //#endregion


    //#region Attack and Damage Hook Handlers

    /**
     * Hook on `dnd5e.preRollAttack`
     * 
     * If a tracked instance for the triggering item is found
     * and the instance is awaiting an attack hook,
     * the `_onAttack` method of that instance is called
     * and the triggering hook is cancelled.
     * @param {Item5e} item 
     * @param {D20RollConfiguration} config
     */
    static onPreRollAttack(item, config) {
        const instance = Multiattack.tracked.get(item.uuid);
        if(!instance?.awaitsAttackHook) return;

        instance._onAttack(config); //async
        return false;   //return false to cancel the hook
    }

    /**
     * Hook on `dnd5e.preRollDamage`
     * 
     * If a tracked instance for the triggering item is found
     * and the instance is awaiting a damage hook,
     * the `_onDamage` method of that instance is called
     * and the triggering hook is cancelled.
     * @param {Item5e} item 
     * @param {DamageRollConfiguration} config 
     */
    static onPreRollDamage(item, config) {
        const instance = Multiattack.tracked.get(item.uuid);
        if(!instance?.awaitsDamageHook) return;

        instance._onDamage(config); //async
        return false;  //return false to cancel the hook
    }

    //#endregion


    //#region Item Sheet Integration

    /**
     * Hook event `tidy5e-sheet.renderItemSheet`
     * 
     * Adds the attack count field to the tidy item sheet of valid items.
     * @param {TidyItemSheet} app 
     * @param {HTMLElement} element 
     * @param {object} data 
     * @returns {void}
     */
    static onRenderTidySheet(app, element, data) {
        const item = data.item;
        if(!Multiattack.isValidItem(item)) return;

        const targetEle = element.querySelector('div[data-form-group-for="system.critical.damage"]');
        if(!targetEle) return;

        const wrapperDiv = document.createElement("div");
        wrapperDiv.style = "display: contents";
        wrapperDiv.dataset.tidyRenderScheme = "handlebars"; // "data-tidy-render-scheme" in html
        wrapperDiv.innerHTML = Multiattack.#getAttackCountFieldHTML(item);

        targetEle.after(wrapperDiv);
    }

    /**
     * Hook event `renderItemSheet5e`
     * 
     * Adds the attack count field to the default item sheet of valid items.
     * @param {ItemSheet5e} app 
     * @param {JQuery} html 
     * @param {object} data 
     * @returns {void}
     */
    static onRender5eSheet(app, html, data) { 
        if (app.options.classes.includes("tidy5e-sheet")) return;
        const item = data.item;
        if(!Multiattack.isValidItem(item)) return;

        const targetEle = html[0].querySelector?.('div[data-form-group-for="system.critical.damage"]');
        if(!targetEle) return;

        targetEle.insertAdjacentHTML('afterend', Multiattack.#getAttackCountFieldHTML(item));
    }

    /**
     * Gets a HTML string of the number input
     * for the attack count field on item sheets.
     * @param {Item5e} item 
     * @returns {string}
     */
    static #getAttackCountFieldHTML(item) {
        return new foundry.data.fields.NumberField({
            label: "Attack Count",
            min: 0,
            initial: 1,
            integer: true,
        }).toFormGroup({}, {
            name: `flags.${MODULE.ID}.${Multiattack.CONFIG.itemFlag}`,
            value: Multiattack.getItemAttackCount(item),
        }).outerHTML;
    }

    //#endregion

    
    //#region Chat Card Integration

    /**
     * Hook on `dnd5e.renderChatMessage`
     * 
     * Adds the message id to the dataset and
     * adds the eventListener for the multiattack button
     * @param {ChatMessage5e} message 
     * @param {JQuery} html
     * @returns {void}
     */
    static onRenderChatMessage5e(message, html) {
        const button = html[0].querySelector("[data-action^='talia-repeat-attack']");
        if(!button) return;

        button.dataset.messageId = message.id;
        button.addEventListener("click", Multiattack.onMultiAttackButton);
    }

    /**
     * Hook on `dnd5e.preDisplayCard`
     * 
     * Adds the multiattack button to the chatCards of valid items.
     * @param {Item5e} item 
     * @param {object} chatData 
     * @param {ItemUseOptions} options 
     * @returns {void}
     */
    static preDisplayCard(item, chatData, options) {
        if(!Multiattack.isValidItem(item)) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(chatData.content, "text/html");

        let buttonSection = doc.querySelector(".card-buttons");
        if(!buttonSection) {
            buttonSection = doc.createElement("div");
            buttonSection.className = "card-buttons";
            doc.querySelector("div.chat-card")
                .insertBefore(buttonSection, doc.querySelector("section.card-header").nextSibling);
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

    /**
     * Handles initialisation of the workflow when the multiattack button is clicked
     * @param {MouseEvent} event 
     * @returns {Promise<void>}
     */
    static async onMultiAttackButton(event) {
        event.preventDefault();
        event.currentTarget.true = false;

        try {
            Multiattack.#verifyTarget();
            const baseArgs = await Multiattack.#getBaseArgs(event);
            new Multiattack(baseArgs)
                .startWorkflow();   //async
        } catch(err) {
            event.currentTarget.disabled = false;
            Multiattack.onError(err, "onMultiAttackButton");
        }
    }


    //#endregion


    //#region Utils

    /**
     * Notifies the user of unexpected errors and logs them to console.
     * If an instance is provided, also untracks that instance (even if the error is expected).
     * @param {Error} err                   
     * @param {string} methodName           The name of the method which caught the error.
     * @param {Multiattack} [instance=null] If provided, untracks that instance.
     * @returns {void}
     */
    static onError(err, methodName, instance=null) {
        if(instance) Multiattack.untrack(instance);

        if(!err.isExpected) {
            ui.notifications.error(`Multiattack error in: ${methodName}. See developer console for more details.`);
            console.error(err);
        }
    }

    /**
     * Tests if the user is targeting exactly one token,
     * displaying a warning and throwing an expected error if not.
     * @returns {boolean}
     */
    static #verifyTarget() {
        if(game.user.targets.size !== 1) {
            ui.notifications.warn("Multiattack feature only supports attacks against a single target.");
            throw {isExpected: true}
        }

        return true;
    }

    /**
     * Gets the base arguments from a mouse event.
     * @param {MouseEvent} event 
     * @returns {Promise<MulitattackArgs>}
    */
    static async #getBaseArgs(event) {
        const multiattackButton = event.currentTarget;
        if( !(multiattackButton instanceof EventTarget) ) throw new Error(`Multiattack: Multiattack button not instanceof EventTarget.`);

        const messageId = multiattackButton.closest(".chat-card")
            ?.closest?.(".message")?.dataset?.messageId;
        if(!messageId) throw new Error(`Multiattack: Unable to get messageId.`);

        const baseMessage = game.messages.get(messageId);
        if( !(baseMessage instanceof ChatMessage) ) throw new Error(`Multiattack: Unable to get message id "${messageId}".`);

        const baseItem = baseMessage.getAssociatedItem();
        if( !(baseItem instanceof Item) ) throw new Error(`Multiattack: Unable to get associated item from message id "${messageId}".`);

        const baseArgs = {
            baseEvent: event,
            multiattackButton,
            baseMessage,
            baseItem,
        };

        if(event.ctrlKey) baseArgs.damageOnly = true;
        else if(event.shiftKey) baseArgs.attackCount = Multiattack.getItemAttackCount(baseItem);
        else {
            baseArgs.attackCount = await Multiattack.attackCountDialog(baseItem, { 
                top: event.clientY - 80,        // Same relative positions as hardcoded in the system
                left: window.innerWidth - 710
            });
        }

        return baseArgs;
    }    

    /**
     * Does the item have both:
     * - an attack actionType
     * - not an area-type targetType
     * @param {Item} item 
     * @returns {boolean}
     */
    static isValidItem(item) {
        return Multiattack.CONFIG.attackActionTypes.includes(item?.system?.actionType)
            && !Object.keys(CONFIG.DND5E.areaTargetTypes).includes(item?.system?.target?.type);
    }

    /**
     * Gets the attack count of an item from its flag.
     * @param {Item5e} item 
     * @returns {number}    The attack count of the item, or 0 flag isn't set.
     */
    static getItemAttackCount(item) {
        const attackCount = item.getFlag(MODULE.ID, Multiattack.CONFIG.itemFlag) ?? 0;
        return Math.max(attackCount, 0);
    }

    /**
     * Simulates a click event on center of the target button.
     * @param {HTMLElement} targetButton 
     * @returns {void}
     */
    static simulateClick(targetButton) {
        const boundingRect = targetButton.getBoundingClientRect();

        const simulatedClick = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: boundingRect.left + (targetButton.offsetWidth / 2),
            clientY: boundingRect.top + (targetButton.offsetHeight / 2)
        });
        targetButton.dispatchEvent(simulatedClick);
    }

    /**
     * Gets the card buttons for the target of
     * a given mouse event which match the selectors.
     * @param {MouseEvent} event 
     * @param {string} selectors    Valid CSS selectors for `querySelectorAll`
     * @returns {NodeList<HTMLElement> | null}
     */
    static getCardButtons(event, selectors) {
        const cardSelectors = `.card-buttons ${selectors}`;
        const button = event?.target
            ?.closest?.(".chat-card")
            ?.querySelectorAll?.(cardSelectors);
        return button ?? null;
    }

    /**
     * Create a chat message from an array of rolls and a matching config.
     * The created message is set to originate from the message of the given baseMsgId.
     * If the `diceSoNice` module is active, waits for the roll animation to finish.
     * @param {D20Roll[] | DamageRoll[]} rolls 
     * @param {D20RollConfiguration | DamageRollConfiguration} config 
     * @param {string} baseMsgId 
     * @returns {Promise<ChatMessage5e>}
     */
    static async createRollMessage(rolls, config, baseMsgId) {
        const msgData = foundry.utils.expandObject(config.messageData);
        foundry.utils.setProperty(msgData, "flags.dnd5e.originatingMessage", baseMsgId);

        const msgDataObj = await rolls[0].toMessage(msgData, {create: false});

        msgDataObj.rolls = rolls.map(r => JSON.stringify( r.toJSON() ) );
        const msg = await ChatMessage.implementation.create(msgDataObj);

        if( msg && game.modules.get("dice-so-nice")?.active ) {
            await game.dice3d.waitFor3DAnimationByMessageID(msg.id);
        }

        return msg;
    }

    //#endregion


    //#region Dialogs

    /**
     * Prompts the user to choose the number of attacks
     * @param {Item5e} item 
     * @param {{top: number, left: number}} position    Position of the dialog window.
     * @returns {Promise<number | null>} Positive integer or null, if the dialog was cancelled.
     */
    static async attackCountDialog(item, position={}) {
        const content = new foundry.data.fields.NumberField({
            min: 1,
            integer: true,
            required: true,
            max: Multiattack.CONFIG.maxRepeatAttacks,
            label: "# of attacks"
        }).toFormGroup({}, {
            name: "count", 
            value: Multiattack.getItemAttackCount(item),
        }).outerHTML;

        return foundry.applications.api.DialogV2.prompt({
            window: { title: `Multiattack: ${item.name}` },
            content,
            rejectClose: false,
            modal: true,
            position,
            ok: {
                callback: (event, button) => new FormDataExtended(button.form)?.object?.count ?? null
            }
        });
    }

    /**
     * Prompts the user to choose from one of multiple buttons.
     * @param {NodeList<HTMLElement>} buttons 
     * @param {string} label                            Label of the select option in the dialog.
     * @param {{top: number, left: number}} position    Position of the dialog window.
     * @returns {Promise<HTMLElement>}
     */
    static async chooseButtonDialog(buttons, label, position={}) {
        const choices = {};
        buttons.forEach((btn, index) => choices[index] = btn.textContent.trim());

        const content = new foundry.data.fields.StringField({
            choices,
            label,
            required: true,
        }).toFormGroup({}, { 
            name: "buttonIndex", 
            value: choices[0]
        }).outerHTML;

        const chosenIndex = await foundry.applications.api.DialogV2.prompt({
            content,
            rejectClose: false,
            modal: true,
            position,
            ok: {
                callback: (event, button) => new FormDataExtended(button.form)?.object?.buttonIndex ?? null
            }
        });
        const button = buttons[chosenIndex];
        if(!button) throw { isExpected: true };

        return button;
    }

    //#endregion


    //#region Instance

    /**
     * @typedef {object} MulitattackArgs
     * @property {MouseEvent} baseEvent             The event that triggered the multiattack.
     * @property {ChatMessage5e} baseMessage        The chat message with the multiattack button.
     * @property {Item5e} baseItem                  The item with which the multiattack is made.
     * @property {EventTarget} multiattackButton    The base multiattack button.
     * @property {number} [attackCount=0]           The number of attacks to be made.
     * @property {boolean} [damageOnly=false]       Should attacks be skipped and instead only damage for 
     *                                              the last multiattack message of this item be rolled? 
     */

    /** @param {MulitattackArgs} args  */
    constructor({baseEvent, baseMessage, baseItem, multiattackButton, attackCount=0, damageOnly=false}) {
        this.baseEvent = baseEvent
        this.baseMessage = baseMessage;
        this.baseItem = baseItem;
        this.baseItemUuid = baseItem.uuid;
        this.multiattackButton = multiattackButton;
        this.attackCount = attackCount;
        this.damageOnly = damageOnly;
    }

    /** @type {boolean} Does the instance expect _onAttack() can be called next? */
    awaitsAttackHook = false;

    /** @type {boolean} Does the instance expect _onDamage() can be called next? */
    awaitsDamageHook = false;

    /** @type {D20Roll[]} Array of evaluated attack rolls */
    attackRolls = [];

    /**
     * Debounced function so an instance
     * untracks itself if unused for too long.
     */
    setTimer = foundry.utils.debounce(() => {
        Multiattack.untrack(this)
    }, Multiattack.CONFIG.timeoutInMs);

    //#endregion


    //#region Workflow


    /**
     * Tracks the instance and starts the workflow by 
     * simulating a click on the card's attack button.
     * @returns {Promise<void>}
     */
    async startWorkflow() {
        if(!this.damageOnly && !this.attackCount) return;

        Multiattack.track(this);
        if(this.damageOnly) return this._onAttack();

        try {
            const buttons = Multiattack.getCardButtons(this.baseEvent, 'button[data-action="attack"]');
            const attackButton = buttons.length > 1
                ? await Multiattack.chooseButtonDialog(buttons, "Choose Attack", {
                    // Same relative position as hardcoded in the system
                    top: this.baseEvent.clientY - 80,
                    left: window.innerWidth - 710
                })
                : buttons[0];

            this.awaitsAttackHook = true;
            Multiattack.simulateClick(attackButton);   
        } catch(err) {
            Multiattack.onError(err, "startWorkflow", this);
        }
    }

    /**
     * Called by `Multiattack.onPreRollAttack` after `startWorkflow`
     * 
     * Handles attack rolls before advancing the workflow by 
     * simulating a click on the chosen damage button.
     * @param {D20RollConfiguration} [config]   Optional if damageOnly.
     * @returns {Promise<void>}
     */
    async _onAttack(config={}) {
        this.setTimer();
        this.awaitsAttackHook = false;

        try {
            this.attackRolls = this.damageOnly
                ? this.#getLatestAttackRolls()
                : await this.#rollAttackRolls(config);

            // End early if none of the attacks hit of the array is empty.
            if(!this.attackRolls.some(r => Helpers.isRollSuccess(r))) {
                await this.endWorkflow();
                return;
            }

            const buttons = Multiattack.getCardButtons(this.baseEvent, 'button[data-action*="damage"]');
            const damageButton = buttons.length > 1
                ? await Multiattack.chooseButtonDialog(buttons, "Choose Damage", {
                    // Same relative position as hardcoded in the system
                    top: config.event ? config.event.clientY - 80 : null,
                    left: window.innerWidth - 710
                })
                : buttons[0];

            this.awaitsDamageHook = true;
            Multiattack.simulateClick(damageButton);
        } catch(err) {
            Multiattack.onError(err, "_onAttack", this);
        }
    }

    /**
     * Called by `Multiattack.onPreRollDamage` after `_onAttack`
     * 
     * Handles damage rolls before advancing the workflow to end.
     * @param {DamageRollConfiguration} config 
     * @returns {Promise<void>}
     */
    async _onDamage(config) {
        this.setTimer();
        this.awaitsDamageHook = false;

        try {
            await this.#rollDamageRolls(config);
            this.endWorkflow();
        } catch(err) {
            Multiattack.onError(err, "_onDamage", this);
        } 
    }

    /**
     * Ends the workflow by handling wild magic and 
     * untracking the instance.
     * @returns {Promise<void>}
     */
    async endWorkflow() {
        try {
            await this.#handleWildMagic();
        } catch(err) {
            Multiattack.onError(err, "endWorkflow");
        } finally {
            Multiattack.untrack(this);
        }
    }

    //#endregion

    /**
     * Gets the attack rolls from the latest attack message from this baseMessage.
     * Shows a warning and returns an empty array if no such message can be found.
     * @returns {D20Roll[]}  
     */
    #getLatestAttackRolls() {
        const lastAttackMsg = game.messages.contents
            .reverse()
            .find(m => 
                m.flags?.dnd5e?.originatingMessage === this.baseMessage.id
                && m.flags?.dnd5e?.roll?.type === "attack"
                && m.rolls.length
            );

        if(!lastAttackMsg) ui.notifications.warn("Unable to find attacks for this message.");
        return lastAttackMsg?.rolls ?? [];
    }    

    /**
     * Rolls the attack rolls of this multiattack and creates the chatMessage.
     * User configures the first roll which the remaining rolls then use as a template.
     * @param {D20RollConfiguration} config   Attack roll configuration from `dnd5e.preRollAttack` hook
     * @returns {Promise<D20Roll[]>}
     */
    async #rollAttackRolls(config) {
        const attackConfig = foundry.utils.mergeObject(config, { 
            chatMessage: false 
        }, { inplace: false });

        // Roll first roll normally so the user can configure advantage mode, etc.
        const firstRoll = await dnd5e.dice.d20Roll(attackConfig);
        if(firstRoll === null) throw { isExpected: true };

        /*
            Calling firstRoll.reroll() or firstRoll.clone().evaluate() doesn't work
            because that skips the D20Roll#configureModifiers() call in D20Roll since the roll
            would already be configured.
            
            The issue stems from the fact that cloning a D20Roll does not 
            clone the options property of the first dice term in the roll.
            That means any subsequent logic relying on the existance of
            those options would not work (chat message rendering for example).

            The workaround is to just manually create new rolls from the first one;
         */

        const { flavor, advantageMode, defaultRollMode, rollMode, critical,
            fumble, targetValue, elvenAccuracy, halflingLucky, reliableTalent
        } = firstRoll.options;

        const promises = [];
        for(let i = 1; i < this.attackCount; i++) {  //start at 1 because the first roll has already been made
            const roll = new CONFIG.Dice.D20Roll( firstRoll.formula, 
                firstRoll.data, 
                { flavor, advantageMode, defaultRollMode, rollMode, critical,
                    fumble, targetValue, elvenAccuracy, halflingLucky, reliableTalent }
            );

            promises.push( roll.evaluate({
                allowInteractive: (roll.options.rollMode ?? roll.options.defaultRollMode) !== CONST.DICE_ROLL_MODES.BLIND 
            }) );
        }

        const remainingRolls = await Promise.all(promises);
        const attackRolls = [
            firstRoll, ...remainingRolls
        ];

        await Multiattack.createRollMessage(attackRolls, attackConfig, this.baseMessage.id);
        return attackRolls;
    }

    /**
     * Rolls the damage rolls of this multiattack for all attacks that hit
     * and creates the chatMessage.
     * The resulting array includes both critical 
     * and non-critical rolls, in the same order as the attacks.
     * @param {DamageRollConfiguration} config 
     * @returns {Promise<DamageRoll[]>}
     */
    async #rollDamageRolls(config) {
        const damageConfig = foundry.utils.mergeObject(config, { 
            chatMessage: false,
            fastForward: true,
            critical: false
        }, { inplace: false });

        const promises = this.attackRolls
            .filter(r => Helpers.isRollSuccess(r))
            .map(r => {
                const cfg = foundry.utils.deepClone(damageConfig);
                cfg.critical = r.isCritical;
                return dnd5e.dice.damageRoll(cfg);
            });

        const damageRolls = await Promise.all(promises);
        await Multiattack.createRollMessage(damageRolls, damageConfig, this.baseMessage.id);
        return damageRolls;
    }

    /**
     * Handles interactions with the WildMagic system.
     * @returns {Promise<void>}
     */
    async #handleWildMagic() {
        if(!this.damageOnly && WildMagic.canSurge(this.baseItem)) {
            // Start at 1 to account for the original item use
            for(let i = 1; i < this.attackCount; i++) {
                if( WildMagic.surgeCheck() ) await WildMagic.surge(this.baseItem.actor);
            }
        }
    }
}
