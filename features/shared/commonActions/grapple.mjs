/*  REQUIRES MODULE: 
    - Rideable
    - Requestor
    - dFred's Convenient Effects
*/

import { TaliaCustomAPI } from "../../../scripts/api.mjs";
import { MODULE } from "../../../scripts/constants.mjs";

export default {
    register() {
        TaliaCustomAPI.add({grapple: grappleItemMacro}, "ItemMacros");
        Hooks.once("setup", () => {
            const fields = [];
            fields.push("flags.talia-custom.ignoreGrappleSizeLimit");
            DAE.addAutoFields(fields);
        });
    }
}

/**
 * 
 * @param {Item} item 
 * @param {Token} actorToken 
 * @returns {void}
 */
async function grappleItemMacro(item, actorToken) {
    if(actorToken.actor.effects.find(e => e.name === "Grappling")) {
        ui.notifications.warn("You can only grapple one target at a time.");
        return null;
    }

    //make sure exactly 1 token is targeted
    if(game.user.targets.size !== 1) {
        ui.notifications.warn("You need to select exactly one target.");
        return null;
    }
    const targetToken = game.user.targets.first();

    //display the item card before proceeding
    await item.displayCard();

    const targetRD = targetToken.actor.getRollData();
    const actorRD = actorToken.actor.getRollData();

    //check immunity
    if(targetRD.traits.ci.value.has("grappled")) {
        ui.notifications.warn("This creature is immune to being grappled.");
        return null;
    }

    //check size diff
    const grappleSizeIndex = (rd) => {
        const baseSizeIndex = ['tiny', 'sm', 'med', 'lg', 'huge', 'grg'].indexOf(rd.traits.size);
        const grappleSizeBonus = rd.flags?.["talia-custom"]?.grappleSizeBonus ? rd.flags?.["talia-custom"]?.grappleSizeBonus : 0;   //factor in flag "talia-custom.grappleSizeBonus"
        const powerfulBuildBonus = rd.flags?.dnd5e?.powerfulBuild ? 1 : 0;  //factor in flag "dnd5e.powerfulBuild", add +1 to bonus if it's enabled
        return baseSizeIndex + grappleSizeBonus + powerfulBuildBonus;
    }
    const actorGrappleSizeIndex = grappleSizeIndex(actorRD);
    const targetGrappleSizeIndex = grappleSizeIndex(targetRD);
    if((targetGrappleSizeIndex > actorGrappleSizeIndex + 1) && actorRD.getFlag(MODULE.ID, "ignoreGrappleSizeLimit") !== 1) {
        ui.notifications.warn("This creature is too big for you to grapple.");
        return null;
    }

    //get message data stuff
    const speakerObj = ChatMessage.implementation.getSpeaker({actor: actorToken.actor});
    const whisperArr = (() => {
        const tSet = new Set();
        game.users.forEach(user => {
            if(targetToken.document.testUserPermission(user, "OWNER")) tSet.add(user.id)
        });
        return Array.from(tSet);
    })();

    //roll ath check
    const athRoll = await actorToken.actor.rollSkill("ath");
    await game.dice3d.waitFor3DAnimationByMessageID(game.messages.contents.at(-1).id);

    //request apply grapple
    await Requestor.request({
        title: " ",
        img: false,
        buttonData: [{
            label: "Apply Grapple",
            scope: {
                actorTokenId: actorToken.id,
                targetTokenId: targetToken.id,
                actorGrSize: actorGrappleSizeIndex,
                targetGrSize: targetGrappleSizeIndex 
            },
            command: async function(){
                const uuid = canvas.tokens.get(actorTokenId).actor.uuid;
                const effectData = game.dfreds.effectInterface.findEffect({effectName: "Grappling"}).toObject();

                //slow happens if the target is no more than 1 size smaller than the actor
                if(targetGrSize >= actorGrSize - 1) {   
                    effectData.changes = [{ key: "system.attributes.movement.all", value: "* 0.5", mode: 0, priority: 90 }];
                }
                
                await game.dfreds.effectInterface.addEffect({effectData, uuid});
                   
                //effect macro on grappling condition then checks the token doc flags for which tokens are grappled and removes the grappled condition from them
                game.Rideable.MountbyID([targetTokenId], actorTokenId, {Grappled: true})
            }
        }],
        speaker: speakerObj,
        whisper: whisperArr,
    })

    //request roll
    const higherSkill = targetRD.skills.acr.total > targetRD.skills.ath.total ? "acr" : "ath";
    await TaliaCustom.Helpers.requestRoll({
        type: "skill",
        ability: higherSkill === "acr" ? "dex" : "str",
        skill: higherSkill, 
        dc: athRoll.total, 
        hideDC: false, 
        messageOptions: {
            speaker: speakerObj,
            whisper: whisperArr,
            flavor: "Roll Request: Grapple Contest"
        }
    });
}
