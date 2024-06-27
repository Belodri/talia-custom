import { _foundryHelpers } from "../../scripts/_foundryHelpers.mjs";
import { TaliaCustomAPI } from "../../scripts/api.mjs";

/*
    As part of a short rest, you can cook a quick meal for your party, provided you have ingredients and cook's utensils on hand. 
    Doing so takes one ration and lets everyone in your party regain hit points equal to 1d8 * your proficiency bonus.

    When you finish a long rest and at the cost of 5 rations, you can make a meal for your party that gives them temporary hit points equal to 2d4 * your proficiency bonus.
*/

//  Chef Feat itemMacro: "Hooks.call("taliaCustom.chefFeat", actor);"

/*
    Required modules & settings:
        - Requestor
        - DiceSoNice
    Recommended modules & settings:
        - Damage Log
            - allowPlayerView: true
            - minPlayerPermission: 3    //owner
*/

export default {
    _onInit() {},
    _onSetup() {
        TaliaCustomAPI.add({chefFeat: chefFeatCustomCall});

        Hooks.on("dnd5e.restCompleted", async (actor, result) => {
            if(!actor.name.includes("Shalkoc")) return;
    
            if(result.longRest) {
                if(!await confirmDialog("long")) return;
                longRest(actor);
            } else {
                if(!await confirmDialog("short")) return;
                shortRest(actor);
            }
        });


    }
}

async function chefFeatCustomCall(actor) {
    //dialog with choice between short rest, long rest, or item card only
    const choice = await Dialog.wait({
        title: "Chef",
        content: "",
        buttons: {
            shortRest: {
                label: "Short Rest",
                callback: () => 'shortRest'
            },
            longRest: {
                label: "Long Rest",
                callback: () => "longRest"
            },
            itemCard: {
                label: "Chat Only",
                callback: () => "itemCard"
            }
        },
        close: () => false,
        default: "shortRest"
    });

    switch(choice) {
        case 'shortRest': 
            shortRest(actor); 
            break;
        case 'longRest': 
            longRest(actor); 
            break;
        case "itemCard": 
            const chefItem = actor.items.find(i => i.name === "Chef");
            chefItem.displayCard();
            break;
    }
}

async function confirmDialog(restType) {
    let title, content;
    if(restType === "long") {
        title = `Chef Feat - Long Rest`;
        content = `Use 5 Rations to cook a tasty meal which gives temporary hit points to each member of your party?`;
    }
    else if (restType === "short"){
        title = "Chef Feat - Short Rest";
        content = `Use 1 Ration to cook a quick meal which lets every member of your party regain hit points?`;
    } else {
        throw new Error("restType is neither 'short' nor 'long'.");
    }
    const choice = await Dialog.confirm({
        title: title, 
        content: content,
    });
    return choice;
}

async function shortRest(actor) {
    const rationItemName = "Rations";
    const requiredRations = 1;

    //- has cook's utensils?
    if(!actor.items.find(i => i.system?.type?.baseItem === 'cook')) {
        ui.notifications.warn("Chef feat - Short Rest  requires you to have cook's utensils on you.");
        return;
    }
    
    //get ration item from actor
    const rationItem = actor.items.find(i => i.name === rationItemName && i.system?.quantity >= requiredRations);
    if(!rationItem) {   
        ui.notifications.warn(`You need ${requiredRations} ${rationItemName} to cook a quick meal.`);
        return;
    }

    //get chef item
    const chefItem = actor.items.find(i => i.name === "Chef");

    //use it to roll damage (healing)
        //make sure that short rest (healing) is rollgroup 0!
    const roll = await chefItem.rollDamageGroup({rollgroup: 0, options: {chatMessage: false}});

    //wait for 3d dice animation (diceSoNice)
    await game.dice3d.showForRoll(roll, game.user, true);

    //get user _id from all active users (for the whisper)
    const userIdsArray = game.users.players.map((user) => {
        if(user.active) return user._id
    });

    //Create the damages array to pass to the requestor callback
    const damages = dnd5e.dice.aggregateDamageRolls([roll], {respectProperties: true}).map(roll => ({
        value: roll.total,
        type: roll.options.type,
        properties: new Set(roll.options.properties ?? [])
    }));

    //create the requestor message
    await Requestor.request({
        img: rationItem.img,        //maybe replace this with a random image from Kris' Food stuff
        title: "Chef Feat: Short Rest",
        description: `${actor.name} made a quick meal.`,
        buttonData: [{
            label: `Eat to regain up to ${damages[0].value} hp.`,
            command: async function(){
                //apply damage/healing to the actor (uses the character of the player who clicked the button.) 
                await actor.applyDamage(damages, {multiplier: 1, ignore: false});
                ui.notifications.info(`Restored up to ${damages[0].value} hp to ${actor.name}.`);
            },
            scope: {damages: damages}
        }],
        limit: Requestor.LIMIT.ONCE,
        speaker: ChatMessage.implementation.getSpeaker({actor: actor}),
        messageOptions: {
            whisper: userIdsArray,
            blind: true     //check if shalkoc gets his own whisper too: YES he does
        }
    });
    //consume ration
    await _foundryHelpers.consumeItem(rationItem, requiredRations);
}

async function longRest(actor) {
    const rationItemName = "Rations";
    const requiredRations = 5;

    //get ration item from actor
    const rationItem = actor.items.find(i => i.name === rationItemName && i.system?.quantity >= requiredRations);
    if(!rationItem) {   
        ui.notifications.warn(`You need ${requiredRations} ${rationItemName} to cook a quick meal.`);
        return;
    }

    //get chef item
    const chefItem = actor.items.find(i => i.name === "Chef");

    //use it to roll damage (temporary healing)
        //make sure that long rest (temporary healing) is rollgroup 1!
    const roll = await chefItem.rollDamageGroup({rollgroup: 0, options: {chatMessage: false}});

    //wait for 3d dice animation (diceSoNice)
    await game.dice3d.showForRoll(roll, game.user, true);

    //get user _id from all active users (for the whisper)
    const userIdsArray = game.users.players.map((user) => {
        if(user.active) return user._id
    });

    //create the requestor message
    await Requestor.request({
        img: rationItem.img,        //maybe replace this with a random image from Kris' Food stuff
        title: "Chef Feat: Long Rest",
        description: `${actor.name} made a tasty meal.`,
        buttonData: [{
            label: `Eat to gain ${roll.total} temporary hp.`,
            command: async function(){
                //apply temp HP to the actor (uses the character of the player who clicked the button.) 
                await actor.applyTempHP(roll.total);
                ui.notifications.info(`Added up to ${roll.total} temp hp to ${actor.name}.`);
            },
            scope: {roll: roll}
        }],
        limit: Requestor.LIMIT.ONCE,
        speaker: ChatMessage.implementation.getSpeaker({actor: actor}),
        messageOptions: {
            whisper: userIdsArray,
            blind: true     //check if shalkoc gets his own whisper too: YES he does
        }
    });

    //consume ration
    await _foundryHelpers.consumeItem(rationItem, requiredRations);
}