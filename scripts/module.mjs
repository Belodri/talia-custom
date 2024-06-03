import { MODULE } from "./constants.mjs"

Hooks.on("init", () => {
    console.log(`${MODULE.ID} initialized.`);
});