import { TaliaCustomAPI } from "../../scripts/api.mjs"
import Guild from "./guild.mjs"

const partialTemplates = [
    'modules/talia-custom/templates/guildTemplates/partials/missionCard.hbs',
    'modules/talia-custom/templates/guildTemplates/partials/adventurerCard.hbs'
];

export default {
    registerSubsection() {
        TaliaCustomAPI.add( {Guild} , "none");

        Hooks.once("ready", async() => {
            loadTemplates(partialTemplates);
        });
    }
}
