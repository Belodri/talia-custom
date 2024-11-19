import { TaliaCustomAPI } from "../scripts/api.mjs";
import { MODULE } from "../scripts/constants.mjs";
import { ItemHookManager } from "../utils/ItemHookManager.mjs";

export default {
    register() {
        //ItemHookManager.register("Contingency", itemMacro);

        TaliaCustomAPI.add({contingency: {
            choose: chooseContingencySpell,
            trigger: triggerContingencySpell
        }}, "ItemMacros");
    }
}

/**
 * Uses the contingency item referenced in the AE and deletes the active effect.
 * @param {Item5e} item 
 * @returns {void}
 */
async function triggerContingencySpell(item) {
    const actor = item.actor;
    const contingencyEffect = actor.appliedEffects.find(e => e.flags[MODULE.ID]?.contingencyEffectData);
    if(!contingencyEffect) return ui.notifications.info("No contingency effect active.")

    const spellData = contingencyEffect.flags[MODULE.ID].contingencyEffectData;

    //get the spell
    const spell = actor.items.getName(spellData.name);
    if(!spell) return ui.notifications.warn(`Spell "${spellData.name}" not found on actor.`);

    //get the spell useage config and edit it
    const config = spell._getUsageConfig();
    config.slotLevel = spellData.level;
    ["consumeResource", "consumeSpellSlot", "consumeUsage", "createMeasuredTemplate", "createSummons"].forEach(v => {
        config[v] = null;
    });
    
    //use the spell
    await spell.use(config, {configureDialog: false, canSurge: false});

    //delete the active effect
    await contingencyEffect.delete();
}

/**
 * 
 * @param {Item5e} item 
 * @returns {void}
 */
async function chooseContingencySpell(item) {
    const actor = item.actor;

    //check for a previous contingency effect and throw an error if one is found
    if(actor.appliedEffects.some(e => e.flags[MODULE.ID]?.contingencyEffectData)) {
        return ui.notifications.warn("You already have a contingency active.");
    }

    //get valid spells
    //const allowedTargetTypes = ["ally", "any", "creature", "creatureOrObject", "self", "willing"];
    const validSpells = actor.itemTypes.spell.filter(i => {
        const is = i.system;
        return is.activation.cost === 1 &&
            is.activation.type === "action" &&
            is.level <= 5 &&
            is.target.type
    });
    if(!validSpells) return ui.notifications.info("You have no valid spells available.");

    //choose a spell and a condition
    const chosen = await (() => {
        const spellChoicesField = new foundry.data.fields.StringField({
            label: "Select a spell",
            choices: validSpells.reduce((acc, curr) => {
                acc[curr.id] = curr.name;
                return acc;
            }, {}),
            required: true,
            hint: "Some of these spells might not be valid for Contingency. Please check the spell itself and ask the DM if you're unsure.",
        }).toFormGroup({},{name: "spellId"}).outerHTML;
    
        const conditionInputField = new foundry.data.fields.StringField({
            label: "Condition",
            required: true,
        }).toFormGroup({},{name: "conditionText"}).outerHTML;
    
        return foundry.applications.api.DialogV2.prompt({
            window: { title: item.name },
            content: spellChoicesField + conditionInputField,
            modal: true,
            rejectClose: false,
            ok: { callback: (_, button) => new FormDataExtended(button.form).object }
        });
    })();
    if(!chosen) return;
    if(!chosen.conditionText.length) return ui.notifications.warn("You need to set a condition for your contingency spell.");
    const chosenSpell = actor.items.get(chosen.spellId);

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

    const spellData = {
        name: chosenSpell.name,
        id: chosenSpell.id,
        condition: chosen.conditionText,
        level: msgData.flags.dnd5e.use.spellLevel,
    }

    //create the effect on the actor
    const effectData = {
        name: chosenSpell.system.level === 0 ? `Contingency: ${spellData.name}` : `Contingency: ${CONFIG.DND5E.spellLevels[spellData.level]} ${spellData.name}`,
        description: `<p><b>Circumstance: </b>${spellData.condition}</p>
        <p>The contingent spell takes effect immediately after the circumstance is met for the first time, whether or not you want it to, and then contingency ends.</p>`,
        img: item.img,
        flags: {
            [MODULE.ID]: {
                contingencyEffectData: spellData,
            },
            dae: {
                stackable: "noneName",
            },
        },
        duration: {
            seconds: 60 * 60 * 24 * 10,  //10 days
            type: "seconds"
        },
        origin: item.uuid,
    };
    const effect = await ActiveEffect.implementation.create(effectData, {parent: item.parent});
}