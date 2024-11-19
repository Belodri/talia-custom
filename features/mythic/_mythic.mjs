import legend from "./legend.mjs"

export default {
    registerSubsection() {
        CONFIG.DND5E.featureTypes.mythic = {
            label: "Mythic"
        }

        legend.register();
    }
}