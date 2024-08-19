import _aviana from "./aviana/_aviana.mjs"
import _fearghas from "./fearghas/_fearghas.mjs";
import _plex from "./plex/_plex.mjs";
import _shalkoc from "./shalkoc/_shalkoc.mjs";
import _wizardShared from "./wizardShared/_wizardShared.mjs";

export default {
    registerSubsection() {
        _aviana.registerSubsection();
        _fearghas.registerSubsection();
        _plex.registerSubsection();
        _shalkoc.registerSubsection();
        _wizardShared.registerSubsection();
    }
}