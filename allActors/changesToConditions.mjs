/*
    add changes to all the various status condition types
*/

export default {
    _onInit() {
        addChangesToStatusEffects();
    }
}


function addChangesToStatusEffects() {
    // keys are id and values are changes arrays
    const changesList = {
        dead: [],   //no changes
        bleeding: [],   //no changes
        blinded: [
            {key: "flags.midi-qol.disadvantage.attack.all", mode: 0, value: "1", priority: 1},
            {key: "flags.adv-reminder.message.ability.check.all", mode: 0, value: "A blinded creature can't see and automatically fails any ability check that requires sight.", priority: 1},
        ],
        burrowing: [],  //no changes
        charmed: [],    //no changes
        concentrating: [],  //no changes
        cursed: [],     //no changes
        deafened: [
            {key: "flags.adv-reminder.message.ability.check.all", mode: 0, value: "A deafened creature can't hear and automatically fails any ability check that requires hearing.", priority: 1},
        ],
        diseased: [],   //no changes
        dodging: [
            {key: "flags.midi-qol.grants.disadvantage.attack.all", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.advantage.ability.save.dex", mode: 0, value: "1", priority: 1}
        ],
        encumbered: [], //no changes
        ethereal: [],   //no changes
        exceedingCarryingCapacity: [],  //no changes
        exhaustion: [], //no changes
        flying: [],     //no changes
        frightened: [],     //no changes
        grappled: [
            {key: "system.attributes.movement.all", mode: 0, value: "0", priority: 90},
        ],
        heavilyEncumbered: [],  //no changes
        hiding: [],     //no changes
        hovering: [],       //no changes
        inaudible: [],      //no changes
        incapacitated: [],  //no changes
        invisible: [
            {key: "flags.midi-qol.advantage.attack.all", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.grants.disadvantage.attack.all", mode: 0, value: "1", priority: 1},
        ],      
        marked: [],     //no changes
        paralyzed: [
            {key: "flags.midi-qol.fail.ability.save.str", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.fail.ability.save.dex", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.grants.advantage.attack.all", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.grants.critical.msak", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.grants.critical.mwak", mode: 0, value: "1", priority: 1},
            {key: "flags.adv-reminder.grants.message.damage.all", mode: 0, value: "Any attack that hits a paralyzed creature is a critical hit if the attacker is within 5 feet of the creature.", priority: 1},
        ],      
        petrified: [
            {key: "flags.midi-qol.grants.advantage.attack.all", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.fail.ability.save.str", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.fail.ability.save.dex", mode: 0, value: "1", priority: 1},
            {key: "system.traits.dr.all", mode: 0, value: "1", priority: 1},
            {key: "system.traits.ci.value", mode: 0, value: "poisoned", priority: 1},
            {key: "system.traits.ci.value", mode: 0, value: "diseased", priority: 1},
        ],
        poisoned: [
            {key: "flags.midi-qol.disadvantage.attack.all", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.disadvantage.ability.check.all", mode: 0, value: "1", priority: 1},
        ],
        prone: [
            {key: "flags.midi-qol.disadvantage.attack.all", mode: 0, value: "1", priority: 1},
            {key: "flags.adv-reminder.grants.message.attack.all", mode: 0, value: "An attack roll against a prone creature has advantage if the attacker is within 5 feet of the creature. Otherwise, the attack roll has disadvantage.", priority: 1},
        ],
        restrained: [
            {key: "system.attributes.movement.all", mode: 0, value: "0", priority: 90},
            {key: "flags.midi-qol.disadvantage.attack.all", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.grants.advantage.attack.all", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.disadvantage.ability.save.dex", mode: 0, value: "1", priority: 1},
        ],
        silenced: [],   //no changes
        sleeping: [],   //no changes
        stable: [],     //no changes
        stunned: [
            {key: "flags.midi-qol.fail.ability.save.str", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.fail.ability.save.dex", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.grants.advantage.attack.all", mode: 0, value: "1", priority: 1},
        ],
        surprised: [],  //no changes
        transformed: [],    //no changes
        unconscious: [
            {key: "flags.midi-qol.fail.ability.save.str", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.fail.ability.save.dex", mode: 0, value: "1", priority: 1},
            {key: "flags.midi-qol.grants.advantage.attack.all", mode: 0, value: "1", priority: 1},
            {key: "flags.adv-reminder.grants.message.damage.all", mode: 0, value: "Any attack that hits an unconscious creature is a critical hit if the attacker is within 5 feet of the creature.", priority: 1},
        ],
    }

    for(const [key, value] of Object.entries(changesList)) {
        if(!value.length) continue;
        const effect = CONFIG.statusEffects.find(i => i.id === key);
        if(!effect) continue;

        effect.changes = value;
    }
}


