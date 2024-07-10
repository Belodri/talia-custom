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

    console.log(`${MODULE.ID} set up.`);
});

//add flags to DAE
Hooks.once("DAE.setupComplete", () => {
    jump._onDAESetup();
    shove._onDAESetup();
});