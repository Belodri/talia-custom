import ChatCardButtons from "../../utils/chatCardButtons.mjs"

export default {
    register() {
        essence_tithe();
    }
}

/**
 * Registers the ChatCardButton for Essence Tithe.
 * When clicked, asks for user input for component cost in gp and then rolls the damage as set in the CONFIG object.
 */
function essence_tithe() {
    const CONFIG = {    // formula = 1d10 per 25gp
        diceFaces: 10,
        diceNumPerCostStep: 1,
        costStep: 25,
    };

    ChatCardButtons.register({
        itemName: "Essence Tithe",
        buttons:[
            {
                label: "Roll Tithe",
                callback: async({event, item, speaker}) => {
                    const {DialogV2} = foundry.applications.api;
                    const {NumberField} = foundry.data.fields;

                    const enterGPcostField = new NumberField({
                        label: `Cost`,
                        hint: "The cost of the component in gold pieces.",
                        required: true,
                        min: 0,
                        integer: true,
                        positive: true,
                        initial: 0,
                    }).toFormGroup({},{name: "cost"}).outerHTML;

                    const result = await DialogV2.prompt({
                        window: { title: item.name },
                        content: enterGPcostField,
                        rejectClose: false,
                        ok: {
                            callback: (event, button) => new FormDataExtended(button.form).object,
                        }
                    });
                    if(!result?.cost) return;

                    //round up to next multiple of costStep
                    const roundUpCost = Math.ceil(result.cost / CONFIG.costStep) * CONFIG.costStep;
                    const diceNum = Math.max(
                        ( roundUpCost / CONFIG.costStep * CONFIG.diceNumPerCostStep ),
                        CONFIG.diceNumPerCostStep
                    );
                    const formula = `${diceNum}d${CONFIG.diceFaces}`;

                    await dnd5e.dice.damageRoll({
                        parts: [formula],
                        allowCritical: false,
                        fastForward: true,
                        messageData: { 
                            speaker,
                        },
                        flavor: item.name,
                        event
                    });
                }
            }
        ]
    })
}
