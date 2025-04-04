import ChatCardButtons from "../../../utils/chatCardButtons.mjs"

export default {
    register() {
        ChanneledMetamagic.init();
    }
}

class ChanneledMetamagic {
    static METAMAGIC_OPTIONS = {
        careful: { key: "careful", name: "Careful", scaling: false },
        distant: { key: "distant", name: "Distant", scaling: false },
        empowered: { key: "empowered", name: "Empowered", scaling: false },
        extended: { key: "extended", name: "Extended", scaling: false },
        piercing: { key: "piercing", name: "Piercing", scaling: false },
        quickened: { key: "quickened", name: "Quickened", scaling: false },
        subtle: { key: "subtle", name: "Subtle", scaling: false },
        twinned: { key: "twinned", name: "Twinned", scaling: true },
        seeking: { key: "seeking", name: "Seeking", scaling: false },
        transmuted: { key: "transmuted", name: "Transmuted", scaling: false },
        heightened: { key: "heightened", name: "Heightened", scaling: false },
    }

    static CONFIG = {
        effectName: "Channeling Fatigue",
        changeKey: "system.attributes.hp.tempmax",
        chatMessageFlavor: "Maximum HP reduction",
        diceSize: {
            base: "d10",
            focused: "d10"
        },
        dialogOptions: {
            minNum: 0,
            maxNum: 9,
        }
    }

    static init() {
        Hooks.once("setup", ChanneledMetamagic.registerButtons);
        Hooks.on("dnd5e.restCompleted", ChanneledMetamagic.onRestCompleted);
    }

    static registerButtons() {
        Object.values(ChanneledMetamagic.METAMAGIC_OPTIONS)
            .forEach(obj => {
                ChatCardButtons.register({
                    itemName: `Metamagic: ${obj.name} Spell`,
                    buttons: [{
                        label: "Channel",
                        callback: ChanneledMetamagic.channel
                    }]
                })
            })
    }

    static async onRestCompleted(actor, result, config) {
        if(config.type === "short") return;

        const eff = actor.appliedEffects.find(e => e.name.startsWith(ChanneledMetamagic.CONFIG.effectName));
        if(eff) eff.delete();
    }

    /**
     * 
     * @param {object} args
     * @param {import("../../../system/dnd5e/module/documents/chat-message.mjs").default} args.message 
     */
    static async channel({message}) {
        return new ChanneledMetamagic(message).evaluate();
    }

    #evaluated = false;

    /**
     * @param {import("../../../system/dnd5e/module/documents/chat-message.mjs").default} message 
     */
    constructor(message) {
        this.message = message;
        this.actor = message.getAssociatedActor();
        this.item = message.getAssociatedItem();
        this.option = Object.values(ChanneledMetamagic.METAMAGIC_OPTIONS)
            .find(v => this.item.name === `Metamagic: ${v.name} Spell`);

        this.isConduitSurge = this.actor.appliedEffects.some(e => e.name === "Conduit Surge");
        this.isFocused = this.option.key === this.actor.getFlag("talia-custom", "focusedMetamagicOption");
    }
    
    async evaluate() {
        if(this.#evaluated) throw new Error("Alrady evaluated.");

        const diceCount = this.option.scaling 
            ? await this.#diceCountDialog()
            : this.item.system.consume.amount;
        if(!diceCount) return;

        const diceSize = ChanneledMetamagic.CONFIG.diceSize[this.isFocused ? "focused" : "base"];

        this.roll = await new Roll(`${diceCount}${diceSize}`).evaluate();
        await this.#createMessage();
        await this.#handleEffect();
        this.#evaluated = true;
        return this;
    }

    async #handleEffect() {
        const { effectName } = ChanneledMetamagic.CONFIG;

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
        const { changeKey, effectName } = ChanneledMetamagic.CONFIG;

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

    async #diceCountDialog() {
        const {DialogV2} = foundry.applications.api;
        const {NumberField} = foundry.data.fields;

        const {minNum, maxNum,} = ChanneledMetamagic.CONFIG.dialogOptions;

        const spentField = new NumberField({
            min: minNum,
            max: maxNum,
            integer: true,
            initial: 1,
            required: true,
            label: "Spent Sorcery Points",
            hint: "Please enter the number of sorcery points you spent on this metamagic."
        }).toFormGroup({}, {name: "spent"}).outerHTML;

        return DialogV2.prompt({
            content: spentField,
            rejectClose: false,
            modal: true,
            ok: {
                callback: (event, button) => new FormDataExtended(button.form).object.spent,
            }
        });
    }

    async #createMessage() {
        const msgData = {
            speaker: this.message.speaker,
            flavor: ChanneledMetamagic.CONFIG.chatMessageFlavor,
        };

        foundry.utils.setProperty(msgData, "flags.dnd5e.originatingMessage", this.message.id);
        const msg = await this.roll.toMessage(msgData);
        await game.dice3d.waitFor3DAnimationByMessageID(msg.id);
        return msg;
    }
}

