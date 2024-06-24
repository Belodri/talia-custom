export function init_spellbookLich() {
    CONFIG.DND5E.equipmentTypes.spellbook = CONFIG.DND5E.miscEquipmentTypes.spellbook = "Spellbook";
}

export function setup_spellbookLich() {
    Hooks.on("dnd5e.useItem", spellbookLichMain);
}

async function spellbookLichMain(item, config, options) {
    const bookName = "Strength through suffering (of others)";
    const addedSpellNames = [
        "Toll the Dead",
        "Armor of Agathys",
        "Wither and Bloom",
        "Vampiric Touch",
        "Shadow of Moil",
        "Magic Mirror"
    ];

    if(!item.actor?.name?.includes("Fearghas") || !addedSpellNames.includes(item.name)) return;
    const spellbook = item.actor.items.getName(bookName);
    if(!spellbook || !spellbook.system.equipped) return;
    await spellbook.use();
}