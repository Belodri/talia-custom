
/**
 * @import Item5e from "../system/dnd5e/module/documents/item.mjs"
 * @import ActiveEffect5e from "../system/dnd5e/module/documents/active-effect.mjs";
 */

import ChatCardButtons from "../utils/chatCardButtons.mjs";

const ITEM_NAME = "Nystul's Magic Aura";

export default {
    register() {
        

        ChatCardButtons.register({
            itemName: ITEM_NAME,
            displayFilter: (item) => item.type === "spell",
            buttons: [{
                label: "Select Creature Type & Alignment",
                callback: ({item}) => new Nystuls(item).dialogAndUpdate()
            }]
        });
    }
}


class Nystuls {
    static #isInitialized = false;

    static init() {
        Nystuls.#creatureTypeValueToLabel = Object.fromEntries(Object.entries(CONFIG.DND5E.creatureTypes).map(([k, v]) => [k, v.label])); 
        Nystuls.#alignmentValueToLabel = Object.fromEntries(Object.entries(CONFIG.DND5E.alignments).map(([k, v]) => [v, v]));   // value = label
        Nystuls.#isInitialized = true;
    }

    static #alignmentValueToLabel;

    static #creatureTypeValueToLabel;

    constructor(item) {
        if(!Nystuls.#isInitialized) Nystuls.init();

        this.item = item;
        this.effect = item.effects.contents[0];
        if(!this.effect) throw new Error(`${item.name} - Missing Active Effect`);
    }

    async dialogAndUpdate() {
        const choices = await this.#configureMaskOptionsDialog();
        if(!choices) return;

        const changes = this.#getEffectChanges(choices);
        await this.effect.update(changes);
        ui.notifications.info(`Mask effect updated.`);
    }


    /**
     * @typedef {object} MaskChoices
     * @property {{value: string, label: string}} alignment
     * @property {{value: string, label: string}} creatureType
     */

    /**
     * @returns {Promise<MaskChoices>}
     */
    async #configureMaskOptionsDialog() {
        const { DialogV2 } = foundry.applications.api;
        const { StringField } = foundry.data.fields;

        const initial = this.effect.changes.reduce((acc, curr) => {
            if(curr.key === "system.details.alignment") acc.alignment = curr.value;
            if(curr.key === "system.details.type.value") acc.type = curr.value;
            return acc;
        }, { alignment: "none", type: "none" });

        
        const alignmentField = new StringField({
            label: "Alignment",
            hint: "Initial value is the currently selected creature type.",
            choices: { none: " - ", ...Nystuls.#alignmentValueToLabel},
            required: true,
            initial: initial.alignment
        }).toFormGroup({}, {name: "alignment"}).outerHTML;

        const typeField = new StringField({
            label: "Creature Type",
            hint: "Initial value is the currently selected creature type.",
            choices: { none: " - ", ...Nystuls.#creatureTypeValueToLabel},
            required: true,
            initial: initial.type
        }).toFormGroup({}, {name: "creatureType"}).outerHTML


        const result = await foundry.applications.api.DialogV2.prompt({
            window: { title: ITEM_NAME },
            position: { width: 600, height: "auto" },
            modal: true,
            rejectClose: false,
            content: alignmentField + typeField,
            ok: {
                callback: (_, button) => new FormDataExtended(button.form).object
            }
        });

        if(!result) return;
        const { alignment, creatureType } = result;

        const choices = {};

        if(alignment !== "none") choices.alignment = {
            value: alignment,
            label: Nystuls.#alignmentValueToLabel[alignment]
        };

        if(creatureType !== "none") choices.creatureType = {
            value: creatureType,
            label: Nystuls.#creatureTypeValueToLabel[creatureType]
        }

        return choices;
    }

    /**
     * 
     * @param {MaskChoices} choices 
     */
    #getEffectChanges({ alignment, creatureType }) {
        const changes = [];
        let description = "";

        if(alignment) {
            changes.push({
                key: "system.details.alignment",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 90,
                value: alignment.value
            });
            description += `<p>Your alignment is masked as: ${alignment.label}.</p>`;
        }

        if(creatureType) {
            changes.push({
                key: "system.details.type.value",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 90,
                value: creatureType.value
            });
            description += `<p>Your creature type is masked as: ${creatureType.label}.</p>`;
        }

        return { changes, description }
    }


}
