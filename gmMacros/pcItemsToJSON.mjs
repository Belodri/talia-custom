import { TaliaCustomAPI } from "../scripts/api.mjs";
export default {
    register() {
        TaliaCustomAPI.add({pcItemsToJSON: actorItemsToClipboard}, "GmMacros");
    }
}

/*  get item info:

    All
    - Name
    - Description

    items
    - quantity
    - attunement
    - type & subtype

    features
    - requirements

    spell
    - spell level
    - spell school
    - spell range
*/

/**
 * @typedef {object} ItemData
 * @property {string} name
 * @property {string} itemType
 * @property {string} description
 * @property {string} attunement
 * @property {number} quantity
 * @property {string} requirements
 * @property {string} typeLabel
 * @property {string} subType
 * @property {string} spellLevel
 * @property {string} spellRange
 * @property {string} spellSchool
 */

/**
 * @typedef {object} TaliaDate
 * @property {number} day
 * @property {number} month
 * @property {number} year
 * @property {number} hour
 * @property {number} minute
 * @property {number} seconds
 */


/**
 *
 */
async function actorItemsToClipboard() {
    if(!game.user.isGM) return;

    setTimeout(async() => {
        const pcNames = ["Aviana Winterwing", "Fearghas MacAllistar", "Plex", "Shalkoc Zornax"];
        const allowedItemTypes = ["consumable", "container", "equipment", "feat", "loot", "spell", "tool", "weapon"];

        let actorItems = {};
        for(let actorName of pcNames) {
            const workingActor = game.actors.getName(actorName, {strict: true});
            actorItems[actorName] = workingActor.items 
                .filter(i => allowedItemTypes.includes(i.type))
                .map(i => {
                    return {
                        name: i.name,
                        itemType: i.type,
                        description: i.system.description.value,
                        attunement: i.system.attunement,
                        quantity: i.system.quantity,
                        requirements: i.system.requirements,

                        typeLabel: i.system.type?.label,
                        subType: i.system.type?.subtype,
                        spellLevel: i.type === "spell" ? i.labels.level : null,
                        spellRange: i.type === "spell" ? i.labels.range : null,
                        spellSchool: i.type === "spell" ? i.labels.school : null,
                    }
                });
        }

        const jsonString = JSON.stringify(actorItems, null, 2);

        console.log(jsonString);

        try {
            await navigator.clipboard.writeText(jsonString);
            // eslint-disable-next-line no-alert
            alert("JSON copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy: ", err);
        }
    }, 3000)
}

/** */
async function getJsonDataForWebsite() {
    const playerData = game.users.players.reduce((acc, curr) => {
        acc[curr.character.name] = getItemDataArray(curr.character);
        return acc;
    }, {});

    const settlementData = getSettlementData();
    const currentIngameDate = getCurrentIngameDate();
}


/**
 * 
 * @param {Actor} actor 
 * @returns {ItemData[]}
 */
function getItemDataArray(actor) {
    const allowedItemTypes = ["consumable", "container", "equipment", "feat", "loot", "spell", "tool", "weapon"];

    return actor.items
        .filter(i => allowedItemTypes.includes(i.type))
        .map(i => ({
            name: i.name,
            itemType: i.type,
            description: i.system.description.value,
            attunement: i.system.attunement,
            quantity: i.system.quantity,
            requirements: i.system.requirements,

            typeLabel: i.system.type?.label,
            subType: i.system.type?.subtype,
            spellLevel: i.type === "spell" ? i.labels.level : null,
            spellRange: i.type === "spell" ? i.labels.range : null,
            spellSchool: i.type === "spell" ? i.labels.school : null,
        }));
}

function getSettlementData() {
    //todo
}


/**
 * @returns {{date: TaliaDate, display: string}}
 */
function getCurrentIngameDate() {
    const sc = SimpleCalendar.api;
    return {
        date: sc.currentDateTime(),
        display: sc.currentDateTimeDisplay().date
    }
}
