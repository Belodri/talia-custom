import changesToConditions from "./changesToConditions.mjs";
import soulBoundItemProperty from "./soulBoundItemProperty.mjs";
import spellFailureChance from "./spellFailureChance.mjs";
import wildMagic from "./wildMagic/wildMagic.mjs";
import customLimitedUsePeriods from "./customLimitedUsePeriods.mjs";
import _settlement from "./settlement/_settlement.mjs";
import damageAbsorption from "./damageAbsorption.mjs";


export default {
    registerSection() {
        wildMagic.register();
        soulBoundItemProperty.register();
        changesToConditions.register();
        spellFailureChance.register();
        customLimitedUsePeriods.register();
        _settlement.registerSubsection();
        damageAbsorption.register();
    }
}