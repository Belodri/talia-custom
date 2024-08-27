import playerInspirations from "./playerInspirations.mjs"
import restPrompt from "./restPrompt.mjs";

export default {
    registerSection() {
        playerInspirations.register();
        restPrompt.register();
    }
}