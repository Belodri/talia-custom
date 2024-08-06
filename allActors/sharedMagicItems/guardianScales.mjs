export default {
    _onSetup() {
        Hooks.on("preUpdateItem", (item, change) => {
            if(change.system?.equipped === true) {
                if(!allScaleItems.includes(item.name)) return;

                //check if any other scale items are currently equipped and if so, give a warning and return false to cancel the equip update
                if(item.actor.itemTypes.find(i => i.system.equipped === true && allScaleItems.includes(i.name))) {
                    ui.notifications.info("You can equip no more than one Guardian Scale at once.");
                    return false;
                }
                return guardianScalesCreate(item)
            } else if (change.system?.equipped === false) {
                if(!allScaleItems.includes(item.name)) return;
                return guardianScalesDelete(item)
            }
        });
    }
}

const allScaleItems = [
"Guardian Scale of Abjuration",
"Guardian Scale of Conjuration",
"Guardian Scale of Divination",
"Guardian Scale of Enchantment",
"Guardian Scale of Evocation",
"Guardian Scale of Illusion",
"Guardian Scale of Necromancy",
"Guardian Scale of Transmutation",
];

async function guardianScalesDelete(item) {
    //if it's a different item, it should just return
    const spellNames = getSpellNames(item.name);
    if(!spellNames) return;

    //find spell items with matching uuid flags and get their ids
    const foundItemIds = item.actor.itemTypes.spell
        .filter(i => i.flags["talia-custom"]?.grantedByUuid === item.uuid)
        .map(i => i.id);
    
    //delete items
    await Item.deleteDocuments(foundItemIds, {parent: item.actor});

}

async function guardianScalesCreate(item) {
    //if it's a different item, it should just return
    const spellNames = getSpellNames(item.name);
    if(!spellNames) return;

    const pack = game.packs.get("talia-custom.customItems");
    const spellDocs = await pack.getDocuments({name__in: Object.values(spellNames)});
    const spellObj = spellDocs.map(i => i.toObject());


    const rollData = item.actor.getRollData();
    const saveDC = 12 + rollData.attributes.prof;
    const spellAttack = 4 + rollData.attributes.prof;


    //alter each spell object
    for(const obj of spellObj) {
        const isCantrip = obj.system.level === 0 ? true : false;
        const changes = {
            flags: {
                "talia-custom": {
                    grantedByUuid: item.uuid,
                }
            },
            system: {
                activation: {
                    type: isCantrip ? "bonus" : obj.system.activation.type,     //set cantrips to bonus action
                },
                attack: {
                    flat: true,
                    bonus: spellAttack,
                },
                preparation: {
                    mode: "innate"
                },
                properties: ["wild", "mgc"],
                save: {
                    sacaling: "flat",
                    dc: saveDC,
                },
                consume: {
                    amount: isCantrip ? null : 1,
                    scale: false,
                    target: isCantrip ? null : item.id,
                    type: isCantrip ? "" : "charges",
                },
                materials: {
                    consumed: false,
                    cost: 0,
                    supply: 0,
                    value: ""
                }
            },
        };
        foundry.utils.mergeObject(obj, changes);
    }

    //creat the items on the actor
    await Item.createDocuments(spellObj, {parent: item.actor});
}



function getSpellNames(itemName) {
    const spellNames = {
        cantrip: "",
        spell: "",
    }
    switch (itemName) {
        case "Guardian Scale of Abjuration":
            spellNames.cantrip = "Resistance";
            spellNames.spell = "Death Ward";
            break;
        
        case "Guardian Scale of Conjuration":
            spellNames.cantrip = "Mage Hand";
            spellNames.spell = "Dimension Door";
            break;
        case "Guardian Scale of Divination":
            spellNames.cantrip = "Revelation Through Battle";
            spellNames.spell = "Arcane Eye";
            break;
        case "Guardian Scale of Enchantment":
            spellNames.cantrip = "Vicious Mockery";
            spellNames.spell = "Raulothim's Psychic Lance";
            break;
        case "Guardian Scale of Evocation":
            spellNames.cantrip = "Sacred Flame";
            spellNames.spell = "Fire Shield";
            break;
        case "Guardian Scale of Illusion":
            spellNames.cantrip = "Minor Illusion";
            spellNames.spell = "Phantasmal Horror";
            break;
        case "Guardian Scale of Necromancy":
            spellNames.cantrip = "Toll the Dead";
            spellNames.spell = "Blight";
            break;
        case "Guardian Scale of Transmutation":
            spellNames.cantrip = "Thorn Whip";
            spellNames.spell = "Guardian of Nature";
            break;
    }
    if(spellNames.cantrip === "" || spellNames.spell === "") return;
    else return spellNames;
}