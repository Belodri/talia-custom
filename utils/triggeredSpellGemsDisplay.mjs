import Collection from "../foundry/common/utils/collection.mjs";
import { TaliaCustomAPI } from "../scripts/api.mjs";
import { MODULE } from "../scripts/constants.mjs";

export default {
    register() {
        GemDisplay.init();
    }
}

class GemDisplay {
    static displayOptions = {
        anchorId: "hotbar-page-controls",
        styles: {
            "min-width": "fit-content",
            "padding-inline": '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            borderRadius: '10px',
            "align-self": "end",
        },
    }

    static #active = true;

    static get active() { return GemDisplay.#active; }

    static set active(value) {
        if(typeof value !== "boolean") throw new TypeError(`Value must be boolean`);

        GemDisplay.#active = value;

        if(GemDisplay.element) {
            GemDisplay.element.style.display = value 
                ? "block"
                : "none";
        }
    }

    /** @type {HTMLDivElement} */
    static element = null;

    /** @type {Set<string>} */
    static pcUuids = new Set();

    /** 
     * A map with actorUuids of player characters as keys and the corresponding display string as values
     * @type {Collection<string, string>} 
     */
    static actorTexts = new foundry.utils.Collection();

    static init() {
        Hooks.on("getSceneControlButtons", GemDisplay._onGetSceneControlButtonsHook);
        Hooks.once("ready", GemDisplay._onReadyHook);
    }

    static _onReadyHook() {
        GemDisplay.pcUuids = new Set( 
            game.users.players.map(u => u.character.uuid) 
        );

        game.users.players
            .map(u => u.character)
            .filter(a => game.user.isGM || a.uuid === game.user.character?.uuid)
            .forEach(a => GemDisplay.setActorText(a));

        GemDisplay.updateDisplayText();
        
        Hooks.on("updateItem", (item, data, options, userId) => GemDisplay._onItemChange(item, userId));
        Hooks.on("createItem", (item, options, userId) => GemDisplay._onItemChange(item, userId));
        Hooks.on("deleteItem", (item, options, userId) => GemDisplay._onItemChange(item, userId));
    }

    /** @param {SceneControl} controls*/
    static _onGetSceneControlButtonsHook(controls) {
        const bar = controls.find(c => c.name === "token");
        bar.tools.push({
            name: "trigger-gem-display",
            title: "Display Spell Gem Triggers",
            icon: "fas fa-gem",
            toggle: true,
            active: GemDisplay.active,
            onClick: toggled => GemDisplay.active = toggled,
            button: true
        });
    }


    static initDisplayElement() {
        const opts = GemDisplay.displayOptions;

        // Find the anchor element
        const anchorElement = document.getElementById(opts.anchorId);
        if (!anchorElement) {
            console.error(`Element with id "${opts.anchorId}" not found`);
            return;
        }

        // Create the element div
        GemDisplay.element = document.createElement('div');
        
        // Apply all styles
        Object.assign(GemDisplay.element.style, opts.styles);

        // Insert after the anchor element
        if (anchorElement.nextSibling) {
            anchorElement.parentNode.insertBefore(GemDisplay.element, anchorElement.nextSibling);
        } else {
            anchorElement.parentNode.appendChild(GemDisplay.element);
        }
    }

    static updateDisplayText() {
        if(!GemDisplay.element) {
            GemDisplay.initDisplayElement();
        }

        const displayText = GemDisplay.actorTexts
            .filter(Boolean)
            .map(v => v)
            .join("</br>");
        
        GemDisplay.element.innerHTML = `<p>${displayText}</p>` || "<p>None</p>"
    }

    /** 
     * @param {Item} item 
     * @param {object} data
     * @param {object} options
     * @param {string} userId   
     */
    static _onItemChange(item, data, options, userId) {
        //only gm should track others
        if(userId !== game.userId && !game.user.isGM) return;   

        if( GemDisplay.#isItemSpellGem(item) && GemDisplay.#isItemOnPC(item) ) {
            GemDisplay.setActorText(item.actor);
            GemDisplay.updateDisplayText();
        }
    }

    /** @param {Item} item */
    static #isItemOnPC(item) { return GemDisplay.pcUuids.has(item.actor.uuid); }

    /** @param {Item} item */
    static #isItemSpellGem(item) { return item?.system.type?.value === "spellGem"; }

    /** 
     * @param {Actor} actor 
     * @returns {Item[]}
     */
    static getEquippedTriggeredSpellGems(actor) {
        return actor.items.filter(i => 
            i.type === "consumable" 
            && i.system.type?.value === "spellGem" 
            && i.system.equipped 
            && i.name.startsWith("Triggered: ")
        );
    }

    /** @param {Actor} actor */
    static setActorText(actor) {
        const gems = GemDisplay.getEquippedTriggeredSpellGems(actor);
        const firstName = actor.name.split(" ")[0];

        let displayText = "";
        if(gems.length === 1) {
            const triggerCond = gems[0].getFlag("talia-custom", "spellGem.triggerCondition") ?? "NO TRIGGER CONDITION";
            const trimmedName = gems[0].name.replace("Triggered: ", "");

            displayText = game.user.isGM 
                ? `${firstName} (1): ${trimmedName} ["${triggerCond}"]`
                : `${trimmedName} ["${triggerCond}"]`;
        } else if(gems.length > 1) {
            displayText = game.user.isGM 
                ? `${firstName} (${gems.length}): INVALID (more than 1 triggered spell gem equipped)`
                : `INVALID (You cannot have more than 1 triggered spell gem equipped!)`;
        }

        GemDisplay.actorTexts.set(actor.uuid, displayText);
    }
}
