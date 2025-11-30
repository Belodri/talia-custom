export default {
    register() {
        modifyExistingStatusEffects();
        addNewStatusEffects();
        fixExhaustionConfig();
        fixExhaustionDeletion();
    }
}

/**
 * When the exhaustion active effect is deleted, the system doesn't update 
 * the actor accordingly the change is only applied locally, not to the source.
 * This hook on `deleteActiveEffect` ensures the exhaustion value on the actor 
 * is kept in sync when the active effect is deleted.
 */
function fixExhaustionDeletion() {
    Hooks.on("deleteActiveEffect", async (effect, options, userId) => {
        if(game.user.id !== userId) return;
        if(effect._id !== dnd5e.documents.ActiveEffect5e.ID.EXHAUSTION) return;

        const actor = effect.parent;
        if( !(actor instanceof dnd5e.documents.Actor5e )) return;

        await actor.update({"system.attributes.exhaustion": 0});
    });
}

/**
 * Fixes the configuration for the exhaustion status effect.
 */
function fixExhaustionConfig() {
    const newExhaustionIconRef = "TaliaCampaignCustomAssets/c_Icons/svg/exhaustion/exhaustion.svg";
    const exhaustionJournalEntryPage = "Compendium.talia-custom.rules.JournalEntry.ZkD6R9Ye9Sr77OCt.JournalEntryPage.Wjki4nD4YAgKCtNl";
    CONFIG.DND5E.conditionTypes.exhaustion.reference = exhaustionJournalEntryPage;  
    CONFIG.DND5E.conditionTypes.exhaustion.levels = 10;
    CONFIG.DND5E.conditionTypes.exhaustion.icon = newExhaustionIconRef;

    const sE = CONFIG.statusEffects.find(e => e.id === "exhaustion");
    sE.reference = exhaustionJournalEntryPage;
    sE.levels = 10;
    sE.img = newExhaustionIconRef;

    // Remove preset exhaustion effects from conditionEffects CONFIG
    const effectSets = CONFIG.DND5E.conditionEffects;

    for(const set of Object.values(effectSets)) {
        if(!(set instanceof Set) || !set.size) continue;

        for(const item of set) {
            if(typeof item === "string" && item.startsWith("exhaustion")) set.delete(item);
        }
    }
}

// keys are id and values are updates to the object
const STATUS_EFFECTS_MODIFICATIONS = {
    dead: {
        "flags.core.overlay": true,
    },
    bleeding: {},
    blinded: {
        changes: [
            {key: "flags.midi-qol.disadvantage.attack.all", mode: 0, value: "1", priority: 1},
            {key: "flags.adv-reminder.message.ability.check.all", mode: 0, value: "A blinded creature can't see and automatically fails any ability check that requires sight.", priority: 1},
        ]
    },
    burrowing: {},  
    charmed: {},    
    concentrating: {},  
    cursed: {},   
    deafened: {
        changes: [
            {key: "flags.adv-reminder.message.ability.check.all", mode: 0, value: "A deafened creature can't hear and automatically fails any ability check that requires hearing.", priority: 1},
        ]
    },
    diseased: {}, 
    dodging: {
        changes: [
            {key: "flags.midi-qol.grants.disadvantage.attack.all", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.advantage.ability.save.dex", mode: 0, value: "1", priority: 1}
        ]
    },
    encumbered: {},
    ethereal: {}, 
    exceedingCarryingCapacity: {},  
    exhaustion: {
        changes: [
            {key: "system.bonuses.spell.dc", mode: 2, value: "- @attributes.exhaustion", priority: 20},
            {key: "system.bonuses.abilities.check", mode: 2, value: "- @attributes.exhaustion", priority: 20},
            {key: "system.bonuses.abilities.save", mode: 2, value: "- @attributes.exhaustion", priority: 20},
            {key: "system.bonuses.msak.attack", mode: 2, value: "- @attributes.exhaustion", priority: 20},
            {key: "system.bonuses.mwak.attack", mode: 2, value: "- @attributes.exhaustion", priority: 20},
            {key: "system.bonuses.rsak.attack", mode: 2, value: "- @attributes.exhaustion", priority: 20},
            {key: "system.bonuses.rwak.attack", mode: 2, value: "- @attributes.exhaustion", priority: 20},
        ]
    },
    flying: {},
    frightened: {}, 
    grappled: {
        changes: [
            {key: "system.attributes.movement.all", mode: 0, value: "0", priority: 90},
        ]
    },
    heavilyEncumbered: {}, 
    hiding: {},    
    hovering: {},      
    inaudible: {},    
    incapacitated: {},  
    invisible: {
        changes: [
            {key: "flags.midi-qol.advantage.attack.all", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.grants.disadvantage.attack.all", mode: 0, value: "1", priority: 1},
        ]
    },
    marked: {},
    paralyzed: {
        changes: [
            {key: "flags.midi-qol.fail.ability.save.str", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.fail.ability.save.dex", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.grants.advantage.attack.all", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.grants.critical.msak", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.grants.critical.mwak", mode: 0, value: "1", priority: 1},
            {key: "flags.adv-reminder.grants.message.damage.all", mode: 0, value: "Any attack that hits a paralyzed creature is a critical hit if the attacker is within 5 feet of the creature.", priority: 1},
        ]
    },   
    petrified: {
        changes: [
            {key: "flags.midi-qol.grants.advantage.attack.all", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.fail.ability.save.str", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.fail.ability.save.dex", mode: 0, value: "1", priority: 1},
            {key: "system.traits.dr.all", mode: 0, value: "1", priority: 1},
            {key: "system.traits.ci.value", mode: 0, value: "poisoned", priority: 1},
            {key: "system.traits.ci.value", mode: 0, value: "diseased", priority: 1},
        ],
    },
    poisoned: {
        changes: [
            {key: "flags.midi-qol.disadvantage.attack.all", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.disadvantage.ability.check.all", mode: 0, value: "1", priority: 1},
        ]
    },
    prone: {
        changes: [
            {key: "flags.midi-qol.disadvantage.attack.all", mode: 0, value: "1", priority: 1},
            {key: "flags.adv-reminder.grants.message.attack.all", mode: 0, value: "An attack roll against a prone creature has advantage if the attacker is within 5 feet of the creature. Otherwise, the attack roll has disadvantage.", priority: 1},
        ]
    },
    restrained: {
        changes: [
            {key: "system.attributes.movement.all", mode: 0, value: "0", priority: 90},
            {key: "flags.midi-qol.disadvantage.attack.all", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.grants.advantage.attack.all", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.disadvantage.ability.save.dex", mode: 0, value: "1", priority: 1},
        ],
    },
    silenced: {},   
    sleeping: {},
    stable: {},   
    stunned: {
        changes: [
            {key: "flags.midi-qol.fail.ability.save.str", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.fail.ability.save.dex", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.grants.advantage.attack.all", mode: 0, value: "1", priority: 1},
        ],
    },
    surprised: {}, 
    transformed: {},   
    unconscious: {
        changes: [
            {key: "flags.midi-qol.fail.ability.save.str", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.fail.ability.save.dex", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.grants.advantage.attack.all", mode: 0, value: "1", priority: 1},
            {key: "flags.adv-reminder.grants.message.damage.all", mode: 0, value: "Any attack that hits an unconscious creature is a critical hit if the attacker is within 5 feet of the creature.", priority: 1},
        ]
    }
}

/**
 * Modifies existing status effect data in the CONFIG by merging the changes from 
 * `STATUS_EFFECTS_MODIFICATIONS` into the respective effect data objects.
 */
function modifyExistingStatusEffects() {
    CONFIG.statusEffects.forEach(e => 
        foundry.utils.mergeObject(e, STATUS_EFFECTS_MODIFICATIONS[e.id] ?? {})
    );
}

/**
 * Adds new custom status effects to the CONFIG.statusEffects and CONFIG.DND5E.conditionTypes.
 */
function addNewStatusEffects() {
    const effectsToAdd = {
        distracted: {
            label: "Distracted",
            img: "TaliaCampaignCustomAssets/c_Icons/svg/distraction.svg",
            reference: "Compendium.talia-custom.rules.JournalEntry.RZVeB9Toae7IWbzN.JournalEntryPage.5R0uPqr2WgB08C2T",
        },
        dazed: {
            label: "Dazed",
            img: "TaliaCampaignCustomAssets/c_Icons/svg/dazed.svg",
            reference: "Compendium.talia-custom.rules.JournalEntry.RZVeB9Toae7IWbzN.JournalEntryPage.RlGakadjBANEe7Vc",
        }
    };

    
    for(const [k, v] of Object.entries(effectsToAdd)) {
        CONFIG.statusEffects.push({
            id: k, 
            _id: `dnd5e${k}`.padEnd(16, '0'),    //id must be 16 characters long,
            name: v.label,
            img: v.img,
            reference: v.reference
        });
        CONFIG.DND5E.conditionTypes[k] = v;
    }
}
