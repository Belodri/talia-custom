import feyStep from "./feyStep.mjs"
import toweringPillarOfHats from "./toweringPillarOfHats.mjs";

export default {
    registerSubsection() {
        feyStep.register();
        toweringPillarOfHats.register();
    }
}