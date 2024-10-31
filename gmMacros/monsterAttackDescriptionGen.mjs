import { TaliaCustomAPI } from "../scripts/api.mjs"

export default {
    register() {
        TaliaCustomAPI.add({generateAttackDescriptions}, "GmMacros");
    }
}

/**
 * Generates descriptions and updates all weapons on all npc actors within the _descriptionGenerator folder.
 * The generated description is prefixed to any existing description and includes attackType, reach/range, and targetType infos.
 */
async function generateAttackDescriptions() {
    const chosenActors = game.actors.folders.find(f => f.name === "_descriptionGenerator").contents.filter(a => a.type === "npc");

    for(let act of chosenActors) {
        let updates = [];
        const actItems = act.items.filter(i => ["msak", "mwak", "rsak", "rwak"].includes(i.system.actionType) && i.type === "weapon");
        for(let i of actItems) {
            const attackTypeStr = CONFIG.DND5E.itemActionTypes[i.system.actionType];
            const rangeStr = `${i.system.actionType.startsWith("m") ? "reach" : "range"} ${i.labels.range ?? "5 ft"}`;
            const newDescString = `<p><em>${attackTypeStr}:</em> ${rangeStr}., ${i.labels.target}</p>${i.system.description.value}`;
            updates.push({_id: i.id, "system.description.value": newDescString});
        }
        await Item.updateDocuments(updates, {parent: act});
    }
}