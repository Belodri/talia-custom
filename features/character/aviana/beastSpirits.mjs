import { MODULE } from "../../../scripts/constants.mjs";
import { TaliaCustomAPI } from "../../../scripts/api.mjs";
const debug = false;

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
        "Battering Ram": 6,
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
        "Billowing Wings": 6,
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
}