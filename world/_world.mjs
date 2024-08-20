


/** 
    TODO:  Wild Magic
    TODO:  Soul-Bound Item Property
    TODO:  Conditions
    TODO:  Inspiration
*/

import changesToConditions from "./changesToConditions.mjs";
import soulBoundItemProperty from "./soulBoundItemProperty.mjs";
import wildMagic from "./wildMagic/wildMagic.mjs";


export default {
    registerSection() {
        wildMagic.register();
        soulBoundItemProperty.register();
        changesToConditions.register();
    }
}