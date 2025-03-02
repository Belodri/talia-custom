import { TaliaCustomAPI } from "../../scripts/api.mjs"
import Guild from "./guild.mjs"

const partialTemplates = [
    'modules/talia-custom/templates/guildTemplates/partials/missionCard.hbs',
    'modules/talia-custom/templates/guildTemplates/partials/adventurerCard.hbs',
    'modules/talia-custom/templates/guildTemplates/partials/missions.hbs',
    'modules/talia-custom/templates/guildTemplates/partials/adventurers.hbs',
];

export default {
    registerSubsection() {
        TaliaCustomAPI.add( {Guild} , "none");

        Hooks.once("ready", async() => {
            loadTemplates(partialTemplates);
        });
    }
}
