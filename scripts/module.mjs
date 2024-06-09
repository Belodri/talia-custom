import { MODULE } from "./constants.mjs"
import { setupSocket } from "./socket.mjs";


import { initCooking, setupCooking } from "../shalkoc/cooking.mjs";
import { setupChef } from "../shalkoc/Feats/chef.mjs";



Hooks.once("socketlib.ready", () => {
    setupSocket();
});

Hooks.once("init", () => {
    initCooking();
});

Hooks.once("setup", () => {
    setupCooking();
    setupChef();
    console.log(`${MODULE.ID} set up.`);
});