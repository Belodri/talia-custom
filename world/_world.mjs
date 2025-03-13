import changesToConditions from "./changesToConditions.mjs";
import itemProperties from "./itemProperties.mjs";
import spellFailureChance from "./spellFailureChance.mjs";
import WildMagic from "./wildMagic/wildMagic.mjs";
import customLimitedUsePeriods from "./customLimitedUsePeriods.mjs";
import _settlement from "./settlement/_settlement.mjs";
import damageAbsorption from "./damageAbsorption.mjs";
import _guildmanager from "./guildmanager/_guildmanager.mjs";
import addActiveEffectFields from "./addActiveEffectFields.mjs";


export default {
    registerSection() {
        WildMagic.register();
        itemProperties.register();
        changesToConditions.register();
        spellFailureChance.register();
        customLimitedUsePeriods.register();
        _settlement.registerSubsection();
        damageAbsorption.register();
        addActiveEffectFields.register();
        _guildmanager.registerSubsection();
    }
}
