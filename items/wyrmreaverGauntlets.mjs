import { TaliaUtils } from "../utils/_utils.mjs";

export default {
    register() {
        Hooks.on("dnd5e.restCompleted", longRestDialog);
    }
}

async function longRestDialog(actor, result) {
    if(!result.longRest) return;
    //get item
    const item = actor.itemTypes.equipment.find(i => i.name === "Wyrmreaver Gauntlets" && i.system?.equipped && TaliaUtils.Helpers.checkAttunement(i));
    if(!item) return;

    const damageTypes = ['acid','cold','fire','lightning','poison'];

    const typeChoices = damageTypes.reduce((acc, curr) => {
        acc[curr] = CONFIG.DND5E.damageTypes[curr].label;
        return acc;
    }, {});

    const selectGroupDamageType = new foundry.data.fields.StringField({
        label: "Select damage type",
        hint: "You gain resistance to the chosen damage type until the end of your next long rest.",
        required: true,
        choices: typeChoices,
    }).toFormGroup({},{name: "damageType", typeChoices}).outerHTML;
    const content = `<fieldset>${selectGroupDamageType}</fieldset>`
    const selected = await foundry.applications.api.DialogV2.prompt({
        window: {
            title: item.name,
        },
        content,
        modal: true,
        rejectClose: false,
        ok: {
            label: "Ok",
            callback: (event, button) => new FormDataExtended(button.form).object,
        },
    });

    const existingEffect = item.effects.find(e => e.name === `${item.name} - Guarding Runes`);
    if(!selected || !existingEffect) return;
    const effectData = {
        description: `<p>Until the end of your next long rest, you have resistance to ${selected.damageType} damage.</p>`,
        changes: [{
            key: "system.traits.dr.value",
            mode: 2,
            priority: 20,
            value: selected.damageType
        }],
    }
    await existingEffect.update(effectData);
}