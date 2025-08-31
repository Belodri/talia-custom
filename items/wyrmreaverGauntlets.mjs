import ChatCardButtons from "../utils/chatCardButtons.mjs";

export default {
    register() {
        ChatCardButtons.register({
            itemName: "Wyrmreaver Gauntlets",
            buttons: [{
                label: "Guarding Runes",
                callback: ({item}) => guardingRunesButton(item)
            }, {
                label: "Invoking the Runes",
                callback: ({item, actor}) => invokingTheRunesButton(item, actor)
            }]
        });
    }
}

/**
 * Applies the effect and updates the remaining uses.
 * @param {Item} item 
 * @param {Actor} actor 
 */
async function invokingTheRunesButton(item, actor) {
    const effectName = "Invoking the Runes";

    const hasEffectApplied = game.dfreds.effectInterface.hasEffectApplied({ effectName, uuid: actor.uuid });
    if(hasEffectApplied) {
        ui.notifications.warn("The runes are already invoked.");
        return;
    }

    const uses = item.system.uses.value;
    if(uses < 1) {
        ui.notifications.warn("No uses remaining.");
        return;
    }

    const effect = game.dfreds.effectInterface.findEffect({ effectName});
    if(!effect) {
        ui.notifications.error(`Effect "${effectName}" not found.`);
        return;
    }

    await game.dfreds.effectInterface.addEffect({ effectName, uuid: actor.uuid });
    await item.update({"system.uses.value": uses - 1});
}

/**
 * Lets the user choose a different resistance type.
 * @param {Item} item 
 */
async function guardingRunesButton(item) {
    const {DialogV2} = foundry.applications.api;
    const {StringField} = foundry.data.fields;

    const damageTypes = ['acid','cold','fire','lightning','poison'];

    const typeChoices = damageTypes.reduce((acc, curr) => {
        acc[curr] = CONFIG.DND5E.damageTypes[curr].label;
        return acc;
    }, {});

    const selectDamageTypeGroup = new StringField({
        label: "Select damage type",
        hint: "You gain resistance to the chosen damage type.",
        required: true,
        choices: typeChoices,
    }).toFormGroup({},{name: "damageType", typeChoices}).outerHTML;

    const selected = await foundry.applications.api.DialogV2.prompt({
        window: {
            title: item.name,
        },
        content: selectDamageTypeGroup,
        modal: true,
        rejectClose: false,
        ok: {
            label: "Ok",
            callback: (event, button) => new FormDataExtended(button.form).object,
        },
    });

    const existingEffect = item.effects.find(e => e.name === `Guarding Runes`);
    if(!selected || !existingEffect) return;

    const effectData = {
        description: `<p>You have resistance to ${selected.damageType} damage.</p>`,
        changes: [{
            key: "system.traits.dr.value",
            mode: 2,
            priority: 20,
            value: selected.damageType
        }],
    }
    await existingEffect.update(effectData);
}
