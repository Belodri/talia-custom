import Soulknife from "./Soulknife.mjs";
import shapechanger from "./shapechanger.mjs";
import telekineticMovement from "./telekineticMovement.mjs";

export default {
    registerSubsection() {
        Soulknife.register();
        shapechanger.register();
        telekineticMovement.register();
    }
}
