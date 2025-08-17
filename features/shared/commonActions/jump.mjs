import ChatCardButtons from "../../../utils/chatCardButtons.mjs";
import Mover from "../../../utils/Mover.mjs";

export default {
    register() {
        ChatCardButtons.register({
            itemName: ["Jump", "Interceptor Rocket Straps"],
            buttons: [{
                label: "Jump",
                callback: jump
            }]
        });
    }
}

/**
 * Makes the token perform a jump action using the Mover utility.
 * @param {{token: Token}} param0
 * @returns {Promise<void>}
 */
async function jump({token}) {
    const jumpDist = token.actor.getRollData().talia.jumpDistance;
    const mover = new Mover(token)
        .setCrosshairOptions({
            "location.limitMaxRange": jumpDist
        });
    if(!await mover.getAndSetLocation()) return;
    await mover.executeMode("JUMP");
}
