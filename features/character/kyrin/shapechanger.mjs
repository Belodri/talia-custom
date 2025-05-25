import ChatCardButtons from "../../../utils/chatCardButtons.mjs"

export default {
    register() {
        ChatCardButtons.register({
            itemName: "Shapechanger",
            displayFilter: (item) => item.system?.requirements === "Changeling",
            buttons: [{
                label: "Choose Shape",
                callback: chooseShape
            }]
        });
    }
}

const PERSONAS = {
    "Human_Child_Female": {
        name: "Miri Flick",
        token: "TaliaCampaignCustomAssets/c_CharacterArt/Kyrin_Personas/Human_Child_Female_Token.png",
        portrait: "TaliaCampaignCustomAssets/c_CharacterArt/Kyrin_Personas/Human_Child_Female_Portrait.png",
    },
    "Drow_Female": {
        name: "Zey'riin DeNaukhel",
        token: "TaliaCampaignCustomAssets/c_CharacterArt/Kyrin_Personas/Drow_Female_Token.png",
        portrait: "TaliaCampaignCustomAssets/c_CharacterArt/Kyrin_Personas/Drow_Female_Portrait.png",
    },
    "Dwarf_Female": {
        name: "Ilsa Stonepath",
        token: "TaliaCampaignCustomAssets/c_CharacterArt/Kyrin_Personas/Dwarf_Female_Token.png",
        portrait: "TaliaCampaignCustomAssets/c_CharacterArt/Kyrin_Personas/Dwarf_Female_Portrait.png",
    }
}


/**
 * Called by the 'Choose Shape' chat card button.
 * Opens dialog that allows to select a predefined persona, 
 * then applies a dfreds effect to make the character appear as that persona.
 * @param {object} vars
 * @param {Item} vars.item
 * @param {Actor} vars.actor
 */
async function chooseShape({item, actor}) {
    const lastPersona = item.getFlag("talia-custom", "persona") ?? "Human_Child_Female";

    const personaField = new foundry.data.fields.StringField({
        label: "Select Persona",
        choices: Object.fromEntries( Object.entries(PERSONAS).map(([k, v]) => [k, `${v.name} (${k.split("_").join(" ")})`])),
        required: true,
        blank: false,
        initial: lastPersona
    }).toFormGroup({}, {name: "persona"}).outerHTML;

    const chosen = await foundry.applications.api.DialogV2.prompt({
        window: { title: item.name },
        content: personaField,
        rejectClose: false,
        modal: true,
        ok: {
            callback: (event, button) => new FormDataExtended(button.form).object.persona,
        },
    });
    if(!chosen) return;
    const persona = PERSONAS[chosen];
    
    const eff = game.dfreds?.effectInterface?.findEffect?.({effectName: "Shapechanger"});
    if(!eff) throw new Error("No dfreds effect named 'Shapechanger' found.");

    const data = foundry.utils.mergeObject(eff.toObject(), {
        name: item.name,
        origin: item.uuid,
        img: item.img,
        changes: [
            { key: "ATL.texture.src", mode: 5, priority: 20, value: persona.token }, 
            { key: "ATL.name", mode: 5, priority: 20, value: persona.name },
            { key: "img", mode: 5, priority: 20, value: persona.portrait },
            { key: "name", mode: 5, priority: 20, value: persona.name }
        ]
    });
    foundry.utils.setProperty(data, "flags.talia-custom.shapechanger", item.uuid);

    const existingEffect = actor.appliedEffects.find(e => e.getFlag("talia-custom", "shapechanger") === item.uuid);

    if(existingEffect) return existingEffect.update(data);
    return game.dfreds.effectInterface.addEffect({effectData: data, uuid: actor.uuid, origin: item.uuid});
}
