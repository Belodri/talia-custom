//  For info on how to convert this to ApplicationV2 check: https://foundryvtt.wiki/en/development/guides/converting-to-appv2


// Info on Drag and Drop: https://discord.com/channels/170995199584108546/722559135371231352/1160242514243112980


import { MODULE } from "../scripts/constants.mjs";
import { calculateDC, spellscribing } from "./spellscribing.mjs";

export class ScribingUI extends FormApplication {
    constructor(actor) {
        super();
        this.actor = actor;
        this.gemstonesSorted = this.getGemstonesSorted();
        this.chosenData = {};
        this.chosenData.gemstoneChoices = this.getGemstoneChoices();
        this.chosenData.selectedGemstoneId = this.gemstonesSorted[0]?._id || "";
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            //overrides
            classes: ['form'],
            height: 'auto',
            width: 500,
            title: "Spellscribing",
            template: `modules/${MODULE.ID}/templates/scribingUi.hbs`,
            dragDrop: [{dropSelector: "form"}],
            closeOnSubmit: false,       
            submitOnChange: true,
            resizable: true,       
            popOut: true 
        });
    }

    _canDragDrop(selector) {
        return true;
    }

    async _updateObject(event, formData) {
        this.chosenData.selectedGemstoneId = formData.gemstoneItemId;
        this.chosenData.isTrigger = formData.isTrigger;
        this.chosenData.selectedSlotLevel = formData.slotLevel;
        if(formData.triggerConditions) {
            this.chosenData.triggerConditions = formData.triggerConditions;
        }

        this.setPosition();
        return this.render();
    }

    render(force=false, options = {}) {
        /*
        //add clause for when the user doesn't have any gemstones
        //I don't need this if the user can't scribe at all without gems
        if(!this.gemstonesSorted.length) {
            ui.notifications.warn("You don't have any gemstones to scribe.");
            if(!this.rendered) return;
            setTimeout(() => this.close(), 0);
        }
        */
        this._updateButtonText();
        console.log(this);
        return super.render(force, options);
    }

    _updateButtonText() {
        if(this.chosenData.selectedGemstoneId && this.chosenData.selectedSlotLevel) {
            const gem = this.actor.items.get(this.chosenData.selectedGemstoneId);
            const dc = calculateDC(gem, this.chosenData.selectedSlotLevel);
            this.chosenData.addedButtonText = `DC ${dc}`;
        } else {
            this.chosenData.addedButtonText = "";
        }
    }


    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);

        //prevents dropping if there is no gemstone available
        if(this.chosenData.selectedGemstoneId === "") {
            ui.notifications.info("You don't have any gemstones to scribe.")
            return;
        }
        //only allow Items that are embedded on actor
        if(data.type !== "Item" || !data.uuid.startsWith(this.actor.uuid)) return;

        //get the dropped item, check if it's a spell, and if so, bind it to this
        const droppedItem = await fromUuid(data.uuid);
        if(droppedItem.type !== "spell") return;

        //check preparation mode
        if (["atwill", "innate", "pact"].includes(droppedItem.system?.preparation?.mode)) {
            ui.notifications.warn(`Spells of type: "${droppedItem.system.preparation.mode}" are not supported.`);
            return;
        }

        this.chosenData.spell = droppedItem;
        this.chosenData.slotChoices = this.getSpellSlotChoices();
        this.chosenData.selectedSlotLevel = Object.keys(this.chosenData.slotChoices)[0];
        return this.render();
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.on('click', "button", this._handleScribing.bind(this));
    }


    async _handleScribing(event) {
        const chosenArgs = {
            chosenSpell: this.chosenData.spell,
            chosenGem: this.actor.items.get(this.chosenData.selectedGemstoneId),
            selectedSpellSlotLevel: parseInt(this.chosenData.selectedSlotLevel),
            isTrigger: this.chosenData.isTrigger,
            triggerConditions: this.chosenData.triggerConditions || ""
        }
        console.log("_handleScribing: chosenArgs ", chosenArgs);

        const result = await spellscribing(this.actor, chosenArgs);
        console.log({result: result});

        if(result === true) {
            //reload all data since this returned true;
            this.onScribing_recheckData();
            return this.render();
        } else if(result === "surge") {
            //closes the window if a surge was caused
            await this.close();
            //close the character sheet too
            //maybe minimise instead?
            await this.actor.sheet.close();
        }
    }  

    async getData() {


        const data = {
            spell: {
                name: "Drop your spell here",
                img: "systems/dnd5e/icons/svg/items/spell.svg"
            },
            isTrigger: false,
            triggerConditions: "",

            gemstoneChoices: this.chosenData.gemstoneChoices,
            selectedGemstoneId: "",
            

            selectedSlotLevel: null,
            slotChoices: this.chosenData.slotChoices,

            addedButtonText: ""
        };
        if(this.chosenData.selectedGemstoneId === null) {
            this.close({submitOnClose: false});
        }

        return foundry.utils.mergeObject(data, this.chosenData);
    }

    getSpellSlotChoices() {
        const rollData = this.actor.getRollData();
        const chosenSpell = this.chosenData.spell;
        if(!chosenSpell) {
            return {noSpell: {label: "No Spell Chosen", key: null}}
        }
        if(chosenSpell.system.level === 0) {
            return {0: {
                label: "Cantrip",
                key: 0
            }}
        }
        if(!this._getHighestSpellSlotLevel()) {
            return {noSlots: {label: "No Spell Slots", key: null}}
        }

        const choices = Object.entries(rollData.spells).reduce((acc, [key, value]) => {
            if (key === "spell0" 
                || value.max === 0 
                || value.level < chosenSpell.system.level
            ) return acc;
            const objKey = key === "pact" ? "pact" : value.level;
            acc[objKey] = {
                value: value.value,
                max: value.max,
                key: objKey,
                label: `${CONFIG.DND5E.spellLevels[value.level]} - ${value.value}/${value.max}`
            };
            return acc;
        }, {});
        return choices;
        const choicesNoPact = {
            1: {label: "1st Level", value: 3, max: 4},
            2: {label: "2nd Level", value: 3, max: 3},
            3: {label: "3rd Level", value: 0, max: 3},
        }
    }
    /**
     * @returns {number} the highest spell slot the actor has access to overall, or 0 if access to no spell slots
     */
    _getHighestSpellSlotLevel() {
        const rollData = this.actor.getRollData();
        const spells = rollData.spells;
        let highestLevel = 0; // Initialize to 0 to handle the case where no valid level is found
    
        for (const spell in spells) {
            if (spells.hasOwnProperty(spell)) {
                const { level, max } = spells[spell];
                if (max >= 1 && level > highestLevel) {
                    highestLevel = level;
                }
            }
        }
        return highestLevel;
    }

    /**
     * Call this method when an item is scribed so it can recalculate what items & spellslots the actor has
     */
    onScribing_recheckData() {
        this.chosenData.gemstoneChoices = this.getGemstoneChoices();
        this.chosenData.slotChoices = this.getSpellSlotChoices();
    }

    getGemstonesSorted() {
        const gemstoneItems = this.actor.items.filter(i => i.type === "loot" && i.system?.type?.value === "gem");
        // sort by price highest to lowest
        gemstoneItems.sort((a,b) => b.system.price?.value - a.system.price?.value);
        return gemstoneItems;
    }

    getGemstoneChoices() {
        if(!this.gemstonesSorted.length) {
            return {
                "noGemstone" : "No gemstones available."
            }
        }
        return this.gemstonesSorted.reduce((acc, item) => {
            acc[item.id] = item.name;
            return acc;
        },{});
    }
}