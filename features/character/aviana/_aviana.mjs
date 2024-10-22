import beastSpirits from "./beastSpirits.mjs"
import divingStrike from "./divingStrike.mjs";
import relentlessRage from "./relentlessRage.mjs";

export default {
    registerSubsection() {
        beastSpirits.register();
        relentlessRage.register();
        divingStrike.register();
    }
}