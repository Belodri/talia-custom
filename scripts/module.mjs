import { MODULE } from "./constants.mjs"
import { setupSocket } from "./socket.mjs";
import { TaliaCustomAPI } from "./api.mjs";



//import { setup_spellbookLich } from "../fearghas/items/spellbookLich.mjs";
//import { Spellbooks } from "../fearghas/items/spellbooks.mjs";


import beastSpirits from "../aviana/items/beastSpirits.mjs";
import wildMagic from "../wildMagic/wildMagic.mjs";
import cooking from "../shalkoc/cooking.mjs";
import chef from "../shalkoc/Feats/chef.mjs";
import spellscribing from "../spellscribing/spellscribing.mjs";
import spellbooks from "../fearghas/items/spellbooks.mjs";
import spellbookLich from "../fearghas/items/spellbookLich.mjs";


Hooks.once("socketlib.ready", () => {
    setupSocket();
});

Hooks.once("init", () => {
    wildMagic._onInit();
    cooking._onInit();
    beastSpirits._onInit();
    spellscribing._onInit();
    spellbooks._onInit();
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

    console.log(`${MODULE.ID} set up.`);
});