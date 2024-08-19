import { MODULE } from "../../../scripts/constants.mjs";



export class AlchemyBrewingUI extends dnd5e.applications.DialogMixin(FormApplication) {
    constructor(actor, options = {}) {
        const object = {};
        super(object, options);

        this.actor = actor;
        this.brewing = new TaliaCustom.AlchemyAPI.Brewing(actor);
    }

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: `${MODULE.ID}_${game.user.id}_brewingUi`,
            width: null,
            height: null,
            title: "Alchemical Synthesis",
            template: `modules/${MODULE.ID}/templates/alchemyBrewingUi.hbs`,
            classes: [MODULE.ID, "alchemyBrewingUi", "dnd5e2"],
            tabs: [{navSelector: "nav[data-group=main]", contentSelector: "div.rarityTabs"}],
            closeOnSubmit: false,
            submitOnChange: true,
            resizable: false
        });
    }

    _updateObject(event, formData) {
        this.object.gmMode = formData.gmMode;
        return this.render();
    }

    /** @override */
    async getData() {

        const data = {
            tabsData: {
                common: { tabName: "Common", dc: 10, items: [] },
                uncommon: { tabName: "Uncommon", dc: 15, items: [] },
                rare: { tabName: "Rare", dc: 20, items: [] },
                veryRare: { tabName: "Very Rare", dc: 25, items: [] },
                legendary: { tabName: "Legendary", dc: 30, items: [] }
            },
            isGM: game.user.isGM,
            gmMode: this.object.gmMode,
        };

        const brewsCraftable = this.brewing.craftableBrewsAmount;
        for(const brew in brewsCraftable) {
            const brewRecipe = this.brewing.recipes[brew];

            data.tabsData[brewRecipe.rarity].items.push({
                amount: this.object.gmMode ? 99 : brewsCraftable[brew],
                img: brewRecipe.img,
                name: brewRecipe.name,
                recipeKey: brew
            });
        }
        return data;

        //each item looks like this:
        const items = [
            {
                name: "Potion of Healing",
                amount: 3,
                img: "imgUrl",
                recipeKey: "potionOfHealing"
            }
        ];
    }

    /** @override */
    render(force = false, options = {}) {
        return super.render(force, options);
    }

    activateListeners(html) {
        const content = html[0].parentElement;
        content.querySelectorAll("[data-action]").forEach(n => {
            const action = n.dataset.action;
            switch (action) {
                case "craftBrewButton":
                    n.addEventListener("click", this._onCraftButton.bind(this));
                    break;
                //other buttons here
            }
        });
        super.activateListeners(html);
    }

    /* ------------------------------- */
    /*              BUTTONS            */
    /* ------------------------------- */

    async _onCraftButton(event) {
        if(this.options.editable === false) {
            ui.notifications.info("Buttons are locked until the current crafting process is finished.");
            return;
        }

        //buttons with amount === 0 are disabled so we don't have to check again here
        const chosenRecipeKey = event.currentTarget.dataset.recipeKey;
        this.options.editable = false;
        await this.brewing.brewRecipe(chosenRecipeKey, {gmMode: this.object.gmMode});

        this.options.editable = true;
        return this.render();
    }
}