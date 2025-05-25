import _aviana from "./aviana/_aviana.mjs"
import _fearghas from "./fearghas/_fearghas.mjs";
import _plex from "./plex/_plex.mjs";
import _shalkoc from "./shalkoc/_shalkoc.mjs";
import _wizardShared from "./wizardShared/_wizardShared.mjs";
import _naami from "./naami/_naami.mjs";
import _emilio from "./emilio/_emilio.mjs";
import _kyrin from "./kyrin/_kyrin.mjs";

export default {
    registerSubsection() {
        _aviana.registerSubsection();
        _fearghas.registerSubsection();
        _plex.registerSubsection();
        _shalkoc.registerSubsection();
        _wizardShared.registerSubsection();
        _naami.registerSubsection();
        _emilio.registerSubsection();
        _kyrin.registerSubsection();
    }
}
