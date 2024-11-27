import { TaliaCustomAPI } from "../scripts/api.mjs"
import ChatCardButtons from "../utils/chatCardButtons.mjs"
export default {
    register() {
        addChatCardButtons();
        TaliaCustomAPI.add({wardOfTheLitrRune_roundStart, wardOfTheLitrRune_effectCreation: wardOfTheLitrRune_roundStart}, "EffectMacros");
    }
}

function addChatCardButtons() {
    ChatCardButtons.register({
        itemName: "of the Litr Rune",
        isPartialName: true,
        buttons: [
            {
                label: "Flash of the Litr Rune (1 charge)",
                callback: async (item, chatCard) => {
                    
                }
            },
            {
                label: "Ward of the Litr Rune (8 charges)",
                callback: async (item, chatCard) => {

                }
            }
        ]
    })
}
//chefFeat_chatButton
/** itemButtonMacro */
async function armorOfTheLitrRune_activateWard_chatButton(params) {
    
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

    await effect.update({changes: newChanges});

    ChatMessage.create({
        content: `<p>Resistances: ${resistances.join(', ')}</p><p>Vulnerabilities: ${vulnerabilities.join(', ')}</p>`,
        whisper: ChatMessage.getWhisperRecipients('GM'),
        type: CONST.CHAT_MESSAGE_TYPES.WHISPER
    });
}

