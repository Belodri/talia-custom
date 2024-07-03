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
