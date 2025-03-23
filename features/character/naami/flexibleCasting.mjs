import { TaliaCustomAPI } from "../../../scripts/api.mjs";
import { Actor5e } from "../../../system/dnd5e/module/documents/_module.mjs";
import ChatCardButtons from "../../../utils/chatCardButtons.mjs"

export default {
    register() {
        ChatCardButtons.register({
            itemName: "Flexible Casting",
            buttons: [{
                label: "Create Spell Slots",
                callback: SorcManager.onCreateSpellSlots,
            }, {
                label: "Create Sorcery Points",
                callback: SorcManager.onCreateSorceryPoints,
            }]
        })

        TaliaCustomAPI.add({SorcManager}, "none");
    }
}

const SLOT_TO_POINT_COST = {
    1: 2,
    2: 3,
    3: 5,
    4: 6,
    5: 7
};

const {DialogV2} = foundry.applications.api;
const {StringField, NumberField, BooleanField} = foundry.data.fields;


class SorcManager {

    static async onCreateSpellSlots({actor}) {
        return SorcManager.create(actor).createSpellSlotsDialog();
    }

    static async onCreateSorceryPoints({actor}) {
        return SorcManager.create(actor).createSorceryPointsDialog();
    }

    static CONFIG = {
        itemName: "Sorcery Points",
        slotToPointCost: {
            spell1: 2,
            spell2: 3,
            spell3: 5,
            spell4: 6,
            spell5: 7
        }
    }

    static create(actor) {
        const item = actor.items.getName(SorcManager.CONFIG.itemName);
        if(!item) throw new Error(`No item named "${SorcManager.CONFIG.itemName}" found on actor uuid "${actor.uuid}".`);

        return new SorcManager(actor, item);
    }

    /**
     * @param {Actor5e} actor 
     * @param {Item5e} item 
     */
    constructor(actor, item) {
        this.actor = actor;
        this.item = item;
    }

    get sorcPointsField() {
        const uses = this.item.system.uses;

        return `
        <div class="form-group">
            <label>Sorcery Points</label>
            <div class="form-fields">
                <input type="text" value="${uses.value}/${uses.max}" disabled>
            </div>
        </div>`
    }

    async createSpellSlotsDialog() {
        const choices = {};
        for(const [slotKey, cost] of Object.entries(SorcManager.CONFIG.slotToPointCost)) {
            const slot = this.actor.system.spells[slotKey];
            if(!slot?.max || slot.value >= slot.max) continue;

            choices[slotKey] = `${CONFIG.DND5E.spellLevels[slot.level]} (${slot.value}/${slot.max} Slots) - Cost: ${cost} Sorcery Points`;
        }

        const spellSlotChoicesField = new StringField({
            label: "Choose Slot Level",
            choices,
            required: true,
        }).toFormGroup({}, {name: "slotKey"}).outerHTML;
    
        const createMoreField = new BooleanField({
            label: "Create Additional?",
        }).toFormGroup({}, {name: "createMore"}).outerHTML;

        const selected = await DialogV2.prompt({
            window: { title: "Create Spell Slot" },
            position: { width: 600, height: "auto" },
            content: this.sorcPointsField + spellSlotChoicesField + createMoreField,
            modal: true,
            rejectClose: false,
            ok: {
                callback: (event, button) => new FormDataExtended(button.form).object
            }
        });
        if(!selected) return;

        const ret = await this.createSpellSlots(selected.slotKey);

        return !ret || selected.createMore 
            ? this.createSpellSlotsDialog()
            : null;
    }

    async createSpellSlots(slotKey, amount=1) {
        const slot = this.actor.system.spells[slotKey];
        const cost = SorcManager.CONFIG.slotToPointCost[slotKey];

        const newSlotValue = slot.value + amount;
        const newPointValue = this.item.system.uses.value - ( cost * amount );

        if(newPointValue < 0) {
            ui.notifications.warn(`You don't have enough Sorcery Points to create a ${CONFIG.DND5E.spellLevels[slot.level]} spell slot.`);
            return false;
        } else if(slot.value >= slot.max ) {    //should never happen but just in case
            ui.notifications.warn(`You don't have any expended ${CONFIG.DND5E.spellLevels[slot.level]} spell slots.`);
            return false;
        }

        return Promise.all([
            this.actor.update({[`system.spells.${slotKey}.value`]: newSlotValue}),
            this.item.update({"system.uses.value": newPointValue})
        ]);
    }

    async createSorceryPointsDialog() {
        let slotFields = "";

        for(const [slotKey, slot] of Object.entries(this.actor.system.spells)) {
            if(!slot.max || !slot.value) continue;


            // '<div class="form-group"><label></label><div class="form-fields"><input type="checkbox" name="test"></div></div>'

            let inputs = "";
            for(let i = 0; i < slot.value; i++) inputs += `<input type="checkbox" name="${slotKey}.${i}">`;
            
            slotFields += `
            <div class="form-group">
                <label>${CONFIG.DND5E.spellLevels[slot.level]}</label>
                <div class="form-fields">
                    ${inputs}
                </div>
                
            </div>`;
        }

        const content = `
            ${this.sorcPointsField}
            ${slotFields}
            <p class="hint">Each converted spell slot grants an amount of Sorcery Points equal to its level.</p>
        `;

        const selected = await DialogV2.prompt({
            window: { title: "Create Sorcery Points" },
            position: { width: 600, height: "auto" },
            content,
            modal: true,
            rejectClose: false,
            ok: {
                callback: (event, button) => new FormDataExtended(button.form).object
            }
        });
        if(!selected) return;

        return selected;
    }

    async createSorceryPoints(chosenSlots) {

    }
}

const {HandlebarsApplicationMixin, ApplicationV2} = foundry.applications.api;
class CreateSorceryPoints extends HandlebarsApplicationMixin(ApplicationV2) {
    /** @inheritDoc */
    static DEFAULT_OPTIONS = {
        tag: "form",
        window: {
            frame: true,
            positioned: true,
            minimizable: false
        },
        form: {
            handler: CreateSorceryPoints.formHandler,
            submitOnChange: true,
            closeOnSubmit: false
        },
        actions: {
            ok: CreateSorceryPoints.#ok,
        }
    }


    constructor(item, options={}) {
        super(...options);
        this.item = item;
        this.actor = item.actor;

        this.sorcPoints = {
            curr: item.system.uses.value,
            max: item.system.uses.max
        };

        this.spellLevels = Object.entries(item.actor.system.spells)
            .filter(([slotKey, slot]) => slot.max)
            .reduce((acc, [slotKey, slot]) => {
                acc[slotKey] = {
                    slotKey,
                    max: slot.max,
                    value: slot.value,
                    level: slot.level
                };
                return acc;
            }, {});
    }

    static PARTS = {
        template: { template: `modules/${MODULE.ID}/templates/flexibleCasting/createSorceryPoints.hbs` },
    }

    static async #ok(event, target) {

    }

    /**
     * Process form submission for the sheet
     * @this {CreateSorceryPoints}                  The handler is called with the application as its bound scope
     * @param {SubmitEvent} event                   The originating form submission event
     * @param {HTMLFormElement} form                The form element that was submitted
     * @param {FormDataExtended} formData           Processed data for the submitted form
     * @returns {Promise<void>}
     */
    static async formHandler(event, form, formData) {

    }

    async _prepareContext(options) {

        const spellLevels = Object.values(this.spellLevels)
            .map(slot => {
                const slots = {};
                for(let i = 0; i < slot.value; i++) {
                    const slotName = `${slot.slotKey}.${i}`;
                    slots[slotName] = {
                        
                    }
                }
            })

        const context = {

        }
    }
}
