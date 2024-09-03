import { TaliaCustomAPI } from "../scripts/api.mjs";
import { ItemHookManager } from "../utils/ItemHookManager.mjs";

export default {
    register() {
        ItemHookManager.register("Contingency", itemMacro);

        TaliaCustomAPI.add({"contingency": effectMacro}, "EffectMacros");
    }
}

//on create
async function effectMacro(effect, actor) {
    const flagData = effect.getFlag("talia-custom", "contingencyEffectData");
    const spell = actor.items.get(flagData.chosenSpellId);
    if(!spell) return ui.notifications.warn("ID of chosen spell could not be found.");

    const data = {
        name: flagData.name,
        system: {
            activation: {
                type: "trigger",
                cost: null,
                condition: flagData.condition
            },
            level: flagData.chosenSpellLevel,
            preparation: {
                mode: "atwill",
                prepared: false,
            },
            description: {
                value: `${flagData.description}${spell.description}`,
            },
            properties: new Set(["mgc"]),
            target: {
                type: "self",
                untis: null,
                value: null,
                width: null,
            }
        }
    };
    const clone = await spell.clone(data, {save: true});

    await effect.update({
        name: flagData.name,
        description: flagData.description,
        changes: [{key: "flags.dae.deleteUuid", mode: 0, priority: 20, value: clone.uuid}]
    });
}


async function itemMacro(item) {
    const actor = item.actor;
    const rollData = actor.getRollData();

    //if no effect present or not choosing to activate, create/overwrite the effect
    const validSpells = getValidSpells(actor, rollData);
    if(!validSpells) return ui.notifications.info("You have no valid spells available.");

    //dialog to choose a spell and the condition
    const spellDialogResult = await chooseSpellDialog(validSpells);
    if(!spellDialogResult || !spellDialogResult.condition) return;
    const chosenSpell = actor.items.get(spellDialogResult.spellId);
    
    //dialog to choose a spell level for that spell
    const msgData = await chosenSpell.use({
        createMeasuredTemplate: null,
        createSummons: null,
        enchantmentProfile: null,
        promptEnchantment: null,
        summonsProfile: null,
        beginConcentrating: null,
        endConcentration: null,
    },{
        skipItemMacro: true,
        configureDialog: true,
        createMessage: false,
    });
    if(!msgData) return;

    const flagData = {
        chosenSpellId: chosenSpell.id,
        chosenSpellLevel: msgData.flags.dnd5e.use.spellLevel,
        description: `<p><b>Circumstance: </b>${spellDialogResult.condition}</p>
        <p>The contingent spell takes effect immediately after the circumstance is met for the first time, whether or not you want it to, and then contingency ends.</p>`,
        name: chosenSpell.system.level === 0 ? `Contingency: ${chosenSpell.name}` : `Contingency: ${CONFIG.DND5E.spellLevels[msgData.flags.dnd5e.use.spellLevel]} ${chosenSpell.name}`,
        condition: spellDialogResult.condition,
    };

    //get effect
    const effect = item.effects.contents[0];
    await effect.setFlag("talia-custom", "contingencyEffectData", flagData);
    
    return true;
}

async function chooseSpellDialog(validSpells) {
    const spellChoices = validSpells.reduce((acc, curr) => {
        acc[curr.id] = `${curr.name}`;
        return acc;
    }, {});
    const selectSpellsGroup = new foundry.data.fields.StringField({
        label: `Select a spell`,
        choices: spellChoices,
        required: true,
        hint: "Only spells valid for the Contingency spell are displayed.",
    }).toFormGroup({},{name: "spellId", spellChoices}).outerHTML;
    const content = `<fieldset>${selectSpellsGroup}</fieldset>
    <label>Condition <input name="condition" type="string"/></label>`;
    return foundry.applications.api.DialogV2.prompt({
        window: {
            title: "Contingency",
        },
        content,
        modal: true,
        rejectClose: false,
        ok: {
            label: "Ok",
            callback: (event, button) => new FormDataExtended(button.form).object,
        }
    });
}

function getValidSpells(actor, rollData) {
    /*  CONSTRAINTS
        - 5th level or lower
        - casting time = 1 action
        - can target self
    */
    const allowedTargetTypes = ["ally", "any", "creature", "creatureOrObject", "self", "willing"];
    return actor.itemTypes.spell.filter(i => {
        const is = i.system;
        return is.activation.cost === 1 &&
            is.activation.type === "action" &&
            is.level <= 5 &&
            allowedTargetTypes.includes(is.target.type)
    });
}