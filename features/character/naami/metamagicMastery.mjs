import { MODULE } from "../../../scripts/constants.mjs";
import ChatCardButtons from "../../../utils/chatCardButtons.mjs"
import { METAMAGIC_OPTIONS } from "./metamagic.mjs";

export default {
    register() {
        ChatCardButtons.register({
            itemName: "Metamagic Mastery",
            buttons: [{
                label: "Swap",
                callback: ({actor}) => swapHandler(actor)
            }]
        });
    }
}

/**
 * @param {Actor} actor 
 */
async function swapHandler(actor) {
    // Prepare choices

    const currItems = actor.items.filter(i => i.type === "feat" && i.system.type?.subtype === "metamagic");
    if(!currItems.length) {
        ui.notifications.warn(`❌ Cancelled: No metamagic options available to swap out.`);
        return;
    }

    const ownedChoices = {};
    const unownedChoices = {};
    for (const [key, options] of Object.entries(METAMAGIC_OPTIONS)) {
        if (currItems.some(i => i.name === options.itemName)) {
            ownedChoices[key] = options.name;
        } else {
            unownedChoices[key] = options.name;
        }
    }

    if(foundry.utils.isEmpty(unownedChoices)) {
        ui.notifications.warn(`❌ Cancelled: No metamagic options available to swap in.`);
        return;
    }

    // Query User
    const keys = await _swapDialog(ownedChoices, unownedChoices);
    if(!keys) return;
    const swapInOpts = METAMAGIC_OPTIONS[keys.swapInKey];
    const swapOutOpts = METAMAGIC_OPTIONS[keys.swapOutKey];
    
    // Prepare write step
    const itemsToBeAdded = await game.packs.get(MODULE.customItemsPackKey).getDocuments({name__in: [swapInOpts.itemName]});
    if(itemsToBeAdded.length !== 1) throw new Error(`MetamagicMastery | Expected 1 item to be added but received: ${itemsToBeAdded.length}`);
    
    const outItem = currItems.find(i => i.name === swapOutOpts.itemName);
    if(!outItem) throw new Error(`MetamagicMastery | Could not find item to delete: "${swapOutOpts.itemName}"`);

    // Execute write step
    await Item.createDocuments([itemsToBeAdded[0].toObject()], {parent: actor});
    await outItem.delete();

    ui.notifications.info(`✅ Replaced '${swapOutOpts.name}' with '${swapInOpts.name}'.`);
}


/**
 * @param {Record<string, string>} hasChoices
 * @param {Record<string, string>} hasNotChoices 
 * @returns {Promise<{swapOutKey: string, swapInKey: string} | null>}
 */
async function _swapDialog(hasChoices, hasNotChoices) {
    const {DialogV2} = foundry.applications.api;
    const {StringField} = foundry.data.fields;

    const swapOutField = new StringField({
        label: "Swap Out",
        required: true,
        choices: hasChoices
    }).toFormGroup({},{name: "swapOutKey"}).outerHTML;

    const swapInField = new StringField({
        label: "Swap In",
        required: true,
        choices: hasNotChoices
    }).toFormGroup({},{name: "swapInKey"}).outerHTML;

    return DialogV2.prompt({
        window: { title: "Metamagic Mastery"},
        content: swapOutField + swapInField,
        modal: true,
        rejectClose: false,
        ok: {
            callback: (_, button) => new FormDataExtended(button.form).object
        }
    });
}
