import { MODULE } from "../scripts/constants.mjs";
import { WildMagic } from "../world/wildMagic/wildMagic.mjs";

/** 
 * @import ChatMessage5e from "../system/dnd5e/module/documents/chat-message.mjs" 
 * @import { DatabaseCreateOperation } from "../foundry/common/abstract/_types.mjs"
 */

export default {
    register() {
        libWrapper.register(MODULE.ID, "CONFIG.Dice.D20Roll.prototype._onDialogSubmit", wrapped_CONFIG_Dice_D20Roll_prototype__onDialogSubmit, "WRAPPER");
        libWrapper.register(MODULE.ID, "CONFIG.Dice.DamageRoll.prototype._onDialogSubmit", wrapped_CONFIG_Dice_DamageRoll__onSubmitDialog, "WRAPPER");
        Hooks.on("dnd5e.renderChatMessage", multiRollCollapsible);
        Hooks.on("renderDialog", injectDialog);
        Hooks.on("preCreateChatMessage", onPreCreateChatMessage);
    }
}

/**
 * Extends ChatTrayElement which extends HTMLElement.
 * ChatTrayElement is not directly exported so we access it this way instead.
 */
class MultiRollElement extends Object.getPrototypeOf(dnd5e.applications.components.DamageApplicationElement) {
    /**
     * The chat message with which this damage is associated.
     * @type {ChatMessage5e}
     */
    chatMessage;

    /** @type {HTMLDivElement} */
    wrapperDiv;

    /** @type {NodeList} */
    rollNodes;

    /** @inheritdoc */
    connectedCallback() {
        // Fetch the associated chat message
        const messageId = this.closest("[data-message-id]")?.dataset.messageId;
        this.chatMessage = game.messages.get(messageId);
        if (!this.chatMessage) return;

        this.classList.add("dnd5e2");

        // Build the frame HTML only once
        if(this.wrapperDiv) return;

        const div = document.createElement("div");
        div.classList.add("card-tray", "talia-multi-tray", "collapsible");
        if (!this.open) div.classList.add("collapsed");
        div.innerHTML = `
            <label class="roboto-upper">
                <i class="fa-solid fa-dice"></i>
                <span>Details</span>
                <i class="fa-solid fa-caret-down"></i>
            </label>
            <div class="collapsible-content">
                <div class="wrapper">
                
                </div>
            </div>
        `;
        this.replaceChildren(div);
        this.wrapperDiv = div.querySelector(".wrapper");
        this.rollNodes?.forEach(n => this.wrapperDiv.appendChild(n));
        div.addEventListener("click", this._handleClickHeader.bind(this));
    }

    /**
     * Assigns individual dice roll DOM elements to be displayed within this tray.
     * @param {NodeList} nodeList 
     */
    setRollNodes(nodeList) {
        this.rollNodes = nodeList;
    }
}

window.customElements.define("multi-roll-tray", MultiRollElement);


/**
 * Modifies chat message HTML to group multiple D20 rolls (not damage) into a collapsible tray. Adds a roll outcome summary.
 * @param {ChatMessage5e} msg
 * @param {HTMLElement} html
 */
function multiRollCollapsible(msg, html) {
    if(!msg.getFlag("talia-custom", "isMultiroll")) return;
    if(msg.rolls.length <= 1) return;

    // Make sure flavor span exists even for damage rolls.
    let flavorSpan = html.querySelector(".flavor-text");
    if(!flavorSpan) {
        flavorSpan = document.createElement("span");
        flavorSpan.className = "flavor-text";
        flavorSpan.textContent = msg.flavor;
        
        const header = html.querySelector("header");
        header.appendChild(flavorSpan);
    }

    const rollType = msg.getFlag("dnd5e", "roll.type");
    if(rollType === "damage") return;

    const content = html.querySelector(".message-content");
    const rollEles = content.querySelectorAll(".dice-roll");
    const mEle = document.createElement("multi-roll-tray");
    mEle.setRollNodes(rollEles);
    content.appendChild(mEle);

    const targetsTray = html.querySelector(".targets-tray");
    if(targetsTray) targetsTray.toggleAttribute("hidden");

    const flavorDetails = _getFlavorDetailsLine(msg, rollType);
    if(flavorDetails) flavorSpan.innerHTML = `${flavorSpan.innerHTML}<br>${flavorDetails}`;
}

/**
 * Generates a concise summary string of D20 roll outcomes (hits, misses, crits, etc.) for a chat message.
 * @param {ChatMessage5e} msg 
 * @param {string} rollType 
 * @returns {string|undefined}
 */
function _getFlavorDetailsLine(msg, rollType) {
    if(!msg.isContentVisible) return;
    const showAttacks = game.user.isGM || (game.settings.get("dnd5e", "attackRollVisibility") !== "none");
    if(rollType === "attack" && !showAttacks) return;

    let crit = 0;
    let success = 0;
    let fail = 0;
    let fumble = 0;
    let unknown = 0;
    let bypassSurges = false;

    for(const roll of msg.rolls) {
        if(roll.options.bypassSurges) bypassSurges = true;

        const tv = typeof roll.options.targetValue === "number"
            ? roll.options.targetValue
            : typeof roll.options.targetValue === "string"
                ? Number.parseInt(roll.options.targetValue)
                : null;

        if(roll.isCritical) crit++;
        else if(roll.isFumble) fumble++;
        else if(!Number.isInteger(tv)) unknown++;
        else if(roll.total >= tv) success++;
        else fail++;        
    }
    success += crit;
    fail += fumble;

    const labels = {
        success: rollType === "attack" ? "Hit" : "Success",
        fail: rollType === "attack" ? "Miss" : "Fail",
        crit: "crit",
        fumble: "fumble",
        unknown: "?"
    };

    const lines = [];
    if(success) {
        let str = `${success}x ${labels.success}`;
        if(crit) str += ` (${crit}x ${labels.crit})`;
        lines.push(str);
    }
    if(fail) {
        let str = `${fail}x ${labels.fail}`;
        if(fumble) str += ` (${fumble}x ${labels.fumble})`;
        lines.push(str);
    }
    if(unknown) lines.push(`${unknown}x ${labels.unknown}`);
    if(bypassSurges) lines.push("-wild");

    return lines.join(" / ");
}

/**
 * Injects "Roll Count" and "Skip Surges" inputs into supported roll dialogs. Adjusts dialog height.
 * @param {Dialog} dialog 
 * @param {JQuery} html 
 * @param {object} data 
 */
function injectDialog(dialog, html, data) {
    const form = html[0].querySelector("form");
    if(!form) return;

    const validTypes = {
        save: "Saving Throw",
        attack: "Attack Roll",
        skill: "Skill Check",
        ability: "Ability Check",
        damage: "Damage Roll",
    }
    
    for(const [type, match] of Object.entries(validTypes)) {
        // No other way of differentiating roll dialogs from other generic dialogs.
        if(dialog.data?.title?.includes(match)) {
            _injectRoll(html, type);
            if(type === "attack") _injectSurgeBypass(html);

            const pos = dialog.position;
            pos.height = "auto";
            dialog.setPosition(pos);

            break;
        }
    }
}

/**
 * Adds a "Skip Additional Surge Checks" checkbox to attack roll dialogs for multi-attacks.
 * @param {JQuery} html 
 */
function _injectSurgeBypass(html) {
    const div = document.createElement("div");
    div.classList.add("form-group");
    div.dataset.tooltip = "Allows single events with multiple attack to skip additional wild magic surge checks (e.g. Eldritch Blast or Scorching Ray).";
    div.dataset.tooltipDirection = "LEFT";

    const label = document.createElement("label");
    label.textContent = "Skip Additional Surge Checks";
    div.appendChild(label);

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.name = "bypassSurges";
    cb.checked = false;
    div.appendChild(cb);

    html[0].querySelector("form").appendChild(div);
}

/**
 * Adds a "Roll Count" input field to specified roll dialogs.
 * @param {JQuery} html 
 * @param {string} type 
 */
function _injectRoll(html, type) {
    const isDamage = type === "damage";
    const isInvalidAttack = type === "attack" && game.user.targets.size !== 1;

    const div = document.createElement("div");
    div.classList.add("form-group", "talia-dialog-form-group");
    div.dataset.rollType = type;

    const label = document.createElement("label");
    label.textContent = "Roll Count";
    div.appendChild(label);

    const numInput = document.createElement("input")
    numInput.type = 'number';
    numInput.min = 1;
    numInput.max = 30;
    numInput.name = "rollCount";
    numInput.placeholder = isInvalidAttack ? "Single Target Only" : '1';
    numInput.disabled = isInvalidAttack;
    div.appendChild(numInput);

    html[0].querySelector("form").appendChild(div);
}

/**
 * Wrapper that retrieves "Roll Count" from damage roll dialogs and stores it in roll options.
 * @param {Function} wrapped 
 * @param {JQuery} html 
 * @param {boolean} isCritical 
 * @param {boolean} isFirst 
 */
function wrapped_CONFIG_Dice_DamageRoll__onSubmitDialog(wrapped, html, isCritical, isFirst) {
    const form = html[0].querySelector("form");
    const rollType = form.querySelector(".form-group.talia-dialog-form-group")?.dataset?.rollType;
    if(rollType) this.options.taliaRollCount = form.rollCount?.value ?? 1;
    return wrapped(html, isCritical, isFirst);
}

/**
 * Wrapper that retrieves "Roll Count" and "Bypass Surges" from D20 roll dialogs and stores them in roll options.
 * @param {Function} wrapped 
 * @param {JQuery} html 
 * @param {number} advantageMode 
 */
function wrapped_CONFIG_Dice_D20Roll_prototype__onDialogSubmit(wrapped, html, advantageMode) {
    const form = html[0].querySelector("form");
    const rollType = form.querySelector(".form-group.talia-dialog-form-group")?.dataset?.rollType;
    if(rollType) {
        this.options.taliaRollCount = form.rollCount?.value ?? 1;
        this.options.bypassSurges = form.bypassSurges?.checked ?? false;
    }
    return wrapped(html, advantageMode);
}

/**
 * Intercepts roll messages with a `taliaRollCount > 1` to initiate multi-roll processing which cancels original message.
 * @param {ChatMessage} msg 
 * @param {object} data 
 * @param {DatabaseCreateOperation} options 
 * @returns {void|false}
 */
function onPreCreateChatMessage(msg, data, options) {
    const isMultiroll = msg.getFlag("talia-custom", "isMultiroll");
    if(isMultiroll) return;

    const rc = msg.rolls?.[0]?.options?.taliaRollCount;
    if(rc <= 1) return;

    const rollType = msg.getFlag("dnd5e", "roll.type");
    if(rollType === "damage") _multiDamageMsg(msg, options, rc); //async
    else if(["save", "attack", "ability", "skill"].includes(rollType)) _multiD20Msg(msg, options, rc);  //async
    else return;

    return false;
}

/**
 * Creates a new chat message with multiple instances of damage rolls.
 * @param {ChatMessage} msg 
 * @param {DatabaseCreateOperation} options 
 * @param {number} rollCount 
 */
async function _multiDamageMsg(msg, options, rollCount) {
    const rollPromises = [];
    for(let i = 1; i < rollCount; i++) {
        for(const roll of msg.rolls) {
            const newRoll = roll.clone();
            newRoll.options.taliaDamagePartsGroup = i;   // Added so we can differentiate between different 'instances' of damage later.
            rollPromises.push(newRoll.evaluate());
        }
    }

    const changes = {
        "flags.talia-custom.isMultiroll": true,
        rolls: [
            ...msg.rolls,
            ...await Promise.all(rollPromises)
        ],
        flavor: `${rollCount}x ${msg.flavor}`
    };

    msg.updateSource(changes);
    ChatMessage.implementation.create(msg, options);
}

/**
 * Creates a new chat message with multiple D20 rolls. May trigger Wild Magic checks for non-bypassed attacks.
 * @param {ChatMessage} msg 
 * @param {DatabaseCreateOperation} options 
 * @param {number} rollCount 
 */
async function _multiD20Msg(msg, options, rollCount) {
    const rollPromises = [];
    for(let i = 1; i < rollCount; i++) {
        const newRoll = msg.rolls[0].clone();
        newRoll.configureModifiers();
        rollPromises.push(newRoll.evaluate());
    }

    const changes = {
        "flags.talia-custom.isMultiroll": true,
        rolls: [
            msg.rolls[0],
            ...await Promise.all(rollPromises)
        ],
        flavor: `${rollCount}x ${msg.flavor}`
    };

    msg.updateSource(changes);
    const message = await ChatMessage.implementation.create(msg, options);
    if(!msg.rolls[0].options.bypassSurges) _handleWildMagic(message, rollCount);
}

/**
 * Triggers Wild Magic surge checks via `WildMagic.useItemHook` for each additional attack in a multi-attack sequence.
 * @param {ChatMessage5e} msg 
 * @param {number} rollCount 
 */
function _handleWildMagic(msg, rollCount) {
    const rollType = msg.getFlag("dnd5e", "roll.type");
    if(rollType !== "attack") return;

    const actor = msg.getAssociatedActor();
    if(!actor || actor.system.details?.type?.subtype === "swarm") return;
    
    const originatingMsg = game.messages.get(msg.getFlag("dnd5e", "originatingMessage"));
    if(!originatingMsg) return;
    const item = originatingMsg.getAssociatedItem();
    if(!item) return;

    for(let i = 1; i < rollCount; i++) {
        WildMagic.useItemHook(item, {}, {});
    }
}
