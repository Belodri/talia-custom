import { TaliaCustomAPI } from "../scripts/api.mjs";
import { MODULE } from "../scripts/constants.mjs";

export default {
    register() {
        GemDisplay.init();
        TaliaCustomAPI.add({GemDisplay}, "Other");
    }
}

class GemDisplay {
    static CONFIG = {
        triggerConditionFlag: "spellGem.triggerCondition",
        userFlagToggleState: "spellGemDisplayToggle",
        itemTypeValue: "spellGem",
        debounceDelay: 50,
        anchorId: "hotbar-page-controls",
        defaultContent: "<p>None</p>",
        styles: {
            "min-width": "fit-content",
            "padding-inline": '10px',
            "backgroundColor": 'rgba(0, 0, 0, 0.7)',
            "color": 'white',
            "borderRadius": '10px',
            "align-self": "end",
            "display": "block",
            "text-wrap": "nowrap",
        },
        maxLines: 6,
        permissions: {
            limitToUserChar: false,
        }
    }

    /** @type {GemDisplay} */
    static #instance = null;

    static get active() { return !!GemDisplay.#instance; }

    static init() {
        Hooks.on("getSceneControlButtons", GemDisplay._onGetSceneControlButtonsHook);
        Hooks.on("renderSceneControls", GemDisplay._onRenderSceneControls);
    }

    static configure(newConfig) {
        this.CONFIG = foundry.utils.mergeObject(this.CONFIG, newConfig, {
            insertKeys: false,
            insertValues: false,
            enforceTypes: true,
            performDeletions: false,
        });
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
            onClick: toggled => GemDisplay.toggle(toggled),
            button: true
        });
    }

    static #controlHookRecGuard = false;

    /**
     * When scene controls are rendered, ensure flag, displayUI, and controlsUI are synced.
     */
    static _onRenderSceneControls() {
        // recursion guard
        if(GemDisplay.#controlHookRecGuard) { 
            GemDisplay.#controlHookRecGuard = false;
            return;
        }
        GemDisplay.#controlHookRecGuard = true;
        
        // sync flag, displayUI, and controlsUI
        const uiState = ui.controls?.control?.tools?.find?.(t => t.name === "trigger-gem-display")?.active;
        if(typeof uiState !== "boolean") return;

        const toggleFlag = game.user.getFlag(MODULE.ID, GemDisplay.CONFIG.userFlagToggleState) ?? true;

        if(GemDisplay.active !== toggleFlag) GemDisplay.toggle(toggleFlag, false);  // sync state with flag
        if(GemDisplay.active !== uiState) ui.controls.render();   // sync ui with state - rerender controls to update button state
    }

    /** 
     * @param {boolean} value                   Toggle on (true) or off (false)?
     * @param {boolean} [setUserFlag = true]    Set the new toggle state as a flag on the user?
     */
    static toggle(value, setUserFlag = true) {
        if(setUserFlag) game.user.setFlag(MODULE.ID, GemDisplay.CONFIG.userFlagToggleState, value);    // async
        return value ? GemDisplay.#create() : GemDisplay.#destroy();
    }

    static #create() {
        GemDisplay.#destroy();

        const instance = new GemDisplay();
        instance._onCreateInstance();
        GemDisplay.#instance = instance;
    }

    static #destroy() {
        if(GemDisplay.#instance) {
            GemDisplay.#instance?._onDestroyInstance();
            GemDisplay.#instance = null;
        }
    }

    /*----------------------------------------------------------------------------
                    Instance          
    ----------------------------------------------------------------------------*/

    /** @type {{[key: string]: number}} */
    #hookIds = {
        createItem: null,
        updateItem: null,
        deleteItem: null,
        canvasReady: null,
    };

    /** @type {Map<string, Item>} */
    #items = new Map();

    /** @type {HTMLDivElement} */
    #element = null;

    constructor() {
        /** @type {boolean} */
        this.isGM = game.user.isGM;
        /** @type {string | null} */
        this.userCharUuid = game.user.character?.uuid ?? null;

        // Proxy to trigger a refresh whenever the map is modified.
        this.#items = new Proxy(this.#items, {
            get: (target, prop, receiver) => {
                if (['set', 'delete', 'clear'].includes(prop)) {
                    return function(...args) {
                        const retVal = target[prop](...args);
                        this.setElementContent();
                        return retVal;
                    }.bind(this);
                }

                const value = Reflect.get(target, prop, receiver);
                return typeof value === 'function' 
                    ? value.bind(target) 
                    : value;
            }
        });
    }

    _onCreateInstance() {
        // register hooks
        this.#hookIds.createItem = Hooks.on("createItem", this._onCreateItem.bind(this));
        this.#hookIds.updateItem = Hooks.on("updateItem", this._onUpdateItem.bind(this));
        this.#hookIds.deleteItem = Hooks.on("deleteItem", this._onDeleteItem.bind(this));
        this.#hookIds.canvasReady = Hooks.on("canvasReady", this._onCanvasReady.bind(this));

        //create display
        this.#createDisplayElement();

        // populate items
        this.#populateItems();
    }

    _onDestroyInstance() {
        // deregister hooks
        for(const [hookName, id] of Object.entries(this.#hookIds)) {
            if(id) Hooks.off(hookName, id);
        }
        if(this.#element) this.#element.remove();
    }

    /*----------------------------------------------------------------------------
                    Events            
    ----------------------------------------------------------------------------*/

    _onCreateItem(item, options, userId) {
        if(!this.#validateItem(item, {checkEmbedded: true, equippedEquals: true})) return;
        this.#items.set(item.uuid, item);
    }

    _onUpdateItem(item, changed, options, userId) {
        if(!this.#validateItem(item, {checkEmbedded: true})) return;

        const equipped = changed.system?.equipped;
        if(equipped === true) this.#items.set(item.uuid, item);
        else if(equipped === false) this.#items.delete(item.uuid);
    }

    _onDeleteItem(item, options, userId) {
        if(!this.#validateItem(item)) return;
        this.#items.delete(item.uuid);
    }

    _onCanvasReady(canvas) {
        // Defer execution to next macrotask so other _onCanvasReady hooks aren't blocked.
        setTimeout(() => this.#populateItems(), 0); 
    }

    /*----------------------------------------------------------------------------
                    Item Handling            
    ----------------------------------------------------------------------------*/

    #populateItems() {
        this.#items.clear();

        for(const t of canvas?.scene?.tokens ?? []) {
            if(!t.actor?.isOwner) continue;

            for(const i of t.actor.items) {
                if( this.#validateItem(i, {equippedEquals: true}) ) {
                    this.#items.set(i.uuid, i);
                }
            }
        }
    }

    #validateItem(item, {checkEmbedded=false, equippedEquals=null}={}) {
        // Is the item a valid triggered spell gem?
        const isSpellGem = item?.system?.type?.value === GemDisplay.CONFIG.itemTypeValue;
        const hasTrigger = !!this.#getCondition(item);
        if(!isSpellGem || !hasTrigger) return false;

        // Is the item embedded on an actor?
        if(checkEmbedded && !item.actor) return false;

        // What's the equipment status of the item?
        if(equippedEquals !== null && item.system.equipped !== equippedEquals) return false;

        // For non-GMs, if the display is limited to user chars only, is the item on user's assigned character?
        if(!this.isGM 
            && GemDisplay.CONFIG.permissions.limitToUserChar 
            && item.actor?.uuid !== this.userCharUuid
        ) return false;

        // If not, does the user own the actor?
        if( !item.actor.isOwner ) return false;

        return true;
    }

    #getCondition(item) {
        return item?.getFlag(MODULE.ID, GemDisplay.CONFIG.triggerConditionFlag);
    }

    /*----------------------------------------------------------------------------
                    Display            
    ----------------------------------------------------------------------------*/

    #createDisplayElement() {
        const anchorElement = document.getElementById(GemDisplay.CONFIG.anchorId);
        if (!anchorElement) {
            throw new Error(`Anchor element with id "${GemDisplay.CONFIG.anchorId}" not found`);
        }

        this.#element = document.createElement('div');
        this.#element.innerHTML = GemDisplay.CONFIG.defaultContent;
        Object.assign(this.#element.style, GemDisplay.CONFIG.styles);

        if (anchorElement.nextSibling) {
            anchorElement.parentNode.insertBefore(this.#element, anchorElement.nextSibling);
        } else {
            anchorElement.parentNode.appendChild(this.#element);
        }
    }

    #getParagraph(item) {
        const itemName =  item.name.startsWith("Triggered: ") && item.name.indexOf(" - ") > 0
            ? item.name.split(" - ")[0].replace("Triggered: ", "")
            : item.name;

        const condition = this.#getCondition(item) ?? "NO TRIGGER CONDITION"; // Should never happen but just in case
        const charName = item.actor.token?.name ?? item.actor.name.split(" ")[0];   // use token name for synthetic actors to keep them apart

        return `<p><b>${charName}:</b> ${itemName} - <i>"${condition}"</i></p>`;
    }

    setElementContent = foundry.utils.debounce(() => {
        if(!this.#element) return;
        const content = [...this.#items.values()]
            .map(i => this.#getParagraph(i))
            .sort((a, b) => a.localeCompare(b))
            .slice(0, GemDisplay.CONFIG.maxLines)
            .join("");

        this.#element.innerHTML = content || GemDisplay.CONFIG.defaultContent;
    }, GemDisplay.CONFIG.debounceDelay) 
}
