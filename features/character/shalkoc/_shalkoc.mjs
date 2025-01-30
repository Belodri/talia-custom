import aspectOfTheWyrm from "./aspectOfTheWyrm.mjs";
import breathOfTheDragon from "./breathOfTheDragon.mjs";
import martialStyleStances from "./martialStyleStances.mjs"
import stepOfTheWind from "./stepOfTheWind.mjs";

export default {
    registerSubsection() {
        martialStyleStances.register();
        breathOfTheDragon.register();
        aspectOfTheWyrm.register();
        stepOfTheWind.register();
    }
}
