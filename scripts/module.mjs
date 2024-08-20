import { MODULE } from "./constants.mjs"
import { TaliaCustomAPI } from "./api.mjs";
import _utils from "../utils/_utils.mjs";
import { registerWrappers } from "../wrappers/_wrappers.mjs";

import _world from "../world/_world.mjs";
import _gmMacros from "../gmMacros/_gmMacros.mjs";
import _items from "../items/_items.mjs";
import _spells from "../spells/_spells.mjs";
import _features from "../features/_features.mjs";


/*
import beastSpirits from "../aviana/items/beastSpirits.mjs";
import cooking from "../features/professions/chefAndCooking/cooking.mjs";
import chef from "../shalkoc/Feats/chef.mjs";
import spellscribing from "../spellscribing/spellscribing.mjs";
import spellbooks from "../fearghas/items/spellbooks.mjs";
import spellbookLich from "../fearghas/items/spellbookLich.mjs";


import contraptionsCrafting from "../plex/contraptionsCrafting/contraptionsCrafting.mjs";
import alchemy from "../alchemy/alchemy.mjs";
import tokenAdjacencyCheck from "../inGame-macrosAndScripts/tokenAdjacencyCheck.mjs";
import martialStyleStances from "../features/character/shalkoc/martialStyleStances.mjs";
import mythicRanks from "../allActors/mythicRanks.mjs";
import breathOfTheDragon from "../shalkoc/Feats/breathOfTheDragon.mjs";
import homebrewRules from "../allActors/homebrewRules.mjs";
*/


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
    4) SECTIONS (each section should manage it's own hooks)


    SECTIONS

    - GM Macros
        - (DONE) playerInspirations             //change call

    - World
        - (DONE) Wild Magic                     //change call
        - (DONE) Soul-Bound Item Property
        - (DONE) Conditions

    - Items
        - (DONE) Guardian Scales
        - (DONE) Grateful Fey Charm             //change call
        - (DONE) Mantle of the Arcane Trickster
        - (DONE) Vice Grip                      //change call


    - Features
        - Mythic
        - Shared
            - Common Actions
                - (DONE) Jump                   //change call
                - (DONE) Grapple                //change call
                - Shove
        - Character (class, subclass, race, & special)
            - Shalkoc
                - (DONE) Martial Style Stances         //change call
                - (DONE) Breath of the Dragon                  //change call

            - Aviana
                - (DONE) Beast Spirits             //change call for each

            - Wizard (shared)
            - Fearghas
            - Plex

        - Professions
            - Spellscribing
            - Cooking & Chef    //TODO: combine cooking and chef
            - Alchemy    
            - Contraptions

    - Spells
        - (DONE) Revelation Through Battle
        - (DONE) Skill Empowerment
    
    

    - Homebrew Rules
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
}

/*
Hooks.once("init", () => {
    wildMagic._onInit();
    cooking._onInit();
    beastSpirits._onInit();
    spellscribing._onInit();
    spellbooks._onInit();
    commonActions._onInit();
    contraptionsCrafting._onInit();
    alchemy._onInit();
    martialStyleStances._onInit();
    mythicRanks._onInit();
    changesToConditions._onInit();
    soulBoundItemProperty._onInit();
    homebrewRules._onInit();
});

Hooks.once("setup", () => {
    TaliaCustomAPI._setup();
    _spells._onSetup();         //collection for all spell scripts  //move these to the more generalised _itemMacros 
    _itemMacros._onSetup();     //collection for all item macros
    cooking._onSetup();
    wildMagic._onSetup();
    beastSpirits._onSetup();
    chef._onSetup();
    spellscribing._onSetup();
    spellbooks._onSetup();
    spellbookLich._onSetup();
    gratefulFeyCharm._onSetup();
    contraptionsCrafting._onSetup();
    helpersToApi._onSetup();
    alchemy._onSetup();
    tokenAdjacencyCheck._onSetup();
    martialStyleStances._onSetup();
    mantleOfTheArcaneTrickster._onSetup();
    playerInspirations._onSetup();
    breathOfTheDragon._onSetup();
    soulBoundItemProperty._onSetup();
    guardianScales._onSetup();
    grapple._onSetup();
    

    console.log(`${MODULE.ID} setup complete.`);
});

*/