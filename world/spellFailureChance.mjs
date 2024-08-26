import { TaliaUtils } from "../utils/_utils.mjs";

export default {
    register() {
        //add "Spell Failure" item property to indicate items that can cause spell failure
        CONFIG.DND5E.itemProperties.spellFail = {
            label: "Spell Failure",
            icon: "systems/dnd5e/icons/svg/items/equipment.svg"
        };
        //add item property to valid item types
        CONFIG.DND5E.validProperties.equipment.add("spellFail");
        CONFIG.DND5E.rules.ancientarmor = "Compendium.talia-custom.rules.JournalEntry.ZkD6R9Ye9Sr77OCt.JournalEntryPage.teudeOPJnJzaJQiV";
        Hooks.on("dnd5e.useItem", arcaneSpellFailure);
    }
}

async function arcaneSpellFailure(item, config, options) {
    if(options.flags?.dnd5e?.use?.type !== "spell") return;     //only allow spells
    if(!item.system.properties?.has("somatic")) return;         //only allow spells with somatic components

    //check if user is wearing equipment with spell failure chance
    const spellFailItems = item.actor.itemTypes.equipment.filter(i => i.system.properties.has("spellFail") && i.system.equipped);
    if(!spellFailItems.length) return;

    //check the base type for the spell failure chance to apply for each item and sum them up
    const failChanceSumRaw = spellFailItems.reduce((acc, curr) => acc += curr.flags?.["talia-custom"]?.spellFailChance ?? 0, 0);
    //makes sure the chance is a multiple of 5, round up  to the nearest multiple of 5 if needed
    const spellFailChance = failChanceSumRaw % 5 === 0 ? failChanceSumRaw : failChanceSumRaw + (5 - failChanceSumRaw % 5);

    const roll = await dnd5e.dice.d20Roll({
        targetValue: spellFailChance / 5, 
        createMessage: true, 
        fastForward: true, 
        flavor: `Arcane Spell Failure chance: ${spellFailChance}% = DC: ${spellFailChance/5}`, 
        rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
        messageData: {
            speaker: ChatMessage.implementation.getSpeaker({
                actor: item.actor, 
                token: item.actor.token || undefined
            }),
            blind: false,
        }
    });

    //maybe add a check and further handling when an arcane failure check fails

    //if(TaliaUtils.Helpers.isRollSuccess(roll)) return;
}