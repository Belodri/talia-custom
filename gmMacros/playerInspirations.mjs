import { TaliaCustomAPI } from "../scripts/api.mjs";
import { MODULE } from "../scripts/constants.mjs";

export default {
    register() {
        TaliaCustomAPI.add({rollInspirations}, "GmMacros");
        TaliaCustomAPI.add({clearInspirations}, "GmMacros");
    }
}

const FLAG_KEY = "isInspiration";

/**
 *
 */
async function rollInspirations() {
    const packFolder = game.packs.get("talia-custom.rollable-tables").folders.find(f => f.name === "Inspirations");
    const activePlayers = game.users.players.filter(p => p.active === true)
    
    const names = activePlayers.map(obj => obj.name);
    // generate an object with player names as keys and objects as values
    // each value has another player's name as a value of the key 'targetName'
    const pairs = (() => {
        const n = names.length;
        // Fisher-Yates shuffle
        for (let i = n - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [names[i], names[j]] = [names[j], names[i]];
        }
        // Create the pairings with a simple shift
        const pairs = {};
        for (let i = 0; i < n; i++) {
            pairs[names[i]] = {targetName: names[(i + 1) % n]};
        }
        return pairs;
    })();
    
    for(const [key, value] of Object.entries(pairs)) {
        const tableUuid = packFolder.contents.find(t => t.name.includes(value.targetName)).uuid;
        const table = await fromUuid(tableUuid);
        
        //roll each result (rr so they can never be the same) and add the roll and the text results to pairs
        const tableSize = table.results.size;
        const rollFormula = `1d${tableSize}rr1d${tableSize}`;

        /**
         *
         */
        function getUniqueRandomNumbers(x) {
            if (x < 2) {
                return []; // Return an empty array if x is less than 2
            }
          
            let num1, num2;
            do {
                num1 = Math.floor(Math.random() * x) + 1;
                num2 = Math.floor(Math.random() * x) + 1;
            } while (num1 === num2);
          
            return [num1, num2];
        }

        const randomNums = getUniqueRandomNumbers(tableSize);
        value.tableTextResults = randomNums.map(d => {
            const indexVal = d - 1;
            return table.results.contents[indexVal].text;    
        });
        
        //generate the text for the message
        const content = `
            <h3>Inspirations for <b>${value.targetName}</b></h3>
            <p>${value.tableTextResults[0]}</p>
            <p>${value.tableTextResults[1]}</p>
            `;
            
        const speaker = ChatMessage.getSpeaker({alias: "Aerelia"});
        const msg = await ChatMessage.create({
            speaker: speaker,
            content,
            whisper: [activePlayers.find(p => p.name === key)._id],
            flags: { [MODULE.ID]: { [FLAG_KEY]: true } }
        });
        //pin for all
        game.modules.get("pinned-chat-message").api.pinnedMessage(msg);
    }
}

/** Clears existing inspiration messages, whether pinned or not. */
function clearInspirations() {
    game.messages
        .filter(m => m.getFlag(MODULE.ID, FLAG_KEY))
        .forEach(m => {
            m.flags = null; // remove pin
            m.delete();
        });
}
