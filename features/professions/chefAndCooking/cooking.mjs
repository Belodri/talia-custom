import { TaliaUtils } from "../../../utils/_utils.mjs";

const spicesBuffsDatabase = {
    /*
    mode: 2 = add
    value: needs to be a string (I think)
    "": {
        description: "<p></p>",
        changes: [
            {key: "", mode: 2, value: "", priority: 20},
        ]
    },
    */

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
    "Ginseng Root Powder": {
        description: "<p>Your hit point maximum is increased by 30 for the duration.</p>",
        changes: [
            {key: "system.attributes.hp.tempmax", mode: 2, value: "30", priority: 20},
        ]
    },
    "Ginko Leaves": {
        description: "<p>You gain a 1d4 bonus to Intelligence, Wisdom, and Charisma saving throws.</p>",
        changes: [
            {key: "system.abilities.int.bonuses.save", mode: 2, value: "1d4", priority: 20},
            {key: "system.abilities.wis.bonuses.save", mode: 2, value: "1d4", priority: 20},
            {key: "system.abilities.cha.bonuses.save", mode: 2, value: "1d4", priority: 20},
        ]
    },
    "Licorice Root": {
        description: "<p>Any acid damage you take is reduced by 5.</p>",
        changes: [
            {key: "system.traits.dm.amount.acid", mode: 2, value: "-5", priority: 20},
        ]
    },
    "Mustard Seeds": {
        description: "<p>Any bludgeoning damage you take is reduced by 5.</p>",
        changes: [
            {key: "system.traits.dm.amount.bludgeoning", mode: 2, value: "-5", priority: 20},
        ]
    },
    "Eucalyptus": {
        description: "<p>Any lightning damage you take is reduced by 5.</p>",
        changes: [
            {key: "system.traits.dm.amount.lightning", mode: 2, value: "-5", priority: 20},
        ]
    },
    "Mustard Seeds": {
        description: "<p>Any bludgeoning damage you take is reduced by 5.</p>",
        changes: [
            {key: "system.traits.dm.amount.bludgeoning", mode: 2, value: "-5", priority: 20},
        ]
    },
    "Vanilla": {
        description: "<p>Any necrotic damage you take is reduced by 5.</p>",
        changes: [
            {key: "system.traits.dm.amount.necrotic", mode: 2, value: "-5", priority: 20},
        ]
    },
    "Yarrow": {
        description: "<p>Any piercing damage you take is reduced by 5.</p>",
        changes: [
            {key: "system.traits.dm.amount.piercing", mode: 2, value: "-5", priority: 20},
        ]
    },
    "Cardamom": {
        description: "<p>Any poison damage you take is reduced by 5.</p>",
        changes: [
            {key: "system.traits.dm.amount.poison", mode: 2, value: "-5", priority: 20},
        ]
    },
    "Aloe Vera": {
        description: "<p>Any slashing damage you take is reduced by 5.</p>",
        changes: [
            {key: "system.traits.dm.amount.slashing", mode: 2, value: "-5", priority: 20},
        ]
    },
    "Rhubarb": {
        description: "<p>Any thunder damage you take is reduced by 5.</p>",
        changes: [
            {key: "system.traits.dm.amount.thunder", mode: 2, value: "-5", priority: 20},
        ]
    },

    
}

//TODO add to api so it can be called without having to take a rest

export async function cookingMain(actor, forced = true) {
    if(forced && !actor.name.includes("Shalkoc")) return;     //only allow Shalkoc to do that

    //get chef feat (to use as effect origin later)
    const chefFeat = actor.items.find(i => i.name === "Chef" && i.type === "feat");
    if(!chefFeat && forced) return;
    const originUuid = chefFeat.uuid || actor.uuid;
    // TODO NOTIFICATION for missing chef feat

    //get spices the user has on him with quantity > 0
    //also check if the spices are listed in the spicesBuffsDatabase

    /** @type {Item5e[]} */
    const spices = actor.items.filter(i => i.system?.type?.value === 'spices' 
        && i.system?.quantity >= 1
        && Object.keys(spicesBuffsDatabase).includes(i.name));
    if(spices.length === 0) return; //return early if he has no spices on him.

    //let the user choose
    const chosenSpiceName = await userChosenSpice(spices);

    /** @type {Item5e} */
    const chosenSpice = spices.find(i => i.name === chosenSpiceName); 

    const effectData = {
        name: chosenSpice.name,
        duration: {
            seconds: TaliaUtils.Helpers.SECONDS.IN_ONE_DAY,
        },
        description: spicesBuffsDatabase[chosenSpice.name].description,
        changes: spicesBuffsDatabase[chosenSpice.name].changes,
        icon: chosenSpice.img,
        origin: originUuid,  //provide chef feat as origin so it's easy to filter out later
    };

    await Requestor.request({
        img: chosenSpice.img,
        title: `Spicy Treat`,
        description: `Shalkoc made a small treat filled with ${chosenSpice.name}.`,
        buttonData: [{
            label: `Eat`,
            command: async function() {
                //delete prior spice effect first
                const prevEffect = actor.appliedEffects.find( e => spiceKeys.includes(e.name));
                if(prevEffect) {
                    await prevEffect.delete();
                }
                await ActiveEffect.create(effectData, {parent: actor});
            },
            scope: {
                effectData: effectData,
                spiceKeys: Object.keys(spicesBuffsDatabase),
            }
        }],
        limit: Requestor.LIMIT.ONCE,
        speaker: ChatMessage.implementation.getSpeaker({actor: actor}),
        messageOptions: {
            whisper: TaliaUtils.Helpers.getUserIdsArray(),
            blind: true,
        }
    });
    await TaliaUtils.Helpers.consumeItem(chosenSpice, 1, 1, true);
    return true;
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