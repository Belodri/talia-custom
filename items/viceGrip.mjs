import { TaliaCustomAPI } from "../scripts/api.mjs";

export default {
    register() {
        TaliaCustomAPI.add({viceGrip}, "ItemMacros");
    }
}

//removes the attack roll from the card
/**
 *
 */
async function viceGrip(item) {
    const msg = await item.use({},{skipItemMacro: true, createMessage: false});

    const parser = new DOMParser();
    const doc = parser.parseFromString(msg.content, 'text/html');

    // Select and remove all <button> elements with data-action="attack"
    const buttons = doc.querySelectorAll('button[data-action="attack"]');
    buttons.forEach(button => button.remove());

    // Serialize the DOM object back into a string
    const updatedHtmlString = doc.body.innerHTML;

    msg.content = updatedHtmlString;
    await ChatMessage.create(msg);
} 
