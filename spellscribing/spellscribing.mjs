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

/*  DECISIONS
    - Rules decisions:
        - Limit the amount of triggered gems one can have active at the same time?
            a) Yes
                + The trigger conditions could be basically whatever.

                Idea:
                Limit of 1 triggered gem active at any time.
                Can swap them on your turn via free item interaction.
                    Maybe increase the limit depending on character level?

        
*/

/*  ADD RULES
    - Regular Spell Gems are destroyed upon use or upon trying to write another spell into them
    - Eternal Spell Gems are not destroyed upon use or upon trying to write another spell into them

    - Triggers: Specify that triggers can only be things 'outside' and can only activate AFTER something has happened
        example: 
            "This spell triggers after I get hit in combat." - valid
            "This spell triggers before I get hit in combat." - invalid

            "This spell triggers when an enemy casts a spell." - valid
            "This spell triggers when I think an enemy would cast a spell." - invalid

            "Trigger if: I think about the trigger" - technically valid but would go off at a random point because how are you gonna keep yourself from even thinking about the trigger?

            other valid examples:
            "Trigger if: I squeeze the spell gem "
*/



/*  --- TODO ---

    - excemption to WMS
    - workaround for eternal spell gem
    - ui/ux
    - macro for creating custom spellgems (choose bonus/save/casterlevel)
    - consume spell slot
    (kinda done) - Notification to let user know they crafted something  (maybe via message, not sure)
    (done) - wait for 3D roll to finish
*/

/*  UI / UX
    - When selecting a cantrip, deactivate the section for selecting a spell slot level.
*/

/*  Data Validation
    - Cantrips cannot be upcasted
*/


import { MODULE } from "../scripts/constants.mjs";
import { createSpellGem } from "./SpellGem.mjs";
import { ScribingUI } from "./scribingUi.mjs";

export function initSpellscribing() {
    CONFIG.DND5E.consumableTypes.spellGem = {
        label: "Spell Gem",
        subtypes: {
            eternal: "Eternal"
        }
    };
    CONFIG.DND5E.abilityActivationTypes.trigger = "Trigger";
}
export function setupSpellscribing() {
    globalThis[MODULE.globalThisName] = {
        spellscribing,
        testUi
    }
}
/*  NOTES

    Begin with setting up the part after the user pressed confirm (so I can do ui last);
        setup testing function that pretends the first part has already been done

*/
/**
 * @typedef {Object} chosenArgs 
 * @property {Item5e} chosenSpell
 * @property {Item5e} chosenGem
 * @property {number} selectedSpellSlotLevel
 * @property {boolean} isTrigger
 * @property {string} [triggerConditions]
 */
function generateTestingData(actor) {
    //testingData
    const chosenArgs = {
        chosenSpell: actor.items.find(i => i.type === "spell" && i.name === "Guiding Bolt"),
        chosenGem: actor.items.find(i => i.type === "loot" && i.system.type?.value === "gem"),   //test other gems by giving the actor only one gem at a time
        selectedSpellSlotLevel: 5,
        isTrigger: false
    }
    if(chosenArgs.isTrigger) {
        chosenArgs.triggerConditions = "Example text for trigger condition.";
    }
    return chosenArgs;
}

export async function testUi(actor) {
    new ScribingUI(actor).render(true);
}

/*  INTERFACE
    - test if actor has gemstones
    
    call scribing ui and pass actor
*/


export async function spellscribing(actor) {
    //get chosenArgs from UI later
    const chosenArgs = generateTestingData(actor);
    const dc = calculateDC(chosenArgs.chosenGem, chosenArgs.selectedSpellSlotLevel);
    if(!await inscriptionCheckSuccessful(actor, dc)) {
        causeSurges(actor, chosenArgs);
        return;
    }
    const resultingItem = await createSpellGem(actor, chosenArgs);
    ui.notifications.info(`Successfully crafted ${resultingItem.name}`);
}


/**
 * 
 * @param {Actor5e} actor 
 * @param {chosenArgs} chosenArgs 
 */
function causeSurges(actor, chosenArgs) {   //do this later as it requires reworking the WMS stuff
    ui.notifications.warn("This causes one or more surges! Don't forget to implement that!");
}

async function inscriptionCheckSuccessful(actor, dc) {
    //Inscription Check = Arcana Check + Caster Level + jeweler's tools proficiency bonus (0 if not proficient)
    //don't support multiclassing until it becomes relevant
    const options = {
        chooseModifier: false,
        flavor: `<b>Inscription Check - DC ${dc}</b>`,
        title: `Inscription Skill Check: ${actor.name}`,
        parts: ["@tools.jeweler.prof.flat", "@details.level"],
        targetValue: dc,
        chatMessage: false,
    };
    const result = await actor.rollSkill("arc", options);

    //print message manually to be able to await the dice so nice animation
    const messageData = {
        speaker: options.speaker || ChatMessage.getSpeaker({actor: actor}),
        "flags.dnd5e.roll": {type: "skill", skillId: "arc"}
    }
    const msg = await result.toMessage(messageData);
    await game.dice3d.waitFor3DAnimationByMessageID(msg.id);

    if((result.total >= result.options.targetValue && !result.isFumble) || result.isCritical) return true;
    else return false;
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
    if(!chosenGemValue || !priceToDC[chosenGemValue]) {
        ui.notifications.warn("This gem does not have a valid price.");
        return null;
    }
    const materialDC = priceToDC[chosenGemValue];
    return materialDC + (selectedSpellSlotLevel * mult);
}

//**********************************************************************************
//      Ideas and other random snippets
//**********************************************************************************

/*

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

*/