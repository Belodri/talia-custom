import { MODULE } from "./constants.mjs"
import { setupSocket } from "./socket.mjs";
import { TaliaCustomAPI } from "./api.mjs";


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
import skillEmpowerment from "../spells/skillEmpowerment.mjs";
import martialStyleStances from "../shalkoc/Feats/martialStyleStances.mjs";
import customActiveEffects from "./customActiveEffects.mjs";
import actorWrappers from "../allActors/actorWrappers.mjs";
import sizeIndex from "../allActors/sizeIndex.mjs";

Hooks.once("socketlib.ready", () => {
    setupSocket();
});

Hooks.once("libWrapper.Ready", () => {
    actorWrappers._onLibWrapperReady();
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
    customActiveEffects._onInit();
    sizeIndex._onInit();

});

Hooks.once("setup", () => {
    TaliaCustomAPI._setup();
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
    skillEmpowerment._onSetup();
    martialStyleStances._onSetup();

    sizeIndex._onSetup();

    customActiveEffects._onSetup();
    

    console.log(`${MODULE.ID} set up.`);
});

//add flags to DAE
Hooks.once("DAE.setupComplete", () => {
    jump._onDAESetup();
    shove._onDAESetup();
});