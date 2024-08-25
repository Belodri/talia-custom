import { TaliaUtils } from "../../../utils/_utils.mjs";

export default {
    register() {
        Hooks.on("dnd5e.preApplyDamage", preDamageApplyHook);

        //hook to reset the DC upon resting
        Hooks.on("dnd5e.preRestCompleted", (actor, result, config) => {
            const item = actor.items.find(i => i.name === "Relentless Rage");
            if(!item) return;
            result.updateItems.push({
                _id: item.id,
                "system.save.dc": 10
            });
        });
    }
}

function preDamageApplyHook(actor, amount, updates, options) {
    if(updates.system?.attributes?.hp?.value > 0) return;

    const item = actor.itemTypes?.feat?.find(i => i.name === "Relentless Rage");
    if(!item) return;
    if(!actor.appliedEffects.find(e => e.name === "Rage")) return;

    //check massive damage insta kill
    /*
        Massive damage can kill you instantly. 
        When damage reduces you to 0 hit points and there is damage remaining, you die if the remaining damage equals or exceeds your hit point maximum.

        For example, a cleric with a maximum of 12 hit points currently has 6 hit points. 
        If she takes 18 damage from an attack, she is reduced to 0 hit points, but 12 damage remains. 
        Because the remaining damage equals her hit point maximum, the cleric dies.
    */
    const prevHP = actor.system.attributes.hp.value;
    if(amount - prevHP >= prevHP) {
        return ChatMessage.implementation.create({
            speaker: ChatMessage.implementation.getSpeaker({actor}),
            content: `${actor.name} took ${amount} damage while having only ${prevHP} hp left, resulting in instant death.`
        });
    }
    
    //actual effect begins here
    //if we haven't returned by now, we'll return false to cancel the hooked function
    (async () => {
        await TaliaUtils.Helpers.displayItemInfoOnly(item);
        const updatesClone = foundry.utils.deepClone(updates);

        Requestor.request({
            title: " ",
            speaker: ChatMessage.implementation.getSpeaker({actor}),
            buttonData: [{
                label: `DC ${item.system.save.dc} ${CONFIG.DND5E.abilities[item.system.save.ability].label} saving throw`,
                scope: {
                    actorId: actor.id,
                    actorUuid: actor.uuid,
                    itemId: item.id,
                    updates: updatesClone,
                },
                command: async function() {
                    if(actor.uuid !== actorUuid) return ui.notifications.warn("Only the originating actor can execute this command.");
                    
                    const item = actor.items.get(itemId);
                    const roll = await actor.rollAbilitySave(item.system.save.ability, {targetValue: item.system.save.dc, chatMessage: false});
                    
                    //this is just to be able to wait for the end of the roll animation before continuing
                    await roll.toMessage({
                        speaker: ChatMessage.implementation.getSpeaker({actor}),
                    });
                    
                    if(roll.isCritical || (!roll.isFumble && roll.total >= roll.options.targetValue)) {
                        updates["system.attributes.hp.value"] = 1;
                    }
                    await item.update({"system.save.dc": item.system.save.dc + 5});
                    await actor.update(updates);                  
                }
            }]
        });
    })();
    return false;
}