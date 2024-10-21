import { TaliaCustomAPI } from "./api.mjs";
import _utils from "../utils/_utils.mjs";
import { registerWrappers } from "../wrappers/_wrappers.mjs";

import _world from "../world/_world.mjs";
import _gmMacros from "../gmMacros/_gmMacros.mjs";
import _items from "../items/_items.mjs";
import _spells from "../spells/_spells.mjs";
import _features from "../features/_features.mjs";

/*
    API looks like this:

    TaliaCustom = {
        AlchemyAPI: {...},
        TaliaUtils: {...},  
        ItemMacros: {
            grapple,
            jump,
            viceGrip,
            gratefulFeyCharm,
            shiftingStances,
            breathOfTheDragon,
            revelationThroughBattle,
            skillEmpowerment,
            beastSpirits,
            spellScribing,
            cunningContraptions,
            triggerContraption
        },
        EffectMacros: {},
        GmMacros: {
            rollPlayerInspirations,
        },
        Macros: {
            wildMagicSurge,  
        },
        Other: {
            getJumpDistance
        }
    }
*/

/*
    LOAD ORDER

    1) API
    2) Utils
    3) Wrappers
    4) SECTIONS (each section should manage it's own order)
*/


Hooks.once("init", () => {
    TaliaCustomAPI._setup();
    _utils.registerSection();
    registerWrappers();

    //sections
    _world.registerSection();
    _gmMacros.registerSection();
    _items.registerSection();
    _spells.registerSection();
    _features.registerSection();
    registerHomebrewRules();
});

function registerHomebrewRules() {
    //  all of the keys have to be lowercase only for some reason!
    CONFIG.DND5E.rules.legres = "Compendium.talia-custom.rules.JournalEntry.ZkD6R9Ye9Sr77OCt.JournalEntryPage.y7XsmDawHmZdSTTR";
    CONFIG.DND5E.rules.alchemy = "Compendium.talia-custom.rules.JournalEntry.ZkD6R9Ye9Sr77OCt.JournalEntryPage.Z0XP4RuNUbFSIMVN";       //also in alchemy.mjs
    CONFIG.DND5E.rules.craftingcontraptions = "Compendium.talia-custom.rules.JournalEntry.ZkD6R9Ye9Sr77OCt.JournalEntryPage.0pmGvF3yS5xoUoEU";  //also in craftingContraptions.mjs
    CONFIG.DND5E.rules.triggeredabilities = "Compendium.talia-custom.rules.JournalEntry.ZkD6R9Ye9Sr77OCt.JournalEntryPage.DCZAvOjR2CqqnEpT";
    CONFIG.DND5E.rules.ancientarmor = "Compendium.talia-custom.rules.JournalEntry.ZkD6R9Ye9Sr77OCt.JournalEntryPage.teudeOPJnJzaJQiV";      //also in spellFailureChance.mjs
    CONFIG.DND5E.rules.undoingasurge = "Compendium.talia-custom.rules.JournalEntry.ZkD6R9Ye9Sr77OCt.JournalEntryPage.fXqW6yKBSh1Duwlw";
    CONFIG.DND5E.rules.spellscribing = "Compendium.talia-custom.rules.JournalEntry.ZkD6R9Ye9Sr77OCt.JournalEntryPage.RRUMkplfkv2jAr8s";
}