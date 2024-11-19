export default {
    register() {
        unflinching();
    }
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

