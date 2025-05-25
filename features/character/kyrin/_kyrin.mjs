import Soulknife from "./Soulknife.mjs";
import shapechanger from "./shapechanger.mjs";

export default {
    registerSubsection() {
        Soulknife.register();
        shapechanger.register();
    }
}
