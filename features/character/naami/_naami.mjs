import channeledMetamagic from "./channelledMetamagic.mjs";
import metamagic from "./metamagic.mjs";

export default {
    registerSubsection() {
        metamagic.register();
        channeledMetamagic.register();
    }
}
