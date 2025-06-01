import { TaliaCustomAPI } from "../../../scripts/api.mjs";
import { MODULE } from "../../../scripts/constants.mjs";
import { AlchemyBrewingUI } from "./brewingUi.mjs";

export default {
    register() {
        CONFIG.DND5E.rules.alchemy = "Compendium.talia-custom.rules.JournalEntry.ZkD6R9Ye9Sr77OCt.JournalEntryPage.Z0XP4RuNUbFSIMVN";
        CONFIG.DND5E.lootTypes.ingredient = {label: "Ingredient" };
        CONFIG.DND5E.lootTypes.ingredient.subtypes = { 
            herb: "Herb",
            bodyPart: "Body Part"
        };

        TaliaCustomAPI.add({promptHarvestHerbs: createHarvestHerbs}, "GmMacros");

        TaliaCustomAPI.add({AlchemyAPI: {
            INGREDIENTS,
            RECIPES,
            createHarvestHerbs,
            createHarvestBodyParts,
            Harvest,
            createBrewUI,
            Brewing,
        }});
    }
}

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
 * @typedef {object} Ingredient
 * @property {string} name - The name of the ingredient.
 * @property {number} quantity - The quantity of the ingredient required.
 */

/**
 * @typedef {object} Recipe
 * @property {string} name - The name of the potion.
 * @property {Ingredient[]} ingredients - The list of ingredients required for the potion.
 */

const RECIPES = {
    potionOfHealing: {name: "Potion of Healing", rarity: "common", ingredients: [
        {name: "Fever Grass", quantity: 1}, 
        {name: "Salt Vine", quantity: 1}, 
        {name: "Plant Muscle Fibres", quantity: 1}
    ]},
    potionOfWaterBreathing: {name: "Potion of Water Breathing", rarity: "common", ingredients: [
        {name: "Salt Vine", quantity: 1}, 
        {name: "Gills", quantity: 2}]
    },
    potionOfMaximumPower: {name: "Potion of Maximum Power", rarity: "common", ingredients: [
        {name: "Fever Grass", quantity: 1}, 
        {name: "Plant Muscle Fibres", quantity: 1}, 
        {name: "Gills", quantity: 1}
    ]},
    potionOfHeroism: {name: "Potion of Heroism", rarity: "common", ingredients: [
        {name: "Plant Muscle Fibres", quantity: 2}, 
        {name: "Salt Vine", quantity: 1}
    ]},
    potionOfAdvantage: {name: "Potion of Advantage", rarity: "common", ingredients: [
        {name: "Salt Vine", quantity: 3}
    ]},
    basicPoisonCoating: {name: "Basic Poison Coating", rarity: "common", ingredients: [
        {name: "Plant Muscle Fibres", quantity: 2}, 
        {name: "Gills", quantity: 1}
    ]},
    potionOfGreaterHealing: {name: "Potion of Greater Healing", rarity: "uncommon", ingredients: [
        {name: "Wineberry Bark", quantity: 1}, 
        {name: "Black Nerium", quantity: 1}, 
        {name: "Core Crystal", quantity: 1}
    ]},
    potionOfResistance: {name: "Potion of Resistance", rarity: "uncommon", ingredients: [
        {name: "Black Nerium", quantity: 2}, 
        {name: "Monstrous Blood", quantity: 1}
    ]},
    oilOfSlipperiness: {name: "Oil of Slipperiness", rarity: "uncommon", ingredients: [
        {name: "Wineberry Bark", quantity: 2}, 
        {name: "Core Crystal", quantity: 1}
    ]},
    potionOfGrowth: {name: "Potion of Growth", rarity: "uncommon", ingredients: [
        {name: "Wineberry Bark", quantity: 1}, 
        {name: "Monstrous Blood", quantity: 2}
    ]},
    potionOfDiminution: {name: "Potion of Diminution", rarity: "uncommon", ingredients: [
        {name: "Black Nerium", quantity: 1}, 
        {name: "Core Crystal", quantity: 2}
    ]},
    drowPoison: {name: "Drow Poison", rarity: "uncommon", ingredients: [
        {name: "Core Crystal", quantity: 3}
    ]},
    serpentVenom: {name: "Serpent Venom", rarity: "uncommon", ingredients: [
        {name: "Monstrous Blood", quantity: 3}
    ]},
    potionOfSuperiorHealing: {name: "Potion of Superior Healing", rarity: "rare", ingredients: [
        {name: "Shatterstone", quantity: 1}, 
        {name: "Water Flower", quantity: 1}, 
        {name: "Ooze Drops", quantity: 1}
    ]},
    potionOfGaseousForm: {name: "Potion of Gaseous Form", rarity: "rare", ingredients: [
        {name: "Ooze Drops", quantity: 2}, 
        {name: "Shatterstone", quantity: 1}
    ]},
    potionOfInvisibility: {name: "Potion of Invisibility", rarity: "rare", ingredients: [
        {name: "Ooze Drops", quantity: 2}, 
        {name: "Giant's Nail", quantity: 1}
    ]},
    murgaxorsElixirOfLife: {name: "Murgaxor's Elixir of Life", rarity: "rare", ingredients: [
        {name: "Giant's Nail", quantity: 2}, 
        {name: "Water Flower", quantity: 1}
    ]},
    malice: {name: "Malice", rarity: "rare", ingredients: [
        {name: "Ooze Drops", quantity: 3}
    ]},
    wyvernPoison: {name: "Wyvern Poison", rarity: "rare", ingredients: [
        {name: "Giant's Nail", quantity: 3}
    ]},
    potionOfSupremeHealing: {name: "Potion of Supreme Healing", rarity: "veryRare", ingredients: [
        {name: "Bloodroot", quantity: 1}, 
        {name: "Shimmerleaf", quantity: 1}, 
        {name: "Pure Wrong", quantity: 1}
    ]},
    potionOfFlying: {name: "Potion of Flying", rarity: "veryRare", ingredients: [
        {name: "Shimmerleaf", quantity: 2}, 
        {name: "Pure Wrong", quantity: 1}
    ]},
    potionOfSpeed: {name: "Potion of Speed", rarity: "veryRare", ingredients: [
        {name: "Bloodroot", quantity: 2}, 
        {name: "Necromantic Binding", quantity: 1}
    ]},
    oilOfSharpness: {name: "Oil of Sharpness", rarity: "veryRare", ingredients: [
        {name: "Bloodroot", quantity: 1}, 
        {name: "Shimmerleaf", quantity: 2}
    ]},
    willowshadeOil: {name: "Willowshade Oil", rarity: "veryRare", ingredients: [
        {name: "Shimmerleaf", quantity: 2}, 
        {name: "Necromantic Binding", quantity: 1}
    ]},
    torpor: {name: "Torpor", rarity: "veryRare", ingredients: [
        {name: "Necromantic Binding", quantity: 3}
    ]},
    purpleWormPoison: {name: "Purple Worm Poison", rarity: "veryRare", ingredients: [
        {name: "Pure Wrong", quantity: 3}
    ]},
    potionOfGiantSize: {name: "Potion of Giant Size", rarity: "legendary", ingredients: [
        {name: "Snow Moss", quantity: 2}, 
        {name: "Essence of Legend", quantity: 1}
    ]},
    potionOfLegendaryResistance: {name: "Potion of Legendary Resistance", rarity: "legendary", ingredients: [
        {name: "Essence of Legend", quantity: 3}
    ]},
    potionOfTimeStop: {name: "Potion of Time Stop", rarity: "legendary", ingredients: [
        {name: "Snow Moss", quantity: 2}, 
        {name: "Volcano Poppy", quantity: 1}
    ]},
};


/**
 *
 */
async function createBrewUI(actor) {
    return new AlchemyBrewingUI(actor).render(true);
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
     * @type {{[key: string]: number}}
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

    async rollAlchemyCheck({rarity = "common", name = "", itemYield = null, fastForward = false, skipAnim = false}) {
        if(!this.tool) {
            ui.notifications.error("You need to have Alchemist's Tools on you to practice Alchemy.");
            return null;
        }

        const DC = this.dcFromRarity(rarity);
        const options = {
            flavor: `<b>${itemYield ? `${itemYield}x ` : ""}${name ? `${name} - ` : ""}DC ${DC} Alchemy Check</b>`,
            chooseModifier: false,
            targetValue: DC,
            fastForward: fastForward
        };
        
        const result = await this.tool.rollToolCheck(options);
        if(!result) return null;    //if the dialog was just closed

        if(!skipAnim) {
            //wait for the roll animation to finish before continuing
            const id = game.messages.contents.at(-1)._id;
            await game.dice3d.waitFor3DAnimationByMessageID(id);
        }

        if((result.total >= result.options.targetValue && !result.isFumble) || result.isCritical) {
            result.isSuccess = true;
            return result;
        } else if(fastForward || !await this.queryInspiration()) 
        {
            result.isSuccess = false;
            return result;
        }
        else return await this.rollAlchemyCheck({rarity, name, itemYield, skipAnim});
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
     * @param {object[]} ingredientsArray   Array of ingredient objects to be harvested.
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
     * @param {object[]} ingredientsArray   Array of ingredient objects to roll itemYields for.
     * @param {string} [formula="2d4"]      Formula string to determine the quantity.
     * @returns {Promise<object[]>}         Resolves to the updated ingredientsArray.
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
        this.recipes = Brewing.getWorkingRecipes();
    }


    /**
     * Retrieves and combines working recipes from the brews found in the pack pack with the recipes in AlchemyAPI.
     * @static
     * @returns {object} An object containing the working recipes, where each recipe includes:
     *                   - All properties from the original RECIPES object
     *                   - uuid and img properties from matching entries inside the Brews folder of the pack
    */
    static getWorkingRecipes() {
        const availableRecipes = game.packs.get("talia-custom.customItems")
            .folders.getName("Brews")
            .contents;
        
        const availableMap = Object.fromEntries(
            availableRecipes.map(({ name, uuid, img }) => [name, { uuid, img }])
        );

        const ret = Object.fromEntries(
            Object.entries(TaliaCustom.AlchemyAPI.RECIPES)
                .filter(([_, {name}]) => name in availableMap || name === "Potion of Resistance" )
                .map(([key, recipe]) => [
                    key,
                    { ...recipe, ...availableMap[recipe.name]}
                ])
        );

        ret.potionOfResistance.img = "icons/consumables/potions/bottle-bulb-corked-labeled-blue.webp";
        ret.potionOfResistance.uuid = null;

        return ret;
    }

    static get availableMap() {
        return Object.fromEntries(
            Brewing.availableRecipes.map(({ name, uuid, img }) => [name, { uuid, img }])
        );
    }

    static get availableRecipes() {
        return game.packs.get("talia-custom.customItems")
            .folders.getName("Brews")
            .contents;
    }

    /**
     * Gets the available ingredients for brewing.
     * @returns {Array} An array of loot items that are of type "ingredient".
     */
    get availableIngredients() {
        return this.actor.itemTypes.loot.filter(i => i.system.type.value === "ingredient");
    }

    /**
     * Calculates the craftable brews based on available ingredients.
     * @returns {{[key: string]: number}} An object where keys are brew keys (shortened names) and values are the maximum quantity that can be crafted.
     */
    get craftableBrewsAmount() {
        const craftableBrewsAmount = {};
        //creates an object with ingredient names as the keys and their quantity as the value
        const ingreds = this.availableIngredients
            .reduce((acc, cur) => {
                return {...acc, [cur.name]: cur.system.quantity}
            }, {});

        Object.entries(this.recipes).forEach(([key, recipe]) => {
            const maxQuantity = Math.min(...recipe.ingredients.map(ingredient => 
                //iterating over each ingredient in the recipe for the current brew
                Math.floor((ingreds[ingredient.name] || 0) / ingredient.quantity)
            ));
            craftableBrewsAmount[key] = maxQuantity;
        });
        return craftableBrewsAmount;
    }

    async brewRecipe(recipeKey, options = {}) {
        this.item.quantity = 0;
        this.item.name = "";

        const recipe = foundry.utils.deepClone(this.recipes[recipeKey]);

        if(recipeKey === "potionOfResistance") {
            const chosenResist = await this.chooseResistPotion();
            if(!chosenResist) return null;
            recipe.name = `Potion of ${CONFIG.DND5E.damageTypes[chosenResist].label} Resistance`;
            recipe.uuid = Brewing.availableMap[recipe.name].uuid;
        }

        if(options.gmMode) {
            this.item.quantity = 1;
            this.item.name = recipe.name;
            await this.grantItem();
            return true;
        }

        const alchCheck = await this.rollAlchemyCheck(recipe);
        if(!alchCheck) return null;  //if the alchemy check is cancelled, just return null

        if(alchCheck.isSuccess) {
            this.item.quantity = 1 + Math.floor((alchCheck.total - alchCheck.options.targetValue) / 5);
            this.item.name = recipe.name;

            for(const ingr of recipe.ingredients) {
                ingr.consumeQuant = ingr.quantity;
            }
        } else {
            for(const ingr of recipe.ingredients) {
                //run one check for each ingredient (run twice if the quantity is 2, etc)
                let subtract = 0; 
                for(let i = 0; i < ingr.quantity; i++) {
                    ingr.rarity = recipe.rarity;    //ingredients will always have the same rarity as the brews they're used in
                    const result = await this.rollAlchemyCheck({...ingr, skipAnim: true});
                    if(result?.isSuccess) { //if no roll is made, treat is as a failed roll
                        subtract++;     //each successful roll is a 'recovered' ingredient
                    }
                }
                ingr.consumeQuant = ingr.quantity - subtract;
            }
        }

        //get the ingredient items to consume
        const ingredientItemsToConsume = recipe.ingredients.reduce((acc, curr) => {
            acc.push({
                item: this.availableIngredients.find(i => i.name === curr.name),
                consumeQuant: curr.consumeQuant
            });
            return acc;
        }, []);

        //calcuate consumption
        const updates = [];
        const toDelete = [];
        for(const cons of ingredientItemsToConsume) {
            const newQuant = Math.max(0, cons.item.system.quantity - cons.consumeQuant);
            if(!newQuant) {
                toDelete.push(cons.item._id);
            } else {
                updates.push({
                    _id: cons.item._id,
                    "system.quantity": newQuant
                });
            }
        }

        //consume ingredients
        if(toDelete.length) {
            await this.actor.deleteEmbeddedDocuments("Item", toDelete);
        }
        if(updates.length) {
            await this.actor.updateEmbeddedDocuments("Item", updates);
        }
        //grant item
        if(this.item?.name && this.item?.quantity) {
            await this.grantItem();
        }

        //create message
        const msgData = {}
        msgData.content = `
            <h2>Crafted</h2>
            <table style="border: unset;"><tbody>
                <tr>
                    <td style="width: 15%;">${this.item?.quantity}</td>
                    <td>${recipe.name}</td>
                </tr>
            </tbody></table>
            <h2>Consumed</h2>
            <table style="border: unset;"><tbody>
                ${recipe.ingredients.reduce((acc, curr) => acc += 
                    `<tr>
                        <td style="width: 15%;">${curr.consumeQuant}/${curr.quantity}</td>
                        <td>${curr.name}</td>
                    </tr>`
    ,"")}
            </tbody></table>
        `;
        msgData.speaker = ChatMessage.implementation.getSpeaker({actor: this.actor});
        await ChatMessage.create(msgData);

        //reset 
        this.item.name = "";
        this.item.quantity = 0;
        return true;
    }

    async chooseResistPotion() {
        const options = Object.entries(CONFIG.DND5E.damageTypes)
            .reduce((acc, [key, value]) => acc += `<option value="${key}">${value.label}</option>`, "");
        
        const content = `<form>
            <div class="form-group">
                <label>Select a damage type</label>
                <div class="form-fields">
                    <select name="chosen">${options}</select>
                </div>
            </div>
        </form>`;

        const choice = await Dialog.prompt({
            title: "Potion of Resistance",
            content,
            callback: ([html]) => new FormDataExtended(html.querySelector("form")).object,
            rejectClose: false,
        });
        return choice?.chosen || null;
    }
}
