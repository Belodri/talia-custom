import { MODULE } from "../../scripts/constants.mjs"
import { Spellbook } from "../../utils/spellbookManager.mjs"

export default {
    _onInit() {},
    _onSetup() {
        Hooks.on("dnd5e.useItem", spellbookLichMain);
    }
}

/**
 * 
 * @param {Item} item 
 * @param {object} config 
 * @param {object} options 
 */
async function spellbookLichMain(item, config, options) {
    if(item.type !== "spell") return;

    const bookOriginUuid = Spellbook.getSpellbookItemUuid(item);
    if(!bookOriginUuid) return;

    const BOOK_NAME = "Strength through suffering (of others)";
    const bookItem = item.actor.items.getName(BOOK_NAME);
    if(!bookItem || bookItem.uuid !== bookOriginUuid) return;

    if(!bookItem.system.equipped) await bookItem.use();
}
