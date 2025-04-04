/* eslint-disable jsdoc/require-jsdoc */
import ChatCardButtons from "../../../utils/chatCardButtons.mjs";
import { ItemHookManager } from "../../../utils/ItemHookManager.mjs";
import ChanneledMetamagic from "./channeledMetamagic.mjs";

export default {
    register() {
        heightened();
        twinned();
        subtle();
    }
}
const rollFatigueButton = { label: "Roll Channeling Fatigue", callback: ChanneledMetamagic.channel };


function subtle(itemName = "Metamagic: Subtle Spell") {
    ChatCardButtons.register({ itemName, buttons: [
        rollFatigueButton
    ]});
}

function heightened(itemName = "Metamagic: Heightened Spell") {
    ChatCardButtons.register({ itemName, buttons: [
        { label: "Warded", callback: ({item}) => heightenedButton(item, false) },
        { label: "Channeled", callback: ({item}) => heightenedButton(item, true) },
        rollFatigueButton
    ]});

    /**
     * @param {Item5e} item 
     * @param {boolean} channeled 
     */
    async function heightenedButton(item, channeled=false) {
        const eff = item.effects
            .find(e => e.name.includes(channeled ? "(Channeled)" : "(Warded)"));
        await eff.update({disabled: false});

        Hooks.once("dnd5e.useItem", () => {
            eff.update({disabled: true});
        });
    }
}

function twinned(itemName = "Metamagic: Twinned Spell") {
    ChatCardButtons.register({ itemName, buttons: [
        rollFatigueButton
    ]});

    Hooks.on("dnd5e.preUseItem", (item, config, options) => {
        if(item.name !== itemName || options.skipItemMacro ) return;

        (async() => {
            const sorcPoints = await chooseSpellLevel(item) ?? 0;
            await item.update({"system.consume.amount": sorcPoints});
            item.use({}, {skipItemMacro: true});
        })();
        return false;
    });

    async function chooseSpellLevel(item) {
        const {DialogV2} = foundry.applications.api;
        const {NumberField, BooleanField} = foundry.data.fields;

        const levelField = new NumberField({
            min: 1,
            max: 9,
            integer: true,
            initial: 1,
            required: true,
            label: "Choose Spell Level",
            hint: `Please select the level of the spell you want to twin.`,
        }).toFormGroup({}, {name: "level"}).outerHTML;

        return DialogV2.prompt({
            content: levelField,
            rejectClose: false,
            modal: true,
            ok: {
                callback: (event, button) => new FormDataExtended(button.form).object.level,
            }
        });
    }
}
