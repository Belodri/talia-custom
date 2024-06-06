import { _foundryHelpers } from "../scripts/_foundryHelpers.mjs";
import { taliaEffectHelpers } from "../scripts/effects.mjs";
import { talia_socket } from "../scripts/socket.mjs";

export function initCooking() {
    CONFIG.DND5E.lootTypes.spices = {label: "Spices"};
}
export function setupCooking() {
    Hooks.on("dnd5e.restCompleted", async (actor, result) => {
        await cookingMain(actor, result);
        console.log(actor, result);
    });
}

const spicesBuffsDatabase = {
    //mode: 2 = add
    //value: needs to be a string (I think)
    "": {
        description: "<p></p>",
        changes: [
            {key: "", mode: 2, value: "", priority: 20},
        ]
    },

    "Star Anise": {
        description: "<p>You gain a +2 bonus to AC.</p>",
        changes: [
            {key: "system.attributes.ac.bonus", mode: 2, value: "2", priority: 20},
        ]
    },
    "Chili Pepper": {
        description: "<p>You gain a +10ft bonus to walking speed.</p>",
        changes: [
            {key: "system.attributes.movement.walk", mode: 2, value: "10", priority: 20},
        ]
    },
    "Saffron": {
        description: "<p>You gain a +2 bonus to initiative.</p>",
        changes: [
            {key: "system.attributes.init.bonus", mode: 2, value: "2", priority: 20},
        ]
    },
    "Ginger": {
        description: "<p>You gain a +1 bonus to Strength, Dexterity & Constitution saving throws.</p>",
        changes: [
            {key: "system.abilities.str.bonuses.save", mode: 2, value: "1", priority: 20},
            {key: "system.abilities.dex.bonuses.save", mode: 2, value: "1", priority: 20},
            {key: "system.abilities.con.bonuses.save", mode: 2, value: "1", priority: 20},
        ]
    },
    "Sassafras": {
        description: "<p>Any fire damage you take is reduced by 5.</p>",
        changes: [
            {key: "system.traits.dm.amount.fire", mode: 2, value: "-5", priority: 20},
        ]
    },
    "Wasabi": {
        description: "<p>Any cold damage you take is reduced by 5.</p>",
        changes: [
            {key: "system.traits.dm.amount.cold", mode: 2, value: "-5", priority: 20},
        ]
    },
    "Lavender": {
        description: "<p>Any psychic damage you take is reduced by 5.</p>",
        changes: [
            {key: "system.traits.dm.amount.psychic", mode: 2, value: "-5", priority: 20},
        ]
    },
}



async function cookingMain(actor, result) {
    if(!result.longRest) return;    //only allow on long rests (for now)
    if(!actor.name.includes("Shalkoc")) return;     //only allow Shalkoc to do that

    //get chef's tools (to check if he has them and to use as the origin of the active effect later)
    /** @type {Item5e | undefined} */
    const chefTool = actor.items.find(i => i.system?.type?.baseItem === 'cook');
    if(!chefTool) return;   //return early if no chef's tools are found
//NOTIFICATION for missing chef's tools

    /** @type {Item5e[]} */
    const spices = actor.items.filter(i => i.system?.type?.value === 'spices' && i.system?.quantity >= 1);
    if(spices.length === 0) return; //return early if he has no spices on him.


    const chosenSpiceName = await userChosenSpice(spices);

    /** @type {Item5e} */
    const chosenSpice = spices.find(i => i.name === chosenSpiceName); 

    //create the effect
    const thisSpiceBuff = spicesBuffsDatabase[chosenSpice.name];
    if(!thisSpiceBuff) {
//NOTIFICATION
        return;  //return early if no buff could be found
    } 
    /** @type {ActiveEffect} */
    const effect = taliaEffectHelpers.createActiveEffect({
        name: chosenSpice.name,
        seconds: _foundryHelpers.SECONDS.IN_ONE_DAY,
        description: thisSpiceBuff.description,
        changes: thisSpiceBuff.changes,
        icon: chosenSpice.img
    });

    console.log(effect);
    //get active users
    /** @type {User5e[]} */
    const users = game.users.players.filter(user => user.active);
    
    try {
        //let the GM apply the effect to every active player's character
        for(let user of users) {
            if(!user.character) continue;
            const retProm = await talia_socket.executeAsGM('talia_addActiveEffect', {
                effect: effect.toObject(),
                uuid: user.character.uuid,
                origin: chefTool.uuid,
            });
        }
        //remove 1 quantity of that spice
        await chosenSpice.update({"system.quantity": chosenSpice.system.quantity - 1});
    } catch (error) {
        ui.notifications.error("Error in Talia-Custom: cookingMain(). Please notify GM.");
    }
}



/**
 * Lets the user choose one spice from a selection of items.
 * @param {Item5e[]} spices Array of items with lootType = spices
 * @returns {Promise<string>}   Name of the spice chosen by the user
 */
async function userChosenSpice(spices) {
    const options = spices.reduce((acc, e) => acc += `<option value="${e.name}">${e.name}   -   ${e.system.quantity}</option>`,"");

    const content =  `<form>
                        <div class="form-group">
                            <label>Select one of the spices in your inventory:</label>
                            <div class="form-fields">
                                <select name="chosen">${options}</select>
                            </div>
                        </div>
                    </form>`;

    const choice = await Dialog.prompt({
        title: "Cooking",
        content: content,
        callback: ([html]) => new FormDataExtended(html.querySelector("form")).object,
        rejectClose: false
    });
    return choice.chosen;
}