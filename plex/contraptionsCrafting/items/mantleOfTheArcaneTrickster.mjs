export default {
    _onSetup() {
        Hooks.on("preCreateActiveEffect", 
            /**
             * When the Mage Armor effect is applied to Plex, alter it's effects if Mantle of the Arcane Trickster is equipped and attuned.
             */
            (activeEffect, data, options, userId) => {
            if(activeEffect.name !== "Mage Armor") return;

            const actor = activeEffect.parent.documentName === "Actor" ? activeEffect.parent : game.users.get(userId).character;
            
            const mantleItem = actor.itemTypes?.equipment?.find( i => i.name === "Mantle of the Arcane Trickster");
            if(!mantleItem || !mantleItem.system.equipped || (mantleItem.system.attunement === "required" && !mantleItem.system.attuned)) return;
        
            const effectData = mantleItem.effects.contents[0];
            activeEffect.updateSource({ 
                changes: [...activeEffect.changes, ...effectData.changes] 
            });
        });
    }
}