import { TaliaCustomAPI } from "../scripts/api.mjs";

export default {
    register() {
        TaliaCustomAPI.add({
            damageOrHealSelf: damageOrHealControlled, // Old function name, keep for compatability with older macros
            damageOrHealControlled
        }, "Macros"); 
    }
}

async function damageOrHealControlled() {
    const types = {
        untyped: { label: "Untyped" },
        ...CONFIG.DND5E.damageTypes,
        ...CONFIG.DND5E.healingTypes
    };

    const chosen = await dialog(types);
    if(!chosen) return;

    const roll = await dnd5e.dice.damageRoll({
        rollConfigs: [{
            parts: [chosen.formula],
            type: chosen.type
        }],
        fastForward: true,
        chatMessage: false,
    });
    if(!roll) return ui.notifications.warn("Roll error.");

    const msg = await ChatMessage.implementation.create({
        rolls: [roll],
        speaker: { alias: game.user.name },
        flavor: `<b>Type:</b> ${types[chosen.type].label}`
    });
    if(!roll.isDeterministic) await game.dice3d.waitFor3DAnimationByMessageID(msg.id);
    
    const func = chosen.type === "temphp"
        ? { name: "applyTempHP", arg: roll.total }
        : { name: "applyDamage", arg: [{ value: roll.total, type: chosen.type === "untyped" ? undefined : chosen.type }] };

    canvas.tokens.controlled.forEach(t => t.actor[func.name](func.arg));
}

async function dialog(types, priorChosen = {}) {
    const { DialogV2 } = foundry.applications.api;
    const { StringField } = foundry.data.fields;


    const typeField = new StringField({
        label: "Damage Type",
        choices: Object.entries(types)
            .reduce((acc, [k, v]) => { 
                acc[k] = v.label;
                return acc;
            }, {}),
        required: true,
        nullable: false,
        initial: priorChosen.type ?? ""
    }).toFormGroup({},{name: "type"}).outerHTML;

    const formulaField = new StringField({
        label: "Roll Formula or Number",
        required: true,
        blank: true,
        nullable: false,
        initial: priorChosen.formula ?? "",
    }).toFormGroup({}, {name: "formula"}).outerHTML;

    const span = `
        <span>Choose an amount and type of damage or healing to apply to all currently selected actors.</br>Note: 'Healing (Temporary)' just sets the temp hp to the evaluated value.</span>`;

    const chosen = await DialogV2.prompt({
        window: {
            title: "Damage or Heal",
        },
        content: span + typeField + formulaField,
        rejectClose: false,
        modal: false,
        ok: {
            callback: (event, button) => new FormDataExtended(button.form).object
        }
    });

    if(!chosen) return;

    if(!Roll.validate(chosen.formula)) {
        ui.notifications.warn("Invalid roll formula.");
        return dialog(types, chosen);
    }

    return chosen;
}
