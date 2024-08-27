import arcaneGate from "./arcaneGate.mjs";
import revelationThroughBattle from "./revelationThroughBattle.mjs"
import skillEmpowerment from "./skillEmpowerment.mjs";


export default {
    registerSection() {
        revelationThroughBattle.register();
        skillEmpowerment.register();
        arcaneGate.register();
    }
}