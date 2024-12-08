export default {
    register() {
        registerEquipAttuneHook();
        registerHideChatMessageHook();
        registerModifySpellLevelHook(); 
    }
}

/**
 * custom on equip/unequip and on attune/unattune hooks
 */
function registerEquipAttuneHook() {
    Hooks.on("updateItem", (item, data, options, userId) => {
        if(userId !== game.userId || !item.actor) return;
        //equip hooks
        if(data.system?.equipped === true) Hooks.callAll("talia-custom.postEquip", item, data, options);
        else if(data.system?.equipped === false) Hooks.callAll("talia-custom.postUnEquip", item, data, options);

        //attune hooks
        if(data.system?.attuned === true) Hooks.callAll("talia-custom.postAttune", item, data, options);
        else if(data.system?.attuned === false) Hooks.callAll("talia-custom.postUnAttune", item, data, options);
    });
}

/**
 * Sets the display style of a chat message to "none" if the message has:
 * - flags.talia-custom.hideFromSelf = true
 * - user is not a gm
 * - user is the author of the message 
 */
function registerHideChatMessageHook() {
    Hooks.on("renderChatMessage", (msg, [html], msgData) => {
        if(msg.flags?.["talia-custom"]?.hideFromSelf === true && !game.user.isGM && msg.author?.id === game.userId) {
            html.style.display = "none";
        }
    });
}

/**
 * Rule: "When cast a spell using a spell slot, the spell is treated as if it were cast using a spell slot of x levels higher/lower, up to a maximum of 9th level."
 * 
 * Checks if the actor casting the spell has one of the following flags (can be expanded later):
 * - talia-custom.modifySpellLevel.spellSchools[spellSchoolId] {number}
 */
function registerModifySpellLevelHook() {
    Hooks.on("dnd5e.preItemUsageConsumption", (item, config, options) => {
        //prevent recursion
        if(options.talia?.modifiedSpellLevel) return;
        //prevent invalid items
        if(!item.type === "spell" || !config.slotLevel || config.slotLevel === 0) return;

        const modFlag = item.actor?.flags?.["talia-custom"]?.modifySpellLevel;
        if(!modFlag) return;

        const chosenSlotLevel = options.flags.dnd5e?.use?.spellLevel;
        if(!chosenSlotLevel) return;

        let slotLevelModifier = 0;
        //add all flag values together
        slotLevelModifier += modFlag.spellSchools?.[item.system.school] ?? 0;

        //calculate changed slot level; min = 1, max = 9;
        const newSlotLevel = Math.min(1, Math.max(chosenSlotLevel + slotLevelModifier, 9));
        if(newSlotLevel === chosenSlotLevel) return;

        //start async function, then return false to cancel the use
        (async() => {
            //consume spell slot manually if set in the original config
            if( config.consumeSpellSlot ) {
                const spellData = item.actor?.system.spells ?? {};
                const level = spellData[config.slotLevel];
                const spells = Number(level?.value ?? 0);

                if ( spells === 0 ) {
                    const isLeveled = /spell\d+/.test(config.slotLevel || "");
                    const labelKey = isLeveled ? `DND5E.SpellLevel${item.system.level}`: `DND5E.SpellProg${config.slotLevel?.capitalize()}`;
                    const label = game.i18n.localize(labelKey);
                    ui.notifications.warn(game.i18n.format("DND5E.SpellCastNoSlots", {name: item.name, level: label}));
                    return false;
                }
                await item.actor.update({[`system.spells.${config.slotLevel}.value`]: Math.max(spells - 1, 0)});
            }

            // then use the item again but don't consume spell slots and specify the slot level used (and all other config choices)
            config.consumeSpellSlot = false;
            config.slotLevel = newSlotLevel;

            options.configureDialog = false;
            options.talia ??= {};
            options.talia.modifiedSpellLevel = true;

            await item.use(config, options);
        })();
        return false;
    });
}
