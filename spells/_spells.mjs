import arcaneGate from "./arcaneGate.mjs";
import contingency from "./contingency.mjs";
import revelationThroughBattle from "./revelationThroughBattle.mjs"
import skillEmpowerment from "./skillEmpowerment.mjs";
import heroesFeast from "./heroesFeast.mjs";
import bladeWard from "./bladeWard.mjs";
import absorbElements from "./absorbElements.mjs";
import witheringTouch from "./witheringTouch.mjs";


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
    }
}
