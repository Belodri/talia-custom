import playerInspirations from "./playerInspirations.mjs"
import restPrompt from "./restPrompt.mjs";
import pcItemsToJSON from "./pcItemsToJSON.mjs"

export default {
    registerSection() {
        playerInspirations.register();
        restPrompt.register();
        pcItemsToJSON.register();
    }
}