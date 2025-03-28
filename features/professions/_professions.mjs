import alchemy from "./alchemy/alchemy.mjs";
import chef from "./chefAndCooking/chef.mjs";
import contraptionsCrafting from "./contraptionsCrafting/contraptionsCrafting.mjs";
import spellscribing from "./spellscribing/spellscribing.mjs"

export default {
    registerSubsection() {
        spellscribing.register();
        contraptionsCrafting.register();
        alchemy.register();
        chef.register();
    }
}
