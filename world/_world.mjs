import changesToConditions from "./changesToConditions.mjs";
import soulBoundItemProperty from "./soulBoundItemProperty.mjs";
import spellFailureChance from "./spellFailureChance.mjs";
import wildMagic from "./wildMagic/wildMagic.mjs";


export default {
    registerSection() {
        wildMagic.register();
        soulBoundItemProperty.register();
        changesToConditions.register();
        spellFailureChance.register();
    }
}