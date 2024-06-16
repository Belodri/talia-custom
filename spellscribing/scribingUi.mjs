//  For info on how to convert this to ApplicationV2 check: https://foundryvtt.wiki/en/development/guides/converting-to-appv2


// Info on Drag and Drop: https://discord.com/channels/170995199584108546/722559135371231352/1160242514243112980


import { MODULE } from "../scripts/constants.mjs";

export class ScribingUI extends FormApplication {
    constructor(actor) {
        super();
        this.actor = actor;
        this.chosenData = {};
        this.chosenData.gemstoneChoices = this.getGemstoneChoices();
    }
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            //overrides
            classes: ['form'],
            height: 400,
            width: 500,
            title: "Spellscribing",
            template: `modules/${MODULE.ID}/templates/scribingUi.hbs`,
            dragDrop: [{dropSelector: "form"}],
            closeOnSubmit: false,       
            submitOnChange: true,
            resizable: true,        
        });
    }

    async _updateObject(event, formData) {
        console.log({
            this: this, 
            event: event, 
            formData:formData
        });
        this.chosenData.selectedGemstoneId = formData.gemstoneItemId;
        this.chosenData.isTrigger = formData.isTrigger;
        this.chosenData.selectedSlotLevel = formData.slotLevel;
        return this.render();
    }

    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        //only allow Items that are embedded on actor
        if(data.type !== "Item" || !data.uuid.startsWith(this.actor.uuid)) return;

        //get the dropped item, check if it's a spell, and if so, bind it to this
        const droppedItem = await fromUuid(data.uuid);
        if(droppedItem.type !== "spell") return;

        this.chosenData.spell = droppedItem;
        this.chosenData.slotChoices = this.getSpellSlotChoices();
        return this.render();
    }

    
    async getData() {
        const data = {
            spell: {
                name: "Drop your spell here",
                img: "systems/dnd5e/icons/svg/items/spell.svg"
            },
            isTrigger: false,
            triggerConditions: "Enter your trigger conditions here.",

            selectedGemstoneId: "",
            gemstoneChoices: this.chosenData.gemstoneChoices,

            selectedSlotLevel: null,
            slotChoices: this.chosenData.slotChoices
        };
        return foundry.utils.mergeObject(data, this.chosenData);
    }

    getSpellSlotChoices() {
        const chosenSpell = this.chosenData.spell;
        if(!chosenSpell) {
            return {noSpell: "No Spell Chosen"};
        } else if (chosenSpell.system.level === 0) {
            return {0: {
                label: "Cantrip",
                key: 0
            }}
        }

        const rollData = this.actor.getRollData();
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
     * Call this method when an item is scribed so it can recalculate what items & spellslots the actor has
     */
    onScribing() {
        this.chosenData.gemstoneChoices = this.getGemstoneChoices();
        this.chosenData.slotChoices = this.getSpellSlotChoices();
    }

    getGemstoneChoices() {
        const gemstoneItems = this.actor.items.filter(i => i.type === "loot" && i.system?.type?.value === "gem");
        // sort by price highest to lowest
        gemstoneItems.sort((a,b) => b.system.price?.value - a.system.price?.value);

        return gemstoneItems.reduce((acc, item) => {
            acc[item.id] = item.name;
            return acc;
        },{});
    }
}