import ChatCardButtons from "../../utils/chatCardButtons.mjs"

export default {
    register() {
        essence_tithe();
        rite_of_profane_power();
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

/**
 * Registers the ChatCardButton for Rite of Profane Power.
 * Lets the user choose a school of magic and then adds the active effect for that school.
 */
function rite_of_profane_power() {
    const ABILITY_CONFIG = {
        effectDurationInSeconds: 60 * 60 * 24,      //24h
    }

    ChatCardButtons.register({
        itemName: "Rite of Profane Power",
        buttons: [
            {
                label: "Choose School of Magic",
                callback: async ({actor, item}) => {
                    const schoolsCfg = CONFIG.DND5E.spellSchools;

                    //check rituals present
                    const mythicRank = actor.flags["talia-custom"]?.mythicRank ?? 0;
                    const maxRituals = Math.ceil(mythicRank / 2);
                    const presentRitualEffects = actor.appliedEffects.filter(e => e.origin === item.uuid) ?? [];
                    if(presentRitualEffects.length >= maxRituals && !game.user.isGM) {
                        ui.notifications.warn(`You can only benefit from up to ${maxRituals} ritual at mythic rank ${mythicRank}.`);
                        return;
                    }

                    //choose spell school
                    const chosenSchoolId = await (async() => {
                        const {DialogV2} = foundry.applications.api;
                        const {StringField} = foundry.data.fields;

                        const selectSpellSchoolGroup = new StringField({
                            label: "Select a School",
                            required: true,
                            choices: Object.entries(schoolsCfg).reduce((acc, [k, v]) => {
                                acc[k] = v.label;
                                return acc;
                            }, {}),
                        }).toFormGroup({}, {name: "schoolId"}).outerHTML;

                        const choice = await DialogV2.prompt({
                            window: { title: item.name },
                            content: selectSpellSchoolGroup,
                            rejectClose: false,
                            ok: {
                                callback: (event, button) => new FormDataExtended(button.form).object,
                            }
                        });
                        return choice?.schoolId ?? null;
                    })();
                    if(!chosenSchoolId) return;

                    //create effect data
                    const effectData = {
                        name: `Profane ${schoolsCfg[chosenSchoolId].label}`,
                        origin: item.uuid,
                        description: `<p>Whenever you cast a ${schoolsCfg[chosenSchoolId].label} spell by expending a spell slot, the spell is treated as if it were cast using a spell slot ${chosenSchoolId === "nec" ? "two levels" : "one level"} higher, up to a maximum of 9th level.</p>`,
                        flags: {
                            dae: { stackable: "noneName"}
                        },
                        duration: {
                            seconds: ABILITY_CONFIG.effectDurationInSeconds
                        },
                        img: item.img,
                        transfer: false,
                        changes: [
                            {
                                key: `flags.talia-custom.modifySpellLevel.spellSchools.${chosenSchoolId}`,
                                mode: 2,
                                priority: 20,
                                value: chosenSchoolId === "nec" ? 2 : 1
                            }
                        ]
                    };

                    //apply effect
                    await game.dfreds.effectInterface.addEffect({ effectData, uuid: actor.uuid });
                }
            }
        ]
    });
}
