import channeledMetamagic from "./channelledMetamagic.mjs";
import metamagic from "./metamagic.mjs";
import metamagicMastery from "./metamagicMastery.mjs"

export default {
    registerSubsection() {
        metamagic.register();
        channeledMetamagic.register();
        metamagicMastery.register();
    }
}
