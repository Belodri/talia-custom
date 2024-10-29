/**
 * @typedef {Object} chosenArgs 
 * @property {Item5e} chosenSpell
 * @property {Item5e} chosenGem
 * @property {number} selectedSpellSlotLevel
 * @property {boolean} isTrigger
 * @property {string} [triggerConditions]
 */

export async function createSpellGem(actor, chosenArgs) {
    const changes = getChanges(actor, chosenArgs);
    
    const createScrollConfig = {dialog: false, explanation: "none", level: chosenArgs.selectedSpellSlotLevel};
    const scroll = await getDocumentClass("Item").createScrollFromSpell(chosenArgs.chosenSpell, changes, createScrollConfig);
    const workingObj = scroll.toObject();

    //fixes after creating the scroll but before creating the actual spell gem on the actor
    foundry.utils.mergeObject(workingObj, {
        "system.description.value": `${chosenArgs.isTrigger ? `<p><strong>Trigger: </strong>${chosenArgs.triggerConditions}</p><hr>` : ""}${workingObj.system.description.value}`,
        "system.properties": ["mgc"],
    });
    
    const [newItem] = await actor.createEmbeddedDocuments("Item", [workingObj]);
    return newItem;
}

function getChanges(actor, chosenArgs) {
    const rollData = actor.getRollData();

    //get spell level level for name (0th, 1st, 2nd,...9th)
    const titleSpellLevelString = 
        chosenArgs.selectedSpellSlotLevel === 1 ? " - 1st" :
        chosenArgs.selectedSpellSlotLevel === 2 ? " - 2nd" :
        chosenArgs.selectedSpellSlotLevel === 3 ? " - 3rd" :
        ` - ${chosenArgs.selectedSpellSlotLevel}th`;

    //general changes first
    const name = chosenArgs.isTrigger ? `Triggered: ${chosenArgs.chosenSpell.name}${titleSpellLevelString}` : `Activated: ${chosenArgs.chosenSpell.name}${titleSpellLevelString}`;
    const changes = {
        "flags.tidy5e-sheet.section": "Spell Gem",
        "img": chosenArgs.chosenGem.img,
        "name": name,
        "system.type.label": "Spell Gem",
        "system.type.value": "spellGem",
        "system.rarity": chosenArgs.chosenGem.system.rarity,
        "system.price.value": chosenArgs.chosenGem.system.price.value,
        "system.weight.value": chosenArgs.chosenGem.system.weight.value,
    };

    //attack changes
    if(["mwak", "msak", "rwak", "rsak"].includes(chosenArgs.chosenSpell.system.actionType)) {
        //temporary or other bonuses to spell mod, attack rolls, or proficiency are not included
        changes["system.attack.bonus"] = rollData.attributes.spellmod + rollData.attributes.prof;
    }
    //save changes
    if(chosenArgs.chosenSpell.system.save.ability) {
        //temporary or other bonuses to spell mod, attack rolls, or proficiency are not included
        changes["system.save.dc"] = rollData.attributes.spellmod + rollData.attributes.prof + 8;
        //changes["system.save.dc"] = rollData.attributes.spelldc;  --- this would include temporary or passive bonuses as well
        changes["system.save.scaling"] = "flat";
    }

    return changes;
}