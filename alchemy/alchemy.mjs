import { TaliaCustomAPI } from "../scripts/api.mjs";
import { MODULE } from "../scripts/constants.mjs";

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
        TaliaCustomAPI.add({
            HarvestHerbs
        });
    }
}
/*
    TODO: Add ingredient items to module compendium.
    TODO: implement rules changes (alchemy recipe book, compendium items)
    - change Compound Eye -> Core Crystal (from medium+ constructs)
    - gills -> (from beasts with swim speed)
*/


/*
    Harvesting - Creatures
    - target creature token
    - useAbility (Fearghas has the ability)
    - do checks (dead, etc...)
    - creature actor gets a flag stating that it's been gathered

    Harvesting - Herbs
    - select herb type/environment
    - prompt Fearghas
    
    Harvesting - Shared
    - roll happens (prompt inspiration if fail)
    - materials are gathered

*/

/**
 * Base class representing Alchemy-related functionalities.
 * Contains methods and properties shared between all subclasses.
 */
class Alchemy {
    constructor(actor) {
        this.actor = actor;
        this.alchemyTool = actor.itemTypes.tool.find(i => i.system.type.baseItem === "alchemist") ?? null;
        if(!this.alchemyTool) ui.notifications.error("You need to have Alchemist's Tools on you to practice Alchemy.");
    }

    static recipes = {
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

    //TODO Move getCraftablePotions and recipes to a child class since they are not needed for Harvesting

    /**
     * Determines the maximum number of each potion that can be crafted based on the available ingredients.
     * 
     * @param {Object.<string, number>} inventory - An object representing the available ingredients.
     * @param {number} inventory.ingredientName - The quantity of each ingredient available.
     * @returns {Object.<string, number>} An object where keys are potion identifiers and values are the maximum number of that potion that can be crafted.
     * 
     * @example
     * const userInventory = {
     *   "Fever Grass": 5,
     *   "Salt Vine": 3,
     *   "Plant Muscle Fibres": 2,
     *   "Gills": 4
     * };
     * const craftablePotions = Alchemy.getCraftablePotions(userInventory);
     * // craftablePotions might be: { potionOfHealing: 2, potionOfWaterBreathing: 1, potionOfAdvantage: 1 }
     */
    static getCraftablePotions(inventory) {
        const craftablePotions = {};

        Object.entries(this.recipes).forEach(([potionKey, recipe]) => {
            const maxQuantity = Math.min(...recipe.ingredients.map(ingredient => 
                Math.floor((inventory[ingredient.name] || 0) / ingredient.quantity)
            ));

            if (maxQuantity > 0) {
                craftablePotions[potionKey] = maxQuantity;
            }
        });

        return craftablePotions;
    }

    /**
     * Rolls a check using the actor's alchemist's tools.
     * @param {Object} options - Options for the alchemy check.
     * @param {string} [options.rarity="common"] - The rarity the DC should be based on.
     * @param {string} [options.name=""] - The item name that should be printed to chat (if applicable).
     * @param {number} [options.quantity] - The quantity of the item that should be printed to chat (if applicable).
     * @param {Roll} [options.roll] - Optional roll object.
     * @returns {Promise<Roll>} The final roll object.
     */
    async rollAlchemyCheck({rarity = "common", name = "", quantity = undefined, roll} = {}) {
        const rarityToDC = {
            "common": 10,
            "uncommon": 15,
            "rare": 20,
            "veryRare": 25,
            "legendary": 30,
        };
        const dc = rarityToDC[rarity];

        quantity = roll.total ?? quantity;

        const options = {
            flavor: `<b>${quantity ? `${quantity}x ` : ""}${name ? `${name} - ` : ""}DC ${dc} Alchemy Check</b>`,
            chooseModifier: false,
            targetValue: dc,
        }
        const result = await this.alchemyTool.rollToolCheck(options);
        if((result.total >= result.options.targetValue && !result.isFumble) || result.isCritical) {
            return result;
        } else {
            if(!await this.queryInspiration()) return result;
            else return await this.alchemyCheck(rarity);
        }
    }
    
    //TODO Test this on player account
    //TODO Refactor this to a helper function accessible by the rest of the module
    async queryInspiration() {
        const soInspired = {
            scope: "so-inspired",
            flagKey: "inspirationCount"
        };
        const actorOwner = game.users.find(u => u.character?.uuid === this.actor.uuid);
        if(!actorOwner) return false;
        const currentInspirationCount =  actorOwner.getFlag(soInspired.scope, soInspired.flagKey);
        if(!currentInspirationCount) return false;
        const spendInspiration = await Dialog.confirm({
            title: "Alchemy check",
            content: `Do you want to spend one inspiration to reroll this check?`,
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
}


/**
 * Class representing general harvesting operations.
 * Extends Alchemy for shared alchemy functionalities.
 * Contains methods and properties shared between its subclasses.
 * @extends Alchemy
 */
class Harvest extends Alchemy {
    constructor(actor) {
        super(actor);
        /**
         * @typedef {Object} Ingredient
         * @property {string} name
         * @property {string} rarity
         * @property {Roll} roll
         * 
         */

        /**
         * @type {Ingredient[]}
         */
        this.workingIngr = [];
    }

    //testing only
    get workingIngreds() {
        return this.workingIngr;
    }

    async harvest() {
        this.workingIngr = this.harvestableIngredients;

        if(!this.workingIngr) {
            ui.notifications.warn("No harvestable ingredients found.");
            return null;
        }
        await this.rollQuantities();
        //

        

        console.log(this);
        return this;
    }

    

    async rollQuantities() {
        const promises = [];
        for(const ingr of this.workingIngr) {
            const roll = await new Roll(`2d4`).evaluate();
            promises.push(game.dice3d.showForRoll(roll, game.user, true));
            ingr.roll = roll;
        }
        await Promise.all(promises);
        return this;
    }
}

/**
 * Class for harvesting body parts from deceased creatures.
 * Extends Harvest for shared harvesting functionalities.
 * @extends Harvest
 */
class HarvestBodyParts extends Harvest {
    constructor(actor, targetToken) {
        super(actor);
        this.targetToken = targetToken;
        this.targetRollData = targetToken.actor.getRollData();
    }

    static bodyPartsPerType = {
        plant: {name: "Plant Muscle Fibres", rarity: "common", minSizeIndex: 2},
        beast: {name: "Gills", rarity: "common", minSizeIndex: 0, extraCondition: (targetRollData) => targetRollData.attributes.movement.swim >= 1},
        construct: {name: "Core Crystal", rarity: "uncommon", minSizeIndex: 0},
        monstrosity: {name: "Monstrous Blood", rarity: "uncommon", minSizeIndex: 3},
        ooze: {name: "Ooze Drops", rarity: "rare", minSizeIndex: 3},
        giant: {name: "Giant's Nail", rarity: "rare", minSizeIndex: 4},
        aberration: {name: "Pure Wrong", rarity: "veryRare", minSizeIndex: 3},
        undead: {name: "Necromantic Binding", rarity: "veryRare", minSizeIndex: 4},
        dragon: {name: "Dragon Scale", rarity: "legendary", minSizeIndex: 4},
        legend: {name: "Essence of Legend", rarity: "legendary", minSizeIndex: 0, extraCondition: (targetRollData) => targetRollData.resources.legres.max >= 1}
    }

    get harvestableIngredients() {
        if(!this.isHarvestable) return null;

        const parts = [];
        //handle legend case
        if(HarvestBodyParts.bodyPartsPerType.legend.extraCondition(this.targetRollData)) {
            const {name, rarity} = bodyPartsPerType.legend;
            parts.push({name, rarity});
        }

        const type = this.targetRollData.details.type.value;
        const sizesArray = ["tiny", "sm", "med", "lg", "huge", "grg"];
        const sizeIndex = sizesArray.indexOf(this.targetRollData.traits.size);

        // Check if the type exists in bodyPartsPerType and process it
        if(HarvestBodyParts.bodyPartsPerType.hasOwnProperty(type)) {
            const { name, rarity, minSizeIndex, extraCondition } = bodyPartsPerType[type];

            if(sizeIndex >= minSizeIndex && (!extraCondition || extraCondition(this.targetRollData))) {
                parts.push({name, rarity});
            }
        }
        return parts;
    }
    get isHarvestable() {
        if(this.targetToken.document.getFlag(MODULE.ID, "beenHarvested")) {
            //ui.notifications.info("This creature has already been harvested.");
            return false;
        } else if (this.targetRollData.attributes.pct !== 0) {
            //ui.notifications.info("The creature is not happy with your attempt to harvest it's body parts. Maybe you should kill it first.");
            return false;
        }
        return true;
    }
}

/**
 * Class for harvesting herbs.
 * Extends Harvest for shared harvesting functionalities.
 * @extends Harvest
 */
class HarvestHerbs extends Harvest {
    constructor(actor, herbName = undefined) {
        super(actor);
        this.herbName = herbName;
    }

    static herbs = [
        {name: "Fever Grass", rarity: "common"},
        {name: "Salt Vine", rarity: "common"},
        {name: "Wineberry Bark", rarity: "uncommon"},
        {name: "Black Nerium", rarity: "uncommon"},
        {name: "Shatterstone", rarity: "rare"},
        {name: "Water Flower", rarity: "rare"},
        {name: "Bloodroot", rarity: "veryRare"},
        {name: "Shimmerleaf", rarity: "veryRare"},
        {name: "Volcano Poppy", rarity: "legendary"},
        {name: "Snow Moss", rarity: "legendary"},
    ];

    get harvestableIngredients() {
        const chosenHerb = HarvestHerbs.herbs.find(h => h.name === this.herbName);
        if(chosenHerb) {
            const { name, rarity } = chosenHerb;
            return [{name, rarity}]; 
        }
        return null;
    }
}


/*
    static herbs = [
        {name: "Fever Grass", rarity: "common"},
        {name: "Salt Vine", rarity: "common"},
        {name: "Wineberry Bark", rarity: "uncommon"},
        {name: "Black Nerium", rarity: "uncommon"},
        {name: "Shatterstone", rarity: "rare"},
        {name: "Water Flower", rarity: "rare"},
        {name: "Bloodroot", rarity: "veryRare"},
        {name: "Shimmerleaf", rarity: "veryRare"},
        {name: "Volcano Poppy", rarity: "legendary"},
        {name: "Snow Moss", rarity: "legendary"},
    ];

    static bodyParts = [
        {name: "Plant Muscle Fibres", rarity: "common", type: "plant", minSizeIndex: 2},
        {name: "Gills", rarity: "common", type: "beast", minSizeIndex: 0, extraCondition: (targetRollData) => targetRollData.attributes.movement.swim},
        {name: "Core Crystal", rarity: "uncommon", type: "construct", minSizeIndex: 2},
        {name: "Monstrous Blood", rarity: "uncommon", type: "monstrosity", minSizeIndex: 3},
        {name: "Ooze Drops", rarity: "rare", type: "ooze", minSizeIndex: 3},
        {name: "Giant's Nail", rarity: "rare", type: "giant", minSizeIndex: 4},
        {name: "Pure Wrong", rarity: "veryRare", type: "aberration", minSizeIndex: 3},
        {name: "Necromantic Binding", rarity: "veryRare", type: "undead", minSizeIndex: 4},
        {name: "Dragon Scale", rarity: "legendary", type: "dragon", minSizeIndex: 4},
        {name: "Essence of Legend", rarity: "legendary", type: "any", minSizeIndex: 0, extraCondition: (targetRollData) => targetRollData.resources.legres.max >= 1}
    ];
*/