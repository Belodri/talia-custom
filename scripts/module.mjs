import { MODULE } from "./constants.mjs"
import { setupSocket } from "./socket.mjs";
import { createAPI } from "./api.mjs";



import { initCooking, setupCooking } from "../shalkoc/cooking.mjs";
import { setupChef } from "../shalkoc/Feats/chef.mjs";
import { initSpellscribing, setupSpellscribing } from "../spellscribing/spellscribing.mjs";


Hooks.once("socketlib.ready", () => {
    setupSocket();
});

Hooks.once("init", () => {
    initCooking();
    initSpellscribing();
});

Hooks.once("setup", () => {
    createAPI();
    setupCooking();
    setupChef();
    setupSpellscribing();
    console.log(`${MODULE.ID} set up.`);
});