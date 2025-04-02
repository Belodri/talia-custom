const MODES = {
    CUSTOM: 0,
    MULTIPLY: 1,
    ADD: 2,
    DOWNGRADE: 3,
    UPGRADE: 4,
    OVERRIDE: 5
};

const DUR = {};

const scaling = [
    {
        "text": "You are the center of a massive explosion. You and each creature within 60 feet of you must make a Dexterity saving throw against your spell save DC, taking 2d12 force damage for each level of your character on a failed save, or half as much damage on a successful one.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You recover all expended class resources.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You are deafened for 1 week.",
        "duration": DUR.w,
        "effect": {
            "changes": [],
            "statuses": ["deafened"]
        }
    },
    {
        "text": "You are silenced for 1 week.",
        "duration": DUR.w,
        "effect": {
            "changes": [],
            "statuses": ["silenced"]
        }
    },
    {
        "text": "You are poisoned for 1 week.",
        "duration": DUR.w,
        "effect": {
            "changes": [],
            "statuses": ["poisoned"]
        }
    },
    {
        "text": "You are invisible for 1 week.",
        "duration": DUR.w,
        "effect": {
            "changes": [],
            "statuses": ["invisible"]
        }
    },
    {
        "text": "Each creature within 60 feet of you takes 2d8 necrotic damage. You regain hit points equal to the sum of damage dealt.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You are teleported to an empty demiplane for 1 day before returning to the location you left.",
        "duration": DUR.d,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You are protected from creatures from the same plane as the one you're currently on for 1 day. Such creatures cannot attack you or harm you unless they succeed on a Charisma saving throw against your spell save DC and will focus on other targets if they can.",
        "duration": DUR.d,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You are at the center of a darkness spell for 1 week.",
        "duration": DUR.w,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You are frightened for 1 hour.",
        "duration": DUR.h,
        "effect": {
            "changes": [],
            "statuses": ["frightened"]
        }
    },
    {
        "text": "You are resistant to all damage types for 1 hour.",
        "duration": DUR.h,
        "effect": {
            "changes": [{key: "system.traits.dr.all", mode: MODES.CUSTOM, value: 1}],
            "statuses": []
        }
    },
    {
        "text": "All other creatures within 60 feet of you become poisoned for 1 hour.",
        "duration": DUR.h,
        "effect": {
            "description": "You are poisoned for 1 hour.",
            "changes": [],
            "statuses": ["poisoned"]
        }
    },
    {
        "text": "All other creatures within 60 feet of you become blinded for 1 hour.",
        "duration": DUR.h,
        "effect": {
            "description": "You are blinded for 1 hour.",
            "changes": [],
            "statuses": ["blinded"]
        }
    },
    {
        "text": "All other creatures within 60 feet of you become deafened for 1 hour.",
        "duration": DUR.h,
        "effect": {
            "description": "You are deafened for 1 hour.",
            "changes": [],
            "statuses": ["deafened"]
        }
    },
    {
        "text": "All other creatures within 60 feet of you become invisible for 1 hour.",
        "duration": DUR.h,
        "effect": {
            "description": "You are invisible for 1 hour.",
            "changes": [],
            "statuses": ["invisible"]
        }
    },
    {
        "text": "All other creatures within 60 feet of you become restrained for 1 hour.",
        "duration": DUR.h,
        "effect": {
            "description": "You are restrained for 1 hour.",
            "changes": [],
            "statuses": ["restrained"]
        }
    },
    {
        "text": "You immediately gain 3d100 temporary hit points.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You immediately lose all temporary hit points and drop to 1 hp.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "All attack rolls against you are made with advantage for 1 week.",
        "duration": DUR.w,
        "effect": {
            "changes": [{key: "flags.midi-qol.grants.advantage.attack.all", mode: MODES.CUSTOM, value: 1}],
            "statuses": []
        }
    },
    {
        "text": "All attack rolls against you are made with disadvantage for 1 week.",
        "duration": DUR.w,
        "effect": {
            "changes": [{key: "flags.midi-qol.grants.disadvantage.attack.all", mode: MODES.CUSTOM, value: 1}],
            "statuses": []
        }
    },
    {
        "text": "A demon whose CR is equal to your level appears near you. Make a Charisma saving throw against your own spell save DC. If you make it, the demon is subservient, otherwise, it is hostile. The demon, if not banished or defeated, vanishes after 1 day.",
        "duration": DUR.d,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "All other creatures within 60ft regain 2d8 hit points each. Then you take necrotic damage for the sum of all hit points restored this way.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You can attune to one additional item. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "system.attributes.attunement.max", mode: MODES.ADD, value: 1}],
            "statuses": []
        }
    },
    {
        "text": "You can attune to one fewer item. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "system.attributes.attunement.max", mode: MODES.ADD, value: -1}],
            "statuses": []
        }
    },
    {
        "text": "You immediately drop to 0 hit points and become immune to all damage for 2 rounds.",
        "duration": DUR.r * 2,
        "effect": {
            "changes": [{key: "system.traits.di.all", mode: MODES.CUSTOM, value: 1}],
            "statuses": []
        }
    },
    {
        "text": "Your size is permanently reduced by 1 category.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "macro.execute", mode: MODES.CUSTOM, value: `"daeMacro_sizeChange" -1`}],
            "statuses": []
        }
    },
    {
        "text": "Your size is permanently increased by 1 category.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "macro.execute", mode: MODES.CUSTOM, value: `"daeMacro_sizeChange" 1`}],
            "statuses": []
        }
    },
    {
        "text": "You transform into a medium-sized potted plant for 1 hour, during which time you are considered petrified.",
        "duration": DUR.h,
        "effect": {
            "changes": [],
            "statuses": ["petrified"]
        }
    },
    {
        "text": "1d20 random gems appear near you, worth 5000gp each.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "All creatures within 60ft are knocked prone.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "Whenever you make an ability check using Strength, subtract 1d8 from the result. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "system.abilities.str.bonuses.check", mode: MODES.ADD, value: "-1d8"}],
            "statuses": []
        }
    },
    {
        "text": "Whenever you make an ability check using Dexterity, subtract 1d8 from the result. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "system.abilities.dex.bonuses.check", mode: MODES.ADD, value: "-1d8"}],
            "statuses": []
        }
    },
    {
        "text": "Whenever you make an ability check using Constitution, subtract 1d8 from the result. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "system.abilities.con.bonuses.check", mode: MODES.ADD, value: "-1d8"}],
            "statuses": []
        }
    },
    {
        "text": "Whenever you make an ability check using Intelligence, subtract 1d8 from the result. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "system.abilities.int.bonuses.check", mode: MODES.ADD, value: "-1d8"}],
            "statuses": []
        }
    },
    {
        "text": "Whenever you make an ability check using Wisdom, subtract 1d8 from the result. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "system.abilities.wis.bonuses.check", mode: MODES.ADD, value: "-1d8"}],
            "statuses": []
        }
    },
    {
        "text": "Whenever you make an ability check using Charisma, subtract 1d8 from the result. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "system.abilities.cha.bonuses.check", mode: MODES.ADD, value: "-1d8"}],
            "statuses": []
        }
    },
    {
        "text": "Whenever you make an ability check using Strength, add 1d8 to the result. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "system.abilities.str.bonuses.check", mode: MODES.ADD, value: "1d8"}],
            "statuses": []
        }
    },
    {
        "text": "Whenever you make an ability check using Dexterity, add 1d8 to the result. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "system.abilities.dex.bonuses.check", mode: MODES.ADD, value: "1d8"}],
            "statuses": []
        }
    },
    {
        "text": "Whenever you make an ability check using Constitution, add 1d8 to the result. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "system.abilities.con.bonuses.check", mode: MODES.ADD, value: "1d8"}],
            "statuses": []
        }
    },
    {
        "text": "Whenever you make an ability check using Intelligence, add 1d8 to the result. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "system.abilities.int.bonuses.check", mode: MODES.ADD, value: "1d8"}],
            "statuses": []
        }
    },
    {
        "text": "Whenever you make an ability check using Wisdom, add 1d8 to the result. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "system.abilities.wis.bonuses.check", mode: MODES.ADD, value: "1d8"}],
            "statuses": []
        }
    },
    {
        "text": "Whenever you make an ability check using Charisma, add 1d8 to the result. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "system.abilities.cha.bonuses.check", mode: MODES.ADD, value: "1d8"}],
            "statuses": []
        }
    },
    {
        "text": "For 1 week, other creatures within 60 feet of you cannot cast spells of 6th level or lower.",
        "duration": DUR.w,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You gain the ability to speak one new language of your choice. However, you lose the ability to speak one language you already know. This effect is permanent and cannot be reversed.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You forget one cantrip of your choice. This effect is permanent and cannot be reversed.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You learn one cantrip of your choice. This effect is permanent and cannot be reversed.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You gain an additional spell slot of your highest level. If you do not have spell slots, you instead learn a 3rd level spell of your choice and gain the ability to cast it once per day. This effect is permanent and cannot be reversed.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "During this turn, you can take move and take actions equivalent to taking 5 turns.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "Your maximum hit points are increased by 2d20.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "system.attributes.hp.bonuses.overall", mode: MODES.ADD, value: 0}],
            "statuses": []
        }
    },
    {
        "text": "Your lowest ability score is permanently increased by 4.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "system.abilities.cha.value", mode: MODES.ADD, value: 4}],
            "statuses": []
        }
    },
    {
        "text": "Your highest ability score is permanently reduced by 4.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "system.abilities.cha.value", mode: MODES.ADD, value: -4}],
            "statuses": []
        }
    },
    {
        "text": "You gain proficiency with one weapon or armour of your choice. This effect is permanent and cannot be reversed.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You permanently gain proficiency with one tool of your choice. This effect is permanent and cannot be reversed.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "For 1 hour, you can cast any spell with a casting time of 1 action as a bonus action and you can take the attack as a bonus action.",
        "duration": DUR.h,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You immediately cause 4d4 additional wild magic surges.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "For 1 day, your ranged attacks and spells cannot target anything that's more than 5 feet away from you.",
        "duration": DUR.d,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "All creatures within 60 feet must make a Wisdom saving throw against your spell save DC. Any creature immune to magical sleep automatically succeeds on its saving throw. Those that fail fall asleep for 1 hour.",
        "duration": DUR.h,
        "effect": {
            "description": "You're asleep for 1 hour.",
            "changes": [],
            "statuses": ["sleeping"]
        }
    },
    {
        "text": "For 1 hour, every time you hit a creature with an attack, it is pulled 10ft towards you.",
        "duration": DUR.h,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "For 1 hour, every time you hit a creature with an attack, it is pushed 10ft away from you.",
        "duration": DUR.h,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You jump forward in time exactly 1 minute. From the perspective of everyone else, you simply cease to exist during that time.",
        "duration": DUR.m,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "For 1 hour, each player looses control over their character and instead gains control over the character who's session inspiration they can see. After the effect ends, the characters themselves don't understand what happened.",
        "duration": DUR.h,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "Your walking speed is permanently increased by 30ft.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "system.attributes.movement.walk", mode: MODES.ADD, value: 30}],
            "statuses": []
        }
    },
    {
        "text": "Your walking speed is permanently reduced by 30ft.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [{key: "system.attributes.movement.walk", mode: MODES.ADD, value: -30}],
            "statuses": []
        }
    },
    {
        "text": "Whenever a creature talks to you for the first time during the effect's duration, you flip a coin. If it lands on heads, you punch them in the face, otherwise you hug them. You are not aware of this effect being anything other than you openly expressing your feelings. The effect lasts for 1 week.",
        "duration": DUR.w,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You spot a (1d6: 1=Cat, 2=Pig, 3=Frog, 4=Goat, 5=Chicken, 6=Dog) of CR 0 and firmly believe it to be a reincarnated deity, an embodiment of nature itself, or something similar according to your beliefs. You decide that you need to protect it at all costs and do everything in your power to make sure it is treated with the respect you think it deserves. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "For 1 day, your vocabulary is limited to the words \"Yes\" and \"No\", which you can only scream. During this time you cannot cast spells with verbal components.",
        "duration": DUR.d,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "While asleep, you snore so loudly that no other creature within 1 mile can sleep. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You and everything you're wearing and carrying are instantly, and without warning, transported to the elemental plane of (1d4: 1= fire, 2=water, 3=earth, 4=air). Your companions know exactly where you are.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "For 1 day, you cannot willingly move further than away 30ft from your current location. If you are moved outside this range, you must take any and all actions you can to get back as quickly as possible. For the duration of the effect, your behaviour seems perfectly reasonable to you and you cannot be convinced otherwise.",
        "duration": DUR.d,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "For 1 week, you can only move via jumping, and you cannot choose to jump less than the maximum distance you're able to jump. For the duration of the effect, your behaviour seems perfectly reasonable to you and you cannot be convinced otherwise.",
        "duration": DUR.w,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "For 1 day, you can speak with animals but trying to speak any language will result in you making random animal noises.",
        "duration": DUR.d,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You take 1 damage for every 10gp worth of currency you're carrying.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You gain the ability to breathe water but loose the ability to breathe air for 1 day.",
        "duration": DUR.d,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "For 1 day, everything you say will also be written in the sky as per the Skywrite spell.",
        "duration": DUR.d,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "For 1 day, you can pass through any solid, non-magical wall that is 6 or fewer inches thick.",
        "duration": DUR.d,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "All copper and silver pieces you carry turn into platinum pieces. All other currencies you carry turn to copper pieces.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "Whenever you take a long rest, a corpse of a recently murdered humanoid creature appears in your bed. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "Every time you walk through a door or gate it will slam shut behind you and refuse to let anyone except you through. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "For 1 hour, you are unable to cast spells that cause damage.",
        "duration": DUR.h,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "All your clothing and equipment teleports to the nearest unoccupied space at least 120 feet from you that you can see.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You can only speak while dancing. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You are surrounded by faint, ethereal music. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "Your skin permanently changes color. (1d8: 1=Red, 2=Green, 3=Blue, 4= Purple, 5= Yellow, 6=Grey, 7=White, 8=Black)",
        "duration": DUR.PERM,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "For 1 day, all spells with a casting time of 1 action or 1 bonus action require 2 consecutive actions to cast.",
        "duration": DUR.d,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "While speaking, your tongue is under the effect of the Light spell. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "All liquids within 120ft of you transform into lukewarm water when drunk. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "Some god has taken issue with the last thing you said or did. You immediately take xd12 radiant damage where x is your level.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "Approximately 10000 gallons of water appear over your head and those within 100 feet of you, evenly distributed above everybody within the radius.",
        "duration": DUR.i,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "You are unable to read as the letters all appeared jumbled. This effect is permanent.",
        "duration": DUR.PERM,
        "effect": {
            "changes": [],
            "statuses": []
        }
    },
    {
        "text": "For the next day, everything you say must rhyme. If it doesn't, you take 1d4 psychic damage.",
        "duration": DUR.d,
        "effect": {
            "changes": [],
            "statuses": []
        }
    }
];


const newNewTable = {
    "major": [
        {
            "text": "You are the center of a massive explosion. You and each creature within 60 feet of you must make a Dexterity saving throw against your spell save DC, taking 2d12 force damage for each level of your character on a failed save, or half as much damage on a successful one.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You recover all expended class resources.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are deafened for 1 week.",
            "duration": DUR.w,
            "effect": {
                "changes": [],
                "statuses": ["deafened"]
            }
        },
        {
            "text": "You are silenced for 1 week.",
            "duration": DUR.w,
            "effect": {
                "changes": [],
                "statuses": ["silenced"]
            }
        },
        {
            "text": "You are poisoned for 1 week.",
            "duration": DUR.w,
            "effect": {
                "changes": [],
                "statuses": ["poisoned"]
            }
        },
        {
            "text": "You are invisible for 1 week.",
            "duration": DUR.w,
            "effect": {
                "changes": [],
                "statuses": ["invisible"]
            }
        },
        {
            "text": "Each creature within 60 feet of you takes 2d8 necrotic damage. You regain hit points equal to the sum of damage dealt.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are teleported to an empty demiplane for 1 day before returning to the location you left.",
            "duration": DUR.d,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are protected from creatures from the same plane as the one you're currently on for 1 day. Such creatures cannot attack you or harm you unless they succeed on a Charisma saving throw against your spell save DC and will focus on other targets if they can.",
            "duration": DUR.d,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are at the center of a darkness spell for 1 week.",
            "duration": DUR.w,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are frightened for 1 hour.",
            "duration": DUR.h,
            "effect": {
                "changes": [],
                "statuses": ["frightened"]
            }
        },
        {
            "text": "You are resistant to all damage types for 1 hour.",
            "duration": DUR.h,
            "effect": {
                "changes": [{key: "system.traits.dr.all", mode: MODES.CUSTOM, value: 1}],
                "statuses": []
            }
        },
        {
            "text": "All other creatures within 60 feet of you become poisoned for 1 hour.",
            "duration": DUR.h,
            "effect": {
                "description": "You are poisoned for 1 hour.",
                "changes": [],
                "statuses": ["poisoned"]
            }
        },
        {
            "text": "All other creatures within 60 feet of you become blinded for 1 hour.",
            "duration": DUR.h,
            "effect": {
                "description": "You are blinded for 1 hour.",
                "changes": [],
                "statuses": ["blinded"]
            }
        },
        {
            "text": "All other creatures within 60 feet of you become deafened for 1 hour.",
            "duration": DUR.h,
            "effect": {
                "description": "You are deafened for 1 hour.",
                "changes": [],
                "statuses": ["deafened"]
            }
        },
        {
            "text": "All other creatures within 60 feet of you become invisible for 1 hour.",
            "duration": DUR.h,
            "effect": {
                "description": "You are invisible for 1 hour.",
                "changes": [],
                "statuses": ["invisible"]
            }
        },
        {
            "text": "All other creatures within 60 feet of you become restrained for 1 hour.",
            "duration": DUR.h,
            "effect": {
                "description": "You are restrained for 1 hour.",
                "changes": [],
                "statuses": ["restrained"]
            }
        },
        {
            "text": "You immediately gain 3d100 temporary hit points.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You immediately lose all temporary hit points and drop to 1 hp.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All attack rolls against you are made with advantage for 1 week.",
            "duration": DUR.w,
            "effect": {
                "changes": [{key: "flags.midi-qol.grants.advantage.attack.all", mode: MODES.CUSTOM, value: 1}],
                "statuses": []
            }
        },
        {
            "text": "All attack rolls against you are made with disadvantage for 1 week.",
            "duration": DUR.w,
            "effect": {
                "changes": [{key: "flags.midi-qol.grants.disadvantage.attack.all", mode: MODES.CUSTOM, value: 1}],
                "statuses": []
            }
        },
        {
            "text": "A demon whose CR is equal to your level appears near you. Make a Charisma saving throw against your own spell save DC. If you make it, the demon is subservient, otherwise, it is hostile. The demon, if not banished or defeated, vanishes after 1 day.",
            "duration": DUR.d,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All other creatures within 60ft regain 2d8 hit points each. Then you take necrotic damage for the sum of all hit points restored this way.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You can attune to one additional item. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.attributes.attunement.max", mode: MODES.ADD, value: 1}],
                "statuses": []
            }
        },
        {
            "text": "You can attune to one fewer item. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.attributes.attunement.max", mode: MODES.ADD, value: -1}],
                "statuses": []
            }
        },
        {
            "text": "You immediately drop to 0 hit points and become immune to all damage for 2 rounds.",
            "duration": DUR.r * 2,
            "effect": {
                "changes": [{key: "system.traits.di.all", mode: MODES.CUSTOM, value: 1}],
                "statuses": []
            }
        },
        {
            "text": "Your size is permanently reduced by 1 category.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "macro.execute", mode: MODES.CUSTOM, value: `"daeMacro_sizeChange" -1`}],
                "statuses": []
            }
        },
        {
            "text": "Your size is permanently increased by 1 category.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "macro.execute", mode: MODES.CUSTOM, value: `"daeMacro_sizeChange" 1`}],
                "statuses": []
            }
        },
        {
            "text": "You transform into a medium-sized potted plant for 1 hour, during which time you are considered petrified.",
            "duration": DUR.h,
            "effect": {
                "changes": [],
                "statuses": ["petrified"]
            }
        },
        {
            "text": "1d20 random gems appear near you, worth 5000gp each.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All creatures within 60ft are knocked prone.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Strength, subtract 1d8 from the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.str.bonuses.check", mode: MODES.ADD, value: "-1d8"}],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Dexterity, subtract 1d8 from the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.dex.bonuses.check", mode: MODES.ADD, value: "-1d8"}],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Constitution, subtract 1d8 from the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.con.bonuses.check", mode: MODES.ADD, value: "-1d8"}],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Intelligence, subtract 1d8 from the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.int.bonuses.check", mode: MODES.ADD, value: "-1d8"}],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Wisdom, subtract 1d8 from the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.wis.bonuses.check", mode: MODES.ADD, value: "-1d8"}],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Charisma, subtract 1d8 from the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.cha.bonuses.check", mode: MODES.ADD, value: "-1d8"}],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Strength, add 1d8 to the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.str.bonuses.check", mode: MODES.ADD, value: "1d8"}],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Dexterity, add 1d8 to the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.dex.bonuses.check", mode: MODES.ADD, value: "1d8"}],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Constitution, add 1d8 to the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.con.bonuses.check", mode: MODES.ADD, value: "1d8"}],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Intelligence, add 1d8 to the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.int.bonuses.check", mode: MODES.ADD, value: "1d8"}],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Wisdom, add 1d8 to the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.wis.bonuses.check", mode: MODES.ADD, value: "1d8"}],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Charisma, add 1d8 to the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.cha.bonuses.check", mode: MODES.ADD, value: "1d8"}],
                "statuses": []
            }
        },
        {
            "text": "For 1 week, other creatures within 60 feet of you cannot cast spells of 6th level or lower.",
            "duration": DUR.w,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You gain the ability to speak one new language of your choice. However, you lose the ability to speak one language you already know. This effect is permanent and cannot be reversed.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You forget one cantrip of your choice. This effect is permanent and cannot be reversed.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You learn one cantrip of your choice. This effect is permanent and cannot be reversed.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You gain an additional spell slot of your highest level. If you do not have spell slots, you instead learn a 3rd level spell of your choice and gain the ability to cast it once per day. This effect is permanent and cannot be reversed.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "During this turn, you can take move and take actions equivalent to taking 5 turns.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Your maximum hit points are increased by 2d20.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.attributes.hp.bonuses.overall", mode: MODES.ADD, value: 0}],
                "statuses": []
            }
        },
        {
            "text": "Your lowest ability score is permanently increased by 4.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.cha.value", mode: MODES.ADD, value: 4}],
                "statuses": []
            }
        },
        {
            "text": "Your highest ability score is permanently reduced by 4.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.cha.value", mode: MODES.ADD, value: -4}],
                "statuses": []
            }
        },
        {
            "text": "You gain proficiency with one weapon or armour of your choice. This effect is permanent and cannot be reversed.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You permanently gain proficiency with one tool of your choice. This effect is permanent and cannot be reversed.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 hour, you can cast any spell with a casting time of 1 action as a bonus action and you can take the attack as a bonus action.",
            "duration": DUR.h,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You immediately cause 4d4 additional wild magic surges.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 day, your ranged attacks and spells cannot target anything that's more than 5 feet away from you.",
            "duration": DUR.d,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All creatures within 60 feet must make a Wisdom saving throw against your spell save DC. Any creature immune to magical sleep automatically succeeds on its saving throw. Those that fail fall asleep for 1 hour.",
            "duration": DUR.h,
            "effect": {
                "description": "You're asleep for 1 hour.",
                "changes": [],
                "statuses": ["sleeping"]
            }
        },
        {
            "text": "For 1 hour, every time you hit a creature with an attack, it is pulled 10ft towards you.",
            "duration": DUR.h,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 hour, every time you hit a creature with an attack, it is pushed 10ft away from you.",
            "duration": DUR.h,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You jump forward in time exactly 1 minute. From the perspective of everyone else, you simply cease to exist during that time.",
            "duration": DUR.m,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 hour, each player looses control over their character and instead gains control over the character who's session inspiration they can see. After the effect ends, the characters themselves don't understand what happened.",
            "duration": DUR.h,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Your walking speed is permanently increased by 30ft.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.attributes.movement.walk", mode: MODES.ADD, value: 30}],
                "statuses": []
            }
        },
        {
            "text": "Your walking speed is permanently reduced by 30ft.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.attributes.movement.walk", mode: MODES.ADD, value: -30}],
                "statuses": []
            }
        },
        {
            "text": "Whenever a creature talks to you for the first time during the effect's duration, you flip a coin. If it lands on heads, you punch them in the face, otherwise you hug them. You are not aware of this effect being anything other than you openly expressing your feelings. The effect lasts for 1 week.",
            "duration": DUR.w,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You spot a (1d6: 1=Cat, 2=Pig, 3=Frog, 4=Goat, 5=Chicken, 6=Dog) of CR 0 and firmly believe it to be a reincarnated deity, an embodiment of nature itself, or something similar according to your beliefs. You decide that you need to protect it at all costs and do everything in your power to make sure it is treated with the respect you think it deserves. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 day, your vocabulary is limited to the words \"Yes\" and \"No\", which you can only scream. During this time you cannot cast spells with verbal components.",
            "duration": DUR.d,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "While asleep, you snore so loudly that no other creature within 1 mile can sleep. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You and everything you're wearing and carrying are instantly, and without warning, transported to the elemental plane of (1d4: 1= fire, 2=water, 3=earth, 4=air). Your companions know exactly where you are.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 day, you cannot willingly move further than away 30ft from your current location. If you are moved outside this range, you must take any and all actions you can to get back as quickly as possible. For the duration of the effect, your behaviour seems perfectly reasonable to you and you cannot be convinced otherwise.",
            "duration": DUR.d,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 week, you can only move via jumping, and you cannot choose to jump less than the maximum distance you're able to jump. For the duration of the effect, your behaviour seems perfectly reasonable to you and you cannot be convinced otherwise.",
            "duration": DUR.w,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 day, you can speak with animals but trying to speak any language will result in you making random animal noises.",
            "duration": DUR.d,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You take 1 damage for every 10gp worth of currency you're carrying.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You gain the ability to breathe water but loose the ability to breathe air for 1 day.",
            "duration": DUR.d,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 day, everything you say will also be written in the sky as per the Skywrite spell.",
            "duration": DUR.d,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 day, you can pass through any solid, non-magical wall that is 6 or fewer inches thick.",
            "duration": DUR.d,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All copper and silver pieces you carry turn into platinum pieces. All other currencies you carry turn to copper pieces.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you take a long rest, a corpse of a recently murdered humanoid creature appears in your bed. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Every time you walk through a door or gate it will slam shut behind you and refuse to let anyone except you through. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 hour, you are unable to cast spells that cause damage.",
            "duration": DUR.h,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All your clothing and equipment teleports to the nearest unoccupied space at least 120 feet from you that you can see.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You can only speak while dancing. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are surrounded by faint, ethereal music. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Your skin permanently changes color. (1d8: 1=Red, 2=Green, 3=Blue, 4= Purple, 5= Yellow, 6=Grey, 7=White, 8=Black)",
            "duration": DUR.PERM,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 day, all spells with a casting time of 1 action or 1 bonus action require 2 consecutive actions to cast.",
            "duration": DUR.d,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "While speaking, your tongue is under the effect of the Light spell. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All liquids within 120ft of you transform into lukewarm water when drunk. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Some god has taken issue with the last thing you said or did. You immediately take xd12 radiant damage where x is your level.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Approximately 10000 gallons of water appear over your head and those within 100 feet of you, evenly distributed above everybody within the radius.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are unable to read as the letters all appeared jumbled. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For the next day, everything you say must rhyme. If it doesn't, you take 1d4 psychic damage.",
            "duration": DUR.d,
            "effect": {
                "changes": [],
                "statuses": []
            }
        }
    ],
    "moderate": [
        {
            "text": "You are the center of a moderate explosion. You and each creature within 30 feet of you must make a Dexterity saving throw against your spell save DC, taking 2d10 force damage for each level of your character on a failed save, or half as much damage on a successful one.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You recover half of all expended class resources.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are deafened for 1 day.",
            "duration": DUR.d,
            "effect": {
                "changes": [],
                "statuses": ["deafened"]
            }
        },
        {
            "text": "You are silenced for 1 day.",
            "duration": DUR.d,
            "effect": {
                "changes": [],
                "statuses": ["silenced"]
            }
        },
        {
            "text": "You are poisoned for 1 day.",
            "duration": DUR.d,
            "effect": {
                "changes": [],
                "statuses": ["poisoned"]
            }
        },
        {
            "text": "You are invisible for 1 day.",
            "duration": DUR.d,
            "effect": {
                "changes": [],
                "statuses": ["invisible"]
            }
        },
        {
            "text": "Each creature within 30 feet of you takes 2d6 necrotic damage. You regain hit points equal to the sum of damage dealt.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are teleported to an empty demiplane for 1 minute before returning to the location you left.",
            "duration": DUR.m,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are protected from creatures from the same plane as the one you're currently on for 1 hour. Such creatures cannot attack you or harm you unless they succeed on a Charisma saving throw against your spell save DC  and will focus on other targets if they can.",
            "duration": DUR.h,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are at the center of a darkness spell for 1 day.",
            "duration": DUR.d,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are frightened for 1 minute.",
            "duration": DUR.m,
            "effect": {
                "changes": [],
                "statuses": ["frightened"]
            }
        },
        {
            "text": "You are resistant to all damage types for 1 minute.",
            "duration": DUR.m,
            "effect": {
                "changes": [{key: "system.traits.dr.all", mode: MODES.CUSTOM, value: 1}],
                "statuses": []
            }
        },
        {
            "text": "All other creatures within 60 feet of you become poisoned for 1 minute.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All other creatures within 60 feet of you become blinded for 1 minute.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All other creatures within 60 feet of you become deafened for 1 minute.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All other creatures within 60 feet of you become invisible for 1 minute.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All other creatures within 60 feet of you become restrained for 1 minute.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You immediately gain 3d20 temporary hit points.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You immediately lose any temporary hit points you have and drop to 1d20 hp.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All attack rolls against you are made with advantage for 1 day.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All attack rolls against you are made with disadvantage for 1 day.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 minute, other creatures have advantage on saving throws against spells you cast.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 minute, other creatures have disadvantage on saving throws against spells you cast.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "A demon whose CR is equal to 3/4 of your level appears near you. Make a Charisma saving throw against your own spell save DC. If you make it, the demon is subservient, otherwise, it is hostile. The demon, if not banished or defeated, vanishes after 1 day.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All other creatures within 30ft regain 2d8 hit points each. Then you take necrotic damage for the sum of all hit points restored this way.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 month, your size is reduced by 1 category.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 month, your size is reduced by 1 category.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 month, your size is increased by 1 category.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You transform into a medium-sized potted plant for 1 minute, during which time you are considered petrified.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "1d20 random gems appear near you, worth 500gp each.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All creatures within 30ft are knocked prone.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Strength, subtract 1d4 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Dexterity, subtract 1d4 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Constitution, subtract 1d4 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Intelligence, subtract 1d4 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Wisdom, subtract 1d4 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Charisma, subtract 1d4 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Strength, add 1d4 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Dexterity, add 1d4 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Constitution, add 1d4 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Intelligence, add 1d4 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Wisdom, add 1d4 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Charisma, add 1d4 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 week, no creature within 30ft of you can cast spells of 3th level or lower.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "During this turn, you can take move and take actions equivalent to taking 3 turns.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Your maximum hit points are permanently increased by 2d10.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Your lowest ability score is permanently increased by 2.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Your highest ability score is permanently reduced by 2.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 minute, you can cast any spell with a casting time of 1 action as a bonus action and you can take the attack as a bonus action.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You immediately cause 2d4 additional wild magic surges.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 hour min, ranged attacks or spells with a range of more than touch, have a range of melee or touch instead.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All creatures within 30 feet must make a Wisdom saving throw against your spell save DC. Any creature immune to magical sleep automatically succeeds on its saving throw. Those that fail fall asleep for 1 minute.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 minute, every time you hit a creature with an attack, it is pulled 10ft towards you.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 minute, every time you hit a creature with an attack, it is pushed 10ft away from you.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You jump forward in time exactly 30 seconds. From the perspective of everyone else, you simply cease to exist during that time.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 minute, each player looses control over their character and instead gains control over the character who's session inspiration they can see. After the effect ends, the characters themselves don't understand what happened.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Your walking speed is permanently increased by 20ft.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Your walking speed is permanently decreased by 20ft.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever a creature talks to you for the first time during the effect's duration, you flip a coin. If it lands on heads, you punch them in the face, otherwise you hug them. You are not aware of this effect being anything other than you openly expressing your feelings. The effect lasts for 1 day.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 hour, your vocabulary is limited to the words \"Yes\" and \"No\", which you can only scream. During this time you cannot cast spells with verbal components.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "While asleep, you snore so loudly that no other creature within 1000ft can sleep.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You and everything you're wearing and carrying are instantly, and without warning, transported to (1d3: 1=the astral plane, 2=the etherial plane, 3=your childhood home). Your companions know exactly where you are.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 hour, you cannot willingly move further than away 30ft from your current location. If you are moved outside this range, you must take any and all actions you can to get back as quickly as possible. Behaving like this seems perfectly reasonable to you.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 day, you can only move via jumping, and you cannot choose to jump less than the maximum distance you're able to jump.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 hour, you can speak with animals but trying to speak any language will result in you making random animal noises.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You take 1 damage for every 100gp worth of currency you're carrying.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You gain the ability to breathe water but loose the ability to breathe air for 1 hour.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 hour, everything you say will also be written in the sky as per the Skywrite spell.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 hour, you can pass through any solid, non-magical wall that is 6 or fewer inches thick.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you take a long rest, a severed head appears in your bed. The head belongs to a humanoid creature that was recently murdered.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 week, every time you walk through a door or gate it will slam shut behind you and refuse to let anyone except you through.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 minute, you are unable to cast any spell that causes damage of any type.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You immediately lose all unspent class resources and may not regain them until you have finished a long rest.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All your clothing and equipment teleports to the nearest unoccupied space at least 60 feet from you that you can see.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 week, you can only speak while music is playing.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 week, you are surrounded by faint, ethereal music.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Your hair permanently changes color. (1d8: 1=Red, 2=Green, 3=Blue, 4= Purple, 5= Yellow, 6=Grey, 7=White, 8=Black)",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 hour, all spells  with a casting time of 1 action or 1 bonus action require 2 consecutive actions to cast.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For one day, while you're speaking you gain the effect of the Light spell.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All beverages within 30ft of you transform into lukewarm water when drunk.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 week, every time you say a word that begins with an 's', it sounds like you're hissing like a snake.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Some god has taken issue with the last thing you said or did. You immediately take 5d10 radiant damage.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Approximately 1000 gallons of water appear over your head and those within 100 feet of you, evenly distributed above everybody within the radius.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For week day, you are unable to read as the letters all appeared jumbled.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For the next hour, everything you say must rhyme. If it doesn't, you take 1d4 psychic damage.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        }
    ],
    "minor": [
        {
            "text": "You are the center of a small explosion. You and each creature within 10 feet of you must make a Dexterity saving throw against your spell save DC, taking 2d8 force damage for each level of your character on a failed save, or half as much damage on a successful one.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You recover a single expended class resource.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are deafened for 1 hour.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are silenced for 1 hour.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are poisoned for 1 hour.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are invisible for 1 hour.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Each creature within 10 feet of you takes 2d4 necrotic damage. You regain hit points equal to the sum of damage dealt.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are teleported to an empty demiplane for 1 round before returning to the location you left.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are protected from creatures from the same plane as the one you're currently on for 1 minute. Such creatures cannot attack you or harm you unless they succeed on a Charisma saving throw against your spell save DC  and will focus on other targets if they can.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are at the center of a darkness spell for 1 hour.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are frightened by the nearest creature for 1 round.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You are resistant to all damage types for 1 round.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All other creatures within 60 feet of you become poisoned for 1 round.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All other creatures within 60 feet of you become blinded for 1 round.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All other creatures within 60 feet of you become deafened for 1 round.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All other creatures within 60 feet of you become invisible for 1 round.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All other creatures within 60 feet of you become restrained for 1 round.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You immediately gain 3d12 temporary hit points.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You immediately lose any temporary hit points you have and drop to 1d100 hp.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All attack rolls against you are made with advantage for 1 hour.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All attack rolls against you are made with disadvantage for 1 hour.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 round, other creatures have advantage on saving throws against spells you cast.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 round, other creatures have disadvantage on saving throws against spells you cast.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "A demon whose CR is equal to 1/2 of your level appears near you. Make a Charisma saving throw against your own spell save DC. If you make it, the demon is subservient, otherwise, it is hostile. The demon, if not banished or defeated, vanishes after 1 day.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All other creatures within 10ft regain 2d8 hit points each. Then you take necrotic damage for the sum of all hit points restored this way.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 week, your size is reduced by 1 category.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 week, your size is increased by 1 category.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You transform into a medium-sized potted plant for 1 round, during which time you are considered petrified.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "1d20 random gems appear near you, worth 50gp each.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All creatures within 10ft are knocked prone.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Strength, subtract 1 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Dexterity, subtract 1 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Constitution, subtract 1 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Intelligence, subtract 1 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Wisdom, subtract 1 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Charisma, subtract 1 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Strength, add 1 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Dexterity, add 1 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Constitution, add 1 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Intelligence, add 1 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Wisdom, add 1 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you make an ability check using Charisma, add 1 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 week, no creature within 10ft of you can cast spells of 1st level or lower.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "During this turn, you can take move and take actions equivalent to taking 2 turns.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Your maximum hit points are permanently increased by 1d10.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Your lowest ability score is permanently increased by 1.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Your highest ability score is permanently reduced by 1.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 round, you can cast any spell with a casting time of 1 action as a bonus action and you can take the attack as a bonus action.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You immediately cause 2 additional wild magic surges.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 minute min, ranged attacks or spells with a range of more than touch, have a range of melee or touch instead.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All creatures within 60 feet must make a Wisdom saving throw against your spell save DC. Any creature immune to magical sleep automatically succeeds on its saving throw. Those that fail fall asleep for 1 round.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 round, every time you hit a creature with an attack, it is pulled 10ft towards you.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 round, every time you hit a creature with an attack, it is pushed 10ft away from you.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You jump forward in time exactly 6 seconds. From the perspective of everyone else, you simply cease to exist during that time.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 round, each player looses control over their character and instead gains control over the character who's session inspiration they can see. After the effect ends, the characters themselves don't understand what happened.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Your walking speed is permanently increased by 10ft.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Your walking speed is permanently decreased by 10ft.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever a creature talks to you for the first time during the effect's duration, you flip a coin. If it lands on heads, you punch them in the face, otherwise you hug them. You are not aware of this effect being anything other than you openly expressing your feelings. The effect lasts for 1 hour.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 minute, your vocabulary is limited to the words \"Yes\" and \"No\", which you can only scream. During this time you cannot cast spells with verbal components.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "While asleep, you snore so loudly that no other creature within 100ft can sleep.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You and everything you're wearing and carrying are instantly, and without warning, transported to the place where you last took a long rest. Your companions know exactly where you are.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 minute, you cannot willingly move further than away 30ft from your current location. If you are moved outside this range, you must take any and all actions you can to get back as quickly as possible. Behaving like this seems perfectly reasonable to you.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 hour, you can only move via jumping, and you cannot choose to jump less than the maximum distance you're able to jump.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 minute, you can speak with animals but trying to speak any language will result in you making random animal noises.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You take 1 damage for every 1000gp worth of currency you're carrying.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You gain the ability to breathe water but loose the ability to breathe air for 1 minute.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 minute, everything you say will also be written in the sky as per the Skywrite spell.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 minute, you can pass through any solid, non-magical wall that is 6 or fewer inches thick.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Whenever you take a long rest, a severed hand appears in your bed. The hand belongs to a humanoid creature that was recently murdered.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 day, every time you walk through a door or gate it will slam shut behind you and refuse to let anyone except you through.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 round, you are unable to cast any spell that causes damage of any type.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All your clothing and equipment teleports to the nearest unoccupied space at least 30 feet from you that you can see.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 day, you can only speak while music is playing.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 day, you are surrounded by faint, ethereal music.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Your eyes permanently change color. (1d8: 1=Red, 2=Green, 3=Blue, 4= Purple, 5= Yellow, 6=Grey, 7=White, 8=Black)",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 minute, all spells  with a casting time of 1 action or 1 bonus action require 2 consecutive actions to cast.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 minute, while you're speaking you gain the effect of the Light spell.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "All beverages within 10ft of you transform into lukewarm water when drunk.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 day, every time you say a word that begins with an 's', it sounds like you're hissing like a snake.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Some god has taken issue with the last thing you said or did. You immediately take 1d8 radiant damage.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "Approximately 100 gallons of water appear over your head and those within 10 feet of you, evenly distributed above everybody within the radius.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "You permanently gain the ability to talk to nonexistent things.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For 1 day, you are unable to read as the letters all appeared jumbled.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        {
            "text": "For the next minute, everything you say must rhyme. If it doesn't, you take 1d4 psychic damage.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        }
    ]
}


const newTable = {
    "major": {
        "1": {
            "text": "You are the center of a massive explosion. You and each creature within 60 feet of you must make a Dexterity saving throw against your spell save DC, taking 2d12 force damage for each level of your character on a failed save, or half as much damage on a successful one.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "2": {
            "text": "You recover all expended class resources.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "3": {
            "text": "You are deafened for 1 week.",
            "duration": DUR.w,
            "effect": {
                "changes": [],
                "statuses": ["deafened"]
            }
        },
        "4": {
            "text": "You are silenced for 1 week.",
            "duration": DUR.w,
            "effect": {
                "changes": [],
                "statuses": ["silenced"]
            }
        },
        "5": {
            "text": "You are poisoned for 1 week.",
            "duration": DUR.w,
            "effect": {
                "changes": [],
                "statuses": ["poisoned"]
            }
        },
        "6": {
            "text": "You are invisible for 1 week.",
            "duration": DUR.w,
            "effect": {
                "changes": [],
                "statuses": ["invisible"]
            }
        },
        "7": {
            "text": "Each creature within 60 feet of you takes 2d8 necrotic damage. You regain hit points equal to the sum of damage dealt.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "8": {
            "text": "You are teleported to an empty demiplane for 1 day before returning to the location you left.",
            "duration": DUR.d,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "9": {
            "text": "You are protected from creatures from the same plane as the one you're currently on for 1 day. Such creatures cannot attack you or harm you unless they succeed on a Charisma saving throw against your spell save DC and will focus on other targets if they can.",
            "duration": DUR.d,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "10": {
            "text": "You are at the center of a darkness spell for 1 week.",
            "duration": DUR.w,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "11": {
            "text": "You are frightened by the nearest creature for 1 hour.",
            "duration": DUR.h,
            "effect": {
                "changes": [],
                "statuses": ["frightened"]
            }
        },
        "12": {
            "text": "You are resistant to all damage types for 1 hour.",
            "duration": DUR.h,
            "effect": {
                "changes": [{key: "system.traits.dr.all", mode: MODES.CUSTOM, value: 1}],
                "statuses": []
            }
        },
        "13": {
            "text": "All other creatures within 60 feet of you become poisoned for 1 hour.",
            "duration": DUR.h,
            "effect": {
                "changes": [],
                "statuses": ["poisoned"]
            }
        },
        "14": {
            "text": "All other creatures within 60 feet of you become blinded for 1 hour.",
            "duration": DUR.h,
            "effect": {
                "changes": [],
                "statuses": ["blinded"]
            }
        },
        "15": {
            "text": "All other creatures within 60 feet of you become deafened for 1 hour.",
            "duration": DUR.h,
            "effect": {
                "changes": [],
                "statuses": ["deafened"]
            }
        },
        "16": {
            "text": "All other creatures within 60 feet of you become invisible for 1 hour.",
            "duration": DUR.h,
            "effect": {
                "changes": [],
                "statuses": ["invisible"]
            }
        },
        "17": {
            "text": "All other creatures within 60 feet of you become restrained for 1 hour.",
            "duration": DUR.h,
            "effect": {
                "changes": [],
                "statuses": ["restrained"]
            }
        },
        "18": {
            "text": "You immediately gain 3d100 temporary hit points.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "19": {
            "text": "You immediately lose all temporary hit points and drop to 1 hp.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "20": {
            "text": "All attack rolls against you are made with advantage for 1 week.",
            "duration": DUR.w,
            "effect": {
                "changes": [{key: "flags.midi-qol.grants.advantage.attack.all", mode: MODES.CUSTOM, value: 1}],
                "statuses": []
            }
        },
        "21": {
            "text": "All attack rolls against you are made with disadvantage for 1 week.",
            "duration": DUR.w,
            "effect": {
                "changes": [{key: "flags.midi-qol.grants.disadvantage.attack.all", mode: MODES.CUSTOM, value: 1}],
                "statuses": []
            }
        },
        "24": {
            "text": "A demon whose CR is equal to your level appears near you. Make a Charisma saving throw against your own spell save DC. If you make it, the demon is subservient, otherwise, it is hostile. The demon, if not banished or defeated, vanishes after 1 day.",
            "duration": DUR.d,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "25": {
            "text": "All other creatures within 60ft regain 2d8 hit points each. Then you take necrotic damage for the sum of all hit points restored this way.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "26": {
            "text": "You can attune to one additional item. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.attributes.attunement.max", mode: MODES.ADD, value: 1}],
                "statuses": []
            }
        },
        "27": {
            "text": "You can attune to one fewer item. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.attributes.attunement.max", mode: MODES.ADD, value: -1}],
                "statuses": []
            }
        },
        "28": {
            "text": "You immediately drop to 0 hit points and become immune to all damage for 2 rounds.",
            "duration": DUR.r * 2,
            "effect": {
                "changes": [{key: "system.traits.di.all", mode: MODES.CUSTOM, value: 1}],
                "statuses": []
            }
        },
        "29": {
            "text": "Your size is permanently reduced by 1 category.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "macro.execute", mode: MODES.CUSTOM, value: `"daeMacro_sizeChange" -1`}],
                "statuses": []
            }
        },
        "30": {
            "text": "Your size is permanently increased by 1 category.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "macro.execute", mode: MODES.CUSTOM, value: `"daeMacro_sizeChange" 1`}],
                "statuses": []
            }
        },
        "31": {
            "text": "You transform into a medium-sized potted plant for 1 hour, during which time you are considered petrified.",
            "duration": DUR.h,
            "effect": {
                "changes": [],
                "statuses": ["petrified"]
            }
        },
        "32": {
            "text": "1d20 random gems appear near you, worth 5000gp each.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "33": {
            "text": "All creatures within 60ft are knocked prone.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "34": {
            "text": "Whenever you make an ability check using Strength, subtract 1d8 from the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.str.bonuses.check", mode: MODES.ADD, value: "-1d8"}],
                "statuses": []
            }
        },
        "35": {
            "text": "Whenever you make an ability check using Dexterity, subtract 1d8 from the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.dex.bonuses.check", mode: MODES.ADD, value: "-1d8"}],
                "statuses": []
            }
        },
        "36": {
            "text": "Whenever you make an ability check using Constitution, subtract 1d8 from the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.CON.bonuses.check", mode: MODES.ADD, value: "-1d8"}],
                "statuses": []
            }
        },
        "37": {
            "text": "Whenever you make an ability check using Intelligence, subtract 1d8 from the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.INT.bonuses.check", mode: MODES.ADD, value: "-1d8"}],
                "statuses": []
            }
        },
        "38": {
            "text": "Whenever you make an ability check using Wisdom, subtract 1d8 from the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.dWIS.bonuses.check", mode: MODES.ADD, value: "-1d8"}],
                "statuses": []
            }
        },
        "39": {
            "text": "Whenever you make an ability check using Charisma, subtract 1d8 from the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.cha.bonuses.check", mode: MODES.ADD, value: "-1d8"}],
                "statuses": []
            }
        },
        "40": {
            "text": "Whenever you make an ability check using Strength, add 1d8 to the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.str.bonuses.check", mode: MODES.ADD, value: "1d8"}],
                "statuses": []
            }
        },
        "41": {
            "text": "Whenever you make an ability check using Dexterity, add 1d8 to the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.dex.bonuses.check", mode: MODES.ADD, value: "1d8"}],
                "statuses": []
            }
        },
        "42": {
            "text": "Whenever you make an ability check using Constitution, add 1d8 to the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.CON.bonuses.check", mode: MODES.ADD, value: "1d8"}],
                "statuses": []
            }
        },
        "43": {
            "text": "Whenever you make an ability check using Intelligence, add 1d8 to the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.int.bonuses.check", mode: MODES.ADD, value: "1d8"}],
                "statuses": []
            }
        },
        "44": {
            "text": "Whenever you make an ability check using Wisdom, add 1d8 to the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.wis.bonuses.check", mode: MODES.ADD, value: "1d8"}],
                "statuses": []
            }
        },
        "45": {
            "text": "Whenever you make an ability check using Charisma, add 1d8 to the result. This effect is permanent.",
            "duration": DUR.PERM,
            "effect": {
                "changes": [{key: "system.abilities.cha.bonuses.check", mode: MODES.ADD, value: "1d8"}],
                "statuses": []
            }
        },
        "46": {
            "text": "For 1 week, no creature within 60ft of you can cast spells of 6th level or lower.",
            "duration": DUR.w,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "47": {
            "text": "You gain the ability to speak one new language of your choice. However, you lose the ability to speak one language you already know.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "48": {
            "text": "You forget one cantrip of your choice.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "49": {
            "text": "You learn one cantrip of your choice.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "50": {
            "text": "You gain an additional spell slot of your highest level. If you do not have spell slots, you instead learn a 3rd level spell of your choice and gain the ability to cast it once per day.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "51": {
            "text": "During this turn, you can move and take actions equivalent to taking 5 turns.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "52": {
            "text": "Your maximum hit points are permanently increased by 2d20.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "53": {
            "text": "Your lowest ability score is permanently increased by 4.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "54": {
            "text": "Your highest ability score is permanently reduced by 4.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "55": {
            "text": "You permanently gain proficiency with one weapon or armour of your choice.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "56": {
            "text": "You permanently gain proficiency with one tool of your choice.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "57": {
            "text": "For 1 hour, you can cast any spell with a casting time of 1 action as a bonus action and you can take the attack as a bonus action.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "58": {
            "text": "You immediately cause 4d4 additional wild magic surges.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "59": {
            "text": "For 1 day min, ranged attacks or spells with a range of more than touch, have a range of melee or touch instead.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "60": {
            "text": "All creatures within 60 feet must make a Wisdom saving throw against your spell save DC. Any creature immune to magical sleep automatically succeeds on its saving throw. Those that fail fall asleep for 1 hour.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "61": {
            "text": "For 1 hour, every time you hit a creature with an attack, it is pulled 10ft towards you.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "62": {
            "text": "For 1 hour, every time you hit a creature with an attack, it is pushed 10ft away from you.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "63": {
            "text": "You jump forward in time exactly 1 minute. From the perspective of everyone else, you simply cease to exist during that time.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "64": {
            "text": "For 1 hour, each player looses control over their character and instead gains control over the character who's session inspiration they can see. After the effect ends, the characters themselves don't understand what happened.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "65": {
            "text": "Your walking speed is permanently increased by 30ft.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "66": {
            "text": "Your walking speed is permanently decreased by 30ft.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "67": {
            "text": "Whenever a creature talks to you for the first time during the effect's duration, you flip a coin. If it lands on heads, you punch them in the face, otherwise you hug them. You are not aware of this effect being anything other than you openly expressing your feelings. The effect lasts for 1 week.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "68": {
            "text": "You spot a (1d6: 1=Cat, 2=Pig, 3=Frog, 4=Goat, 5=Chicken, 6=Dog) of CR 0 and firmly believe it to be a reincarnated deity, an embodiment of nature itself, or something similar according to your beliefs. You decide that you need to protect it at all costs and do everything in your power to make sure it is treated with the respect you think it deserves.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "69": {
            "text": "For 1 day, your vocabulary is limited to the words \"Yes\" and \"No\", which you can only scream. During this time you cannot cast spells with verbal components.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "70": {
            "text": "While asleep, you snore so loudly that no other creature within 1 mile can sleep.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "71": {
            "text": "You and everything you're wearing and carrying are instantly, and without warning, transported to the elemental plane of (1d4: 1= fire, 2=water, 3=earth, 4=air). Your companions know exactly where you are.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "72": {
            "text": "For 1 day, you cannot willingly move further than away 30ft from your current location. If you are moved outside this range, you must take any and all actions you can to get back as quickly as possible. Behaving like this seems perfectly reasonable to you.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "73": {
            "text": "For 1 week, you can only move via jumping, and you cannot choose to jump less than the maximum distance you're able to jump.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "74": {
            "text": "For 1 day, you can speak with animals but trying to speak any language will result in you making random animal noises.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "75": {
            "text": "You take 1 damage for every 10gp worth of currency you're carrying.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "76": {
            "text": "You gain the ability to breathe water but loose the ability to breathe air for 1 day.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "77": {
            "text": "For 1 day, everything you say will also be written in the sky as per the Skywrite spell.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "78": {
            "text": "For 1 day, you can pass through any solid, non-magical wall that is 6 or fewer inches thick.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "79": {
            "text": "All copper and silver pieces you carry turn into platinum pieces. All other currencies you carry turn to copper pieces.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "80": {
            "text": "Whenever you take a long rest, a corpse of a recently murdered humanoid creature appears in your bed.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "81": {
            "text": "Every time you walk through a door or gate it will slam shut behind you and refuse to let anyone except you through.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "82": {
            "text": "For 1 hour, you are unable to cast any spell that causes damage of any type.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "83": {
            "text": "All your clothing and equipment teleports to the nearest unoccupied space at least 120 feet from you that you can see.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "84": {
            "text": "You can only speak while music is playing.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "85": {
            "text": "You are surrounded by faint, ethereal music.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "86": {
            "text": "Your skin permanently changes color. (1d8: 1=Red, 2=Green, 3=Blue, 4= Purple, 5= Yellow, 6=Grey, 7=White, 8=Black)",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "87": {
            "text": "For 1 day, all spells  with a casting time of 1 action or 1 bonus action require 2 consecutive actions to cast.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "88": {
            "text": "For 1 day, while you're speaking you gain the effect of the Light spell.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "89": {
            "text": "All beverages within 120ft of you transform into lukewarm water when drunk.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "90": {
            "text": "Some god has taken issue with the last thing you said or did. You immediately take 10d12 radiant damage.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "91": {
            "text": "Approximately 10000 gallons of water appear over your head and those within 1000 feet of you, evenly distributed above everybody within the radius.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "92": {
            "text": "You are unable to read as the letters all appeared jumbled.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "93": {
            "text": "For the next day, everything you say must rhyme. If it doesn't, you take 1d4 psychic damage.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        }
    },
    "moderate": {
        "1": {
            "text": "You are the center of a moderate explosion. You and each creature within 30 feet of you must make a Dexterity saving throw against your spell save DC, taking 2d10 force damage for each level of your character on a failed save, or half as much damage on a successful one.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "2": {
            "text": "You recover half of all expended class resources.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "3": {
            "text": "You are deafened for 1 day.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "4": {
            "text": "You are silenced for 1 day.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "5": {
            "text": "You are poisoned for 1 day.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "6": {
            "text": "You are invisible for 1 day.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "7": {
            "text": "Each creature within 30 feet of you takes 2d6 necrotic damage. You regain hit points equal to the sum of damage dealt.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "8": {
            "text": "You are teleported to an empty demiplane for 1 minute before returning to the location you left.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "9": {
            "text": "You are protected from creatures from the same plane as the one you're currently on for 1 hour. Such creatures cannot attack you or harm you unless they succeed on a Charisma saving throw against your spell save DC  and will focus on other targets if they can.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "10": {
            "text": "You are at the center of a darkness spell for 1 day.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "11": {
            "text": "You are frightened by the nearest creature for 1 minute.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "12": {
            "text": "You are resistant to all damage types for 1 minute.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "13": {
            "text": "All other creatures within 60 feet of you become poisoned for 1 minute.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "14": {
            "text": "All other creatures within 60 feet of you become blinded for 1 minute.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "15": {
            "text": "All other creatures within 60 feet of you become deafened for 1 minute.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "16": {
            "text": "All other creatures within 60 feet of you become invisible for 1 minute.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "17": {
            "text": "All other creatures within 60 feet of you become restrained for 1 minute.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "18": {
            "text": "You immediately gain 3d20 temporary hit points.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "19": {
            "text": "You immediately lose any temporary hit points you have and drop to 1d20 hp.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "20": {
            "text": "All attack rolls against you are made with advantage for 1 day.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "21": {
            "text": "All attack rolls against you are made with disadvantage for 1 day.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "22": {
            "text": "For 1 minute, other creatures have advantage on saving throws against spells you cast.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "23": {
            "text": "For 1 minute, other creatures have disadvantage on saving throws against spells you cast.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "24": {
            "text": "A demon whose CR is equal to 3/4 of your level appears near you. Make a Charisma saving throw against your own spell save DC. If you make it, the demon is subservient, otherwise, it is hostile. The demon, if not banished or defeated, vanishes after 1 day.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "25": {
            "text": "All other creatures within 30ft regain 2d8 hit points each. Then you take necrotic damage for the sum of all hit points restored this way.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "26": {
            "text": "For 1 month, your size is reduced by 1 category.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "27": {
            "text": "For 1 month, your size is reduced by 1 category.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "28": {
            "text": "For 1 month, your size is increased by 1 category.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "29": {
            "text": "You transform into a medium-sized potted plant for 1 minute, during which time you are considered petrified.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "30": {
            "text": "1d20 random gems appear near you, worth 500gp each.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "31": {
            "text": "All creatures within 30ft are knocked prone.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "32": {
            "text": "Whenever you make an ability check using Strength, subtract 1d4 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "33": {
            "text": "Whenever you make an ability check using Dexterity, subtract 1d4 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "34": {
            "text": "Whenever you make an ability check using Constitution, subtract 1d4 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "35": {
            "text": "Whenever you make an ability check using Intelligence, subtract 1d4 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "36": {
            "text": "Whenever you make an ability check using Wisdom, subtract 1d4 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "37": {
            "text": "Whenever you make an ability check using Charisma, subtract 1d4 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "38": {
            "text": "Whenever you make an ability check using Strength, add 1d4 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "39": {
            "text": "Whenever you make an ability check using Dexterity, add 1d4 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "40": {
            "text": "Whenever you make an ability check using Constitution, add 1d4 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "41": {
            "text": "Whenever you make an ability check using Intelligence, add 1d4 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "42": {
            "text": "Whenever you make an ability check using Wisdom, add 1d4 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "43": {
            "text": "Whenever you make an ability check using Charisma, add 1d4 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "44": {
            "text": "For 1 week, no creature within 30ft of you can cast spells of 3th level or lower.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "45": {
            "text": "During this turn, you can take move and take actions equivalent to taking 3 turns.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "46": {
            "text": "Your maximum hit points are permanently increased by 2d10.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "47": {
            "text": "Your lowest ability score is permanently increased by 2.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "48": {
            "text": "Your highest ability score is permanently reduced by 2.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "49": {
            "text": "For 1 minute, you can cast any spell with a casting time of 1 action as a bonus action and you can take the attack as a bonus action.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "50": {
            "text": "You immediately cause 2d4 additional wild magic surges.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "51": {
            "text": "For 1 hour min, ranged attacks or spells with a range of more than touch, have a range of melee or touch instead.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "52": {
            "text": "All creatures within 30 feet must make a Wisdom saving throw against your spell save DC. Any creature immune to magical sleep automatically succeeds on its saving throw. Those that fail fall asleep for 1 minute.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "53": {
            "text": "For 1 minute, every time you hit a creature with an attack, it is pulled 10ft towards you.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "54": {
            "text": "For 1 minute, every time you hit a creature with an attack, it is pushed 10ft away from you.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "55": {
            "text": "You jump forward in time exactly 30 seconds. From the perspective of everyone else, you simply cease to exist during that time.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "56": {
            "text": "For 1 minute, each player looses control over their character and instead gains control over the character who's session inspiration they can see. After the effect ends, the characters themselves don't understand what happened.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "57": {
            "text": "Your walking speed is permanently increased by 20ft.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "58": {
            "text": "Your walking speed is permanently decreased by 20ft.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "59": {
            "text": "Whenever a creature talks to you for the first time during the effect's duration, you flip a coin. If it lands on heads, you punch them in the face, otherwise you hug them. You are not aware of this effect being anything other than you openly expressing your feelings. The effect lasts for 1 day.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "60": {
            "text": "For 1 hour, your vocabulary is limited to the words \"Yes\" and \"No\", which you can only scream. During this time you cannot cast spells with verbal components.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "61": {
            "text": "While asleep, you snore so loudly that no other creature within 1000ft can sleep.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "62": {
            "text": "You and everything you're wearing and carrying are instantly, and without warning, transported to (1d3: 1=the astral plane, 2=the etherial plane, 3=your childhood home). Your companions know exactly where you are.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "63": {
            "text": "For 1 hour, you cannot willingly move further than away 30ft from your current location. If you are moved outside this range, you must take any and all actions you can to get back as quickly as possible. Behaving like this seems perfectly reasonable to you.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "64": {
            "text": "For 1 day, you can only move via jumping, and you cannot choose to jump less than the maximum distance you're able to jump.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "65": {
            "text": "For 1 hour, you can speak with animals but trying to speak any language will result in you making random animal noises.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "66": {
            "text": "You take 1 damage for every 100gp worth of currency you're carrying.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "67": {
            "text": "You gain the ability to breathe water but loose the ability to breathe air for 1 hour.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "68": {
            "text": "For 1 hour, everything you say will also be written in the sky as per the Skywrite spell.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "69": {
            "text": "For 1 hour, you can pass through any solid, non-magical wall that is 6 or fewer inches thick.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "70": {
            "text": "Whenever you take a long rest, a severed head appears in your bed. The head belongs to a humanoid creature that was recently murdered.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "71": {
            "text": "For 1 week, every time you walk through a door or gate it will slam shut behind you and refuse to let anyone except you through.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "72": {
            "text": "For 1 minute, you are unable to cast any spell that causes damage of any type.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "73": {
            "text": "You immediately lose all unspent class resources and may not regain them until you have finished a long rest.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "74": {
            "text": "All your clothing and equipment teleports to the nearest unoccupied space at least 60 feet from you that you can see.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "75": {
            "text": "For 1 week, you can only speak while music is playing.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "76": {
            "text": "For 1 week, you are surrounded by faint, ethereal music.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "77": {
            "text": "Your hair permanently changes color. (1d8: 1=Red, 2=Green, 3=Blue, 4= Purple, 5= Yellow, 6=Grey, 7=White, 8=Black)",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "78": {
            "text": "For 1 hour, all spells  with a casting time of 1 action or 1 bonus action require 2 consecutive actions to cast.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "79": {
            "text": "For one day, while you're speaking you gain the effect of the Light spell.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "80": {
            "text": "All beverages within 30ft of you transform into lukewarm water when drunk.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "81": {
            "text": "For 1 week, every time you say a word that begins with an 's', it sounds like you're hissing like a snake.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "82": {
            "text": "Some god has taken issue with the last thing you said or did. You immediately take 5d10 radiant damage.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "83": {
            "text": "Approximately 1000 gallons of water appear over your head and those within 100 feet of you, evenly distributed above everybody within the radius.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "84": {
            "text": "For week day, you are unable to read as the letters all appeared jumbled.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "85": {
            "text": "For the next hour, everything you say must rhyme. If it doesn't, you take 1d4 psychic damage.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        }
    },
    "minor": {
        "1": {
            "text": "You are the center of a small explosion. You and each creature within 10 feet of you must make a Dexterity saving throw against your spell save DC, taking 2d8 force damage for each level of your character on a failed save, or half as much damage on a successful one.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "2": {
            "text": "You recover a single expended class resource.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "3": {
            "text": "You are deafened for 1 hour.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "4": {
            "text": "You are silenced for 1 hour.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "5": {
            "text": "You are poisoned for 1 hour.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "6": {
            "text": "You are invisible for 1 hour.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "7": {
            "text": "Each creature within 10 feet of you takes 2d4 necrotic damage. You regain hit points equal to the sum of damage dealt.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "8": {
            "text": "You are teleported to an empty demiplane for 1 round before returning to the location you left.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "9": {
            "text": "You are protected from creatures from the same plane as the one you're currently on for 1 minute. Such creatures cannot attack you or harm you unless they succeed on a Charisma saving throw against your spell save DC  and will focus on other targets if they can.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "10": {
            "text": "You are at the center of a darkness spell for 1 hour.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "11": {
            "text": "You are frightened by the nearest creature for 1 round.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "12": {
            "text": "You are resistant to all damage types for 1 round.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "13": {
            "text": "All other creatures within 60 feet of you become poisoned for 1 round.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "14": {
            "text": "All other creatures within 60 feet of you become blinded for 1 round.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "15": {
            "text": "All other creatures within 60 feet of you become deafened for 1 round.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "16": {
            "text": "All other creatures within 60 feet of you become invisible for 1 round.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "17": {
            "text": "All other creatures within 60 feet of you become restrained for 1 round.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "18": {
            "text": "You immediately gain 3d12 temporary hit points.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "19": {
            "text": "You immediately lose any temporary hit points you have and drop to 1d100 hp.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "20": {
            "text": "All attack rolls against you are made with advantage for 1 hour.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "21": {
            "text": "All attack rolls against you are made with disadvantage for 1 hour.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "22": {
            "text": "For 1 round, other creatures have advantage on saving throws against spells you cast.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "23": {
            "text": "For 1 round, other creatures have disadvantage on saving throws against spells you cast.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "24": {
            "text": "A demon whose CR is equal to 1/2 of your level appears near you. Make a Charisma saving throw against your own spell save DC. If you make it, the demon is subservient, otherwise, it is hostile. The demon, if not banished or defeated, vanishes after 1 day.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "25": {
            "text": "All other creatures within 10ft regain 2d8 hit points each. Then you take necrotic damage for the sum of all hit points restored this way.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "26": {
            "text": "For 1 week, your size is reduced by 1 category.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "27": {
            "text": "For 1 week, your size is increased by 1 category.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "28": {
            "text": "You transform into a medium-sized potted plant for 1 round, during which time you are considered petrified.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "29": {
            "text": "1d20 random gems appear near you, worth 50gp each.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "30": {
            "text": "All creatures within 10ft are knocked prone.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "31": {
            "text": "Whenever you make an ability check using Strength, subtract 1 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "32": {
            "text": "Whenever you make an ability check using Dexterity, subtract 1 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "33": {
            "text": "Whenever you make an ability check using Constitution, subtract 1 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "34": {
            "text": "Whenever you make an ability check using Intelligence, subtract 1 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "35": {
            "text": "Whenever you make an ability check using Wisdom, subtract 1 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "36": {
            "text": "Whenever you make an ability check using Charisma, subtract 1 from the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "37": {
            "text": "Whenever you make an ability check using Strength, add 1 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "38": {
            "text": "Whenever you make an ability check using Dexterity, add 1 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "39": {
            "text": "Whenever you make an ability check using Constitution, add 1 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "40": {
            "text": "Whenever you make an ability check using Intelligence, add 1 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "41": {
            "text": "Whenever you make an ability check using Wisdom, add 1 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "42": {
            "text": "Whenever you make an ability check using Charisma, add 1 to the result. This effect is permanent.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "43": {
            "text": "For 1 week, no creature within 10ft of you can cast spells of 1st level or lower.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "44": {
            "text": "During this turn, you can take move and take actions equivalent to taking 2 turns.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "45": {
            "text": "Your maximum hit points are permanently increased by 1d10.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "46": {
            "text": "Your lowest ability score is permanently increased by 1.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "47": {
            "text": "Your highest ability score is permanently reduced by 1.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "48": {
            "text": "For 1 round, you can cast any spell with a casting time of 1 action as a bonus action and you can take the attack as a bonus action.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "49": {
            "text": "You immediately cause 2 additional wild magic surges.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "50": {
            "text": "For 1 minute min, ranged attacks or spells with a range of more than touch, have a range of melee or touch instead.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "51": {
            "text": "All creatures within 60 feet must make a Wisdom saving throw against your spell save DC. Any creature immune to magical sleep automatically succeeds on its saving throw. Those that fail fall asleep for 1 round.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "52": {
            "text": "For 1 round, every time you hit a creature with an attack, it is pulled 10ft towards you.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "53": {
            "text": "For 1 round, every time you hit a creature with an attack, it is pushed 10ft away from you.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "54": {
            "text": "You jump forward in time exactly 6 seconds. From the perspective of everyone else, you simply cease to exist during that time.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "55": {
            "text": "For 1 round, each player looses control over their character and instead gains control over the character who's session inspiration they can see. After the effect ends, the characters themselves don't understand what happened.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "56": {
            "text": "Your walking speed is permanently increased by 10ft.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "57": {
            "text": "Your walking speed is permanently decreased by 10ft.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "58": {
            "text": "Whenever a creature talks to you for the first time during the effect's duration, you flip a coin. If it lands on heads, you punch them in the face, otherwise you hug them. You are not aware of this effect being anything other than you openly expressing your feelings. The effect lasts for 1 hour.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "59": {
            "text": "For 1 minute, your vocabulary is limited to the words \"Yes\" and \"No\", which you can only scream. During this time you cannot cast spells with verbal components.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "60": {
            "text": "While asleep, you snore so loudly that no other creature within 100ft can sleep.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "61": {
            "text": "You and everything you're wearing and carrying are instantly, and without warning, transported to the place where you last took a long rest. Your companions know exactly where you are.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "62": {
            "text": "For 1 minute, you cannot willingly move further than away 30ft from your current location. If you are moved outside this range, you must take any and all actions you can to get back as quickly as possible. Behaving like this seems perfectly reasonable to you.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "63": {
            "text": "For 1 hour, you can only move via jumping, and you cannot choose to jump less than the maximum distance you're able to jump.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "64": {
            "text": "For 1 minute, you can speak with animals but trying to speak any language will result in you making random animal noises.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "65": {
            "text": "You take 1 damage for every 1000gp worth of currency you're carrying.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "66": {
            "text": "You gain the ability to breathe water but loose the ability to breathe air for 1 minute.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "67": {
            "text": "For 1 minute, everything you say will also be written in the sky as per the Skywrite spell.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "68": {
            "text": "For 1 minute, you can pass through any solid, non-magical wall that is 6 or fewer inches thick.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "69": {
            "text": "Whenever you take a long rest, a severed hand appears in your bed. The hand belongs to a humanoid creature that was recently murdered.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "70": {
            "text": "For 1 day, every time you walk through a door or gate it will slam shut behind you and refuse to let anyone except you through.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "71": {
            "text": "For 1 round, you are unable to cast any spell that causes damage of any type.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "72": {
            "text": "All your clothing and equipment teleports to the nearest unoccupied space at least 30 feet from you that you can see.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "73": {
            "text": "For 1 day, you can only speak while music is playing.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "74": {
            "text": "For 1 day, you are surrounded by faint, ethereal music.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "75": {
            "text": "Your eyes permanently change color. (1d8: 1=Red, 2=Green, 3=Blue, 4= Purple, 5= Yellow, 6=Grey, 7=White, 8=Black)",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "76": {
            "text": "For 1 minute, all spells  with a casting time of 1 action or 1 bonus action require 2 consecutive actions to cast.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "77": {
            "text": "For 1 minute, while you're speaking you gain the effect of the Light spell.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "78": {
            "text": "All beverages within 10ft of you transform into lukewarm water when drunk.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "79": {
            "text": "For 1 day, every time you say a word that begins with an 's', it sounds like you're hissing like a snake.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "80": {
            "text": "Some god has taken issue with the last thing you said or did. You immediately take 1d8 radiant damage.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "81": {
            "text": "Approximately 100 gallons of water appear over your head and those within 10 feet of you, evenly distributed above everybody within the radius.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "82": {
            "text": "You permanently gain the ability to talk to nonexistent things.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "83": {
            "text": "For 1 day, you are unable to read as the letters all appeared jumbled.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        },
        "84": {
            "text": "For the next minute, everything you say must rhyme. If it doesn't, you take 1d4 psychic damage.",
            "duration": DUR.i,
            "effect": {
                "changes": [],
                "statuses": []
            }
        }
    }
}


export const surgesTable = {
    major: {
        1: "You are the center of a massive explosion. You and each creature within 60 feet of you must make a Dexterity saving throw against your spell save DC, taking 2d12 force damage for each level of your character on a failed save, or half as much damage on a successful one.",
        2: "You recover all expended class resources.",
        3: "You are deafened for 1 week.",
        4: "You are silenced for 1 week.",
        5: "You are poisoned for 1 week.",
        6: "You are invisible for 1 week.",
        7: "Each creature within 60 feet of you takes 2d8 necrotic damage. You regain hit points equal to the sum of damage dealt.",
        8: "You are teleported to an empty demiplane for 1 day before returning to the location you left.",
        9: "You are protected from creatures from the same plane as the one you're currently on for 1 day. Such creatures cannot attack you or harm you unless they succeed on a Charisma saving throw against your spell save DC and will focus on other targets if they can.",
        10: "You are at the center of a darkness spell for 1 week.",
        11: "You are frightened by the nearest creature for 1 hour.",
        12: "You are resistant to all damage types for 1 hour.",
        13: "All other creatures within 60 feet of you become poisoned for 1 hour.",
        14: "All other creatures within 60 feet of you become blinded for 1 hour.",
        15: "All other creatures within 60 feet of you become deafened for 1 hour.",
        16: "All other creatures within 60 feet of you become invisible for 1 hour.",
        17: "All other creatures within 60 feet of you become restrained for 1 hour.",
        18: "You immediately gain 3d100 temporary hit points.",
        19: "You immediately lose any temporary hit points you have and drop to 1 hp.",
        20: "All attack rolls against you are made with advantage for 1 week.",
        21: "All attack rolls against you are made with disadvantage for 1 week.",
        22: "For 1 hour, other creatures have advantage on saving throws against spells you cast.",
        23: "For 1 hour, other creatures have disadvantage on saving throws against spells you cast.",
        24: "A demon whose CR is equal to your level appears near you. Make a Charisma saving throw against your own spell save DC. If you make it, the demon is subservient, otherwise, it is hostile. The demon, if not banished or defeated, vanishes after 1 day.",
        25: "All other creatures within 60ft regain 2d8 hit points each. Then you take necrotic damage for the sum of all hit points restored this way.",
        26: "You can attune to one additional item. This effect is permanent.",
        27: "You can attune to one fewer item. This effect is permanent.",
        28: "You immediately drop to 0 hit points and become immune to all damage for 2 rounds.",
        29: "Your size is permanently reduced by 1 category. This effect can only be removed by the Wish spell or by casting Greater Restoration or Remove Curse at 10th level or higher.",
        30: "Your size is permanently increased by 1 category. This effect can only be removed by the Wish spell or by casting Greater Restoration or Remove Curse at 10th level or higher.",
        31: "You transform into a medium-sized potted plant for 1 hour, during which time you are considered petrified.",
        32: "1d20 random gems appear near you, worth 5000gp each.",
        33: "All creatures within 60ft are knocked prone.",
        34: "Whenever you make an ability check using Strength, subtract 1d8 from the result. This effect is permanent.",
        35: "Whenever you make an ability check using Dexterity, subtract 1d8 from the result. This effect is permanent.",
        36: "Whenever you make an ability check using Constitution, subtract 1d8 from the result. This effect is permanent.",
        37: "Whenever you make an ability check using Intelligence, subtract 1d8 from the result. This effect is permanent.",
        38: "Whenever you make an ability check using Wisdom, subtract 1d8 from the result. This effect is permanent.",
        39: "Whenever you make an ability check using Charisma, subtract 1d8 from the result. This effect is permanent.",
        40: "Whenever you make an ability check using Strength, add 1d8 to the result. This effect is permanent.",
        41: "Whenever you make an ability check using Dexterity, add 1d8 to the result. This effect is permanent.",
        42: "Whenever you make an ability check using Constitution, add 1d8 to the result. This effect is permanent.",
        43: "Whenever you make an ability check using Intelligence, add 1d8 to the result. This effect is permanent.",
        44: "Whenever you make an ability check using Wisdom, add 1d8 to the result. This effect is permanent.",
        45: "Whenever you make an ability check using Charisma, add 1d8 to the result. This effect is permanent.",
        46: "For 1 week, no creature within 60ft of you can cast spells of 6th level or lower.",
        47: "You gain the ability to speak one new language of your choice. However, you lose the ability to speak one language you already know.",
        48: "You forget one cantrip of your choice.",
        49: "You learn one cantrip of your choice.",
        50: "You gain an additional spell slot of your highest level. If you do not have spell slots, you instead learn a 3rd level spell of your choice and gain the ability to cast it once per day.",
        51: "During this turn, you can take move and take actions equivalent to taking 5 turns.",
        52: "Your maximum hit points are permanently increased by 2d20.",
        53: "Your lowest ability score is permanently increased by 4.",
        54: "Your highest ability score is permanently reduced by 4.",
        55: "You permanently gain proficiency with one weapon or armour of your choice.",
        56: "You permanently gain proficiency with one tool of your choice.",
        57: "For 1 hour, you can cast any spell with a casting time of 1 action as a bonus action and you can take the attack as a bonus action.",
        58: "You immediately cause 4d4 additional wild magic surges.",
        59: "For 1 day min, ranged attacks or spells with a range of more than touch, have a range of melee or touch instead.",
        60: "All creatures within 60 feet must make a Wisdom saving throw against your spell save DC. Any creature immune to magical sleep automatically succeeds on its saving throw. Those that fail fall asleep for 1 hour.",
        61: "For 1 hour, every time you hit a creature with an attack, it is pulled 10ft towards you.",
        62: "For 1 hour, every time you hit a creature with an attack, it is pushed 10ft away from you.",
        63: "You jump forward in time exactly 1 minute. From the perspective of everyone else, you simply cease to exist during that time.",
        64: "For 1 hour, each player looses control over their character and instead gains control over the character who's session inspiration they can see. After the effect ends, the characters themselves don't understand what happened.",
        65: "Your walking speed is permanently increased by 30ft.",
        66: "Your walking speed is permanently decreased by 30ft.",
        67: "Whenever a creature talks to you for the first time during the effect's duration, you flip a coin. If it lands on heads, you punch them in the face, otherwise you hug them. You are not aware of this effect being anything other than you openly expressing your feelings. The effect lasts for 1 week.",
        68: "You spot a (1d6: 1=Cat, 2=Pig, 3=Frog, 4=Goat, 5=Chicken, 6=Dog) of CR 0 and firmly believe it to be a reincarnated deity, an embodiment of nature itself, or something similar according to your beliefs. You decide that you need to protect it at all costs and do everything in your power to make sure it is treated with the respect you think it deserves.",
        69: "For 1 day, your vocabulary is limited to the words \"Yes\" and \"No\", which you can only scream. During this time you cannot cast spells with verbal components.",
        70: "While asleep, you snore so loudly that no other creature within 1 mile can sleep.",
        71: "You and everything you're wearing and carrying are instantly, and without warning, transported to the elemental plane of (1d4: 1= fire, 2=water, 3=earth, 4=air). Your companions know exactly where you are.",
        72: "For 1 day, you cannot willingly move further than away 30ft from your current location. If you are moved outside this range, you must take any and all actions you can to get back as quickly as possible. Behaving like this seems perfectly reasonable to you.",
        73: "For 1 week, you can only move via jumping, and you cannot choose to jump less than the maximum distance you're able to jump.",
        74: "For 1 day, you can speak with animals but trying to speak any language will result in you making random animal noises.",
        75: "You take 1 damage for every 10gp worth of currency you're carrying.",
        76: "You gain the ability to breathe water but loose the ability to breathe air for 1 day.",
        77: "For 1 day, everything you say will also be written in the sky as per the Skywrite spell.",
        78: "For 1 day, you can pass through any solid, non-magical wall that is 6 or fewer inches thick.",
        79: "All copper and silver pieces you carry turn into platinum pieces. All other currencies you carry turn to copper pieces.",
        80: "Whenever you take a long rest, a corpse of a recently murdered humanoid creature appears in your bed.",
        81: "Every time you walk through a door or gate it will slam shut behind you and refuse to let anyone except you through.",
        82: "For 1 hour, you are unable to cast any spell that causes damage of any type.",
        83: "All your clothing and equipment teleports to the nearest unoccupied space at least 120 feet from you that you can see.",
        84: "You can only speak while music is playing.",
        85: "You are surrounded by faint, ethereal music.",
        86: "Your skin permanently changes color. (1d8: 1=Red, 2=Green, 3=Blue, 4= Purple, 5= Yellow, 6=Grey, 7=White, 8=Black)",
        87: "For 1 day, all spells  with a casting time of 1 action or 1 bonus action require 2 consecutive actions to cast.",
        88: "For 1 day, while you're speaking you gain the effect of the Light spell.",
        89: "All beverages within 120ft of you transform into lukewarm water when drunk.",
        90: "Some god has taken issue with the last thing you said or did. You immediately take 10d12 radiant damage.",
        91: "Approximately 10000 gallons of water appear over your head and those within 1000 feet of you, evenly distributed above everybody within the radius.",
        92: "You are unable to read as the letters all appeared jumbled.",
        93: "For the next day, everything you say must rhyme. If it doesn't, you take 1d4 psychic damage."
    },
    moderate: {
        1: "You are the center of a moderate explosion. You and each creature within 30 feet of you must make a Dexterity saving throw against your spell save DC, taking 2d10 force damage for each level of your character on a failed save, or half as much damage on a successful one.",
        2: "You recover half of all expended class resources.",
        3: "You are deafened for 1 day.",
        4: "You are silenced for 1 day.",
        5: "You are poisoned for 1 day.",
        6: "You are invisible for 1 day.",
        7: "Each creature within 30 feet of you takes 2d6 necrotic damage. You regain hit points equal to the sum of damage dealt.",
        8: "You are teleported to an empty demiplane for 1 minute before returning to the location you left.",
        9: "You are protected from creatures from the same plane as the one you're currently on for 1 hour. Such creatures cannot attack you or harm you unless they succeed on a Charisma saving throw against your spell save DC  and will focus on other targets if they can.",
        10: "You are at the center of a darkness spell for 1 day.",
        11: "You are frightened by the nearest creature for 1 minute.",
        12: "You are resistant to all damage types for 1 minute.",
        13: "All other creatures within 60 feet of you become poisoned for 1 minute.",
        14: "All other creatures within 60 feet of you become blinded for 1 minute.",
        15: "All other creatures within 60 feet of you become deafened for 1 minute.",
        16: "All other creatures within 60 feet of you become invisible for 1 minute.",
        17: "All other creatures within 60 feet of you become restrained for 1 minute.",
        18: "You immediately gain 3d20 temporary hit points.",
        19: "You immediately lose any temporary hit points you have and drop to 1d20 hp.",
        20: "All attack rolls against you are made with advantage for 1 day.",
        21: "All attack rolls against you are made with disadvantage for 1 day.",
        22: "For 1 minute, other creatures have advantage on saving throws against spells you cast.",
        23: "For 1 minute, other creatures have disadvantage on saving throws against spells you cast.",
        24: "A demon whose CR is equal to 3/4 of your level appears near you. Make a Charisma saving throw against your own spell save DC. If you make it, the demon is subservient, otherwise, it is hostile. The demon, if not banished or defeated, vanishes after 1 day.",
        25: "All other creatures within 30ft regain 2d8 hit points each. Then you take necrotic damage for the sum of all hit points restored this way.",
        26: "For 1 month, your size is reduced by 1 category.",
        27: "For 1 month, your size is reduced by 1 category.",
        28: "For 1 month, your size is increased by 1 category.",
        29: "You transform into a medium-sized potted plant for 1 minute, during which time you are considered petrified.",
        30: "1d20 random gems appear near you, worth 500gp each.",
        31: "All creatures within 30ft are knocked prone.",
        32: "Whenever you make an ability check using Strength, subtract 1d4 from the result. This effect is permanent.",
        33: "Whenever you make an ability check using Dexterity, subtract 1d4 from the result. This effect is permanent.",
        34: "Whenever you make an ability check using Constitution, subtract 1d4 from the result. This effect is permanent.",
        35: "Whenever you make an ability check using Intelligence, subtract 1d4 from the result. This effect is permanent.",
        36: "Whenever you make an ability check using Wisdom, subtract 1d4 from the result. This effect is permanent.",
        37: "Whenever you make an ability check using Charisma, subtract 1d4 from the result. This effect is permanent.",
        38: "Whenever you make an ability check using Strength, add 1d4 to the result. This effect is permanent.",
        39: "Whenever you make an ability check using Dexterity, add 1d4 to the result. This effect is permanent.",
        40: "Whenever you make an ability check using Constitution, add 1d4 to the result. This effect is permanent.",
        41: "Whenever you make an ability check using Intelligence, add 1d4 to the result. This effect is permanent.",
        42: "Whenever you make an ability check using Wisdom, add 1d4 to the result. This effect is permanent.",
        43: "Whenever you make an ability check using Charisma, add 1d4 to the result. This effect is permanent.",
        44: "For 1 week, no creature within 30ft of you can cast spells of 3th level or lower.",
        45: "During this turn, you can take move and take actions equivalent to taking 3 turns.",
        46: "Your maximum hit points are permanently increased by 2d10.",
        47: "Your lowest ability score is permanently increased by 2.",
        48: "Your highest ability score is permanently reduced by 2.",
        49: "For 1 minute, you can cast any spell with a casting time of 1 action as a bonus action and you can take the attack as a bonus action.",
        50: "You immediately cause 2d4 additional wild magic surges.",
        51: "For 1 hour min, ranged attacks or spells with a range of more than touch, have a range of melee or touch instead.",
        52: "All creatures within 30 feet must make a Wisdom saving throw against your spell save DC. Any creature immune to magical sleep automatically succeeds on its saving throw. Those that fail fall asleep for 1 minute.",
        53: "For 1 minute, every time you hit a creature with an attack, it is pulled 10ft towards you.",
        54: "For 1 minute, every time you hit a creature with an attack, it is pushed 10ft away from you.",
        55: "You jump forward in time exactly 30 seconds. From the perspective of everyone else, you simply cease to exist during that time.",
        56: "For 1 minute, each player looses control over their character and instead gains control over the character who's session inspiration they can see. After the effect ends, the characters themselves don't understand what happened.",
        57: "Your walking speed is permanently increased by 20ft.",
        58: "Your walking speed is permanently decreased by 20ft.",
        59: "Whenever a creature talks to you for the first time during the effect's duration, you flip a coin. If it lands on heads, you punch them in the face, otherwise you hug them. You are not aware of this effect being anything other than you openly expressing your feelings. The effect lasts for 1 day.",
        60: "For 1 hour, your vocabulary is limited to the words \"Yes\" and \"No\", which you can only scream. During this time you cannot cast spells with verbal components.",
        61: "While asleep, you snore so loudly that no other creature within 1000ft can sleep.",
        62: "You and everything you're wearing and carrying are instantly, and without warning, transported to (1d3: 1=the astral plane, 2=the etherial plane, 3=your childhood home). Your companions know exactly where you are.",
        63: "For 1 hour, you cannot willingly move further than away 30ft from your current location. If you are moved outside this range, you must take any and all actions you can to get back as quickly as possible. Behaving like this seems perfectly reasonable to you.",
        64: "For 1 day, you can only move via jumping, and you cannot choose to jump less than the maximum distance you're able to jump.",
        65: "For 1 hour, you can speak with animals but trying to speak any language will result in you making random animal noises.",
        66: "You take 1 damage for every 100gp worth of currency you're carrying.",
        67: "You gain the ability to breathe water but loose the ability to breathe air for 1 hour.",
        68: "For 1 hour, everything you say will also be written in the sky as per the Skywrite spell.",
        69: "For 1 hour, you can pass through any solid, non-magical wall that is 6 or fewer inches thick.",
        70: "Whenever you take a long rest, a severed head appears in your bed. The head belongs to a humanoid creature that was recently murdered.",
        71: "For 1 week, every time you walk through a door or gate it will slam shut behind you and refuse to let anyone except you through.",
        72: "For 1 minute, you are unable to cast any spell that causes damage of any type.",
        73: "You immediately lose all unspent class resources and may not regain them until you have finished a long rest.",
        74: "All your clothing and equipment teleports to the nearest unoccupied space at least 60 feet from you that you can see.",
        75: "For 1 week, you can only speak while music is playing.",
        76: "For 1 week, you are surrounded by faint, ethereal music.",
        77: "Your hair permanently changes color. (1d8: 1=Red, 2=Green, 3=Blue, 4= Purple, 5= Yellow, 6=Grey, 7=White, 8=Black)",
        78: "For 1 hour, all spells  with a casting time of 1 action or 1 bonus action require 2 consecutive actions to cast.",
        79: "For one day, while you're speaking you gain the effect of the Light spell.",
        80: "All beverages within 30ft of you transform into lukewarm water when drunk.",
        81: "For 1 week, every time you say a word that begins with an 's', it sounds like you're hissing like a snake.",
        82: "Some god has taken issue with the last thing you said or did. You immediately take 5d10 radiant damage.",
        83: "Approximately 1000 gallons of water appear over your head and those within 100 feet of you, evenly distributed above everybody within the radius.",
        84: "For week day, you are unable to read as the letters all appeared jumbled.",
        85: "For the next hour, everything you say must rhyme. If it doesn't, you take 1d4 psychic damage."
    },
    minor: {
        1: "You are the center of a small explosion. You and each creature within 10 feet of you must make a Dexterity saving throw against your spell save DC, taking 2d8 force damage for each level of your character on a failed save, or half as much damage on a successful one.",
        2: "You recover a single expended class resource.",
        3: "You are deafened for 1 hour.",
        4: "You are silenced for 1 hour.",
        5: "You are poisoned for 1 hour.",
        6: "You are invisible for 1 hour.",
        7: "Each creature within 10 feet of you takes 2d4 necrotic damage. You regain hit points equal to the sum of damage dealt.",
        8: "You are teleported to an empty demiplane for 1 round before returning to the location you left.",
        9: "You are protected from creatures from the same plane as the one you're currently on for 1 minute. Such creatures cannot attack you or harm you unless they succeed on a Charisma saving throw against your spell save DC  and will focus on other targets if they can.",
        10: "You are at the center of a darkness spell for 1 hour.",
        11: "You are frightened by the nearest creature for 1 round.",
        12: "You are resistant to all damage types for 1 round.",
        13: "All other creatures within 60 feet of you become poisoned for 1 round.",
        14: "All other creatures within 60 feet of you become blinded for 1 round.",
        15: "All other creatures within 60 feet of you become deafened for 1 round.",
        16: "All other creatures within 60 feet of you become invisible for 1 round.",
        17: "All other creatures within 60 feet of you become restrained for 1 round.",
        18: "You immediately gain 3d12 temporary hit points.",
        19: "You immediately lose any temporary hit points you have and drop to 1d100 hp.",
        20: "All attack rolls against you are made with advantage for 1 hour.",
        21: "All attack rolls against you are made with disadvantage for 1 hour.",
        22: "For 1 round, other creatures have advantage on saving throws against spells you cast.",
        23: "For 1 round, other creatures have disadvantage on saving throws against spells you cast.",
        24: "A demon whose CR is equal to 1/2 of your level appears near you. Make a Charisma saving throw against your own spell save DC. If you make it, the demon is subservient, otherwise, it is hostile. The demon, if not banished or defeated, vanishes after 1 day.",
        25: "All other creatures within 10ft regain 2d8 hit points each. Then you take necrotic damage for the sum of all hit points restored this way.",
        26: "For 1 week, your size is reduced by 1 category.",
        27: "For 1 week, your size is increased by 1 category.",
        28: "You transform into a medium-sized potted plant for 1 round, during which time you are considered petrified.",
        29: "1d20 random gems appear near you, worth 50gp each.",
        30: "All creatures within 10ft are knocked prone.",
        31: "Whenever you make an ability check using Strength, subtract 1 from the result. This effect is permanent.",
        32: "Whenever you make an ability check using Dexterity, subtract 1 from the result. This effect is permanent.",
        33: "Whenever you make an ability check using Constitution, subtract 1 from the result. This effect is permanent.",
        34: "Whenever you make an ability check using Intelligence, subtract 1 from the result. This effect is permanent.",
        35: "Whenever you make an ability check using Wisdom, subtract 1 from the result. This effect is permanent.",
        36: "Whenever you make an ability check using Charisma, subtract 1 from the result. This effect is permanent.",
        37: "Whenever you make an ability check using Strength, add 1 to the result. This effect is permanent.",
        38: "Whenever you make an ability check using Dexterity, add 1 to the result. This effect is permanent.",
        39: "Whenever you make an ability check using Constitution, add 1 to the result. This effect is permanent.",
        40: "Whenever you make an ability check using Intelligence, add 1 to the result. This effect is permanent.",
        41: "Whenever you make an ability check using Wisdom, add 1 to the result. This effect is permanent.",
        42: "Whenever you make an ability check using Charisma, add 1 to the result. This effect is permanent.",
        43: "For 1 week, no creature within 10ft of you can cast spells of 1st level or lower.",
        44: "During this turn, you can take move and take actions equivalent to taking 2 turns.",
        45: "Your maximum hit points are permanently increased by 1d10.",
        46: "Your lowest ability score is permanently increased by 1.",
        47: "Your highest ability score is permanently reduced by 1.",
        48: "For 1 round, you can cast any spell with a casting time of 1 action as a bonus action and you can take the attack as a bonus action.",
        49: "You immediately cause 2 additional wild magic surges.",
        50: "For 1 minute min, ranged attacks or spells with a range of more than touch, have a range of melee or touch instead.",
        51: "All creatures within 60 feet must make a Wisdom saving throw against your spell save DC. Any creature immune to magical sleep automatically succeeds on its saving throw. Those that fail fall asleep for 1 round.",
        52: "For 1 round, every time you hit a creature with an attack, it is pulled 10ft towards you.",
        53: "For 1 round, every time you hit a creature with an attack, it is pushed 10ft away from you.",
        54: "You jump forward in time exactly 6 seconds. From the perspective of everyone else, you simply cease to exist during that time.",
        55: "For 1 round, each player looses control over their character and instead gains control over the character who's session inspiration they can see. After the effect ends, the characters themselves don't understand what happened.",
        56: "Your walking speed is permanently increased by 10ft.",
        57: "Your walking speed is permanently decreased by 10ft.",
        58: "Whenever a creature talks to you for the first time during the effect's duration, you flip a coin. If it lands on heads, you punch them in the face, otherwise you hug them. You are not aware of this effect being anything other than you openly expressing your feelings. The effect lasts for 1 hour.",
        59: "For 1 minute, your vocabulary is limited to the words \"Yes\" and \"No\", which you can only scream. During this time you cannot cast spells with verbal components.",
        60: "While asleep, you snore so loudly that no other creature within 100ft can sleep.",
        61: "You and everything you're wearing and carrying are instantly, and without warning, transported to the place where you last took a long rest. Your companions know exactly where you are.",
        62: "For 1 minute, you cannot willingly move further than away 30ft from your current location. If you are moved outside this range, you must take any and all actions you can to get back as quickly as possible. Behaving like this seems perfectly reasonable to you.",
        63: "For 1 hour, you can only move via jumping, and you cannot choose to jump less than the maximum distance you're able to jump.",
        64: "For 1 minute, you can speak with animals but trying to speak any language will result in you making random animal noises.",
        65: "You take 1 damage for every 1000gp worth of currency you're carrying.",
        66: "You gain the ability to breathe water but loose the ability to breathe air for 1 minute.",
        67: "For 1 minute, everything you say will also be written in the sky as per the Skywrite spell.",
        68: "For 1 minute, you can pass through any solid, non-magical wall that is 6 or fewer inches thick.",
        69: "Whenever you take a long rest, a severed hand appears in your bed. The hand belongs to a humanoid creature that was recently murdered.",
        70: "For 1 day, every time you walk through a door or gate it will slam shut behind you and refuse to let anyone except you through.",
        71: "For 1 round, you are unable to cast any spell that causes damage of any type.",
        72: "All your clothing and equipment teleports to the nearest unoccupied space at least 30 feet from you that you can see.",
        73: "For 1 day, you can only speak while music is playing.",
        74: "For 1 day, you are surrounded by faint, ethereal music.",
        75: "Your eyes permanently change color. (1d8: 1=Red, 2=Green, 3=Blue, 4= Purple, 5= Yellow, 6=Grey, 7=White, 8=Black)",
        76: "For 1 minute, all spells  with a casting time of 1 action or 1 bonus action require 2 consecutive actions to cast.",
        77: "For 1 minute, while you're speaking you gain the effect of the Light spell.",
        78: "All beverages within 10ft of you transform into lukewarm water when drunk.",
        79: "For 1 day, every time you say a word that begins with an 's', it sounds like you're hissing like a snake.",
        80: "Some god has taken issue with the last thing you said or did. You immediately take 1d8 radiant damage.",
        81: "Approximately 100 gallons of water appear over your head and those within 10 feet of you, evenly distributed above everybody within the radius.",
        82: "You permanently gain the ability to talk to nonexistent things.",
        83: "For 1 day, you are unable to read as the letters all appeared jumbled.",
        84: "For the next minute, everything you say must rhyme. If it doesn't, you take 1d4 psychic damage."
    }
};


