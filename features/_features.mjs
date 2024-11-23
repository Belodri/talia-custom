import _character from "./character/_character.mjs";
import _mythic from "./mythic/_mythic.mjs";
import _professions from "./professions/_professions.mjs";
import _shared from "./shared/_shared.mjs"

export default {
    registerSection() {
        _shared.registerSubsection();
        _character.registerSubsection();
        _professions.registerSubsection();
        _mythic.registerSubsection();
    }
}
