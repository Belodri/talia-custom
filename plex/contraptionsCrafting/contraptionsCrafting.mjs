import { MODULE } from "../../scripts/constants.mjs";
import { TaliaCustomAPI } from "../../scripts/api.mjs";

const localConfig = {
    allowedMaterialsTypes: ["loot", "consumable", "weapon", "equipment", "container"]
}

const debug = true;
//  if(debug && game.user.isGM) console.log({});

/**
 * Renders the Contraption Crafting UI for an actor
 * @param {Actor5e} actor 
 * @returns {ContraptionCraftingUI}     The rendered Crafting UI
 */
function openContraptionCrafting(actor) {
    const validDocumentType = ["Actor"].includes(actor.documentName);
    if(!validDocumentType) throw new Error("The document provided is not a valid Actor.");
    return new ContraptionCraftingUI(actor).render(true);
}

export default {
    _onInit() {
        CONFIG.DND5E.consumableTypes.unusualMaterial = {label: "Unusual Material"};
        CONFIG.DND5E.consumableTypes.contraption = {label: "Contraption"};
        CONFIG.DND5E.abilityActivationTypes.trigger = "Trigger";
    },
    _onSetup() {
        TaliaCustomAPI.add({openContraptionCrafting});
    }
}

class ContraptionCraftingUI extends dnd5e.applications.DialogMixin(FormApplication) {

    /**
     * @typedef {Object} WorkingData
     * @property {Collection<string, {item: Item5e, chosenAmount: number, name: string}>} chosenMaterials - The materials chosen by the user.
     * @property {string} contraptionName           - The name given to the resulting contraption.
     * @property {string} contraptionDescription    - The description given to the resulting contraption.
     * @property {string} contraptionImg            - The image given to the resulting contraption.
     */

    /**
     * Constructs a dialog window for crafting contraptions.
     * @param {Object} actor - The actor whose inventory will be used.
     * @param {Object} options - Additional options for the dialog window.
     */
    constructor(actor, options) {
        const object = {};
        super(object, options);
        this.actor = actor;
        /** 
         * The object that stores the user's choices.
         * @type {WorkingData} 
         * @property {Collection<string, {item: Item5e, chosenAmount: number, name: string}>} chosenMaterials - The materials chosen by the user.
         * @property {string} contraptionName           - The name given to the resulting contraption.
         * @property {string} contraptionDescription    - The description given to the resulting contraption.
         * @property {string} contraptionImg            - The image given to the resulting contraption.
         */
        this.object = object;
        this.object.chosenMaterials = new foundry.utils.Collection();
        this.object.contraptionName = "";
        this.object.contraptionDescription = "This is an example description.";
        this.object.contraptionImg = "systems/dnd5e/icons/svg/items/spell.svg";
    }

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            width: 400,
            height: 500,
            title: "Crafting Contraptions",
            template: `modules/${MODULE.ID}/templates/contraptionsCraftingUi.hbs`,
            classes: [MODULE.ID, "contraptionsCraftingUi", "form", "dnd5e2"],
            dragDrop: [{dropSelector: "form"}],
            closeOnSubmit: false,
            resizable: true
        });
    }

    /** @override */
    async getData() {
        const data = {};

        //get the currently chosen materials
        data.currentMaterials = [];
        for(const material of this.object.chosenMaterials) {
            data.currentMaterials.push({
                id: material.item.id,
                name: material.item.name,
                img: material.item.img,
                maxQuant: material.item.system.quantity,
                amount: material.chosenAmount
            });
        }

        data.contraptionName = this.object.contraptionName;
        data.contraptionImg = this.object.contraptionImg;

        const rollData = this.actor.getRollData();
        data.contraptionDescription = await TextEditor.enrichHTML(this.object.contraptionDescription, {
            rollData: rollData, async: true, relativeTo: this.actor
        });
        

        return data;
    }

    /** @override */
    _canDragDrop(selector) {
        return true;
    }

    /** @override */
    async _onDrop(event) {
        //TODO: Limit the maximum number of different materials 

        const data = TextEditor.getDragEventData(event);
        if(debug && game.user.isGM) console.log({event, data});

        //only allow Items that are embedded on actor
        if(data.type !== "Item" || !data.uuid.startsWith(this.actor.uuid)) return;

        //get the dropped item
        const droppedItem = await fromUuid(data.uuid);

        //prevents dropping if the dropped item is not a valid type
        if(!localConfig.allowedMaterialsTypes.includes(droppedItem.type)) return;

        //add an object to the chosenMaterials collection
        this.object.chosenMaterials.set(
            droppedItem.id,
            {
                name: droppedItem.name,     //just so getName() can be used if needed
                item: droppedItem,
                chosenAmount: 1,
            }
        );
        return this.render();
    }

    /** @override */
    render(force = false, options = {}) {
        return super.render(force, options);
    }

    /** @override */
    async _updateObject(event, formData) {
        if(debug && game.user.isGM) console.log({formData});

        this.object.contraptionName = formData.name;
        this.object.contraptionDescription = formData.contraptionDescription;

        return this.render();
    }

    /** @override */
    activateListeners(html) {
        const content = html[0].parentElement;
        content.querySelectorAll("[data-action]").forEach(n => {
            const action = n.dataset.action;
            switch (action) {
                case "plusButton": 
                    n.addEventListener("click", this._onPlusButton.bind(this));
                    break;
                case "minusButton":
                    n.addEventListener("click", this._onMinusButton.bind(this));
                    break;
                case "craftButton":
                    n.addEventListener("click", this._onCraftButton.bind(this));
                    break;
            }
        })
        super.activateListeners(html);
    }

    /* ------------------------------- */
    /*              BUTTONS            */
    /* ------------------------------- */

    _onCraftButton(event) {
        /* 
            TODO: block craft button until all data is valid
                - contraption has a name?
                - has a mechanism?
                - has at least 1 material?
            
            
        */


        console.log({event});
    }

    _onPlusButton(event) {
        const id = event.currentTarget.closest(".material").dataset.id;
        const material = this.object.chosenMaterials.get(id);
        if(material.chosenAmount < material.item.system.quantity) {
            material.chosenAmount ++;
        } else {
            return;
        }
        console.log(this);
        return this.render();
    }

    _onMinusButton(event) {
        const id = event.currentTarget.closest(".material").dataset.id;
        const material = this.object.chosenMaterials.get(id);
        material.chosenAmount --;
        if(material.chosenAmount <= 0) {
            this.object.chosenMaterials.delete(id);
        }
        return this.render();
    }
}