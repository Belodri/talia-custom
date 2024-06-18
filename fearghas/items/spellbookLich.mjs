const bookName = "Strength through suffering (of others)";
const addedSpellNames = [
    "Toll the Dead",
    "Armor of Agathys",
    "Wither and Bloom",
    "Vampiric Touch",
    "Shadow of Moil",
    "Magic Mirror"
];

export function init_spellbookLich() {
    CONFIG.DND5E.equipmentTypes.spellbook = CONFIG.DND5E.miscEquipmentTypes.spellbook = "Spellbook";
}

export function setup_spellbookLich() {
    Hooks.on("dnd5e.useItem", spellbookLichMain);
}

async function spellbookLichMain(item, config, options) {
    if(!item.actor?.name?.includes("Fearghas") || !addedSpellNames.includes(item.name)) return;

    const spellLevel = options.flags.dnd5e.use.spellLevel;
    const diceNum = Math.max(spellLevel, 1);

    const damage = `${diceNum}d4`;
    const parts = [[damage,"psychic"]];

    const spellbook = item.actor.items.find(i => i.name === bookName);
    await spellbook.update({"system.damage.parts": parts});

    return;
    //add code for applying damage later

    await spellbook.use();
    console.log(spellbook);
}