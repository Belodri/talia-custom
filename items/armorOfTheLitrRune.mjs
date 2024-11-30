import { TaliaCustomAPI } from "../scripts/api.mjs"
import ChatCardButtons from "../utils/chatCardButtons.mjs"
export default {
    register() {
        addChatCardButtons();
        TaliaCustomAPI.add({wardOfTheLitrRune_roundStart, wardOfTheLitrRune_effectCreation: wardOfTheLitrRune_roundStart}, "EffectMacros");

        //prevent usage config from showing
        Hooks.on("dnd5e.preUseItem", (item, config, options) => {
            if(!item.name.includes(" of the Litr Rune")) return;
            if(!options.flags) {
                options.flags = {};
            }
            foundry.utils.setProperty(options.flags, "dnd5e.use.consumedUsage", true);
        })
    }
}
/** to handle consumption */
function addChatCardButtons() {
    ChatCardButtons.register({
        itemName: "of the Litr Rune",
        isPartialName: true,
        buttons: [
            {
                label: "Flash (consume 1 charge)",
                callback: async (item, chatCard) => {
                    let charges = item.system.uses.value;
                    if(charges < 1) return ui.notifications.warn(`The armor doesn't have enough charges to activate this ability.`);

                    await item.update({"system.uses.value": charges - 1});
                    return ui.notifications.info(`1 charge consumed, ${item.system.uses.value} charges remaining.`);
                }
            },
            {
                label: "Ward (consume 8 charges)",
                callback: async (item, chatCard) => {
                    const actor = item.actor;
                    let charges = item.system.uses.value;
                    if(charges < 8) return ui.notifications.warn(`The armor doesn't have enough charges to activate this ability.`);

                    await item.update({"system.uses.value": charges - 8});
                    return ui.notifications.info(`8 charges consumed, ${item.system.uses.value} charges remaining.`);
                }
            }
        ]
    })
}

/** effect macro */
async function wardOfTheLitrRune_roundStart(effect) {
    const RES_AMOUNT = 4;
    const VULN_AMOUNT = 1;
    const TOTAL_CHANGES = RES_AMOUNT + VULN_AMOUNT;

    const damageTypes = Object.keys(CONFIG.DND5E.damageTypes);
    if(TOTAL_CHANGES > damageTypes.length) return null;


    const available = [...damageTypes];
    const newChanges = [];
    const vulnerabilities = [];
    const resistances = [];

    for (let i = 0; i < TOTAL_CHANGES; i++) {
        const randomIndex = Math.floor(Math.random() * available.length);
        const [selectedType] = available.splice(randomIndex, 1);

        if (i < VULN_AMOUNT) {
            vulnerabilities.push(selectedType);
        } else {
            resistances.push(selectedType);
        }

        newChanges.push({
            key: i < VULN_AMOUNT ? "system.traits.dv.value" : "system.traits.dr.value", 
            mode: 2, 
            priority: 20, 
            value: selectedType
        });
    }

    const desc = `<p><strong>Resistances:</strong> ${resistances.join(', ')}</p><p><strong>Vulnerabilities:</strong> ${vulnerabilities.join(', ')}</p>`;

    await effect.update({"changes": newChanges, "description": `${desc}<p>At the beginning of each round in combat, these damage types change randomly.</p>`});

    ChatMessage.create({
        flavor: effect.name,
        content: `${desc}`,
        whisper: ChatMessage.getWhisperRecipients('GM'),
        type: CONST.CHAT_MESSAGE_TYPES.WHISPER
    });
}

