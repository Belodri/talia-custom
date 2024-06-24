import { Spellbooks } from "./spellbooks.mjs";

export function setup_spellbookLich() {
    Hooks.on("dnd5e.useItem", spellbookLichMain);
}

async function spellbookLichMain(item, config, options) {
    const bookName = "Strength through suffering (of others)";
    const addedSpellNames = Spellbooks.bookDatabase[bookName].spellList;

    if(!item.actor?.name?.includes("Fearghas") || !addedSpellNames.includes(item.name)) return;
    const spellbook = item.actor.items.getName(bookName);
    if(!spellbook || !spellbook.system.equipped) return;
    await spellbook.use();
}