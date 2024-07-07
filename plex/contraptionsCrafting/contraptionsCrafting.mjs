import { MODULE } from "../../scripts/constants.mjs";
import { TaliaCustomAPI } from "../../scripts/api.mjs";


//TODO: remove contraption item type

const localConfig = {
    allowedMaterialsTypes: ["loot", "consumable", "weapon", "equipment"]
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
        TaliaCustomAPI.add({
            openContraptionCrafting,
            triggerContraption
        });
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
        this.object.contraptionDescription = "";
        this.object.contraptionImg = "TaliaCampaignCustomAssets/c_Icons/box-trap.png";
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
            submitOnChange: true,
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
        if(this.object.chosenMaterials.size >= 7) {
            ui.notifications.info("You cannot use more than 7 different materials for your contraption.");
            return;
        }

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
        this.object.contraptionDescription = formData.contraptionDescription ?? this.object.contraptionDescription;

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
    async _onCraftButton(event) {
        //validate data
        const obj = this.object;
        if(obj.chosenMaterials.size <= 0) {
            ui.notifications.info("You need to choose at least 1 material.");
            return;
        }
        if(obj.contraptionDescription === "") {
            ui.notifications.info("You need to include a description of how the mechanism works.");
            return;
        }
        if(obj.contraptionName === "") {
            ui.notifications.info("You need to give your contraption a name.");
            return;
        }
        return await this.craftContraption();
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

    /* ------------------------------- */
    /*             CRAFTING            */
    /* ------------------------------- */

    async craftContraption() {
        const totalMatsNum = this.object.chosenMaterials.reduce((acc, curr) => acc += curr.chosenAmount, 0);
        //roll the check to determine bonuses
        const result = await this.actor.rollToolCheck("weaver", {chooseModifier: false,});
        //calcualate save dc and attack bonus from that
        const saveDC = Math.max(1, result.total - totalMatsNum + 3);
        const attackBonus = Math.max(1, result.total - totalMatsNum - 4);

        //get the container item
        const [defaultContr] = await game.packs.get(MODULE.customItemsPackKey).getDocuments({name: "DefaultContraption"});
        const contrObj = defaultContr.toObject();

        //apply changes
        const newContrObj = foundry.utils.mergeObject(contrObj, {
            flags: {
                "talia-custom": {
                    contraption: {
                        saveDC: saveDC,
                        attackBonus: attackBonus
                    }
                }
            },
            name: `${this.object.contraptionName}`,
            system: {
                description: {
                    value: `${this._generateDescription(saveDC, attackBonus)}`,
                }
            }
        });

        //turn the object into an item and add it to the actor
        const [createdContr] = await this.actor.createEmbeddedDocuments("Item", [newContrObj]);

        for(const mat of this.object.chosenMaterials) {
            const updates = {
                "system.container": createdContr.id,
            };
            if(mat.chosenAmount !== mat.item.system.quantity) {
                //'split' the stack of an item if chosenAmount !== quantity
                //'split' the stack by creating a new item on the actor with quantity = matQuantity - chosenAmount
                const itemData = mat.item.toObject();
                itemData.system.quantity -= mat.chosenAmount;
                await Item.create(itemData, {parent: this.actor});
                //change the mat's quantity in the update
                updates["system.quantity"] = mat.chosenAmount;
            }

            //add save dc and attack bonus to updates if necessary

            //check if the property is undefined or not
            if(typeof foundry.utils.getProperty(mat.item, "system.attack.bonus") !== "undefined") {
                updates["system.attack.bonus"] = attackBonus;
                updates["system.attack.flat"] = true;
            }
            //check for save ability instead of save dc since if that's falsey, the item is not supposed to have a save DC
            if(foundry.utils.getProperty(mat.item, "system.save.ability")) {
                updates["system.save.dc"] = saveDC;
                updates["system.save.scaling"] = "flat";
            }

            //Add material to container & adjust it's quantity if needed
            await mat.item.update(updates);
        }

        //and add the item macro
        const command = `await TaliaCustom.triggerContraption(item, actor, token);`;
        const macro = new Macro({
            name: `${createdContr.name}`,
            type: "script",
            author: `${game.userId}`,
            command: command
        });
        console.log({createdContr});
        await createdContr.setMacro(macro);

        //clear the chosenMaterials
        this.object.chosenMaterials.clear();
        return this.render();
    }

    /**
     * Generates an HTML string for a given contraption's description.
     * @param {number} saveDC 
     * @param {number} attackBonus   
     * @returns {string}            HTML string for the contraption's description.
     */
    _generateDescription(saveDC, attackBonus) {
        const saveAbPart = `<p>Save DC: ${saveDC} | Attack Bonus: ${attackBonus}</p>`;
        const mechanismTitle = `<p><span style="text-decoration: underline;"><strong><span style="text-decoration: underline;">Mechanism</span></strong></span></p>`;  //no idea why the fuck it is like that...
        const mechanismText = `${this.object.contraptionDescription}`;
        return `${saveAbPart}${mechanismTitle}${mechanismText}`;
    }

    
}

/* ------------------------------- */
/*          CONTRAPTION USE        */
/* ------------------------------- */

/**
 * 
 * @param {Item5e} item         The triggering contraption item
 * @param {Actor5e} actor       The actor who's USING the item
 * @param {Token} token         The token of the actor who's USING the contraption
 */
async function triggerContraption(item, actor, token) {

    /*TODO
        IMPOSSIBLE - Find a way to 'use' the items in the flags without having to create an embedded document for them on the actor.

        WORKS! - see if I can store the items in a container on the actor instead, so they're not immediately accessible

        a contraption has to be a container
        - inside all the items to be used are stored
        - it's itemMacro can be the same
        - no need to store the material objects in the flags
        - no need to list the materials 

        - store DC and attackBonus of the contraption inside a flag on the item


        The container and all it's contents can be deleted via "await container.delete({deleteContents: true});"
        That said, I can't do that upon use since all the individual items have to be used frist.

        Maybe just ask Plex to delete the contraption after he's done using it?
        Or add a button to the chat card to delete it.
    */
    
    

    console.log(item);
}