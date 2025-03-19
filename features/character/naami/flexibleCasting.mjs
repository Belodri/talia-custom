import ChatCardButtons from "../../../utils/chatCardButtons.mjs"

export default {
    register() {
        ChatCardButtons.register({
            itemName: "Flexible Casting",
            buttons: [{
                label: "Create Spell Slots",
                callback: createSpellSlots,
            }, {
                label: "Create Sorcery Points",
                callback: createSorceryPoints,
            }]
        })
    }
}

const SLOT_TO_POINT_COST = {
    1: 2,
    2: 3,
    3: 5,
    4: 6,
    5: 7
};

const {DialogV2} = foundry.applications.api;
const {NumberField, StringField, DocumentUUIDField} = foundry.data.fields;


function getSorceryPointItem(actor) {
    const item = actor.items.getName("Sorcery Points");
    if(!item) throw new Error(`No item named "Sorcery Points" found on actor uuid "${actor.uuid}".`);

    return item;
}

async function createSpellSlots({actor}) {
    const item = getSorceryPointItem(actor);
    const uses = item.system.uses;

    const rollData = actor.getRollData();

    const spellSlotChoices = Object.entries(rollData.spells)
        .filter(([k, v]) => 
            k.startsWith("spell") 
            && v.level <= 5 
            && v.value < v.max
            && SLOT_TO_POINT_COST[v.level] <= uses.value
        )
        .reduce((acc, [k, v]) => {
            acc[k] = `${CONFIG.DND5E.spellLevels[v.level]} (${v.value}/${v.max} Slots) for ${SLOT_TO_POINT_COST[v.level]}/${uses.value} Sorcery Points`;
            return acc;
        }, {});

    const content = new StringField({
        label: "Choose Slot Level",
        choices: spellSlotChoices,
        required: true,
    }).toFormGroup({}, {name: "spellKey"}).outerHTML;

    const chosen = await DialogV2.prompt({
        window: { title: "Create Spell Slots" },
        content,
        modal: true,
        rejectClose: false,
        ok: {
            callback: (event, button) => new FormDataExtended(button.form).object
        }
    });
    if(!chosen) return;

    //TODO: finish
}

async function createSorceryPoints({actor}) {

}
