# 13/07/2024
## Added
- Alchemy gathering system (crafting system is still work in progress)
- Rules: Alchemy
- Feature: Alchemical Extraction (added to Fearghas) 
    > Allows the user to target slain creatures and extract alchemical ingredients from them.
- GM Macro: Prompt Harvest Herbs
    > Lets the user gather herbs depending on the environment.

## Changes
- Compound Eye (body part ingredient) replaced with:  
    > Core Crystal - Gathered from any construct creature  
- Gills (body part ingredient) had it's source changed 
    > from: Medium or larger creatures with water breathing or amphibious traits.

    > to: Medium or larger beast-type creatures that have a swim speed.

- Recipes that used Compound Eye before, now use Core Crystal instead.

# 10/07/2024
## Added
- API function rollTableGrantItems() to make it easier for items from rolltables to be added to actors

## Fixed
- Character sheet closing when a wild magic surge is caused while scribing spell gems.
- Character sheet maximising when a template is placed.

# 09/07/2024
## Fixed
- Contraption crafting rules are now referenceable via enricher
- Cunning Contraption now displays the item card

# 08/07/2024
## Added
- Contraption crafting system

## Changed
- Rules: Crafting Contraptions
- Unusual Materials (changes compared to the draft)
    - Light-Shy Mushroom
        - from:
        > Bursts open when exposed to bright light, releasing a
cloud of pitch-black spores that heavily obscure vision in
a 10ft cube. The cloud dissipades after one minute.

        - to:
        > Bursts open when exposed to bright light, releasing a cloud of pitch-black spores that heavily obscure vision in a 10ft sphere. The cloud dissipates after one minute.

    - Troll Musk Concentrate
        - from:
        > Upon coming into contact with a living creature, this fatty substance creates a 10ft radius aura of foul odor around it.
        > 
        > When a creature enters the effect’s area for the first time on a turn or starts its turn there, that creature must make a Constitution saving throw against the contraption’s Save DC or become poisoned until the start of their next turn.
        >
        > Trolls always succeed the saving throw

        - to:
        > When this flask hits a creature or object, it bursts open and covers the target in a green liquid, a potent aphrodisiac for trolls.
        > 
        > Upon coming into contact with a living creature, this fatty substance creates a 10ft sphere of foul odour around that creature which persists for 10 minutes.
        > 
        > When a creature enters the effect’s area for the first time on a turn or starts its turn there, that creature must make a Constitution saving throw against the contraption’s Save DC or become poisoned until the start of their next turn.
        > 
        > When a troll fails a saving throw against this effect, it becomes charmed instead of poisoned.
    
    - Echoing Crystalbloom
        - from:
        > When this crystalline flower shatters, creatures in a 10ft radius can make a Dexterity Saving Throw to avoid being covered in it’s fine dust.
        >
        > Any creature covered by the dust involunarily echoes
it’s own speech for 10 minutes, making it much more
difficult to form the verbal components of spells.
        >
        > Spells with verbal components cast by affected
creatures have a minimum casting time of two rounds.

        - to:
        > When this crystalline flower shatters, it covers creatures in a 10ft sphere in it's fine dust unless they succeed on a Dexterity saving throw against the contraption's save DC.
        >
        > Any creature covered by the dust involuntarily echoes it’s own speech for 10 minutes, making it much more difficult to form the verbal components of spells.
        >
        > While under this effect, casting a spell with verbal components requires a bonus action and the caster's full movement in addition to the spells normal requirements.

    - Hurting Stone
        - no changes:
        > When this stone hits a creature or object after being
dropped or thrown, it deals an additional 2d6 magical
bludgeoning damage and loudly shouts “Ow!”.
    
    - Sneezing Powder
        - from:
        > This light powder hangs in the air for up to one minute,
filling the volume of a 5ft cube. A creature entering or starting it’s turn in this cloud
immediately uses it’s reaction to sneeze.

        - to: 
        > This light powder hangs in the air for up to one minute, filling the volume of a 10ft sphere. A creature entering or starting it’s turn in this cloud immediately uses it’s reaction to sneeze.

    - Breezeblossom
        - from:
        > It’s petals will always be carried away by a gentle
breeze, going as far to create one themselves if needed.

        - to:
        > It’s petals will always be carried away by a gentle breeze, going as far to create one themselves if needed. This breeze disperses any magical cloud or fog effects.

    - Straightstep Briar
        - from:
        > Creatures touching it’s oils need to make a Strength
Saving Throw against the contraption’s Save DC or they
need to start each of their turns by moving their entire
movement in a straight line.

        - to:
        > One fruit of this plant contains enough oil to cover a 10ft square for 10 turns.
        >
        > A creature touching this oil needs to succeed on a Strength saving throw against the contraption's save DC. On a fail, the creature needs to begin it's next 3 turns by moving it's full movement in a straight line in a direction of it's choice.

    - Wandering Wart
        - from:
        > Every six seconds, the spores of this mushroom teleport
5ft laterally in a random direction, taking any creature
they’re covering with them.
        >
        > A single creature can be affected by multiple
instances of this effect, each one adding 5ft to the
teleportation distance.


        - to:
        > When this mushroom bursts open, it covers any creature in a 5ft radius in it's spores for one minute.
        >
        > A creature covered in these spores teleports 5ft laterally in a random direction at the beginning of it's turn. A single creature can be affected by multiple instances of this effect, each adding 5ft to the teleportation distance.
    - Vanishing Velvet
        - from:
        > Upon coming into contact with water, this moss turns
mostly invisible for 10 minutes. This also affects any
creature or object fully covered by the moss.
        >
        > During combat, an affected creature or object rolls a
1d10 at the start of every combatant’s turn, loosing their
invisibility on a 1 and regaining or maintaining it on a
roll of 2 or higher.
        >
        > Outside of combat, a creature or object covered by the
moss is considered to be visible for 6 seconds out of
every minute instead.

        - to:
        > Upon coming into contact with water, this moss turns itself and any creature it's covering mostly invisible for 10 minutes.
        >
        > During combat, an affected creature rolls a 1d10 at the start of every combatant's turn, loosing it's invisibility on a 1 and regaining or maintaining it on a roll of 2 or higher.

    - Prismatic Thistle
        - from:
        > Sticks stubbornly to a creature, making their outline
glow vibrantly, shedding bright light in a radius of 5ft
until the end of their next turn.
        >
        >Any attack roll against the affected creature has
advantage if the attacker can see it, and the affected
creature can’t benefit from being invisible.
        >
        >Each additional thistle sticking to the same creature
increases the effect’s duration by one round.

        - to:
        > Sticks stubbornly to a creature, making it's outline glow vibrantly, shedding bright light in a radius of 5ft.
        >
        >Any attack roll against the affected creature has advantage if the attacker can see it, and the affected creature can’t benefit from being invisible.
        >
        >The effect ends if the creature removes the thistle using an action, or after 10 minutes.
## Removed
- Consumable Type: Contraption (The final implementation of the crafting system cannot use a custom type so this is removed)

# 03/07/2024
## Added
- Feature Type: Common Action (to be used for the likes of Jump, Dash, Hide, Disengage, Dodge, etc)
- Consumable Type: Unusual Material
- Consumable Type: Contraption

- Unusual Materials:
    - Light-Shy Mushroom
    - Troll Musk
    - Echoing Crystalbloom
    - Hurting Stone
    - Sneezing Powder
    - Breezeblossom
    - Straightstep Briar
    - Wandering Wart (teleportation effect not implemented)
    - Vanishing Velvet
    - Prismatic Thistle

- Compendium: 
    - Rules
    - Rollable Tables
    - Talia Macros

- Rule: Crafting Contraptions


- VFX & Animations
    - Darkness
    - Fog Cloud

- Common Action: Shove (not yet automated)
    - The following Active Effect flags related to shoving have been added:
        - `flags.talia-custom.shove.sizeBonus` || ADD || NUMBER  
            for effects that make the actor count as a size larger or smaller for shoving
        - `flags.talia-custom.shove.distBonus` || ADD || NUMBER (in feet)  
            for effects that add or reduce the distance a creature can shove another creature. 
        - `flags.talia-custom.shove.isImmune` || ADD || NUMBER  
            for effects that grant or remove immunity to being shoved
- Items from Plex's notes
    - Goblin's Disguise (Without Top-Hat)
    - Sea Urchin
    - Coconut Shells x3
    - Jungle Vine (Rope) 50ft
    - Coral Fragment
    - Sea Shell x2
    - Wine Glass x2

## Fixed
- Bear Spirit's Compelled Duel no longer gives Aviana a -100 to all Wisdom saving throws she makes

# 02/07/2024
## Fixed
- Grateful Fey Charm

# 01/07/2024
## Added
- Flexing Icon

# 30/06/2024
## Added
- Beast Spirit: Elk
    - Spirit of the Elk
    - Adept Forager
    - Stampede (unfinished, blocked by #33)  
        Until fixed, everything about this skill has to be done manually
    - Survival Instincts (unfinished, blocked by #33)  
        Until fixed, this skill needs to be used manually to grant temp hp.
    - Unstoppable
- Active Beast Spirit can now be changed by activating the chosen spirit's feature item.
- Added one 1st level spell slot to Fearghas and removed the Mind Sliver cantrip from his known cantrips.
- Jump distance flag to:
    - Adjust Density - Halved
    - Athletic Feat

## Fixed
- All characters now correctly show and use the OneDnD exhaustion system.

# 29/06/2024
## Added
- Jump distance in feet is now accessible within each actor's rollData under `actor.getRollData().talia.jumpDistance`. The number will always be a multiple of 5 (or 0).
- Three new Active Effects flags have been added:
    - `"flags.talia-custom.jumpDist.bonus"` | ADD | NUMBER  
        A number of ft to be added to the actor's maximum jump distance, can be negative.
    - `"flags.talia-custom.jumpDist.countDoubled"` | ADD | NUMBER  
        A number of times the sum of base distance + bonus should be doubled
    - `"flags.talia-custom.jumpDist.countHalved"` | ADD | NUMBER  
        A number of times the sum of base distance + bonus should be halved


# 28/06/2024
## Added
- Beast Spirit: Bear
    - Spirit of the Bear
    - Intimidating Presence
    - Savage Taunt
    - Compelled Duel
    - Ironfur
    - Survival of the Fittest


# 27/06/2024
## Added
- Beast Spirit: Tiger
    - Spirit of the Tiger
    - Ambush Predator
    - Pouncing Strikes
    - Scent of Blood
    - Solitary Hunter
    - Rip and Tear


# 26/06/2024
## Added
- Transferred the playerChangelog from TaliaCampaign repo to this repo. TaliaCampaign repo is slowly getting deprecated in favor of this one.

## Fixed
- Spells granted by spellbooks no longer duplicate when accessed by client and GM at the same time.
- Mantle of the Arcane Trickster again applies it's active effect when Mage Armor is being cast on the wearer if he's attuned to the mantle.

## Notes
- Rod of Hellish Flames is working as intended. When used it consumes it's use and applies an active effect to the user that maximises the damage of the next spell that deals fire or necrotic damage.

# 24/06/2024
## Added
### Magic Items
- Charlatan's Die for Plex

### Macro: "Damage or Heal Self"
Macro allows users to apply a chosen amount of damage, healing, or temphp to owned tokens while respecting the system's application methods.
This means parameters that alter damage taken, such as resistances or immunities, are taken into account.

## Changed

### Armor of Agathys
Changed how it works and added all of the spell's effects to the active effect.
###### from: 
> You gain 5 temporary hit points for the duration. If a creature hits you with a melee attack while you have these hit points, the creature takes 5 cold damage.
###### to:
> You gain 5 temporary hit points. For the duration of the spell, if a creature hits you with a melee attack while you have temporary points, the creature takes 5 cold damage.

### Spellbook: Wither and Bloom -> Life from Death
Replaced the spell Wither and Bloom, granted by Vrazzak's spellbook, with Life from Death.
###### Wither and Bloom
> You invoke both death and life upon a 10-foot-radius sphere centered on a point within range. Each creature of your choice in that area must make a Constitution saving throw, taking 2d6 necrotic damage on a failed save, or half as much damage on a successful one. Nonmagical vegetation in that area withers.
>
> In addition, one creature of your choice in that area can spend and roll one of its unspent Hit Dice and regain a number of hit points equal to the roll plus your spellcasting ability modifier.
>
> At Higher Levels
>
> When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d6 for each slot above the 2nd, and the number of Hit Dice that can be spent and added to the healing roll increases by one for each slot above 2nd.

###### Life from Death
> You invoke both death and life upon a 10-foot-radius sphere centered on a point within range. Each creature of your choice in that area must make a Constitution saving throw, taking 2d6 necrotic damage on a failed save, or half as much damage on a successful one. Nonmagical vegetation in that area withers.
>
> Then up to one creature of your choice in that area can regain a number of hit points equal to half of the total amount of damage this spell caused, rounded down.
>
> At Higher Levels
> 
> When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d6 for each slot above the 2nd.

## Fixed

### Spellbooks
Spellbooks now correctly grant and remove spells from actors upon equip/unequip.

# 23/06/2024
## Added
### Spellscribing
- If the user has 1 or more inspirations and fails an Inscription check, the module will now ask for an optional reroll at the cost of an inspiration.

## Changed
### Cooking
- Only 1 spice buff can be active at any time.
- Can be applied during short or long rests.

# TEMPLATE
# DATE
## Added
## Changed
## Fixed
## Removed
