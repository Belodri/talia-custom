/*  REQUIRES MODULE: 
    - Rideable
    - Requestor
*/

import { _foundryHelpers } from "../scripts/_foundryHelpers.mjs";
import { TaliaCustomAPI } from "../scripts/api.mjs";

export default {

    _onSetup() {
        TaliaCustomAPI.add({
            grappleItemMacro
        });

        Hooks.on("renderChatMessage", (msg, html, data) => {
            if(msg.flags?.["talia-custom"]?.hideFromPlayers && !game.user?.isGM) {
                html.hide();
                return;
            }
        })
    }
}

async function grappleItemMacro(actor, item, grabbingToken) {
    await _foundryHelpers.displayItemInfoOnly(item);    //display basic item card
    //wrap this all in a try/catch block so I can just throw errors where I want and handle the user notification in the catch
    try {
        const grabbedToken = getGrappleTarget();
        const targetActor = grabbedToken.actor;
        const actorRD = actor.getRollData();
        const targetRD = targetActor.getRollData();

        throwIfImmune(targetRD);
        throwIfInvalidSize(actorRD, targetRD);

        const actorRoll = await actor.rollSkill('ath', {flavor: "Grapple Contest"});



        //pass all relevant data to the target user
        await Requestor.request({
            title: "Grapple Contest",
            buttonData: [{
                label: `Roll`,
                scope: {
                    actorId: targetActor.id,    //to supply the requestor message with the correct actor
                    grabbingTokenId: grabbingToken.id,
                    grabbingRoll: actorRoll,
                    itemUuid: item.uuid,

                },
                command: async function(){
                    const grabbedActorRollData = actor.getRollData()



                    const higherSkill = rollData.skills.acr.total > rollData.skills.ath.total ? "acr" : "ath";
                    const roll = actor.rollSkill(higherSkill, {flavor: "Grapple Contest", event});
                    return roll;
                }
            }],
            img: item.img,
            description: `Contest the grapple attempt by ${actor.name}.`,
            speaker: ChatMessage.implementation.getSpeaker({actor: actor}),
            messageOptions: {
                whisper: getWhisperArray(grabbedToken),
                blind: true,
                flags: {
                    "talia-custom": {
                        hideFromPlayers: true
                    }
                }
            }
        });



        const higherSkill = targetRD.skills.acr.total > targetRD.skills.ath.total ? "acr" : "ath";
        const targetRoll = await targetActor.rollSkill(higherSkill, {flavor: "Grapple Contest", fast});

        if(!actorRoll) throw new Error("You have declined the roll or the roll was invalid.");
        if(!targetRoll) throw new Error("Your target has declined the roll or the roll was invalid.");
        const checkSuccessful = actorRoll.total > targetRoll.total;
        
        //hook to call other code
        //maybe let this mutate checkSuccessful in the future, no time for that at the moment
        Hooks.call("talia-custom.postGrappleCheck", checkSuccessful, grabbingToken, grabbedToken);
        if(!checkSuccessful) return;

        //if the grppling was successful, send a requestor message to the grapple target
        //the button on the msg then applies the correct grappled condition from the rideable module
        await Requestor.request({
            title: "Grapple",
            buttonData: [{
                scope: {
                    grabbedTokenId: grabbedToken.id, 
                    grabbingTokenId: grabbingToken.id,
                },
                label: "Apply",
                command: async function() {

                    const grabbedTokenDoc = canvas.tokens.placeables.find(vToken => vToken.id === grabbedTokenId).document;
                    const grabbingTokenDoc = canvas.tokens.placeables.find(vToken => vToken.id === grabbingTokenId).document;

                    //return false to cancel the grapple attempt
                    if( Hooks.call("talia-custom.preGrappleApply", grabbedTokenDoc, grabbingTokenDoc) === false ) return;
                    await game.Rideable.Mount([grabbedTokenDoc], grabbingTokenDoc, {Grappled: true});
                    Hooks.call("talia-custom.postGrappleApply", grabbedTokenDoc, grabbingTokenDoc);
                }
            }],
            img: item.img,
            description: `Apply Grappled condition to ${targetActor.name}.`,
            speaker: ChatMessage.implementation.getSpeaker({actor: actor}),
            messageOptions: {
                whisper: getWhisperArray(grabbedToken),
                blind: true,
                flags: {
                    "talia-custom": {
                        hideFromPlayers: true
                    }
                }
            }
        });
    } catch (error) {
        ui.notifications.error(error.message);
        return;
    }
}



//gets an array of user ids of all the owners of the token
function getWhisperArray(token) {
    let whisperSet =  new Set();
    game.users.forEach(user => {
        if(token.document.testUserPermission(user, "OWNER")) whisperSet.add(user.id)
    });
    return Array.from(whisperSet);
}



/**
 * Throws if the target is at most one size larger than actor (including bonuses)
 * @param {*} actorRD 
 * @param {*} targetRD 
 */
function throwIfInvalidSize(actorRD, targetRD) {
    //get allowed sizes from config. //['tiny', 'sm', 'med', 'lg', 'huge', 'grg']
    const actorSizes = Object.keys(CONFIG.DND5E.actorSizes);

    const actorSizeIndex = actorSizes.indexOf(actorRD.traits.size);
    const targetSizeIndex = actorSizes.indexOf(targetRD.traits.size);

    //factor in flag "talia-custom.grappleSizeBonus"
    const grappleSizeBonus = actorRD.flags?.["talia-custom"]?.grappleSizeBonus ? actorRD.flags?.["talia-custom"]?.grappleSizeBonus : 0;

    //factor in flag "dnd5e.powerfulBuild", add +1 to bonus if it's enabled
    const powerfulBuildBonus = actorRD.flags?.dnd5e?.powerfulBuild ? 1 : 0;

    //check if target is at most one size larger than actor (including bonus)
    if(targetSizeIndex > actorSizeIndex + grappleSizeBonus + powerfulBuildBonus + 1) {
        const maxSizeShort = actorSizes[actorSizeIndex + grapplingSizeBonus + 1];
        const maxSize = CONFIG.DND5E.actorSizes[maxSizeShort].label.toLowerCase();
        throw new Error(`You can only grapple creatures of ${maxSize} size or smaller.`);
    }
}

//throws an error if actor's rollData has them be immune to being grappled
function throwIfImmune(rollData) {
    if(rollData.traits.ci.value.has("grappled")) throw new Error(`This creature is immune to being grappled.`);
}

function getGrappleTarget() {
    const numberOfTargets = game.user.targets.size;
    if(numberOfTargets !== 1) {
        throw new Error(`You need to target exactly one token.`);
    }
    return game.user.targets.first();
}