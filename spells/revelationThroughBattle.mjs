import { TaliaCustomAPI } from "../scripts/api.mjs";

export default {
    register() {
        TaliaCustomAPI.add({revelationThroughBattle}, "ItemMacros");
    }
}

/**
 *
 */
async function revelationThroughBattle(item, deleteAfterMS) {
    const target = game.user.targets?.first();
    if(!target) {
        ui.notifications.info("If you cannot target a token, just ask for the info.");
        return false;
    }

    const rollData = target.actor.getRollData();
    const savesString = Object.entries(rollData.abilities).reduce((acc, [key, value]) => {
        return acc += `<p>${CONFIG.DND5E.abilities[key].label}: ${value.save}</p>`;
    }, "");
    const drString = Array.from(rollData.traits.dr.value)
        .map(i => CONFIG.DND5E.damageTypes[i].label)
        .join(", ");
    const dvString = Array.from(rollData.traits.dv.value)
        .map(i => CONFIG.DND5E.damageTypes[i].label)
        .join(", ");
    const diString = Array.from(rollData.traits.di.value)
        .map(i => CONFIG.DND5E.damageTypes[i].label)
        .join(", ");
    const ciString = Array.from(rollData.traits.ci.value)
        .map(i => CONFIG.DND5E.conditionTypes[i].label)
        .join(", ");
        
    const content = `
        <h3>AC & Saving throw bonuses</h3>
        <p>AC: ${rollData.attributes.ac.value}</p>
        ${savesString}
        ${diString.length ? `<h3>Damage Immunities</h3><p>${diString}</p>` : ""}
        ${drString.length ? `<h3>Damage Resistances</h3><p>${drString}</p>` : ""}
        ${dvString.length ? `<h3>Damage Vulnerabilities</h3><p>${dvString}</p>` : ""}
        ${ciString.length ? `<h3>Condition Immunities</h3><p>${ciString}</p>` : ""}
    `;

    //display spell card first
    await item.displayCard();

    const msg = await ChatMessage.create({
        content,
        whisper: [game.users.activeGM.id],
        speaker: ChatMessage.implementation.getSpeaker({actor: item.actor}),
    });

    setTimeout(async() => await msg.delete(), deleteAfterMS);
}
