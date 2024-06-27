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