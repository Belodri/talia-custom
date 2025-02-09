export default {
    register() {
        Hooks.on("dnd5e.useItem", async (item, config, options) => {
            if(item.name !== "Stone's Endurance") return;

            const rollData = item.actor.getRollData();
            const roll = await new Roll("1d12 + @abilities.con.mod", rollData).evaluate();
            await roll.toMessage({
                flavor: "Damage Reduction",
                speaker: ChatMessage.implementation.getSpeaker({actor: item.actor}),
            });
        })
    }
}
