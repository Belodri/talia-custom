import ChatCardButtons from "../../../utils/chatCardButtons.mjs"
import { METAMAGIC_OPTIONS } from "./metamagic.mjs";

export default {
    register() {
        ChannelledMetamagic.register();
        FocusedMetamagic.register();
    }
}

export class ChannelledMetamagic {
    static CONFIG = {
        effectName: "Channeling Fatigue",
        changeKey: "system.attributes.hp.tempmax",
        chatMessageFlavor: "Maximum HP reduction",
        diceCountMult: {
            base: 2,
            focused: 1,
        },
        diceSize: "d10",
        dialogOptions: {
            minNum: 0,
            maxNum: 9,
        }
    }

    static register() {
        Hooks.on("dnd5e.restCompleted", ChannelledMetamagic.onRestCompleted);
    }

    static async onRestCompleted(actor, result, config) {
        if(config.type === "short") return;

        const eff = actor.appliedEffects.find(e => e.name.startsWith(ChannelledMetamagic.CONFIG.effectName));
        if(eff) eff.delete();
    }

    /**
     * 
     * @param {object} args
     * @param {import("../../../system/dnd5e/module/documents/chat-message.mjs").default} args.message 
     */
    static async channel({message}) {
        return new ChannelledMetamagic(message).evaluate();
    }

    #evaluated = false;

    /**
     * @param {import("../../../system/dnd5e/module/documents/chat-message.mjs").default} message 
     */
    constructor(message) {
        this.message = message;
        this.actor = message.getAssociatedActor();
        this.item = message.getAssociatedItem();
        this.option = Object.values(METAMAGIC_OPTIONS)
            .find(v => this.item.name === v.itemName);

        this.isConduitSurge = this.actor.appliedEffects.some(e => e.name === "Conduit Surge");
        this.isFocused = this.option.key === FocusedMetamagic.getFocusedKey(this.actor);
    }
    
    async evaluate() {
        if(this.#evaluated) throw new Error("Alrady evaluated.");

        const amount = this.item.system.consume.amount
        if(!amount) return;

        const diceCountMult = ChannelledMetamagic.CONFIG.diceCountMult[this.isFocused ? "focused" : "base"];
        const diceSize = ChannelledMetamagic.CONFIG.diceSize;

        const diceCount = Math.floor(amount * diceCountMult);

        this.roll = await new Roll(`${diceCount}${diceSize}`).evaluate();
        await this.#createMessage();
        await this.#handleEffect();
        this.#evaluated = true;
        return this;
    }

    async #handleEffect() {
        const { effectName } = ChannelledMetamagic.CONFIG;

        const effect = this.actor.appliedEffects.find(e => e.name.startsWith(effectName));

        if(effect) {
            const updates = this.#getEffectUpdates(effect.toObject());
            return effect.update(updates);
        }

        const baseEff = game.dfreds.effectInterface.findEffect({effectName});
        const effectData = baseEff.toObject();
        foundry.utils.mergeObject(effectData, this.#getEffectUpdates(effectData));
        return game.dfreds.effectInterface.addEffect({effectData, uuid: this.actor.uuid})
    }

    #getEffectUpdates(effectData) {
        const { changeKey, effectName } = ChannelledMetamagic.CONFIG;

        const newChanges = foundry.utils.deepClone(effectData.changes);
        const change = newChanges.find(c => c.key === changeKey);
        const changeNum = Number.fromString(change.value);
        const newValue = (changeNum ?? 0) - this.roll.total;
        change.value = newValue;

        return {
            changes: newChanges,
            name: `${effectName} (${newValue})`,
        }
    }

    async #createMessage() {
        const msgData = {
            speaker: this.message.speaker,
            flavor: ChannelledMetamagic.CONFIG.chatMessageFlavor,
        };

        foundry.utils.setProperty(msgData, "flags.dnd5e.originatingMessage", this.message.id);
        const msg = await this.roll.toMessage(msgData);
        await game.dice3d.waitFor3DAnimationByMessageID(msg.id);
        return msg;
    }
}

export class FocusedMetamagic {
    static FLAG = "focusedMetamagicOption";

    static CONFIG = {
        featureItemName: "Focused Metamagic",
    }

    /**
     * Gets the key of the metamagic the actor is currently focusing on. 
     * @param {Actor} actor 
     * @returns {string | undefined}
     */
    static getFocusedKey(actor) {
        return actor.getFlag("talia-custom", FocusedMetamagic.FLAG);
    }

    static register() {
        ChatCardButtons.register({
            itemName: FocusedMetamagic.CONFIG.featureItemName,
            buttons: [{
                label: "Replace",
                callback: ({item, actor}) => FocusedMetamagic._replaceFocusButton(item, actor)
            }]
        });
    }

    static async _replaceFocusButton(focusItem, actor) {
        const currentFocusedKey = FocusedMetamagic.getFocusedKey(actor);
        const choices = Object.values(METAMAGIC_OPTIONS)
            .filter(c => c.key !== currentFocusedKey)

        const chosenKey = await this.#chooseReplacementDialog(choices, currentFocusedKey);
        if(!chosenKey) return;  // keep same 

        const newFocus = METAMAGIC_OPTIONS[chosenKey];

        const effect = focusItem.effects.contents[0];
        const newEffectName = FocusedMetamagic.CONFIG.featureItemName + " - " + newFocus.name;
        const newChange = {
            key:  `flags.talia-custom.${FocusedMetamagic.FLAG}`,
            mode: 2,
            value: newFocus.key
        };

        await effect.update({
            name: newEffectName,
            changes: [newChange]
        });
    }

    /**
     * @param {{key: string, name: string}[]} metamagicOptionChoices 
     * @param {string} [currentOptionName=""] 
     * @returns {Promise<string | null>}    The key of the chosen metamagic option, or null if cancelled.
     */
    static async #chooseReplacementDialog(metamagicOptionChoices, currentOptionName = "") {
        const {DialogV2} = foundry.applications.api;
        const {StringField} = foundry.data.fields;

        const selectGroup = new StringField({
            label: "Replace Focus",
            hint: "Choose which metamagic to focus on.",
            required: true,
            choices: Object.fromEntries(
                metamagicOptionChoices.map(opt => [opt.key, opt.name])
            )
        }).toFormGroup({},{name: "metamagicKey"}).outerHTML;

        const p = currentOptionName ? `<p>Currently focusing on: <strong>${currentOptionName}</strong></p>` : "";
        const content = p + selectGroup;

        return DialogV2.prompt({
            window: { title: FocusedMetamagic.CONFIG.featureItemName },
            content,
            modal: true,
            rejectClose: false,
            ok: {
                callback: (event, button) => new FormDataExtended(button.form).object.metamagicKey
            }
        });
    }

}
