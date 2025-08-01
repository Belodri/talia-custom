/* eslint-disable jsdoc/require-jsdoc */

import ChatCardButtons from "../../../utils/chatCardButtons.mjs";
import ChanneledMetamagic from "./channeledMetamagic.mjs";

export default {
    register() {
        METAMAGICS.forEach(config => {
            config.registerButtonFn?.(config.itemName);
        });
    }
}
const rollFatigueButton = { label: "Roll Channeling Fatigue", callback: ChanneledMetamagic.channel };

const METAMAGICS = [
    { itemName: "Metamagic: Careful Spell", registerButtonFn: defaultButton },
    { itemName: "Metamagic: Distant Spell", registerButtonFn: defaultButton },
    { itemName: "Metamagic: Subtle Spell", registerButtonFn: defaultButton },
    { itemName: "Metamagic: Heightened Spell", registerButtonFn: heightened },
    { itemName: "Metamagic: Twinned Spell", registerButtonFn: twinned },
    { itemName: "Metamagic: Extended Spell", registerButtonFn: extended },
    { itemName: "Metamagic: Empowered Spell", registerButtonFn: empowered },
]


function defaultButton(itemName) {
    ChatCardButtons.register({ itemName, buttons: [
        rollFatigueButton
    ]});
}


function heightened(itemName = "Metamagic: Heightened Spell") {
    ChatCardButtons.register({ itemName, buttons: [
        { label: "Warded", callback: ({item}) => heightenedButton(item, false) },
        { label: "Channelled", callback: ({item}) => heightenedButton(item, true) },
        rollFatigueButton
    ]});

    /**
     * @param {Item5e} item 
     * @param {boolean} channelled 
     */
    async function heightenedButton(item, channelled=false) {
        const eff = item.effects
            .find(e => e.name.includes(channelled ? "(Channelled)" : "(Warded)"));
        await eff.update({disabled: false});

        Hooks.once("dnd5e.useItem", () => {
            eff.update({disabled: true});
        });
    }
}

function twinned(itemName = "Metamagic: Twinned Spell") {
    ChatCardButtons.register({ itemName, buttons: [
        rollFatigueButton
    ]});

    Hooks.on("dnd5e.preUseItem", (item, config, options) => {
        if(item.name !== itemName || options.skipItemMacro ) return;

        (async() => {
            const sorcPoints = await chooseSpellLevel(item);
            if(sorcPoints === null) return;

            // ensure that cantrips also consume 1 sorc point
            const points = Math.max(1, sorcPoints);
            await item.update({"system.consume.amount": points});
            item.use({}, {skipItemMacro: true});
        })();
        return false;
    });

    async function chooseSpellLevel(item) {
        const {DialogV2} = foundry.applications.api;
        const {NumberField, BooleanField} = foundry.data.fields;

        const levelField = new NumberField({
            min: 1,
            max: 9,
            integer: true,
            initial: 1,
            required: true,
            label: "Choose Spell Level",
            hint: `Please select the level of the spell you want to twin.`,
        }).toFormGroup({}, {name: "level"}).outerHTML;

        return DialogV2.prompt({
            content: levelField,
            rejectClose: false,
            modal: true,
            ok: {
                callback: (event, button) => new FormDataExtended(button.form).object.level,
            }
        });
    }
}

/** Registers the chat card buttons and hooks for the Extended Spell Metamagic feature */
function extended(itemName = "Metamagic: Extended Spell") {
    const SCALAR_TIME_PERIODS_IN_SECONDS = {
        day: 60 * 60 * 24,
        hour: 60 * 60,
        minute: 60,
    }

    const MODE_CONFIGS = {
        warded: {
            durationMultiplier: 2,
            minDurationInSeconds: SCALAR_TIME_PERIODS_IN_SECONDS.minute,
            maxDurationInSeconds: SCALAR_TIME_PERIODS_IN_SECONDS.day
        },
        channelled: {
            durationMultiplier: 10,
            minDurationInSeconds: SCALAR_TIME_PERIODS_IN_SECONDS.minute,
            maxDurationInSeconds: SCALAR_TIME_PERIODS_IN_SECONDS.day
        }
    }

    ChatCardButtons.register({ itemName, buttons: [
        { label: "Warded", callback: ({item}) => extendedButton(item, false) },
        { label: "Channeled", callback: ({item}) => extendedButton(item, true) },
        rollFatigueButton
    ]});

    // Chat card button creates the metamagic effect on the actor
    async function extendedButton(item, isChanneled=false) {
        const eff = item.effects
            .find(e => e.name.includes(isChanneled ? "(Channelled)" : "(Warded)"));
        await eff.update({disabled: false});
    }

    // Pre-Use hook handles the actual work
    Hooks.on("dnd5e.preUseItem", (item, config, options) => {
        // Test to break recursion
        if(foundry.utils.getProperty(options, "flags.talia-custom.isExtended") === true) return;

        // Ensure correct type and parent existance
        if(!item.actor || item.type !== "spell") return;

        // Ensure the actor has the relevant active effect applied
        const eff = item?.actor?.appliedEffects?.find(e => e.name.startsWith(itemName));
        if(!eff) return;

        // Handle cases where an itemData flag has already been set
        let spellItem = item;
        const storedData = foundry.utils.getProperty(options, "flags.dnd5e.itemData");
        if(storedData) {
            spellItem = new dnd5e.documents.Item5e(storedData, {parent: item.actor})
        }

        // Verify and validate item
        const dur = spellItem.system?.duration?.value;
        if(!Number.isInteger(dur) || dur <= 0) return;

        const timePeriod = spellItem.system?.duration?.units;
        const timePeriodInSeconds = SCALAR_TIME_PERIODS_IN_SECONDS[timePeriod];
        if(!timePeriodInSeconds) return;

        // Convert to s as common unit
        const durInS = timePeriodInSeconds * dur;

        // Get mode from active effect
        const modeConfig = eff.name.includes("(Channelled)") 
            ? MODE_CONFIGS.channelled 
            : MODE_CONFIGS.warded;
        
        // Filter effects below minimum duration
        if(durInS < modeConfig.minDurationInSeconds) return;

        // Calculate new duration & clamp to maximum duration
        const newDurInS = Math.min(durInS * modeConfig.durationMultiplier, modeConfig.maxDurationInSeconds);

        // Convert back to original unit
        const newDur = newDurInS / SCALAR_TIME_PERIODS_IN_SECONDS[timePeriod];

        // Cancel the current use, create a cloned item, and use that instead
        (async () => {
            // Prepare the modified data to be passed in the options flags
            const itemData = spellItem.toObject();
            foundry.utils.mergeObject(itemData, {"system.duration.value": newDur});
            
            // Adjust the duration of effects on the item only if their duration matches the duration of the item
            for(const effData of itemData.effects) {
                if(effData.duration.seconds === durInS) {
                    effData.duration.seconds = newDurInS;
                }
            }
            
            // Create the cloned item to use 
            // (so the automatically generated concentration effect gets the correct duration too)
            const itemClone = spellItem.clone({"system.duration.value": newDur}, {keepId: true});
            itemClone.prepareData();
            itemClone.prepareFinalAttributes();

            // Set the modified item data with the modified effect data as a flag so
            // the Item5e._onChatCardAction event handler uses that instead of fetching 
            // the original item from the actor.
            foundry.utils.setProperty(options, "flags.dnd5e.itemData", itemData);

            // Set recursion guard
            foundry.utils.setProperty(options, "flags.talia-custom.isExtended", true);
            
            await itemClone.use(config, options);

        })();
        return false;
    });

    // Post-Use hook handles cleanup of the metamagic effect on the actor if the metamagic was applied.
    Hooks.on("dnd5e.useItem", (item, config, options) => {
        if(foundry.utils.getProperty(options, "flags.talia-custom.isExtended") !== true) return;

        const featureItem = item?.actor?.items.getName(itemName);
        if(!featureItem) return;

        // Disable all effects (if both were enabled accidentally).
        for(const eff of featureItem.effects) {
            if(!eff.disabled) eff.update({disabled: true});
        }
    });
}

function empowered(itemName = "Metamagic: Empowered Spell") {
    ChatCardButtons.register({ itemName, buttons: [
        { label: "Warded", callback: ({item}) => empoweredButton(item, false) },
        { label: "Channeled", callback: ({item}) => empoweredButton(item, true) },
        rollFatigueButton
    ]});

    async function empoweredButton(item, isChanneled=false) {
        const eff = item.effects
            .find(e => e.name.includes(isChanneled ? "(Channelled)" : "(Warded)"));
        await eff.update({disabled: false});
    }

    // simply disable the effect after the first valid item use
    Hooks.on("dnd5e.useItem", (item, config, options) => {
        if(item.type !== "spell") return;
        const featureItem = item.actor?.items?.getName(itemName);
        if(!featureItem) return;
        
        for(const eff of featureItem.effects) {
            if(!eff.disabled) eff.update({"disabled": true});
        }
    })
}
