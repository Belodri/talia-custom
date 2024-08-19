import { MODULE } from "../../../scripts/constants.mjs";
import { TaliaCustomAPI } from "../../../scripts/api.mjs";
import { TaliaUtils } from "../../../utils/_utils.mjs";
const debug = false;

/*
    - Feature item 'Training': Opens dialog to choose between the available blessings

    - Available blessings are passive feature items on the actor.

    - Once a blessing is chosen, items belonging to other blessings are removed from the actor and items belonging to the chosen blessing are added from the compendium.



*/

export default {
    register() {
        CONFIG.DND5E.featureTypes.class.subtypes.beastBlessing = "Spirit Beast's Blessing";
        CONFIG.DND5E.featureTypes.class.subtypes.beastPower = "Spirit Beast Power";

        TaliaCustomAPI.add({activateSpirit}, "ItemMacros");
    }
}

const blessingsDatabase = {
    "Spirit of the Bear": {
        "Intimidating Presence": 6,
        "Savage Taunt": 6, 
        "Compelled Duel": 6,
        "Ironfur": 10,
        "Survival of the Fittest": 14,
    },
    "Spirit of the Elk": {
        "Adept Forager": 6,
        "Stampede": 6,
        "Survival Instincts": 10,
        "Unstoppable": 14,
    },
    "Spirit of the Tiger": {
        "Ambush Predator": 6,
        "Pouncing Strikes": 6,
        "Scent of Blood": 6,
        "Solitary Hunter": 10,      //isolated check is inside BaB on the item
        "Rip and Tear": 14,
    },     
    "Spirit of the Wolf": {
        "Keen Senses": 6,
        "Pack Tactics": 6,
        "Hamstringing": 10,
        "Coodinated Hunt": 14,
    },
    "Spirit of the Eagle": {
        "Keen Sight": 6,
        "Counterstrike": 6,
        "Diving Strike": 10,
        "Double Down": 14,
    },
};



/*  ItemMacro for items of type "Spirit Beast's Blessing"

*/
async function activateSpirit(actor, chosenSpirit) {
    const rollData = actor.getRollData();
    const barbLevel = rollData.classes?.barbarian?.levels || null;
    if(!barbLevel) return;
    
    const blessingItemsToAdd = Object.entries(blessingsDatabase[chosenSpirit])
        .filter(([key, value]) => value <= barbLevel && !actor.items.getName(key))
        .map(([key, value]) => key);
    if(!blessingItemsToAdd.length) return;

    /* Remove old items */

    const allBlessingItems = Object.values(blessingsDatabase).flatMap(spirit => Object.keys(spirit));
    const blessingItemIDsOnActor = actor.items
        .filter(i => allBlessingItems.includes(i.name))
        .map(i => i.id);
    if(blessingItemIDsOnActor.length > 0) {
        const deleted = await Item.deleteDocuments(blessingItemIDsOnActor, {parent: actor});
        if(debug) console.log({deleted});
    }

    
    /*  Add new items  */

    //create an array of documents from the compendium
    const itemsToBeAdded = await game.packs.get(MODULE.customItemsPackKey).getDocuments({name__in: blessingItemsToAdd});
    if(debug) console.log({itemsToBeAdded});
    if(itemsToBeAdded.length > 0) {
        const itemObjects = itemsToBeAdded.map(i => i.toObject());
        const created = await Item.createDocuments(itemObjects, {parent: actor});
        if(debug) console.log({created});
    }

    const spiritItem = actor.itemTypes.feat.find(i => i.name === chosenSpirit);
    TaliaUtils.Helpers.displayItemInfoOnly(spiritItem);
}



async function trainingDialog(actor) {
    if(!actor.name.includes("Aviana")) return;
    const unlockedSpirits = actor.itemTypes.feat.filter(item => Object.keys(blessingsDatabase).includes(item.name));
    if(!unlockedSpirits.length) return;

    const options = unlockedSpirits.reduce((acc, e) => acc += `<option value="${e.name}">${e.name}</option>`, "");

    const content = `
        <form>
            <span>Choose a blessing.</span>
            <div class="form-group">
                <label>Blessing</label>
                <div class="form-fields">
                    <select name="blessing">${options}</select>
                </div>
            </div>
        </form>
    `;

    const choice = await Dialog.prompt({
        title: "Training",
        content: content,
        callback: ([html]) => new FormDataExtended(html.querySelector("form")).object,
        rejectClose: false,
    });
    if(!choice) return;

    return await activateSpirit(actor, choice.blessing);
}

