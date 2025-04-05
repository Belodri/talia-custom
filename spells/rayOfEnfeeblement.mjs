export default {
    register() {
        Hooks.on("dnd5e.calculateDamage", (actor, damages, options) => {
            const originatingMessage = options.originatingMessageId ? game.messages.get(options.originatingMessageId) : null;
            if(!originatingMessage) return;

            const orgActor = originatingMessage.getAssociatedActor();
            if(!orgActor?.getFlag("talia-custom", "ray-of-enfeeblement")) return;

            const baseMsgId = originatingMessage.getFlag("dnd5e", "originatingMessage");
            if(!baseMsgId) return;
            const baseMsg = game.messages.get(baseMsgId);
            if(!baseMsg) return;

            const orgItem = baseMsg.getAssociatedItem();
            if(orgItem?.abilityMod !== "str" || orgItem.type !== "weapon") return;

            damages.forEach(d => d.value /= 2 );
        });
    }
}
