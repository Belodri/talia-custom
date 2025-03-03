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
            }
        };
        TaliaCustomAPI.add({chefFeat_chatButton: Cooking.itemButtonMacro}, "ItemMacros");
        Hooks.once("ready", () => {
            if(game.user.name !== "Shalkoc") return;

            Hooks.on("renderContainerSheet", (app, html, data) => {
                if(data.document?.name === "Snack Pack") {
                    updateSpiceListJournal(data.document);
                }
            });

        });
    }
}

/**
 * 
 * @param {Item} container 
 * @returns 
 */
async function updateSpiceListJournal(container) {
    const CONFIG = {
        journalName: "Shalkoc's Notes",
        pageName: "Spice List",
    }

    const extractBetweenCurlyBraces = (str) => {
        const openingIndex = str.indexOf('{');
        if (openingIndex === -1) return '';

        const closingIndex = str.indexOf('}', openingIndex + 1);
        if (closingIndex === -1)  return '';
        return str.substring(openingIndex + 1, closingIndex);
    }

    const itemCol = new foundry.utils.Collection();
    container.actor.items
        .filter(i => i.system.type?.value === "spice")
        .forEach(i => {
            const quant = i.system.quantity;
            const existing = itemCol.get(i.name) ?? 0;
            const newQuant = quant + existing;

            itemCol.set(i.name, newQuant);
        });

    const journal = game.journal.getName(CONFIG.journalName);
    const entryPage = journal.pages.getName(CONFIG.pageName);

    const doc = new DOMParser()
        .parseFromString(entryPage.text.content, "text/html");
    
    const table = doc.querySelector('table');
    if (!table) {
        ui.notifications.error(`No table found in "${CONFIG.journalName}" journal, page "${CONFIG.pageName}"`);
        return;
    }

    table.querySelector('tbody')
        ?.querySelectorAll('tr')
        ?.forEach(row => {
            const cols = row.querySelectorAll('td');
            const innerText = cols[0].textContent;
            const name = extractBetweenCurlyBraces(innerText);

            const quant = itemCol.get(name) ?? 0;
            cols[1].textContent = quant;
        });

    const replacementString = doc.body.innerHTML;
    entryPage.update({"text.content": replacementString});  //async
} 

/*
    WORKFLOW

    - Shalkoc chooses which food he wants to use for cooking and how many servings he wants to make.
    - That creates a requestor message for everyone to use to apply healing/tempHP and the spice buff.
*/

class Cooking {
    /*----------------------------------------------------------------------------
                    Static Properties            
    ----------------------------------------------------------------------------*/

    static types = {
        restorative: {
            label: "Restorative",
            formula: "1d8 * @prof",
            action: "healing",
            name: "restorative"
        },
        preventative: {
            label: "Preventative",
            formula: "2d4 * @prof",
            action: "temphp",
            name: "preventative"
        }
    }

    /*----------------------------------------------------------------------------
                    Static Methods            
    ----------------------------------------------------------------------------*/
    /**
     * 
     * @param {Item5e} item
     * @param {string} type     "preventative" or "restorative"
     */
    static async itemButtonMacro(item, type) {
        const cooking = await new Cooking(item, type).loadAllMealItemImagePaths();
        if(!cooking.isInitialised) return;
        // open food containers
        for(let container of cooking.foodContainers) {
            container.sheet.render(true);
        }
        await cooking.chooseParams();
        if(!cooking.chosenServings) return;
        await cooking.createRequestor();
        await cooking.consumeIngredients();
    }

    /**
     * @returns {object | undefined} Active Effect data for a given spice item. 
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

    /** @type {string | null} */
    chosenMealDescription = "";

    /** @type {number} The chosen number of servings. Defaults to 0. */
    chosenServings = 0;

    /** @type {string | null} The chosen base meal item; Used to determine the name of the meal (can be overridden) and the image used to display the meal in chat. */
    chosenBaseMealName = null;

    /** @type {string | null} The name of the meal. If left blank will default to the name of the base meal item.*/
    chosenMealName = null;

    /** @type {Item5e | null} The chosen spice item or null if none chosen.*/
    chosenSpice = null;

    /** @type {Item5e | null} The chosen food item or null if none chosen.*/
    chosenFoodItem = null;

    /** @type {{[key: string]: string} | null} An object with the meal names in human readable form as keys and their respective image paths as values. */
    allMealItemImagePaths = null;

    /*----------------------------------------------------------------------------
                    Instance Methods            
    ----------------------------------------------------------------------------*/
    constructor(item, type) {
        this.chefFeatItem = item;
        this.actor = item.actor;
        if(!Object.keys(Cooking.types).includes(type)) throw new Error(`Invalid type: ${type}`);
        this.type = Cooking.types[type];
    }

    /**
     * Lets the user choose food, spice and number of servings through a dialog.
     * @param {object} [prevArgs]           The results of the previous iteration.
     * @returns {Promise<this>}
     */
    async chooseParams(prevArgs = {}) {
        if(this.isDialogOpen) return this;    //cancel if a dialog is already open

        const chosen = await this._choicesDialog(prevArgs);
        if(!chosen) return this;    //cancel

        const spiceItem = chosen.spiceId === "none" ? null : this.actor.items.get(chosen.spiceId);

        const foodItem = chosen.foodItemUuid ? fromUuidSync(chosen.foodItemUuid) : null;
        if(!foodItem || !foodItem.type === "loot" || !foodItem.system.type?.value === "food") {
            ui.notifications.warn(`You need to choose a food item.`);
            return await this.chooseParams(chosen);
        }
        else if(foodItem.system?.quantity < chosen.servings) {
            ui.notifications.warn(`You only have ${foodItem.system.quantity} ${foodItem.name}; not enough for ${chosen.servings} servings.`);
            return await this.chooseParams(chosen);
        }
        else if (spiceItem && chosen.servings > spiceItem.system.quantity) {
            ui.notifications.warn(`You don't have enough ${spiceItem.name} for ${chosen.servings} servings.`);
            return await this.chooseParams(chosen);
        }

        this.chosenServings = chosen.servings ?? 0;
        this.chosenBaseMealName = chosen.baseMealName ?? null;
        this.chosenMealName = chosen.alternateMealName || chosen.baseMealName || foodItem.name;

        /*
            cases:
            - desc & image          => desc
            - desc & no image       => desc
            - no desc & image       => blank
            - no dec & no image     => item desc
        */
        this.chosenMealDescription = (!chosen.mealDescription && !chosen.baseMealName) ? foodItem.system.description.value :        //description.value is an html string!
            (!chosen.mealDescription && chosen.baseMealName) ? "" :
                `<p>${chosen.mealDescription}</p>`
        this.chosenSpice = spiceItem;       //required
        this.chosenFoodItem = foodItem;     //required
        return this;
    }

    /**
     * Creates the dialog and let's the user choose options.
     * @param {object} [prevArgs]           The results of the previous iteration.
     * @returns {Promise<object | null>}    The results of the dialog. Null if cancelled.
     */
    async _choicesDialog(prevArgs) {
        const {DialogV2} = foundry.applications.api;
        const {NumberField, StringField, DocumentUUIDField} = foundry.data.fields;

        const selectFoodItemGroup = new DocumentUUIDField({
            type: "Item",
            embedded: true,
            label: "Drag & Drop the food item here",
            required: true,
            initial: prevArgs.foodItemUuid,
        }).toFormGroup({},{name: "foodItemUuid"}).outerHTML;

        const selectServingsGroup = new NumberField({
            label: `Servings`,
            hint: `How many servings are you making?`,
            required: true,
            min: 1,
            integer: true,
            positive: true,
            initial: prevArgs.servings ?? 1,
        }).toFormGroup({},{name: "servings"}).outerHTML;

        const selectBaseMealGroup = new StringField({
            label: "Change Meal Image (optional)",
            choices: Object.entries(this.allMealItemImagePaths).reduce((acc, [k,v]) => {
                acc[k] = k;
                return acc;
            }, {}),
            required: false,
            initial: prevArgs.baseMealName,
        }).toFormGroup({},{name: "baseMealName"}).outerHTML;

        const alternateMealNameGroup = new StringField({
            label: "Change Meal Name (optional)",
            required: false,
            initial: prevArgs.alternateMealName ?? "",
        }).toFormGroup({},{name: "alternateMealName"}).outerHTML;

        const optionalMealDescriptionGroup = new StringField({
            label: "Change Meal Description (optional)",
            initial: prevArgs.mealDescription ?? "",
            required: false,
        }).toFormGroup({},{name: "mealDescription"}).outerHTML;

        const selectGroupSpice = new StringField({
            label: "Select Spice",
            choices: this.spiceItems.reduce((acc, curr) => {
                acc[curr.id] = `${curr.name} (${curr.system.quantity})`;
                return acc;
            }, {none: "None"}),
            required: true,
            initial: prevArgs.spiceId,
        }).toFormGroup({},{name: "spiceId"}).outerHTML;

        const content = selectFoodItemGroup + selectServingsGroup + selectBaseMealGroup + alternateMealNameGroup + optionalMealDescriptionGroup + selectGroupSpice;

        return await DialogV2.prompt({
            window: {
                title: this.chefFeatItem.name,
            },
            position: {
                width: 800,
                height: "auto",
            },
            content,
            modal: false,
            rejectClose: false,
            ok: {
                label: `Cook ${this.type.label} Meal`,
                callback: (event, button) => new FormDataExtended(button.form).object,
            }
        });
    }

    /**
     * Rolls the appropriate formula.
     * @returns {Promise<Roll>} - The evaluated roll instance.
     */
    async getRoll() {
        return await new Roll(this.type.formula, this.chefFeatItem.getRollData()).evaluate();
    }

    /**
     * Consumes a number of food items equal to the number of servings.
     * If a spice was chosen, also consumes a number of the chosen spice item equal to the number of servings.
     */
    async consumeIngredients() {
        if(this.chosenFoodItem) await TaliaUtils.Helpers.consumeItem(this.chosenFoodItem, this.chosenServings, 1, true);
        if(this.chosenSpice) await TaliaUtils.Helpers.consumeItem(this.chosenSpice, this.chosenServings, 1, true);
    }

    /**
     * Creates the requestor for everyone to use.
     */
    async createRequestor() {
        const roll = await this.getRoll();

        const title = this.chosenSpice ? `${this.chosenMealName} with ${this.chosenSpice.name}` : this.chosenMealName;

        const description = `
            <p>${this.actor.name} has prepared <strong>${this.chosenServings} ${this.chosenServings === 1 ? "serving" : "servings"}</strong> of <strong>${this.chosenMealName}</strong>${this.chosenSpice ? `, spiced with <strong>${this.chosenSpice.name}</strong>`: ""}.</p>
            <div style="font-style: italic;">${this.chosenMealDescription}</div>`;

        await Requestor.request({
            title,
            img: this.chosenBaseMealName ? this.allMealItemImagePaths[this.chosenBaseMealName] : this.chosenFoodItem.img,
            description,
            speaker: ChatMessage.implementation.getSpeaker({actor: this.actor}),
            messageOptions: {
                rolls: [roll]
            },
            buttonData: [{
                label: this.type.action === "healing" ? `Eat to restore ${roll.total} missing hit points.` : `Eat to gain ${roll.total} temporary hit points.`,
                scope: {
                    rollTotal: roll.total,
                    action: this.type.action,
                    effectData: this.chosenSpice ? Cooking.getSpiceEffectData(this.chosenSpice) : null,
                },
                command: async function() {
                    await actor.applyDamage([{value: rollTotal, type: action}]);

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
     * Sets this.allMealItemImagePaths: An object with the meal names in human readable form as keys and their respective image paths as values.
     * @param {string} [path] A path to the folder with the images. Root = "data". Will default to "TaliaCampaignCustomAssets/c_Icons/MealItems".
     * @returns {Promise<this>}   
     */
    async loadAllMealItemImagePaths(path = "") {
        const defaultPath = "TaliaCampaignCustomAssets/c_Icons/MealItems";
        const imagePaths = (await FilePicker.browse("data", path || defaultPath)).files;

        const allMealItemImages = imagePaths.reduce((acc, curr) => {
            const imageName = decodeURIComponent(curr.split("/").pop())
                .replace(/\.[^.]+$/, '');
            acc[imageName] = curr;
            return acc;
        }, {});
        this.allMealItemImagePaths = allMealItemImages;
        return this;
    }

    /**
     * @returns {boolean} True if the class has been properly initialised and images have been loaded successfully.
     */
    get isInitialised() {
        if(!this.allMealItemImagePaths) {
            ui.notifications.warn(`Invalid path for base images.`);
            return false;
        }
        return true;
    }

    /**
     * @returns {Item5e[]}  Array of loot items with type "spice"
     */
    get spiceItems() {
        return this.actor.itemTypes.loot.filter(i => i.system?.type?.value === "spice");
    }

    /**
     * @returns {Item5e[]}  Array of loot items with subtype "meal"
     */
    get mealItems() {
        return this.actor.itemTypes.loot.filter( i => i.system?.type?.subtype === "meal");
    }

    /**
     * @returns {Item5e[]} Array of all loot items with type "food" on the actor.
     */
    get foodItems() {
        return this.actor.itemTypes.loot.filter(i => i.system?.type?.value === "food");
    }

    /**
     * @returns {Set<Item5e>}   Set of all container items on the actor which contain food type items.
     */
    get foodContainers() {
        return new Set(this.foodItems
            .filter(i => i.system.container)
            .map(i => this.actor.items.get(i.system.container)));
    }

    /**
     * Checks if a dialog with the same title as the chef feat item is currently open.
     * 
     * @returns {boolean} 
     * - `true` if a dialog with the matching title exists in the foundry applications instances
     * - `false` if no such dialog is currently open
     */
    get isDialogOpen() {
        for(let v of foundry.applications.instances.values()) {
            if(v.options?.window?.title === this.chefFeatItem.name) return true;
        }
        return false;
    }
}
