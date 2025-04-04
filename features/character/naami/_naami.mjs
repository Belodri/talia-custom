import channeledMetamagic from "./channeledMetamagic.mjs";
import metamagic from "./metamagic.mjs";

export default {
    registerSubsection() {
        channeledMetamagic.register();
        metamagic.register();
    }
}
