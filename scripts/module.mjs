import { MODULE } from "./constants.mjs"
import { setupSocket } from "./socket.mjs";
import { createAPI } from "./api.mjs";


import { initWildMagic, setupWildMagic } from "../wildMagic/wildMagic.mjs";
import { initCooking, setupCooking } from "../shalkoc/cooking.mjs";
import { setupChef } from "../shalkoc/Feats/chef.mjs";
import { initSpellscribing, setupSpellscribing } from "../spellscribing/spellscribing.mjs";
import { init_spellbookLich, setup_spellbookLich } from "../fearghas/items/spellbookLich.mjs";


Hooks.once("socketlib.ready", () => {
    setupSocket();
});

Hooks.once("init", () => {
    initWildMagic();
    initCooking();
    initSpellscribing();
    init_spellbookLich();
});

Hooks.once("setup", () => {
    createAPI();
    setupCooking();
    setupChef();
    setupSpellscribing();
    setupWildMagic();
    setup_spellbookLich();
    console.log(`${MODULE.ID} set up.`);
});