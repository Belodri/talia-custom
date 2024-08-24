import { TaliaCustomAPI } from "../../../scripts/api.mjs";
import { MODULE } from "../../../scripts/constants.mjs";
import { TaliaUtils } from "../../../utils/_utils.mjs";
import { ItemHookManager } from "../../../utils/ItemHookManager.mjs";
import { cookingMain } from "./cooking.mjs";

/*
    As part of a short rest, you can cook a quick meal for your party, provided you have ingredients and cook's utensils on hand. 
    Doing so takes one ration and lets everyone in your party regain hit points equal to 1d8 * your proficiency bonus.

    When you finish a long rest and at the cost of 5 rations, you can make a meal for your party that gives them temporary hit points equal to 2d4 * your proficiency bonus.
*/


/*
    Required modules & settings:
        - Requestor
        - dfreds ce
*/

export default {
    register() {
        CONFIG.DND5E.lootTypes.spice = {label: "Spice"};
        CONFIG.DND5E.lootTypes.food = {
            label: "Food",
            subtypes: {
                meal: "Meal",
                snack: "Snack"
            }
        };


        CONFIG.DND5E.consumableTypes.food.subtypes = {
            meal: "Meal",
            snack: "Snack"
        };

        ItemHookManager.register("Chef", ChefFeat.itemMacro);

        TaliaCustomAPI.add({chefFeat: chefFeatCustomCall}, "ItemMacros");

        /*
        Hooks.on("dnd5e.restCompleted", async (actor, result) => {
            if(!actor.name.includes("Shalkoc")) return;
    
            if(result.longRest) {
                if(!await confirmDialog("long")) return;
                await longRest(actor);
            } else {
                if(!await confirmDialog("short")) return;
                await shortRest(actor);
            }
        });
        */
    }
}

//TODO Cleanup old code and remove cooking.mjs once ChefFeat has been tested.

/*
    WORKFLOW

    - Shalkoc chooses to take a short or a long rest by using the chef feat
    - He then chooses which food/spices he wants to use for cooking

    - DM gets a requestor message to approve the rest and to advance time accordingly
    - When the DM approves of the rest, a requestor message is sent that is clickable by all
    
    - Clicking that requestor message then makes everyone who clicked it take a rest (no dialog!, no time advance!);
    - After awaiting the result of that rest, apply shalkoc's buff and healing/tempHP
*/

class ChefFeat {
    constructor(item) {
        this.chefItem = item;
        this.actor = item.actor;

        //get resting characters (online player characters)
        this.restingActors = game.users.players.filter(u => u.active).map(u => u.character) || [];
        this.isLongRest = undefined;

        //items
        this.cooksTool = undefined;
        this.foodItems = undefined;
        this.spiceItems = undefined;

        this.chosenFoodItem = undefined;
        this.chosenSpiceItem =  undefined;
        
        this.effectData = undefined;
    }

    static async itemMacro(item) {
        TaliaUtils.Helpers.displayItemInfoOnly(item);

        const rest = await new ChefFeat(item).chooseRestType();
        if(typeof rest.isLongRest !== "boolean") return;

        rest.getItems();
        await rest.chooseFoodAndSpices();
        if(!rest.chosenFoodItem) return;

        await rest.rollChefFeat();
        rest.getEffectData();
        if(rest.chosenSpiceItem && !rest.effectData) return;
        return await rest.gmApprovalRequestor();
    }


    async chooseRestType() {
        const restType = await foundry.applications.api.DialogV2.wait({
            window: { title: "Chef Feat"},
            content: "",
            modal: true,
            rejectClose: false,
            buttons: [
                { label: "Cook & Short Rest", action: "short",},
                { label: "Cook & Long Rest", action: "long",},
            ]
        });
        this.isLongRest = restType === "long" ? true :
            restType === "short" ? false : 
            undefined;
        return this;
    }

    async gmApprovalRequestor() {
        const passingScope = {
            requestingActorUuid: this.actor.uuid,
            requestingUserId: game.user.id,
            chefItemUuid: this.chefItem.uuid,
            chosenFoodItemUuid: this.chosenFoodItem.uuid,
            chosenSpiceItemUuid: this.chosenSpiceItem?.uuid || "",
            numberOfRestingActors: this.restingActors.length,
            isLongRest: this.isLongRest,
            rollTotal: this.rollTotal,
            effectData: this.effectData || "",
        }

        Requestor.request({
            title: `Approve Rest`,
            description: `Approve this ${this.isLongRest ? "long" : "short"} rest?`,
            speaker: ChatMessage.implementation.getSpeaker({actor: this.actor}),
            whisper: [game.users.activeGM.id],
            //popout: true,
            //popoutOnly: true,
            //autoclose: true,
            messageOptions: {
                blind: true,
                flags: {
                    "talia-custom": {
                        hideFromSelf: true,    
                    },
                },
            },
            buttonData: [{
                label: "Approve",
                scope: passingScope,
                permission: "GM",
                command: async function() {
                    //get the relevant items
                    const chosenFoodItem = await fromUuid(chosenFoodItemUuid);
                    const chosenSpiceItem = chosenSpiceItemUuid ? await fromUuid(chosenSpiceItemUuid) : undefined;
                    const requestingActor = await fromUuid(requestingActorUuid);

                    //advance time
                    const changeMinutes = isLongRest ? CONFIG.DND5E.restTypes.long.duration.normal : CONFIG.DND5E.restTypes.short.duration.normal;
                    const beforeDay = SimpleCalendar.api.currentDateTime().day;
                    await SimpleCalendar.api.changeDate({minute: changeMinutes});
                    const isNewDay = beforeDay !== SimpleCalendar.api.currentDateTime().day;

                    //create the requestor message
                    const description = `Eat a ${isLongRest ? "meal" : "snack"} of <b>${chosenFoodItem.name}</b>${chosenSpiceItem ? ` with <b>${chosenSpiceItem.name}</b>`: ""} and take a ${isLongRest ? "long" : "short"} rest.`;
                    await Requestor.request({
                        img: chosenFoodItem.img,
                        title: `${isLongRest ? "Meal and Long Rest" : "Snack and Short Rest"}`,
                        description: description,
                        speaker: ChatMessage.implementation.getSpeaker({actor: requestingActor}),
                        //popout: true,
                        //popoutOnly: true,
                        //autoclose: true,
                        buttonData: [{
                            label: "Eat and Rest",
                            scope: {
                                isLongRest: isLongRest,
                                rollTotal: rollTotal,
                                effectData: effectData || "",
                                isNewDay: isNewDay,
                            },
                            command: async function() {
                                if(isLongRest === true) {
                                    await actor.longRest({dialog: false, newDay: isNewDay});
                                    actor.applyTempHP(rollTotal);
            
                                } else if (isLongRest === false) {
                                    await actor.shortRest({dialog: false, newDay: isNewDay});
                                    actor.applyDamage([{value: rollTotal, type: "healing"}]);
                                }

                                if(effectData) {
                                    const prevEffects = actor.appliedEffects.filter( e => e.flags?.["talia-custom"]?.isSpiceEffect === true);
                                    if(prevEffects.length) {
                                        const promises = [];
                                        for(const eff of prevEffects) {
                                            promises.push(eff.delete());
                                        }
                                        await Promise.all(promises);
                                    }
                                    ActiveEffect.implementation.create(effectData, {parent: actor});
                                }
                            }
                        }
                    ]
                    });

                    //consume the items
                    if(chosenFoodItem) TaliaCustom.Helpers.consumeItem(chosenFoodItem, numberOfRestingActors, 1, true);
                    if(chosenSpiceItem) TaliaCustom.Helpers.consumeItem(chosenSpiceItem, 1, 1, true);
                    
                }
            }]
        })
    }

    getEffectData() {
        if(!this.chosenSpiceItem) return undefined;
        const effect = game.dfreds.effectInterface.findEffect({effectName: this.chosenSpiceItem.name});
        if(!effect) throw new Error(`Couldn't find effect data for: ${this.chosenSpiceItem.name}`);
        
        const effObj = effect.toObject();
        this.effectData = foundry.utils.mergeObject(effObj, {
            flags: {
                "talia-custom": {
                    isSpiceEffect: true
                }
            }
        });
        return this;
    }

    async rollChefFeat() {
        //short rest (healing) is rollGroup0
        //long rest (tempHp) is rollGroup1
        const roll = await this.chefItem.rollDamageGroup({rollGroup: this.isLongRest ? 1 : 0, options: {chatMessage: true, fastForward: true}});
        //wait for 3d dice animation (diceSoNice)
        //await game.dice3d.showForRoll(roll, game.user, true);
        this.rollTotal = roll.total;
        return this;
    }

    getItems() {
        /** @type {Item5e | undefined} */
        this.cooksTool = this.actor.itemTypes.tool.find(i => i.system?.type?.baseItem === "cook");
        if(!this.cooksTool) {
            throw new Error("You need to have cook's utensils on you to cook.");
        }

        /** @type {Item5e[] | []} */
        this.foodItems = this.actor.itemTypes.loot
            .filter( i => i.system?.type?.subtype === `${this.isLongRest ? "meal" : "snack"}` && i.system?.quantity >= this.restingActors.length);
        
        if(!this.foodItems?.length) {
            throw new Error(`You don't have enough of one ${this.isLongRest ? "meal" : "snack"} on you to cook for the entire party.`);
        }

        /** @type {Item5e[] | []} */
        this.spiceItems = this.actor.itemTypes.loot.filter(i => i.system?.type?.value === "spice");
        return this;
    }

    async chooseFoodAndSpices() {
        function getChoices(itemArray, addNone = false) {
            return itemArray.reduce((acc, curr) => {
                acc[curr.id] = `${curr.name} (${curr.system.quantity})`;
                return acc;
            }, addNone ? {none: "None"} : {});
        }
        
        const foodChoices = getChoices(this.foodItems, false);
        const selectGroupFood = new foundry.data.fields.StringField({
            label: `Select ${this.isLongRest ? "Meal" : "Snack"}`,
            hint: `You need one ${this.isLongRest ? "meal" : "snack"} for each resting party member.`,
            choices: foodChoices,
            required: true,
        }).toFormGroup({},{name: "foodId", foodChoices}).outerHTML;

        const spiceChoices = getChoices(this.spiceItems, true);
        const selectGroupSpice = new foundry.data.fields.StringField({
            label: "Select Spice",
            hint: `You can select one spice to flavour all ${this.isLongRest ? "meals" : "snacks"}`,
            choices: spiceChoices,
            required: true,
        }).toFormGroup({},{name: "spiceId", spiceChoices}).outerHTML;

        const content = `<style>
            .chef-feat-dialog { 
                width: 400px; 
                & h4 { 
                    margin-top: 0.5em;
                }
            }
            </style>
            <h4>Choose a ${this.isLongRest ? "meal" : "snack"} and a spice to cook during your ${this.isLongRest ? "long" : "short"} rest.</h4>
            <fieldset>${selectGroupFood}${selectGroupSpice}</fieldset>`;

        const selected = await foundry.applications.api.DialogV2.prompt({
            window: {
                title: "Chef Feat",
                contentClasses: ["chef-feat-dialog"],
            },
            content,
            modal: true,
            rejectClose: false,
            ok: {
                label: "Cook and rest",
                callback: (event, button) => new FormDataExtended(button.form).object,
            },
        });

        if(selected) {
            this.chosenFoodItem = this.actor.items.get(selected.foodId);
            this.chosenSpiceItem = this.actor.items.get(selected.spiceId) || undefined;
        }
        return this;
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
        speaker: ChatMessage.implementation.getSpeaker({actor: actor}),
        messageOptions: {
            whisper: userIdsArray,
            blind: true     //check if shalkoc gets his own whisper too: YES he does
        }
    });
    //consume ration
    await TaliaUtils.Helpers.consumeItem(rationItem, requiredRations);

    //TODO integrate cooking (spice) into chef feat properly
    await cookingMain(actor);   //also handles cooking (spice) here.
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
                await actor.applyTempHP(rollTotal);
                ui.notifications.info(`Added up to ${rollTotal} temp hp to ${actor.name}.`);
            },
            scope: {rollTotal: roll.total}
        }],
        speaker: ChatMessage.implementation.getSpeaker({actor: actor}),
        messageOptions: {
            whisper: userIdsArray,
            blind: true     //check if shalkoc gets his own whisper too: YES he does
        }
    });

    //consume ration
    await TaliaUtils.Helpers.consumeItem(rationItem, requiredRations);

    //TODO integrate cooking (spice) into chef feat properly
    await cookingMain(actor);   //also handles cooking (spice) here.
}