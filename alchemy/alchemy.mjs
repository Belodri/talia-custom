import { TaliaCustomAPI } from "../scripts/api.mjs";
import { MODULE } from "../scripts/constants.mjs";

/*  HOW IT WORKS    Harvesting Herbs:
        I press a macro which lets me select one type of environment (and with that the herb that grows there).
        This rolls the itemYield and then whispers a requestor message to Fearghas letting him know which herb he can see and what's it's itemYield is.
        
        On that message there is one button for each harvestable ingredient. (label is something like: "3x Salt Vine" with the 3x being the itemYield of that patch)
        When he clicks the button he's prompted to roll an Alchemy check.
            If he succeeds, that many of that item are created in his inventory (stacking with items of the same name)
            If he fails, he can first choose to spend inspiration to reroll.
            If he can't or he chooses not to spend inspiration, a d4 is rolled which determines how much (if anything he can salvage)
        After all of that, a message appears in chat letting everyone know how much he managed to gather. (change message text if it's a salvage)
*/

/*  HOW IT WORKS    Harvesting Body Parts:
        Fearghas uses his feature "Harvest Body Parts" while targeting a creature.
        If the creature can be harvested (flag "beenHarvested"?, creature is dead?, creature has harvestable parts?), 
        the itemYield is rolled and a requestor message pops up in his chat.

        On that message there is one button for each harvestable ingredient. (label is something like: "3x Gills" with the 3x being the itemYield of that creature)
        When he clicks the button he's prompted to roll an Alchemy check.
            If he succeeds, that many of that item are created in his inventory (stacking with items of the same name)
            If he fails, he can first choose to spend inspiration to reroll.
            If he can't or he chooses not to spend inspiration, a d4 is rolled which determines how much (if anything he can salvage)
        After all of that, a message appears in chat letting everyone know how much he managed to gather. (change message text if it's a salvage)
*/

/*  Regarding the code
        Both herbs and body parts share the same code for the requestor message button.
        Only how that message is created is different.


        The following functions will be added to the module api inside an object called AlchemyAPI:
            createHarvestHerbs()
            createHarvestBodyParts()
            createBrewingUI()
        These functions create the relevant subclasses of Alchemy.

        In the end this means that the individual aspects of Alchemy can be accessed like this:
            - Harvesting Herbs: 
                Macro executed by GM with code:
                    await TaliaCustom.AlchemyAPI.createHarvestHerbs(actor)
            - Harvesting Body Parts:
                ItemMacro executed by Fearghas with code:
                    await TaliaCustom.AlchemyAPI.createHarvestBodyParts(actor)
            - Brewing:
                ItemMacro executed by Fearghas with code:
                    await TaliaCustom.AlchemyAPI.createBrewingUI(actor)
*/



const INGREDIENTS = {  
    HERBS: {
        feverGrass: {id: "feverGrass", name: "Fever Grass", rarity: "common", source: "Grasslands", 
            locDesc: "Amidst the grass, you notice a patch of tall, slender stalks swaying in the breeze."
        },
        saltVine: {id: "saltVine", name: "Salt Vine", rarity: "common", source: "Coast", 
            locDesc: "You see some twisted vines clinging to the rocks by the sea."
        },
        wineberryBark: {id: "wineberryBark", name: "Wineberry Bark", rarity: "uncommon", source: "Riverbanks",
            locDesc: "Along the riverbank, a tree with deep, reddish bark bark catches your eye."
        },
        blackNerium: {id: "blackNerium", name: "Black Nerium", rarity: "uncommon", source: "Cliffs", 
            locDesc: "Clinging to the cliffside, you see some herbs with blackish foliage standing out against the rock."
        },
        shatterstone: {id: "shatterstone", name: "Shatterstone", rarity: "rare", source: "Alpine",
            locDesc: "In the thin air of high altitudes, herbs with shattered-looking foliage dot the rocky terrain."
        },
        waterFlower: {id: "waterFlower", name: "Water Flower", rarity: "rare", source: "Hot Springs",
            locDesc: "Floating on the surface of the hot water, bright flowers with waterlogged petals catch your eye."
        },
        bloodroot: {id: "bloodroot", name: "Bloodroot", rarity: "veryRare", source: "Humid Caves",
            locDesc: "You spot some gnarled, red roots thriving in the humid cave depths."
        },
        shimmerleaf: {id: "shimmerleaf", name: "Shimmerleaf", rarity: "veryRare", source: "Dry Caves",
            locDesc: "Among the dry cave rocks, some leaves with a silvery sheen stand out."
        },
        volcanoPoppy: {id: "volcanoPoppy", name: "Volcano Poppy", rarity: "legendary", source: "Fresh Lava",
            locDesc: "Floating atop the bubbling lava, vivid flowers defy the intense heat."
        },
        snowMoss: {id: "snowMoss", name: "Snow Moss", rarity: "legendary", source: "Glaciers",
            locDesc: "Amid the glacial fissures, clusters of pale moss cling to the inner ice walls."
        },
    },
    BODYPARTS: {
        plantMuscleFibres: {id: "plantMuscleFibres", name: "Plant Muscle Fibres", rarity: "common", source: "plant", conditions: {size: 2},
            locDesc: "You spot some tough, sinewy strands growing among the thickest plant stems."
        },
        gills: {id: "gills", name: "Gills", rarity: "common", source: "beast", conditions: {size: 2, extra: (rollData) => rollData.attributes.movement.swim >= 1},
            locDesc: "Among the remains of the aquatic beast, you find specialized organs adept at underwater breathing."
        },
        coreCrystal: {id: "coreCrystal", name: "Core Crystal", rarity: "uncommon", source: "construct", conditions: {size: 0},
            locDesc: "You notice a sparkling crystal lodged within the remains of the construct."
        },
        monstrousBlood: {id: "monstrousBlood", name: "Monstrous Blood", rarity: "uncommon", source: "monstrosity", conditions: {size: 3},
            locDesc: "Pooling beneath the defeated monstrosity, the blood has an eerie, dark hue."
        },
        oozeDrops: {id: "oozeDrops", name: "Ooze Drops", rarity: "rare", source: "ooze", conditions: {size: 3},
            locDesc: "The remnants of the ooze leave behind some thick, slimy drops."
        },
        giantsNail: {id: "giantsNail", name: "Giant's Nail", rarity: "rare", source: "giant", conditions: {size: 4}, 
            locDesc: "Amid the giant's remains, you find that some of the enormous, tough nails are still intact."
        },
        pureWrong: {id: "pureWrong", name: "Pure Wrong", rarity: "veryRare", source: "aberration", conditions: {size: 3},
            locDesc: "The aberration's flesh twists into unnatural shapes, exuding a sense of wrongness."
        },
        necromanticBinding: {id: "necromanticBinding", name: "Necromantic Binding", rarity: "veryRare", source: "undead", conditions: {size: 4},
            locDesc: "The remains of the undead still crackle with the bindings of necromantic power."
        },
        dragonScale: {id: "dragonScale", name: "Dragon Scale", rarity: "legendary", source: "dragon", conditions: {size: 4},
            locDesc: "Among the dragon's formidable scales, you find a few that remain intact and usable."
        },
        essenceOfLegend: {id: "essenceOfLegend", name: "Essence of Legend", rarity: "legendary", source: "legend", conditions: {size: 0, extra: (rollData) => rollData.resources.legres.max >= 1},
            locDesc: "Among the creature's remains you spot an essence that radiates with the echoes of it's formidable resilience."
        },
    }
}
/**
 * @typedef {Object} Ingredient
 * @property {string} name - The name of the ingredient.
 * @property {number} quantity - The quantity of the ingredient required.
 */

/**
 * @typedef {Object} Recipe
 * @property {string} name - The name of the potion.
 * @property {Ingredient[]} ingredients - The list of ingredients required for the potion.
 */

const RECIPES = {
    potionOfHealing: {name: "Potion of Healing", ingredients: [{name: "Fever Grass", quantity: 1}, {name: "Salt Vine", quantity: 1}, {name: "Plant Muscle Fibres", quantity: 1}]},
    potionOfWaterBreathing: {name: "Potion of Water Breathing", ingredients: [{name: "Salt Vine", quantity: 1}, {name: "Gills", quantity: 2}]},
    potionOfMaximumPower: {name: "Potion of Maximum Power", ingredients: [{name: "Fever Grass", quantity: 1}, {name: "Plant Muscle Fibres", quantity: 1}, {name: "Gills", quantity: 1}]},
    potionOfPoison: {name: "Potion of Poison", ingredients: [{name: "Fever Grass", quantity: 3}]},
    potionOfHeroism: {name: "Potion of Heroism", ingredients: [{name: "Plant Muscle Fibres", quantity: 2}, {name: "Salt Vine", quantity: 1}]},
    potionOfAdvantage: {name: "Potion of Advantage", ingredients: [{name: "Salt Vine", quantity: 3}]},
    potionOfGreaterHealing: {name: "Potion of Greater Healing", ingredients: [{name: "Wineberry Bark", quantity: 1}, {name: "Black Nerium", quantity: 1}, {name: "Core Crystal", quantity: 1}]},
    potionOfResistance: {name: "Potion of Resistance", ingredients: [{name: "Black Nerium", quantity: 2}, {name: "Monstrous Blood", quantity: 1}]},
    oilOfSlipperiness: {name: "Oil of Slipperiness", ingredients: [{name: "Wineberry Bark", quantity: 2}, {name: "Core Crystal", quantity: 1}]},
    potionOfGrowth: {name: "Potion of Growth", ingredients: [{name: "Wineberry Bark", quantity: 1}, {name: "Monstrous Blood", quantity: 2}]},
    potionOfDiminution: {name: "Potion of Diminution", ingredients: [{name: "Black Nerium", quantity: 1}, {name: "Core Crystal", quantity: 2}]},
    potionOfSuperiorHealing: {name: "Potion of Superior Healing", ingredients: [{name: "Shatterstone", quantity: 1}, {name: "Water Flower", quantity: 1}, {name: "Ooze Drops", quantity: 1}]},
    potionOfFireBreath: {name: "Potion of Fire Breath", ingredients: [{name: "Water Flower", quantity: 3}]},
    potionOfGaseousForm: {name: "Potion of Gaseous Form", ingredients: [{name: "Ooze Drops", quantity: 2}, {name: "Shatterstone", quantity: 1}]},
    potionOfInvisibility: {name: "Potion of Invisibility", ingredients: [{name: "Ooze Drops", quantity: 2}, {name: "Giant's Nail", quantity: 1}]},
    potionOfVitality: {name: "Potion of Vitality", ingredients: [{name: "Giant's Nail", quantity: 2}, {name: "Shatterstone", quantity: 1}]},
    murgaxorsElixirOfLife: {name: "Murgaxor's Elixir of Life", ingredients: [{name: "Giant's Nail", quantity: 2}, {name: "Water Flower", quantity: 1}]},
    potionOfSupremeHealing: {name: "Potion of Supreme Healing", ingredients: [{name: "Bloodroot", quantity: 1}, {name: "Shimmerleaf", quantity: 1}, {name: "Pure Wrong", quantity: 1}]},
    potionOfFlying: {name: "Potion of Flying", ingredients: [{name: "Shimmerleaf", quantity: 2}, {name: "Pure Wrong", quantity: 1}]},
    potionOfSpeed: {name: "Potion of Speed", ingredients: [{name: "Bloodroot", quantity: 2}, {name: "Necromantic Binding", quantity: 1}]},
    oilOfSharpness: {name: "Oil of Sharpness", ingredients: [{name: "Bloodroot", quantity: 1}, {name: "Shimmerleaf", quantity: 2}]},
    willowshadeOil: {name: "Willowshade Oil", ingredients: [{name: "Shimmerleaf", quantity: 2}, {name: "Necromantic Binding", quantity: 1}]},
    potionOfDragonsMajesty: {name: "Potion of Dragon's Majesty", ingredients: [{name: "Volcano Poppy", quantity: 2}, {name: "Dragon Scale", quantity: 1}]},
    potionOfGiantSize: {name: "Potion of Giant Size", ingredients: [{name: "Snow Moss", quantity: 2}, {name: "Essence of Legend", quantity: 1}]},
    immediateRest: {name: "Immediate Rest", ingredients: [{name: "Dragon Scale", quantity: 2}, {name: "Volcano Poppy", quantity: 1}]},
    potionOfLegendaryResistance: {name: "Potion of Legendary Resistance", ingredients: [{name: "Essence of Legend", quantity: 3}]},
    potionOfTimeStop: {name: "Potion of Time Stop", ingredients: [{name: "Snow Moss", quantity: 2}, {name: "Volcano Poppy", quantity: 1}]},
    basicPoison: {name: "Basic Poison", ingredients: [{name: "Plant Muscle Fibres", quantity: 2}, {name: "Gills", quantity: 1}]},
    drowPoison: {name: "Drow Poison", ingredients: [{name: "Core Crystal", quantity: 3}]},
    serpentVenom: {name: "Serpent Venom", ingredients: [{name: "Monstrous Blood", quantity: 3}]},
    malice: {name: "Malice", ingredients: [{name: "Ooze Drops", quantity: 3}]},
    wyvernPoison: {name: "Wyvern Poison", ingredients: [{name: "Giant's Nail", quantity: 3}]},
    torpor: {name: "Torpor", ingredients: [{name: "Necromantic Binding", quantity: 3}]},
    purpleWormPoison: {name: "Purple Worm Poison", ingredients: [{name: "Pure Wrong", quantity: 3}]}
};

export default {
    _onInit() {
        CONFIG.DND5E.rules.alchemy = "Compendium.talia-custom.rules.JournalEntry.ZkD6R9Ye9Sr77OCt.JournalEntryPage.Z0XP4RuNUbFSIMVN";
        CONFIG.DND5E.lootTypes.ingredient = {label: "Ingredient" };
        CONFIG.DND5E.lootTypes.ingredient.subtypes = { 
            herb: "Herb",
            bodyPart: "Body Part"
        };
    },
    _onSetup() {
        const AlchemyAPI = {
            INGREDIENTS,
            RECIPES,
            createHarvestHerbs,
            createHarvestBodyParts,
            Harvest,
        }
        TaliaCustomAPI.add({AlchemyAPI});
    }
}

/**
 * Opens a dialog for choosing an environment and herb to harvest, proceeds to roll itemYields for the herb and generate a requestor message for the actor's owner.
 * If no actor is provided, it defaults to Fearghas' character.
 * @param {Actor5e?} actor 
 */
async function createHarvestHerbs(actor = null) {
    //if no actor, default to fearghas
    if(!actor) {
        const user = game.users.players.find(u => u.name.includes("Fearghas"));
        actor = user.character;
    }

    const options = Object.entries(INGREDIENTS.HERBS).reduce((acc, [key, herb]) => {
        return acc + `<option value="${key}">${herb.source} (${herb.name} - ${herb.rarity})</option>`
    }, "");
    const content = `<select name="form">${options}</select>`;

    const choice = await Dialog.prompt({
        title: "Select an environment/herb.",
        content,
        callback: async(html) => {
            let form = html.find("[name=form]")[0].value;
            return form;
        },
        rejectClose: false
    });
    if(!choice) return;

    const ingredientsArray = await Harvest.rollYields([INGREDIENTS.HERBS[choice]]);
    Harvest.whisperRequestorMessage(ingredientsArray, actor);
}

/**
 * Checks if a targeted token is harvestable, rolls the itemYields for the body parts and generates a requestor message for the actor's owner.
 * If no actor is provided, it defaults to Fearghas' character.
 * @param {Actor5e?} actor 
 * @returns 
 */
async function createHarvestBodyParts(actor = null) {
    //if no actor, default to fearghas
    if(!actor) {
        const user = game.users.players.find(u => u.name.includes("Fearghas"));
        actor = user.character;
    }

    //get target token
    const target = game.user.targets.size === 1 ? game.user.targets.first() : null;
    if(!target ) return;
    const rollData = target.actor.getRollData();

    //check if harvestable
    if(target.document.getFlag(MODULE.ID, "beenHarvested")) {
        ui.notifications.info("This creature has already been harvested.");
        return;
    } else if(rollData.attributes.hp.pct !== 0) {
        ui.notifications.info("The creature is not happy with your attempt to harvest it's body parts. Maybe you should kill it first.");
        return;
    }

    //get harvestable ingredients
    
    const sizesArray = ["tiny", "sm", "med", "lg", "huge", "grg"];
    const sizeIndex = sizesArray.indexOf(rollData.traits.size);

    const workingIngrArray = Object.values(TaliaCustom.AlchemyAPI.INGREDIENTS.BODYPARTS)
        .filter(part => {
            // Special case for essenceOfLegend
            if(part.id === 'essenceOfLegend') {
                return typeof part.conditions.extra === 'function' && part.conditions.extra(rollData);
            }
            // Check type condition
            if(part.source !== rollData.details.type.value) return false;
            // Check size condition
            if(sizeIndex < part.conditions.size) return false;
            // Check extra condition if it exists
            if(typeof part.conditions.extra === "function") {
                return part.conditions.extra(rollData);
            }
            return true;
        }).map(part => ({
            id: part.id,
            name: part.name,
            rarity: part.rarity,
            source: part.source,
            locDesc: part.locDesc
        }));
    if(!workingIngrArray.length) {
        ui.notifications.info("This creature does not have any harvestable ingredients.");
        return;
    }
    const ingredientsArray = await Harvest.rollYields(workingIngrArray);
    Harvest.whisperRequestorMessage(ingredientsArray, actor);
}

/**
 * Parent class to house shared functionality.
 */
class Alchemy {
    /**
     * A mapping of ingredient rarity to its corresponding difficulty class.
     * @type {Object<string, number>}
     */
    static rarityToDC = {
        "common": 10,
        "uncommon": 15,
        "rare": 20,
        "veryRare": 25,
        "legendary": 30,
    };

    constructor(actor) {
        this.actor = actor;
        this.item = {           
            name: "",           //the name of the item that should be granted to the user
            quantity: 0,        //the quantity of the item that should be granted to the user
        }; 
    }

    get tool() {
        return this.actor.itemTypes.tool.find(i => i.system.type.baseItem === "alchemist") ?? null;
    }

    dcFromRarity(rarity = "common") {
        return Alchemy.rarityToDC[rarity];
    }

    async rollAlchemyCheck({rarity = "common", name = "", itemYield = null}) {
        if(!this.tool) {
            ui.notifications.error("You need to have Alchemist's Tools on you to practice Alchemy.");
            return null;
        }

        const DC = this.dcFromRarity(rarity);
        const options = {
            flavor: `<b>${itemYield ? `${itemYield}x ` : ""}${name ? `${name} - ` : ""}DC ${DC} Alchemy Check</b>`,
            chooseModifier: false,
            targetValue: DC
        };
        const result = await this.tool.rollToolCheck(options);
        
        if((result.total >= result.options.targetValue && !result.isFumble) || result.isCritical) {
            result.isSuccess = true;
            return result;
        } else {
            if(!await this.queryInspiration()) 
            {
                result.isSuccess = false;
                return result;
            }
            else return await this.rollAlchemyCheck({rarity, name});
        }
    }
    //TODO Refactor this to a helper function accessible by the rest of the module
    async queryInspiration() {
        const soInspired = {
            scope: "so-inspired",
            flagKey: "inspirationCount"
        };
        //check if module is present and active first
        const inspModule = game.modules.get(soInspired.scope)
        if(!inspModule || !inspModule.active) return false;

        const actorOwner = game.users.find(u => u.character?.uuid === this.actor.uuid);
        if(!actorOwner) return false;
        const currentInspirationCount =  actorOwner.getFlag(soInspired.scope, soInspired.flagKey);
        if(!currentInspirationCount) return false;
        const spendInspiration = await Dialog.confirm({
            title: "Alchemy check",
            content: `Do you want to spend 1/${currentInspirationCount} inspiration to reroll this check?`,
            yes: () => true,
            no: () => false,
            defaultYes: false,
        });

        if(!spendInspiration) return false;
        else {
            actorOwner.setFlag(soInspired.scope, soInspired.flagKey, currentInspirationCount - 1);
            ChatMessage.create({
                user: actorOwner,
                flavor: this.actor.name + " has used a point of inspiration!",
            });
            if(this.actor.sheet.rendered) {
                this.actor.sheet.render();
            }
            return true;
        }
    }

    /**
     * 
     * @returns {Promise<Item5e|null>}   
     */
    async grantItem() {
        if(!this.item.name || !this.item.quantity) return null;
        //check if user has item already
        const itemOnUser = this.actor.items.getName(this.item.name);
        if(itemOnUser) {
            //if he does, just add the new quantity to the old and update the item
            const newQuant = this.item.quantity + itemOnUser.system.quantity;
            const retItem = await itemOnUser.update({"system.quantity": newQuant});
            return retItem;
        }
        else {
            //if he doesn't, create a new item with the determined quantity
            const [item] = await game.packs.get(MODULE.customItemsPackKey).getDocuments({name__in: [this.item.name]});
            if(!item) return null;

            const itemObj = foundry.utils.mergeObject(item.toObject(), {
                system: { quantity: this.item.quantity }
            });
            const [createdItem] = await Item.createDocuments([itemObj], {parent: this.actor});
            return createdItem;
        }
    }
}

class Harvest extends Alchemy {
    constructor(actor, ingredient) {
        super(actor);
        /** @type {number} */
        /**
         * @type {object}
         * @property {string} id
         * @property {string} name
         * @property {number} itemYield
         * @property {string} locDesc
         * @property {string} rarity
         * @property {string} source
         */
        this.ingredient = ingredient;

    }

    /**
     * Rolls on the recovery table and multiplies the ingredient's itemYield by the result.
     * @returns {Promise<this>}
     */
    async rollIngredientRecovery() {
        const recTable = {
            1: { itemYieldMult: 0, desc: "You are unable to recover any ingredients."},
            2: { itemYieldMult: 0.5, desc: "Half of the yield is lost, rounded down."},
            3: { itemYieldMult: 0.75, desc: "A quarter of the yield is lost, rounded down."},
            4: { itemYieldMult: 1, desc: "You manage to recover the entire yield."}
        };
        const recRoll = await new Roll("1d4").evaluate();
        this.ingredient.itemYield = Math.floor(this.ingredient.itemYield * recTable[recRoll.total].itemYieldMult);
        const messageOptions = {
            flavor: `<b>${recTable[recRoll.total].desc}</b>`,
            speaker: ChatMessage.getSpeaker({actor: this.actor}),
        }
        await recRoll.toMessage(messageOptions);
        return this;
    }

    //function that handles the harvesting of one ingredient
    async harvestIngredient() {
        const roll = await this.rollAlchemyCheck(this.ingredient);
        if(!roll.isSuccess) {   //handle fail
            await this.rollIngredientRecovery(); //alters itemYield
        }
        this.item = {
            name: this.ingredient.name,
            quantity: this.ingredient.itemYield,
        }
        //grant item (stack if needed)
        const harvestedIngredient = await this.grantItem();     //returns null if no item is created
        if(harvestedIngredient) {
            ui.notifications.info(`You managed to harvest ${this.item.quantity}x ${this.item.name}`);
        }
        
        //set flag (if creature)
        //ignore that for now, maybe add later

        //return granted ingredient if successful
        return harvestedIngredient;
    }

    /**
     * Creates a requestor message with one button for each ingredient in the ingredientsArray
     * Each button looks like: "3x Fever Grass"
     * When a button is clicked, a new instance of Harvest is created and the actor will be able to harvest that ingredient.
     * @param {Object[]} ingredientsArray   Array of ingredient objects to be harvested.
     * @param {Actor5e} actor               The actor who should receive the message and harvest the ingredients.      
     */
    static async whisperRequestorMessage(ingredientsArray, actor) {
        const buttonData = [];
        for(const ingr of ingredientsArray) {
            const buttonObj = {
                scope: {
                    ingr: ingr,
                    actorId: actor.id,
                },
                label: `${ingr.itemYield}x ${ingr.name}`,
                command: async function() {
                    await new TaliaCustom.AlchemyAPI.Harvest(actor, ingr).harvestIngredient();
                },
            };
            buttonData.push(buttonObj);
        }

        let whisper = new Set();
        game.users.forEach(user => {
            if (actor.testUserPermission(user, "OWNER")) whisper.add(user.id);
        });
        whisper = Array.from(whisper);

        await Requestor.request({
            title: "Alchemy - Harvesting",
            img: false,
            //use the ingredient's location description for the message; or a generic if there's multiple ingredients
            description: ingredientsArray.length === 1 ? ingredientsArray[0].locDesc : "You can spot multiple alchemical ingredients, just waiting to be harvested.",
            buttonData,
            limit: Requestor.LIMIT.ONCE,
            speaker: ChatMessage.getSpeaker({actor: actor}),
            whisper: whisper,
        });
    }

    /**
     * Rolls itemYields for all ingredients in the array and plays roll animations simultaneously.
     * Returns an updated ingredientsArray by adding a itemYield property to each ingredient.
     * MUTATES THE OBJECTS INSIDE ingredientsArray
     * @param {Object[]} ingredientsArray   Array of ingredient objects to roll itemYields for.
     * @param {string} [formula="2d4"]      Formula string to determine the quantity.
     * @returns {Promise<Object[]>}         Resolves to the updated ingredientsArray.
     */
    static async rollYields(ingredientsArray, formula = "2d4") {
        const promises = [];
        for(const ingr of ingredientsArray) {
            const roll = await new Roll(formula).evaluate();
            promises.push(game.dice3d.showForRoll(roll, game.user, true));
            ingr.itemYield = roll.total;
        }
        await Promise.all(promises);
        return ingredientsArray;
    }

}


//create an instance of this class in the constructor of BrewingUI (which extends FormApplication)
class Brewing extends Alchemy {
    constructor(actor) {
        super(actor);
    }
    
    /**
     * Gets the available ingredients for brewing.
     * @returns {Array} An array of loot items that are of type "ingredient".
     */
    get availableIngredients() {
        return this.actor.itemTypes.loot.filter(i => i.system.type.value === "ingredient");
    }

    /**
     * Calculates the craftable potions based on available ingredients.
     * @returns {Object} An object where keys are potion names and values are the maximum quantity that can be crafted.
     */
    get craftablePotions() {
        const craftablePotions = {};
        const ingreds = this.availableIngredients;

        Object.entries(TaliaCustom.AlchemyAPI.RECIPES).forEach(([potionKey, recipe]) => {
            const maxQuantity = Math.min(...recipe.ingredients.map(ingredient => 
                Math.floor((inventory[ingredient.name] || 0) / ingredient.quantity)
            ));

            if (maxQuantity > 0) {
                craftablePotions[potionKey] = maxQuantity;
            }
        });

        return craftablePotions;
    }
}