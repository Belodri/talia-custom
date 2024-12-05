import { MODULE } from "../../scripts/constants.mjs";
import ChatCardButtons from "../../utils/chatCardButtons.mjs";

export default {
    register() {
        unflinching();
        legendaryVigor();
        godbreaker();
    }
}

/**
 * Legendary Vigor
 *
 * - Whenever you make a Strength or Constitution ability check or saving throw, you treat a d20 roll of 19 or lower as a 20.
 * - When using the Grapple action, you can grapple creatures of any size as if they were no more than one size larger than you.
 * - The damage of your melee weapon attacks against structures and objects increases by a factor of 10 per Mythic Rank.
 * - The maximum distance you can jump and the distance you can shove a creature when you use the Shove action both increase by a factor of 10 per mythic rank.
 * - Your carrying capacity and the weight you can push, drag, or lift increases by a factor of 10 per Mythic Rank.
 * 
 * Immediately after this effect ends, the grappled condition ends on any creature grappled by you if its size exceeds the maximum size you can grapple.
 */
function legendaryVigor(requiredMythicRank = 1) {

    const VALID = {
        abilityIds: ["str", "con"],
        skillIds: Object.entries(CONFIG.DND5E.skills)
            .filter(([_, v]) => v.ability === "str" || v.ability === "con")
            .map(([k, _]) => k),
    }

    const getMythicRank = (actor) => {
        return actor.getFlag(MODULE.ID, "mythicRank") ?? 0;
    }

    const passesFilter = (actor) => {
        //make sure it only triggers for rolls made by actors with the legendary vigor AE active
        return actor.appliedEffects.some(e => e.name === "Legendary Vigor" && e.active && !e.isSuppressed);
    }

    const modifyRoll = (rollData) => {  // mutates rollData
        rollData.data.talia ??= {};
        rollData.data.talia.legendaryVigor = true;
    };

    /*
        - Whenever you make a Strength or Constitution ability check or saving throw, you treat a d20 roll of 19 or lower as a 20.
    */

    Hooks.on("dnd5e.preRollSkill", (actor, rollData, skillId) => {
        if(VALID.skillIds.includes(skillId) && passesFilter(actor)) modifyRoll(rollData);
    });

    Hooks.on("dnd5e.preRollAbilityTest", (actor, rollData, abilityId) => {
        if(VALID.abilityIds.includes(abilityId) && passesFilter(actor)) modifyRoll(rollData);
    });

    Hooks.on("dnd5e.preRollAbilitySave", (actor, rollData, abilityId) => {
        if(VALID.abilityIds.includes(abilityId) && passesFilter(actor)) modifyRoll(rollData);
    });

    Hooks.on("talia_postConfigureD20Modifiers", (d20Roll) => {
        //make sure it only triggers for rolls made by actors with the legendary vigor AE active
        if(!d20Roll.data?.talia?.legendaryVigor) return;
        const d20 = d20Roll.terms[0];
        d20.modifiers.push("min20");
    });

    /*
        - The maximum distance you can jump and the distance you can shove a creature when you use the Shove action both increase by a factor of 10 per mythic rank.
    */
    Hooks.on("talia_postCalculateJumpDistance", (actor, distanceObj) => {
        if(passesFilter(actor)) {
            const mr = getMythicRank(actor);
            if(mr) distanceObj.newValue = distanceObj.rounded * 10 * mr;
        }
    });
    // note: Not yet implemented.
    Hooks.on("talia_postCalculateShoveDistance", (actor, distanceObj) => {
        if(passesFilter(actor)) {
            const mr = getMythicRank(actor);
            if(mr) distanceObj.newValue = distanceObj.rounded * 10 * mr;
        }
    });
}

/**
 * Whenever you take damage from a critical hit, you immediately regain 2d12 hit points per mythic rank.
 */
function unflinching(requiredMythicRank = 2) {
    Hooks.on("dnd5e.applyDamage", async (actor, amount, options) => {
        //check if the damage was was damage or healing
        if(amount <= 0) return;

        //check if the actor has the unflinching item
        const unflinchingItem = actor.items.getName("Unflinching");
        if(!unflinchingItem) return;

        //check if the damage was from a critical hit
        const originatingMessage = options.originatingMessageId ? game.messages.get(options.originatingMessageId) : null;
        if(!originatingMessage || !originatingMessage.flavor.includes("(Critical Hit)")) return;


        /*  
            Option A:   just use the item
        */

        await unflinchingItem.use();

        const userAviana = game.users.players.find(u => u.name === "Aviana" && u.active);
        if(!userAviana) return;

        //set user's target to actor token
        const allActorTokens = actor.getActiveTokens(true, false);
        const actorToken = allActorTokens[0] ?? null;
        if(!actorToken) return;

        actorToken.setTarget(true, {
            user: userAviana,
            releaseOthers: true
        });
        

        /*
            Option B:   only roll damage with the item

            //save previous targets
            const prevTargets = new Set(game.user.targets);

            //target the current token
            const actorTokens = actor.getActiveTokens(true, false);
            game.user.targets.clear();
            game.user.targets.add(actorTokens[0])

            //roll the healing from the item
            const roll = await unflinchingItem.rollDamage();

            //return to previous targets
            game.user.targets.clear();
            for(let t of prevTargets) {
                game.user.targets.add(t);
            }

        */
        
        
        /*
            Option C:   Heal the actor directly.

            const roll = await unflinchingItem.rollDamage({options: {fastForward: true, chatMessage: false}});
            if(!roll) return;
            await TaliaCustom.Helpers.displayItemInfoOnly(unflinchingItem);
            await game.dice3d.showForRoll(roll);
            actor.applyDamage([{value: roll.total, type: "healing"}]);
        */        
    })
}

/**
While you're grappling a creature, you can expend 1 Mythic Power as an action to hurl the creature 20 feet into the air, following behind it with a powerful jump, and then make an unarmed attack.

If the attack hits, you can repeat this process up to 4 more times, moving the creature an additional 20 feet directly up into the air with each hit.

If any of the attacks miss, both you and the grappled creature fall, taking falling damage as normal for the total height.

After hitting the fifth attack, you immediately seize the creature and drive it into the ground as you land on top of it and make a sixth unarmed attack, which is a guaranteed critical hit.

Upon impact, the grappled creature takes falling damage as if it fell from twice the total height and falls prone, while you take no damage from this impact.
*/
function godbreaker() {
    /*
        register chat card buttons
        - Attacks
        - Fall damage
    */

    ChatCardButtons.register({
        itemName: "Godbreaker",
        buttons: [
            {
                label: "Fall Damage",
                callback: async() => {
                    const {DialogV2} = foundry.applications.api;
                    const {NumberField} = foundry.data.fields;

                    const selectFallDistanceField = new NumberField({
                        label: "Fall Distance (in ft)",
                        required: true,
                        min: 1,
                        integer: true,
                    }).toFormGroup({},{name: "fallDistance"}).outerHTML;

                    const result = await DialogV2.prompt({
                        window: { title: "Fall Damage" },
                        content: selectFallDistanceField,
                        rejectClose: false,
                        ok: {
                            callback: (event, button) => new FormDataExtended(button.form).object,
                        }
                    });
                    if(!result?.fallDistance || result.fallDistance < 10) return;

                    //round down to nearest multiple of 10
                    const roundedDist = Math.floor(result.fallDistance / 10) * 10;
                    
                    // fall damage = 1d6 bludgeoning damage for each 10ft fall distance
                    const diceNum = roundedDist / 10;

                    const damageRoll = await dnd5e.dice.damageRoll({
                        rollConfigs: [{
                            parts: [`${diceNum}d6`],
                            type: "bludgeoning",
                        }],
                        fastForward: true,
                        rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
                        flavor: `Fall Distance: ${result.fallDistance}`
                    });
                }
            }
        ]
    })
}
