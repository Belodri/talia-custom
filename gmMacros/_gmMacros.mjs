import playerInspirations from "./playerInspirations.mjs"
import restPrompt from "./restPrompt.mjs";
import pcItemsToJSON from "./pcItemsToJSON.mjs"
import monsterAttackDescriptionGen from "./monsterAttackDescriptionGen.mjs";
import restManager from "./restManager.mjs"

export default {
    registerSection() {
        playerInspirations.register();
        restPrompt.register();
        pcItemsToJSON.register();
        monsterAttackDescriptionGen.register();
        restManager.register();
    }
}