import grapple from "./grapple.mjs";
import jump from "./jump.mjs";

export default {
    registerSubsection() {
        CONFIG.DND5E.featureTypes.commonAction = {
            label: "Common Action"
        };

        grapple.register();
        jump.register();
    }
}