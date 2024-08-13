import { MODULE } from "./constants.mjs"
import { setupSocket } from "./socket.mjs";
import { TaliaCustomAPI } from "./api.mjs";

import _spells from "../spells/_spells.mjs";
import beastSpirits from "../aviana/items/beastSpirits.mjs";
import wildMagic from "../wildMagic/wildMagic.mjs";
import cooking from "../shalkoc/cooking.mjs";
import chef from "../shalkoc/Feats/chef.mjs";
import spellscribing from "../spellscribing/spellscribing.mjs";
import spellbooks from "../fearghas/items/spellbooks.mjs";
import spellbookLich from "../fearghas/items/spellbookLich.mjs";
import jump from "../allActors/jump.mjs";
import gratefulFeyCharm from "../aviana/items/gratefulFeyCharm.mjs";
import commonActions from "../allActors/commonActions.mjs";
import shove from "../allActors/shove.mjs";
import contraptionsCrafting from "../plex/contraptionsCrafting/contraptionsCrafting.mjs";
import { helpersToApi } from "./_foundryHelpers.mjs";
import templateOpenCharSheet from "../systemChanges/templateOpenCharSheet.mjs";
import alchemy from "../alchemy/alchemy.mjs";
import tokenAdjacencyCheck from "../inGame-macrosAndScripts/tokenAdjacencyCheck.mjs";
import martialStyleStances from "../shalkoc/Feats/martialStyleStances.mjs";
import mythicRanks from "../allActors/mythicRanks.mjs";
import mantleOfTheArcaneTrickster from "../plex/contraptionsCrafting/items/mantleOfTheArcaneTrickster.mjs";
import playerInspirations from "../gmScriptsAndMacros/playerInspirations.mjs";
import breathOfTheDragon from "../shalkoc/Feats/breathOfTheDragon.mjs";
import changesToConditions from "../allActors/changesToConditions.mjs";
import soulBoundItemProperty from "../allActors/soulBoundItemProperty.mjs";
import guardianScales from "../allActors/sharedMagicItems/guardianScales.mjs";
import homebrewRules from "../allActors/homebrewRules.mjs";
import grapple from "../allActors/grapple.mjs";
import _itemMacros from "../ItemMacros/_itemMacros.mjs";

Hooks.once("socketlib.ready", () => {
    setupSocket();
});

Hooks.once("libWrapper.Ready", () => {
    jump._onLibWrapperReady();
    templateOpenCharSheet._onLibWrapperReady();
});

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
    

    console.log(`${MODULE.ID} set up.`);
});

//add flags to DAE
Hooks.once("DAE.setupComplete", () => {
    jump._onDAESetup();
    shove._onDAESetup();
});