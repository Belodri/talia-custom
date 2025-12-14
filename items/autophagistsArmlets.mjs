import ActiveEffect5e from "../system/dnd5e/module/documents/active-effect.mjs";
import { Actor5e, Item5e } from "../system/dnd5e/module/documents/_module.mjs";
import CombatTriggers from "../utils/CombatTriggers.mjs";

export default {
    register() {
        Hooks.on("createActiveEffect", onCreateActiveEffect);
        Hooks.once("ready", () => {
            if(!game.user.isGM) return;
            CombatTriggers.on("onTurnStart", onTurnStart);
        }) 
    }
}

function onTurnStart(actor, combat, event, id) {
    if(!actor) return;
    if(!actor.appliedEffects.includes(e => e.name === "Autophagist's Armlet")) return;
    if(!actor.appliedEffects.includes(e => e.name === "Void Form")) return;

    const armletItem = actor.items.getName("Autophagist's Armlet");
    if(!armletItem) return;

    applyItemActorChanges(actor, armletItem);
}

async function applyItemActorChanges(actor, armletItem) {
    try {
        const shards = getEssenceShards(actor);
        await applyShardChanges(shards, 1);
        await rollDamage(actor, armletItem);
    } catch(err) {
        console.error(err);
        ui.notifications.error("Autophagist's Armlets Error. Check if Essence Shards are correct.");
    }
}

/** */
async function onCreateActiveEffect(document, options, userId) {
    if(game.userId !== userId) return;
    if(document.name !== "Void Form") return;
    if(!(document instanceof ActiveEffect)) return;
    if(!(document.parent instanceof Actor)) return;

    /** @type {ActiveEffect} */
    const effect = document;
    /** @type {Actor} */
    const actor = document.parent;

    if(!actor.appliedEffects.find(e => e.name === "Autophagist's Armlet")) return;

    const armletItem = actor.items.getName("Autophagist's Armlet");
    if(!armletItem) return;

    applyItemActorChanges(actor, armletItem);
}


/**
 * 
 * @param {Actor5e} actor 
 * @param {Item5e} armletItem 
 */
async function rollDamage(actor, armletItem) {
    const damages = await armletItem.rollDamage({ options: { fastForward: true }});
    const total = damages.total;
}

function getEssenceShards(actor) {
    const feature = actor.itemTypes.feat.find(e => e.name === "Essence Shards");
    if(!feature?.system?.uses) return undefined;
    else return feature;
}

/**
 * @param {Item} shards 
 * @param {number} amount 
 */
async function applyShardChanges(shards, amount = 1) {
    const { value, max } = shards.system.uses;
    const newValue = Math.min(max, value + amount);

    const added = newValue - value;

    await shards.update({"system.uses.value": newValue});
    ui.notifications.info(`Autophagist's Armlet added ${added} Essence Shards`);
}
