import { TaliaCustomAPI } from "../../../scripts/api.mjs";
import { TaliaUtils } from "../../../utils/_utils.mjs";

/*
    Required modules & settings:
        - Requestor
        - dfreds ce
        - ItemMacroButtons
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

        TaliaCustomAPI.add({chefFeat_chatButton: Cooking.itemButtonMacro}, "ItemMacros");
    }
}

/*
    WORKFLOW

    - Shalkoc chooses which food/spices he wants to use for cooking and how many servings he wants to make.
    - That creates a requestor message for everyone to use to apply healing/tempHP and the spice buff.
*/



class Cooking {
    /*----------------------------------------------------------------------------
                    Static Properties            
    ----------------------------------------------------------------------------*/
    static chefFeatFormulas = {
        snack: {
            formula: "1d8 * @prof",
            type: "healing",
        },
        meal: {
            formula: "2d4 * @prof",
            type: "temphp",
        }
    };
    /*----------------------------------------------------------------------------
                    Static Methods            
    ----------------------------------------------------------------------------*/
    /**
     * 
     * @param {Item5e} item 
     * @param {boolean} isMeal 
     */
    static async itemButtonMacro(item, isMeal) {
        const cooking = await new Cooking(item, isMeal).chooseParams();
        if(!cooking.chosenServings || !cooking.chosenFood) return;
        await cooking.createRequestor();
        await cooking.consumeIngredients();
    }

    /**
     * @returns {Object | undefined} Active Effect data for a given spice item. 
     */
    static getSpiceEffectData(spiceItem) {
        const effect = game.dfreds.effectInterface.findEffect({effectName: spiceItem.name});
        if(!effect) {
            ui.notifications.error(`Couldn't find effect data for: ${spiceItem.name}`);
            return undefined;
        }
        
        const effObj = effect.toObject();
        return foundry.utils.mergeObject(effObj, {
            flags: {
                "talia-custom": {
                    isSpiceEffect: true
                }
            }
        });
    }

    /*----------------------------------------------------------------------------
                    Instance Properties            
    ----------------------------------------------------------------------------*/

    /** @type {Item5e | null} The chosen food item or null if none chosen. */
    chosenFood = null;
    /** @type {Item5e | null} The chosen spice item or null if none chosen.*/
    chosenSpice = null;
    /** @type {number} The chosen number of servings. Defaults to 0. */
    chosenServings = 0;
    /*----------------------------------------------------------------------------
                    Instance Methods            
    ----------------------------------------------------------------------------*/
    constructor(item, isMeal) {
        this.chefFeatItem = item;
        this.actor = item.actor;
        this.isMeal = isMeal;
    }

    /**
     * Lets the user choose food, spice and number of servings through a dialog.
     * @param {Object} [prevArgs]           The results of the previous iteration.
     * @returns {Promise<this>}
     */
    async chooseParams(prevArgs = {}) {
        const chosen = await this._choicesDialog(prevArgs);
        if(!chosen) return this;    //cancel

        const foodItem = chosen.foodId ? this.actor.items.get(chosen.foodId) : null;
        const spiceItem = chosen.spiceId === "none" ? null : this.actor.items.get(chosen.spiceId);

        if(foodItem && chosen.servings > foodItem.system.quantity) {
            ui.notifications.warn(`You don't have enough ${foodItem.name} for ${chosen.servings} servings.`);
            return await this.chooseParams(chosen);
        } else if (spiceItem && chosen.servings > spiceItem.system.quantity) {
            ui.notifications.warn(`You don't have enough ${spiceItem.name} for ${chosen.servings} servings.`);
            return await this.chooseParams(chosen);
        }
        this.chosenFood = foodItem;
        this.chosenSpice = spiceItem;
        this.chosenServings = chosen.servings ?? 0;
        return this;
    }

    /**
     * Creates the dialog and let's the user choose options.
     * @param {Object} [prevArgs]           The results of the previous iteration.
     * @returns {Promise<Object | null>}    The results of the dialog. Null if cancelled.
     */
    async _choicesDialog(prevArgs) {
        const {DialogV2} = foundry.applications.api;
        const {NumberField, StringField} = foundry.data.fields;

        function getChoices(itemArray, addNone = false) {
            return itemArray.reduce((acc, curr) => {
                acc[curr.id] = `${curr.name} (${curr.system.quantity})`;
                return acc;
            }, addNone ? {none: "None"} : {});
        }

        const foodChoices = getChoices(this.isMeal ? this.mealItems : this.snackItems, false);
        const selectGroupFood = new StringField({
            label: `Select ${this.isMeal ? "Meal" : "Snack"}`,
            hint: `You need one ${this.isMeal ? "meal" : "snack"} for each servings you want to cook.`,
            choices: foodChoices,
            required: true,
            initial: prevArgs.foodId,
        }).toFormGroup({},{name: "foodId", foodChoices}).outerHTML;

        const spiceChoices = getChoices(this.spiceItems, true);
        const selectGroupSpice = new StringField({
            label: "Select Spice",
            hint: `You can select one spice to flavour all ${this.isMeal ? "meals" : "snacks"}.`,
            choices: spiceChoices,
            required: true,
            initial: prevArgs.spiceId,
        }).toFormGroup({},{name: "spiceId", spiceChoices}).outerHTML;

        const selectServingsGroup = new NumberField({
            label: "Servings",
            hint: "How many servings are you making?",
            required: true,
            min: 1,
            integer: true,
            positive: true,
            initial: prevArgs.servings,
        }).toFormGroup({},{name: "servings"}).outerHTML;

        const content = selectGroupFood+selectGroupSpice+selectServingsGroup;

        return await DialogV2.prompt({
            window: {
                title: "Chef Feat",
            },
            position: {
                width: "auto",
                height: "auto",
            },
            content,
            modal: true,
            rejectClose: false,
            ok: {
                label: "Cook",
                callback: (event, button) => new FormDataExtended(button.form).object,
            }
        });
    }

    /**
     * Rolls the appropriate formula.
     * @returns {Promise<Roll>} - The evaluated roll instance.
     */
    async getRoll() {
        return await new Roll(Cooking.chefFeatFormulas[this.isMeal ? "meal" : "snack"].formula, this.chefFeatItem.getRollData()).evaluate();
    }
    
    /**
     * Consumes the chosen ingredients.
     */
    async consumeIngredients() {
        if(this.chosenFood) await TaliaUtils.Helpers.consumeItem(this.chosenFood, this.chosenServings, 1, true);
        if(this.chosenSpice) await TaliaUtils.Helpers.consumeItem(this.chosenSpice, this.chosenServings, 1, true);
    }

    /**
     * Creates the requestor for everyone to use.
     */
    async createRequestor() {
        const roll = await this.getRoll();

        const description = `
            <p>${this.actor.name} has prepared <strong>${this.chosenServings} servings</strong> of <strong>${this.chosenFood.name}</strong>${this.chosenSpice ? `, spiced with the finest <strong>${this.chosenSpice.name}</strong>`: ""}.</p>
            <p>${this.isMeal ? `Grants ${roll.total} temporary hit points.` : `Restores ${roll.total} missing hit points.`}</p>
        `;
        const buttonLabel = this.isMeal ? `Eat to gain ${roll.total} temporary hit points.` : `Eat to restore ${roll.total} missing hit points.`;

        await Requestor.request({
            title: "Let the feasting begin!",
            img: false,
            description,
            speaker: ChatMessage.implementation.getSpeaker({actor: this.actor}),
            messageOptions: {
                rolls: [roll]
            },
            buttonData: [{
                label: buttonLabel,
                scope: {
                    rollTotal: roll.total,
                    isMeal: this.isMeal,
                    effectData: this.chosenSpice ? Cooking.getSpiceEffectData(this.chosenSpice) : null,
                },
                command: async function() {
                    if(isMeal) await actor.applyTempHP(rollTotal);
                    else await actor.applyDamage([{value: rollTotal, type: "healing"}]);

                    if(effectData) {
                        const prevEffects = actor.appliedEffects.filter( e => e.flags?.["talia-custom"]?.isSpiceEffect === true);
                        for(let eff of prevEffects) {
                            await eff.delete();
                        }
                        await ActiveEffect.implementation.create(effectData, {parent: actor});
                    }
                }
            }]
        })
    }

    /**
     * @returns {Item5e[]}  Array of loot items with type "spice"
     */
    get spiceItems() {
        return this.actor.itemTypes.loot.filter(i => i.system?.type?.value === "spice");
    }

    /**
     * @returns {Item5e[]}  Array of loot items with subtype "snack"
     */
    get snackItems() {
        return this.actor.itemTypes.loot.filter( i => i.system?.type?.subtype === "snack");
    }

    /**
     * @returns {Item5e[]}  Array of loot items with subtype "meal"
     */
    get mealItems() {
        return this.actor.itemTypes.loot.filter( i => i.system?.type?.subtype === "meal");
    }
}