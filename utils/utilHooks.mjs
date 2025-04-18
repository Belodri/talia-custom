import { MODULE } from "../scripts/constants.mjs";

export default {
    register() {
        registerEquipAttuneHook();
        registerHideChatMessageHook();
        registerModifySpellLevelHook(); 
        registerHideConsumeButtonsHook();
        registerStatusToggleEnricherDialog();
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
 * - talia-custom.modifySpellLevel.spellSchools[spellSchoolId] {number}     // target spells of a given spell school
 * - talia-custom.modifySpellLevel.all {number}                             // target all spells
 * - talia-custom.modifySpellLevel.filter.underLevel {number}               // target only spells under a given spell level
 * - talia-custom.modifySpellLevel.filter.overLevel {number}                // target only spells over a given spell level
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

        if(modFlag.filter?.underLevel && chosenSlotLevel > modFlag.filter?.underLevel) return;
        if(modFlag.filter?.overLevel && chosenSlotLevel < modFlag.filter?.overLevel) return;

        let slotLevelModifier = 0;
        //add all flag values together
        slotLevelModifier += modFlag.spellSchools?.[item.system.school] ?? 0;
        slotLevelModifier += modFlag.all ?? 0;
        
        //calculate changed slot level; min = 1, max = 9;
        const newSlotLevel = Math.clamp(chosenSlotLevel + slotLevelModifier, 1, 9);
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

/**
 * Registers hooks to hide 'Consume' buttons in item cards.
 * This function adds checkboxes to item sheets to allow users to hide the 'Consume' button in chat messages of that item.
 */
function registerHideConsumeButtonsHook() {
    const FLAGS = {
        USES: "hideChatCardButtons.consumeUses",
        RESOURCES: "hideChatCardButtons.consumeResources"
    };

    /**
     * Generates the HTML for a checkbox to hide the 'Consume' button.
     * @param {object} item - The item object.
     * @param {string} flagKey - The flag key to check.
     * @returns {string} - The HTML string for the checkbox.
     */
    function checkboxesHTML(item, flagKey) {
        const flagValue = item.getFlag(MODULE.ID, flagKey) ?? false;

        const checkbox = `<label class="checkbox" data-tooltip="Hide the 'Consume' button from the chat card?" style="min-width: 8ch; flex-grow: 0;">
            <input type="checkbox" name="flags.${MODULE.ID}.${flagKey}" ${flagValue ? "checked" : ""}>
            Hide
        </label>`;

        return checkbox;
    }

    Hooks.on("renderItemSheet5e", (app, html, {item} = {}) => {
        if (app.options.classes.includes("tidy5e-sheet")) return;

        
        const usesElem = html.find(".form-group.uses-per .form-fields")?.[0];
        if(usesElem && item.hasLimitedUses) {
            $(checkboxesHTML(item, FLAGS.USES)).insertAfter(usesElem);
        }

        const resourcesElem = html.find(".form-group.consumption .form-fields")?.[0];
        if(resourcesElem && item.hasResource) {
            $(checkboxesHTML(item, FLAGS.RESOURCES)).insertAfter(resourcesElem);
        }
    });

    Hooks.on("tidy5e-sheet.renderItemSheet", (app, element, {item}, forced) => {
        //change item sheet
        const html = $(element);

        const usesElem = html.find(".form-group.uses-per .form-fields")?.[0];
        if(usesElem && item.hasLimitedUses) {
            const markupToInject = `
                <div style="display: contents;" data-tidy-render-scheme="handlebars">
                    ${checkboxesHTML(item, FLAGS.USES)}
                </div>
            `;
            $(markupToInject).insertAfter(usesElem);
        }

        const resourcesElem = html.find(".form-group.consumption .form-fields")?.[0];
        if(resourcesElem && item.hasResource) {
            const markupToInject = `
                <div style="display: contents;" data-tidy-render-scheme="handlebars">
                    ${checkboxesHTML(item, FLAGS.RESOURCES)}
                </div>
            `;
            $(markupToInject).insertAfter(resourcesElem);
        }
    });

    Hooks.on("renderChatMessage", (msg, html, msgData) => {

        const consumeUsageButton = html.find('[data-action="consumeUsage"]')?.[0];
        const consumeResourceButton = html.find('[data-action="consumeResource"]')?.[0];
        if(!consumeResourceButton && !consumeUsageButton) return;

        const itemUuid = msg.getFlag("dnd5e", "use.itemUuid");
        if(!itemUuid) return;

        let item = null;
        try {
            item = fromUuidSync(itemUuid, { strict: true });
        } catch {};
        if(!item) return;

        const hideConsumeUsesButton = item.getFlag(MODULE.ID, FLAGS.USES);
        const hideConsumeResourcesButton = item.getFlag(MODULE.ID, FLAGS.RESOURCES);

        if(hideConsumeUsesButton && consumeUsageButton) {
            consumeUsageButton.style.display = 'none';
        }
        if(hideConsumeResourcesButton && consumeResourceButton) {
            consumeResourceButton.style.display = 'none';
        }
    });
}


/**
 * Hook on `dnd5e.enricherToggleStatus` (custom)
 * 
 * If the toggleStatus enricher is shift-clicked, opens a dialog to configure the duration.
 */
function registerStatusToggleEnricherDialog() {
    Hooks.on("dnd5e.enricherToggleStatus", (statusId, event) => {
        if(!event.shiftKey) return;

        (async () => {
            const {DialogV2} = foundry.applications.api;
            const {NumberField, StringField} = foundry.data.fields;
            const {createMultiSelectInput, createFormGroup} = foundry.applications.fields;

            let content = "";

            content += new NumberField({
                label: "Duration (seconds)",
                positive: true,
                integer: true,
                hint: "If a duration in seconds is given, round or turn durations are ignored."
            }).toFormGroup({}, {name: "duration.seconds"}).outerHTML;

            content += new NumberField({
                label: "Duration (rounds)",
                integer: true,
                positive: true
            }).toFormGroup({}, {name: "duration.rounds"}).outerHTML;

            content += new NumberField({
                label: "Duration (turns)",
                integer: true,
                positive: true
            }).toFormGroup({}, {name: "duration.turns"}).outerHTML;

            if(game.modules.get("dae").active) {

                content += `<hr>`;

                const daeSpecials = game.modules.get("dae").api.daeSpecialDurations();
                /*
                    turnStart: "Turn Start: Expires at the start of the target's next turn (in combat).",
                    turnEnd: "Turn End: Expires at the end of the target's next turn (in combat).",
                    turnStartSource: "Turn Start: Expires at the start of the source actor's next turn (in combat).",
                    turnEndSource: "Turn End: Expires at the end of the source actor's next turn (in combat).",
                    combatEnd: "End Combat",
                    joinCombat: "Create Combatant"
                */

                content += createFormGroup({
                    input: createMultiSelectInput({
                        type: "multi-select",
                        name: "flags.dae.specialDuration",
                        options:  Object.entries(daeSpecials)
                            .filter(([k,v]) => v !== "")
                            .map(([k, v]) => ({ label: v, value: k }))
                    }),
                    label: "DAE Special Durations"
                }).outerHTML;
            }

            const eff = CONFIG.statusEffects.find(e => e.id === statusId);

            const effectDataOverride = await DialogV2.prompt({
                content,
                window: { title: `Configure Status Effect: ${eff.name}` },
                ok: { callback: (_, button) => new FormDataExtended(button.form).object },
                rejectClose: false,
                modal: true,
            });
            if(!effectDataOverride) return;

            for ( const token of canvas.tokens.controlled ) {
                await token.actor.toggleStatusEffect(statusId, {effectDataOverride});
            }
        })();
        return false;
    })
}
