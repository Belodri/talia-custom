import ChatCardButtons from "../../../utils/chatCardButtons.mjs"

export default {
    register() {
        ChatCardButtons.register({
            itemName: "Step of the Wind",
            buttons: [{
                label: "Apply",
                callback: async ({actor}) => {
                    game.dfreds.effectInterface.addEffect({ effectName: "Dash", uuid: actor.uuid });
                    game.dfreds.effectInterface.addEffect({ effectName: "Dodge", uuid: actor.uuid });
                }
            }]
        })
    }
}
