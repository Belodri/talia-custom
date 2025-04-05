import arcaneGate from "./arcaneGate.mjs";
import contingency from "./contingency.mjs";
import revelationThroughBattle from "./revelationThroughBattle.mjs"
import skillEmpowerment from "./skillEmpowerment.mjs";
import heroesFeast from "./heroesFeast.mjs";
import bladeWard from "./bladeWard.mjs";
import absorbElements from "./absorbElements.mjs";
import witheringTouch from "./witheringTouch.mjs";
import darkness from "./darkness.mjs";
import polymorph from "./polymorph.mjs";
import rayOfEnfeeblement from "./rayOfEnfeeblement.mjs";


export default {
    registerSection() {
        revelationThroughBattle.register();
        skillEmpowerment.register();
        arcaneGate.register();
        contingency.register();
        heroesFeast.register();
        bladeWard.register();
        absorbElements.register();
        witheringTouch.register();
        darkness.register();
        polymorph.register();
        rayOfEnfeeblement.register();
    }
}
