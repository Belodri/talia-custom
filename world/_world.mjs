import changesToConditions from "./changesToConditions.mjs";
import itemProperties from "./itemProperties.mjs";
import spellFailureChance from "./spellFailureChance.mjs";
import wildMagic from "./wildMagic/wildMagic.mjs";
import customLimitedUsePeriods from "./customLimitedUsePeriods.mjs";
import _settlement from "./settlement/_settlement.mjs";
import damageAbsorption from "./damageAbsorption.mjs";
import _guildmanager from "./guildmanager/_guildmanager.mjs";


export default {
    registerSection() {
        wildMagic.register();
        itemProperties.register();
        changesToConditions.register();
        spellFailureChance.register();
        customLimitedUsePeriods.register();
        _settlement.registerSubsection();
        damageAbsorption.register();
    }
}
