import gratefulFeyCharm from "./gratefulFeyCharm.mjs";
import guardianScales from "./guardianScales.mjs"
import mantleOfTheArcaneTrickster from "./mantleOfTheArcaneTrickster.mjs";
import viceGrip from "./viceGrip.mjs";

export default {
    registerSection() {
        gratefulFeyCharm.register();
        guardianScales.register();
        mantleOfTheArcaneTrickster.register();
        viceGrip.register();
    }
}

