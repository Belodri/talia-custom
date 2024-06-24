import { MODULE } from "./constants.mjs"
import { setupSocket } from "./socket.mjs";
import { createAPI } from "./api.mjs";


import { initWildMagic, setupWildMagic } from "../wildMagic/wildMagic.mjs";
import { initCooking, setupCooking } from "../shalkoc/cooking.mjs";
import { setupChef } from "../shalkoc/Feats/chef.mjs";
import { initSpellscribing, setupSpellscribing } from "../spellscribing/spellscribing.mjs";
import { setup_spellbookLich } from "../fearghas/items/spellbookLich.mjs";
import { Spellbooks } from "../fearghas/items/spellbooks.mjs";


Hooks.once("socketlib.ready", () => {
    setupSocket();
});

Hooks.once("init", () => {
    initWildMagic();
    initCooking();
    initSpellscribing();
    Spellbooks._init();
});

Hooks.once("setup", () => {
    createAPI();
    setupCooking();
    setupChef();
    setupSpellscribing();
    setupWildMagic();
    Spellbooks._setup();
    setup_spellbookLich();
    console.log(`${MODULE.ID} set up.`);
});