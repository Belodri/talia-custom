import beastSpirits from "./beastSpirits.mjs"
import relentlessRage from "./relentlessRage.mjs";

export default {
    registerSubsection() {
        beastSpirits.register();
        relentlessRage.register();
    }
}