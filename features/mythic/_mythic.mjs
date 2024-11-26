import legend from "./legend.mjs"
import lich from "./lich.mjs"
import trickster from "./trickster.mjs"
import dragon from "./dragon.mjs"

export default {
    registerSubsection() {
        CONFIG.DND5E.featureTypes.mythic = {
            label: "Mythic"
        }

        legend.register();
        lich.register();
        trickster.register();
        dragon.register();
    }
}
