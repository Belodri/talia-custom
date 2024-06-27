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


import { _foundryHelpers } from "../scripts/_foundryHelpers.mjs";
import { TaliaCustomAPI } from "../scripts/api.mjs";
import { MODULE } from "../scripts/constants.mjs";
import { Surge } from "../wildMagic/wildMagic.mjs";
import { createSpellGem } from "./SpellGem.mjs";
import { ScribingUI } from "./scribingUi.mjs";

export default {
    _onInit() {
        CONFIG.DND5E.consumableTypes.spellGem = {
            label: "Spell Gem",
            subtypes: {
                eternal: "Eternal"
            }
        };
        CONFIG.DND5E.abilityActivationTypes.trigger = "Trigger";
    },
    _onSetup() {
        TaliaCustomAPI.add({spellscribing: {showUI}});
    }
}

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
    globalThis[MODULE.globalThisName].spellscribing = {
        showUI
    }
}

/**
 * @typedef {Object} chosenArgs 
 * @property {Item5e} chosenSpell
 * @property {Item5e} chosenGem
 * @property {number} selectedSpellSlotLevel
 * @property {boolean} isTrigger
 * @property {string} [triggerConditions]
 */


export function showUI(actor) {
    new ScribingUI(actor).render(true);
}



/**
 * 
 * @param {Actor5e} actor 
 * @param {chosenArgs} chosenArgs 
 * @returns {Promise<boolean|string>} resolves to true if the scribing was successful, false if not, "surge" if a surge was caused
 */
export async function spellscribing(actor, chosenArgs) {

    //test chosenArgs
    if(!argsValid(actor, chosenArgs)) return false;
    
    
    const dc = calculateDC(chosenArgs.chosenGem, chosenArgs.selectedSpellSlotLevel);




    if(!await inscriptionCheckSuccessful(actor, dc)) {
        causeSurges(actor, chosenArgs);
        return "surge";
    }
    const resultingItem = await createSpellGem(actor, chosenArgs);

    //consume spell slot
    await consumeSpellSlot(chosenArgs);
    //consume gem item
    await _foundryHelpers.consumeItem(chosenArgs.chosenGem, 1);

    ui.notifications.info(`Successfully crafted ${resultingItem.name}`);
    return true;
}

async function consumeSpellSlot(chosenArgs) {
    if(chosenArgs.selectedSpellSlotLevel === 0) return;

    const config = {consumeSpellSlot: true, slotLevel: `spell${chosenArgs.selectedSpellSlotLevel}`};
    const options = {configureDialog: false};
    await chosenArgs.chosenSpell.consume(chosenArgs.chosenSpell, config, options);
}


function argsValid(actor, chosenArgs) {
    console.log({
        actor: actor, 
        chosenArgs: chosenArgs
    });
    if(!chosenArgs.chosenSpell) {
        ui.notifications.warn("You need to choose a spell to scribe.");
        return false;
    }
    if(!chosenArgs.chosenGem) {
        ui.notifications.warn("You need to choose a gem to scribe.");
        return false;
    }
    if(["atwill", "innate", "pact"].includes(chosenArgs.chosenSpell.system.preparation.mode)) {
        /*
            See more info here: https://rpg.stackexchange.com/questions/199266/whats-the-difference-between-innate-and-at-will-spell-casting-in-dd-5e

            //add support for pact later if needed
            disallow:
            - "atwill", "innate", "pact"
        */
        ui.notifications.warn(`Spells of type: "${chosenSpell.system.preparation.mode}" are not supported.`);
        return false;
    }

    if(chosenArgs.isTrigger && chosenArgs.triggerConditions === "") {
        ui.notifications.warn(`You need to define a trigger condition when scribing a triggered gem.`);
        return false;
    }
    if(!isValid_spellSlot(actor, chosenArgs)) {
        ui.notifications.warn(`You need to choose an unspent spell slot.`);
        return false;
    }
    return true;
}


function isValid_spellSlot(actor, chosenArgs) {
    const rollData = actor.getRollData();
    console.log({
        actor: actor, 
        chosenArgs: chosenArgs,
        rolLData: rollData
    });
    
    let actorSpellSlot = null;
    if(typeof chosenArgs.selectedSpellSlotLevel === "number") {
        if(chosenArgs.selectedSpellSlotLevel === 0) return true;
        const spellKey = `spell${chosenArgs.selectedSpellSlotLevel}`;
        actorSpellSlot = rollData.spells[spellKey].value;
    } else if (typeof chosenArgs.selectedSpellSlotLevel === "string") {
        actorSpellSlot =  rollData.spells.pact.value;
    }

    if(typeof actorSpellSlot === "number" && actorSpellSlot >= 1) return true;
    else return false;
}


/**
 * 
 * @param {Actor5e} actor 
 * @param {chosenArgs} chosenArgs 
 */
async function causeSurges(actor, chosenArgs) {   //do this later as it requires reworking the WMS stuff
    const allowedSeverities = {
        minor: true,
        moderate: true,
        severe: true
    };
    let amount = 1;

    if(chosenArgs.selectedSpellSlotLevel >= 7) {
        allowedSeverities.minor = false;
        allowedSeverities.moderate = false;
        amount = 3;
    } else if (chosenArgs.selectedSpellSlotLevel >= 4) {
        allowedSeverities.minor = false;
        amount = 2;
    }

    for(let i = 0; i < amount; i++) {
        const surge = await Surge.causeSurge(allowedSeverities);
        await Surge.createChatMessage(surge, actor);
    }
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

    //check for success
    if((result.total >= result.options.targetValue && !result.isFumble) || result.isCritical) {
        return true;
    } else {
        //this will eventually resolve to either true or false so it's safe to return to the UI
        return await handleInspirations(actor, dc);
    }
}

/**
 * If the actor's owner has inspirations it asks if they wish to spend them.
 * Should they choose so, it subtracts an inspiration and requests another roll.
 * @param {Actor5e} actor 
 * @param {number} dc 
 * @returns {Promise<false|inscriptionCheckSuccessful} 
 */
async function handleInspirations(actor, dc) {
    const soInspired = {
        scope: "so-inspired",
        flagKey: "inspirationCount"
    };

    const actorOwner = game.users.find(u => u.character?.uuid === actor.uuid);
    if(!actorOwner) return false;

    const currentInspirationCount =  actorOwner.getFlag(soInspired.scope, soInspired.flagKey);
    console.log({currentInspirationCount});
    if(!currentInspirationCount) return false;   //returns early if it's 0 or undefined
    
    const spendInspiration = await Dialog.confirm({
        title: "Inscription check",
        content: `Do you want to spend one inspiration to reroll this check?`,
        yes: () => true,
        no: () => false,
        defaultYes: false,
    });

    if(!spendInspiration) return false;
    else {
        actorOwner.setFlag(soInspired.scope, soInspired.flagKey, currentInspirationCount - 1);
        ChatMessage.create({
            user: actorOwner,
            flavor: actor.name + " has used a point of inspiration!",
        });
        if(actor.sheet.rendered) {
            actor.sheet.render();
        }
        return await inscriptionCheckSuccessful(actor, dc);
    }
}

export function calculateDC(chosenGem, selectedSpellSlotLevel) {
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