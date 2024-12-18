import { MODULE } from "../../../scripts/constants.mjs";
import ChatCardButtons from "../../../utils/chatCardButtons.mjs";
import { Helpers } from "../../../utils/helpers.mjs";

export default {
    register() {
        ChatCardButtons.register({
            itemName: "Grapple",
            buttons: [
                {
                    label: "Roll Grapple",
                    callback: async ({actor, message}) => {
                        await _rollGrapple(actor, message);
                    }
                },
                {
                    label: "Contest Roll",
                    callback: async ({message}) => {
                        await _contestRoll(message);
                    }
                }
            ]
        });
    }
}

/**
 * Rolls the higher of acr/ath against the DC in the message flag.
 * If the message flag includes an actorUuid, that actor is used for the roll.
 * @param {ChatMessage} message     The button's chat message.
 * @returns {void}
 */
async function _contestRoll(message) {
    const flag = message.getFlag(MODULE.ID, "grappleFlag");
    if(!flag) {
        ui.notifications.warn("Please wait until the grappler has made their roll.");
        return;
    }

    const actor = flag.targetActorUuid ? fromUuidSync(flag.targetActorUuid) : canvas.tokens?.controlled?.[0]?.actor;
    if(!actor) return;

    const actorRD = actor.getRollData();
    const higherSkill = actorRD.skills.acr.total > actorRD.skills.ath.total ? "acr" : "ath";

    const options = {
        chooseModifier: false,
    };
    if( flag.isCritical ) options.fumble = 19;
    else if( flag.isFumble ) options.critical = 2;
    else options.targetValue = flag.grappleDC;

    const roll = await actor.rollSkill(higherSkill, options);

    if(Helpers.isRollSuccess(roll) === false) {
        await game.dice3d.waitFor3DAnimationByMessageID(game.messages.contents.at(-1).id);
        await actor.toggleStatusEffect("grappled", {active: true});
    }
}

/**
 * Rolls the athletics check and stores the result, along with the target (optionally), in the message flag.
 * @param {Actor} actor             The button's actor.
 * @param {ChatMessage} message     The button's chat message.
 * @returns {void}
 */
async function _rollGrapple(actor, message) {
    const athRoll = await actor.rollSkill("ath");
    if(typeof athRoll?.total !== "number") return;
    const flag = {
        grappleDC: athRoll.total,
        isFumble: athRoll.isFumble,
        isCritical: athRoll.isCritical,
        targetActorUuid: game.user.targets.first()?.actor?.uuid ?? null,
    }
    await message.setFlag(MODULE.ID, "grappleFlag", flag);
}
