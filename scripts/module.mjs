import { MODULE } from "./constants.mjs"
import { setupSocket } from "./socket.mjs";


import { initCooking, setupCooking } from "../shalkoc/cooking.mjs";



Hooks.once("socketlib.ready", () => {
    setupSocket;
});

Hooks.once("init", () => {
    initCooking();
});

Hooks.once("setup", () => {
    setupCooking();
    console.log(`${MODULE.ID} set up.`);
});