/*  UX
    - crafting UI window opened via macro
    - Drag & drop 1 spell from spellbook to window
    - select gemstone via dropdown menu
    - select spell level via dropdown menu
    - select type (cast or trigger)
        - if trigger, enter trigger condition into textbox
    - confirm

    - consume spell slot
    - roll scribing check
        - if unsuccessful: 
            - trigger WMS
        - if successful:
            # create spellgem
*/

/*  create spellgem

    create new item of type 'spellGem'      //CONFIG.DND5E.consumableTypes.spellGem = {label: "Spell Gem"};

    spellGem ->
        - set name ("Gem: Triggered Spell Name" OR "Gem: Cast Spell Name")  //idk
        - set description to include spell level, 

    selectedSpell.toObject -> 
        - fix values to scribe's spellcasting modifier

    preUseItem hook -> if type is spellGem -> return false and handle self
        - see Zhell's example
        - add excemption to WMS
*/

/*  DECISIONS
    - How to handle spellGem use?
        a) preUseItem hook
            + Least complicated; just return false if the type is a spell gem
            + Can't interact badly with WMS as that triggers on useItem hook.
*/

/*  NOTES
    - Cantrips can't be upcasted
*/


export function initSpellscribing() {
    CONFIG.DND5E.consumableTypes.spellGem = {label: "Spell Gem"};
}
export function setupSpellscribing() {
    
}
/*  NOTES

    Begin with setting up the part after the user pressed confirm (so I can do ui last);
        setup testing function that pretends the first part has already been done

*/
function generateTestingData(actor) {
    //testingData
    const chosenArgs = {
        chosenSpell: actor.items.find(i => i.type === "spell" && i.name === "Guiding Bolt"),
        chosenGem: actor.items.find(i => i.type === "loot" && i.system.type?.value === "gem"),   //test other gems by giving the actor only one gem at a time
        selectedSpellSlotLevel: 4,
        isTrigger: false
    }
    if(chosenArgs.isTrigger) {
        chosenArgs.triggerConditions = "Example text for trigger condition.";
    }
    return chosenArgs;
}

async function spellscribing(actor) {
    //get chosenArgs from UI later
    const chosenArgs = generateTestingData(actor);
    const dc = calculateDC(chosenArgs.chosenGem, chosenArgs.selectedSpellSlotLevel);
    await inscriptionCheckSuccessful(actor, dc) ? createSpellGem() : causeSurges(selectedSpellSlotLevel)
}

function causeSurges(selectedSpellSlotLevel) {

}

function createSpellGem(actor, chosenArgs) {

}

async function inscriptionCheckSuccessful(actor, dc) {
    //Inscription Check = Arcana Check + Caster Level + jeweler's tools proficiency bonus (0 if not proficient)
    //don't support multiclassing until it becomes relevant
    const options = {
        chooseModifier: false,
        flavor: `<b>Inscription Check - DC ${dc}</b>`,
        title: `Inscription Skill Check: ${actor.name}`,
        parts: ["@tools.jeweler.prof.flat", "@details.level"],
        targetValue: dc
    };
    const result = await actor.rollSkill("arc", options);
    return result.total >= result.targetValue ? true : false;
}

function calculateDC(chosenGem, selectedSpellSlotLevel) {
    //DC = Material DC + (Spell Slot Level * mult)
    const mult = 7;
    const priceToDC = {     //go by price in case I forget to set the correct rarity for one
        10: 35,     //common
        50: 30,     //uncommon
        100: 25,    //rare
        500: 20,    //very rare
        1000: 15,   //legendary
        5000: 10    //artifact
    };
    const chosenGemValue = chosenGem.system.price?.value || null;
    if(!chosenGemValue || !Object.keys(priceToDC).includes(chosenGemValue)) {
        ui.notifications.warn("This gem does not have a valid price.");
        return null;
    }
    const materialDC = priceToDC[chosenGemValue];
    return materialDC + (selectedSpellSlotLevel * mult);
}

//**********************************************************************************
//      Ideas and other random snippets
//**********************************************************************************

function getScribeableSpells(actor) {
    const spellItems = actor.items.filter(i => i.type === "spell");
    if(!spellItems.length) {
        ui.notifications.warn("This actor does not have any spells.");
        return null;
    }
    return spellItems;
}
const spellNames = ["Fireball", "Ray of Frost", "Shield"];
const spellsData = {
    "Fireball": {
        spellLevel: 3
    },
    "Ray of Frost": {
        spellLevel: 1
    },
    "Shield": {
        spellLevel: 1
    }
};
const options = spellNames.reduce((acc, spellName) => acc += `<option value="${spellName}">${spellName}</option>`,"");

const content = `
<form>
    <div class="form-group">
        <label>Choose a spell:</label>
        <div class="form-fields">
            <select name="chosenSpell" class="chosenSpell">${options}</select>
        </div>
    </div>
    <div class="form-group">
        <label>Choose a spell level</label>
        <div class="form-fields">
            <select class="chosenSpellLevel"></select>
        </div>
    </div>
    <div class="form-group">
        <label class="spellLevel" name="spellLevel">SpellLevel</label>
    </div>
</form>
`;

new Dialog({
    title: "Scribing",
    content: content,
    buttons: {
        done: {label: "done"},
    },    
    render: handleRender,
    rejectClose: false
}).render(true);

function handleRender(html) {
    html.on('change', 'select.chosenSpell', () => { 
        const selectedSpell = html.find("select.chosenSpell").val();
        const spellLevel = spellsData[selectedSpell].spellLevel;
    
        //change available options for spell slot level       
        const spellSlotsArray = [0,1,2,3,4,5,6,7,8,9]; 
        const validSpellSlots = spellSlotsArray.slice(spellLevel);
               
        const slotLevelOptions = validSpellSlots.reduce((acc, slotLevel) => acc += `<option value="${slotLevel}">${slotLevel}</option>`,"");

        
        const newText = `Spell Level: ${spellLevel}`;
        console.log(newText);
        html.find("label.spellLevel").text(newText);
        console.log(slotLevelOptions);
        html.find("select.chosenSpellLevel").html(slotLevelOptions);
    });
}

