# 0.4.0 - 2024/07/30
<details>
<summary><h2>Added</h2></summary>

-   <details>
    <summary>Magic Items</summary>

    - Strionic Resonator
    - Drunken Brawler's Dancing Shoes
    - Sneaky Spellshite's Amulet
    - Unholy Grimoire of Blood
    </details>

-   <details>
    <summary>Spells</summary>

    - Bloody Rites
    - Blood Barrier
    - Inflict Wounds
    - Gentle Repose
    - Nondetection
    - Circle of Death
    </details>

-   <details>
    <summary>Spell Gems and Scrolls from Vrazzak's Lair </summary>  

    Found inside the storage chest in the cabin.
    - 2x Activated: Circle of Death - 6th
    - 4x Activated: Circle of Death - 9th
    - 4x Activated: Inflict Wounds - 4th
    - 9x Activated: Nondetection - 3rd
    - 7x Triggered: Greater Restoration - 9th
    - 3x Spell Scroll: Gentle Repose
    </details>

-   <details>
    <summary>Potions and Poisons</summary>

    -   <details>
        <summary>Oil of Sharpness (changed)</summary>  

        from
        > The oil can coat one slashing or piercing weapon or up to 5 pieces of slashing or piercing ammunition. Applying the oil takes 1 minute. For 1 hour, the coated item is magical and has a +3 bonus to attack and damage rolls.

        to
        > Taking a bonus action to apply, the oil can coat the user's weapons. For 1 hour, all attacks with weapons are considered magical and have a +3 bonus to attack and damage rolls.
        </details>
    - Potion of Invisibility
    - Potion of Flying
    - Potion of Speed
    - Murgaxor's Elixir of Life
    - Purple Worm Poison
    - Torpor
    - Wyvern Poison
    - Malice
    - Serpent Venom
    - Drow Poison
    -   <details>
        <summary>Basic Poison Coating</summary>
        
        Altered version of Basic Poison (vial).
        from
        > You can use the poison in this vial to coat one slashing or piercing weapon or up to three pieces of ammunition. Applying the poison takes an action. A creature hit by the poisoned weapon or ammunition must make a DC 10 Constitution saving throw or take 1d4 poison damage. Once applied, the poison retains potency for 1 minute before drying.

        to
        > Taking a bonus action to apply, the oil can coat the user's weapons. For 1 minute, all attacks with weapons deal an additional 1d4 poison damage on a hit.
        </details> 
    -   <details>
        <summary>Willowshade Oil (changed)</summary>

        from
        > A creature can use its action to apply the oil to another creature that has been petrified for less than 1 minute, causing the petrified condition on that creature to end at the start of what would be that creature's next turn.

        to
        > A creature can use a bonus action to apply the oil to another creature that has been petrified for less than 1 minute, causing the petrified condition on that creature to end immediately.
        </details>
    </details>

-   <details>
    <summary>Spices</summary>

    - Aloe Vera
    - Cardamom
    - Eucalyptus
    - Ginko Leaves
    - Ginseng Root Powder
    - Licorice Root
    - Mustard Seeds
    - Rhubarb
    - Vanilla
    - Yarrow
    </details>

-   <details>
    <summary>Rules</summary>

        - Triggered Abilities
    </details>
</details>

<details>
<summary><h2>Changed</h2></summary>

- Added learned spells to Fearghas
    - Teleport
    - Wind Walk
    - Greater Invisibility
</details>

<details>
<summary><h2>Fixed</h2></summary>
    
- Spells that are granted by items while those items are equipped and/or attuned can no longer be scribed.
- Spellbooks now check for attunement as well when adding/removing spells.
- Created spell gems now show their spell level in the title.
- Fixed console log spam during spellscribing.
- Added missing spells to Plex (Animate Objects and Telekinesis)
- Fixed (some) code for Wild Magic Surges filters being utter garbage I've written at 4am.
- Plex's Mantle of the Arcane Trickster's effect should now be added and removed correctly alongside Mage Armor.
</details>

<details>
<summary><h2>Removed</h2></summary>

- Potion of Poison  
    Correctly dealing with all of it's effects just takes up way too much time and trying to implement automation for it made me want to yeet my laptop out the window.  
</details>

<details>
<summary><h2>Dev Details</h2></summary>  

- API function `displayItemInfoOnly(item, options = {})`
    Displays only the most basic item info in a chat message.
    If `options.chatDataOnly === true`, a the chat message data will be returned and no chat message will be displayed.

- API function `createBrewUI(actor)`
    Is called by "Alchemical Synthesis" feature
</details>

# 0.3.0 - 2024/07/23
## Added
- Levels
    - Fearghas -> level 10
    - Aviana -> level 10
    - Shalkoc -> level 10
    - Plex -> level 10

- Features
    - Spirit of the Wolf
    - Keen Senses
    - <details><summary>Pack Tactics (changed)</summary>  

        from
        > Your allies have advantage on attack rolls against hostile creatures within 5ft of you.

        to
        > All attacks rolls made against hostile creatures within 5ft of you have advantage.
    </details>
    
    - Hamstringing
    - Coordinated Hunt
    - <details><summary>Empowered Evocation (changed)</summary>  

        from
        > Beginning at 10th level, you can add your Intelligence modifier to one damage roll of any wizard evocation spell you cast.

        to
        > Beginning at 10th level, you can add your Intelligence modifier to the damage roll of any evocation spell you cast.
    </details>

    - <details><summary>Shifting Stances (new Monk level 10)</summary>  


        > You can spend 1 Ki to enter a stance or shift from one to another, imitating the movements of the creature that inspired the stance's style. This stance lasts until you choose to end it, until you enter a different stance, or until combat ends.
        >
        > You can enter a stance, change to a different stance, or end a stance only once per turn as a free action.
    </details>

    - <details><summary>Mantis Style</summary>  

        > Embodying the style of the mantis, lets you add your proficiency bonus to your regular Ki save DC when you use Stunning Strike but the style also reduces your AC by an amount equal to your proficiency bonus.
    </details>

    - <details><summary>Turtle Style</summary>  

        > The turtle style grants you a bonus to your AC equal to your proficiency bonus but the maximum distance you can move during each of your turns is limited to a number of feet equal to 5 times your proficiency bonus.
    </details>

    - <details><summary>Tiger Style</summary>  

        > The tiger style adds an amount of damage equal to your proficiency bonus to all natural weapon attacks you make but reduces your Ki save DC by the same amount.
    </details>

    - <details><summary>Violent Attraction (changed)</summary>  

        from
        > When another creature that you can see within 60 feet of you hits with a weapon attack, you can use your reaction to increase the attack's velocity, causing the attack's target to take an extra 1d10 damage of the weapon's type.
        >
        > Alternatively, if a creature within 60 feet of you takes damage from a fall, you can use your reaction to increase the fall's damage by 2d10.
        >
        > You can use this feature a number of times equal to your Intelligence modifier (a minimum of once). You regain all expended uses when you finish a long rest.

        to
        > When another creature that you can see within 60 feet of you is hit with a weapon attack, you can use your reaction to increase the attack's velocity, causing the attack's target to take an extra 1d10 damage of the weapon's type.
        > 
        > Alternatively, if a creature within 60 feet of you takes damage from a fall, you can use your reaction to increase the fall's damage by 2d10.
        >
        > You can use this feature a number of times equal to your Intelligence modifier (a minimum of once). You regain all expended uses when you finish a long rest.
    </details>

- Spells
    - Teleport
    - Wind Walk
    - Fog
    - Web
    - <details><summary>Skill Empowerment (changed)</summary>  

        from
        > Your magic deepens a creature's understanding of its own talent. You touch one willing creature and give it expertise in one skill of your choice; until the spell ends, the creature doubles its proficiency bonus for ability checks it makes that use the chosen skill.
        >
        > You must choose a skill in which the target is proficient and that isn't already benefiting from an effect, such as Expertise, that doubles its proficiency bonus.

        to
        > Your magic deepens a creature's understanding of its own talent. You touch one willing creature and give it expertise in one skill or tool of your choice; until the spell ends, the creature doubles its proficiency bonus for ability checks it makes that use the chosen skill.
        >
        > You must choose a skill or tool in which the target is proficient and that isn't already benefiting from an effect, such as Expertise, that doubles its proficiency bonus.
    </details>

    - Hold Monster
    - Ray of Frost
    - Shape Water
    - Telekinesis
    - Animate Objects

- Summonable creatures
    - Animated Object (Tiny)
    - Animated Object (Small)
    - Animated Object (Medium)
    - Animated Object (Large)
    - Animated Object (Huge)

- Items
    - Ring of Protection +2
    - Circlet of Wisdom
    - Glasses of True Seeing

- Compendium "Talia Actors" (key="talia-actors")
    Used to store custom creature templates for summoning and polymorphing.

## Fixed
- Fearghas' Spellbook now correctly grants spells when equipped again.

<details><summary><h2>Dev Details</h2></summary>  

- `_foundryHelpers.displayItemInfoOnly(item)`
    Displays only the most basic item info in a chat message.

- API function `activateMartialStyleStance(item)`
    Is called by Monk's Shifting Stances

- API function `tokensAdjacent(token1, token2)`  
    Determines if two tokens are adjacent or overlapping on a canvas divided into 100x100 pixel cells.
    Tokens are considered adjacent if they are in neighboring cells (including diagonally) or if they overlap in any way.
    Returns true if the tokens are adjacent or overlapping, false otherwise.
</details>

# 0.2.0 - 2024/07/16
## Added
- Automation systems for gathering and harvesting alchemical ingredients.
- Feature Alchemical Extraction which allows the user to target slain creatures and extract alchemical ingredients from them.
- Macro Prompt Harvest Herbs which makes herbs available for gathering depending on the environment.
- Rules for alchemy crafting and gathering
- Feature Inspiring Flex which lets the user flex to inspire their allies.
- Journal "Alchemical Ingredients And Their Uses" which serves as a catalogue for alchemical ingredients, where to find them and their recipes.

## Changed
- Alchemical ingredient Compound Eye has been replaced with Core Crystal which can be gathered from any slain construct creature.
- The source of the alchemical ingredient Gills has been changed from medium or larger insect creatures to medium or larger beast-type creatures that have a swim speed.
- Recipes that used to require Compound Eye have been changed to require Core Crystal instead

## Fixed
- Character sheets no longer close when a wild magic surge is caused while scribing spell gems.
- Character sheets no longer maximise when a template is placed.

<details><summary><h2>Dev Details</h2></summary>  

- API function `rollTableGrantItems()` to make it easier for items from rolltables to be added to actors
</details>

# 0.1.2 - 2024/07/09
## Added
- Contraption crafting system
- Rules for crafting contraptions
- Consumable Type: Unusual Material
- Feature Type: Common Action (to be used for the likes of Jump, Dash, Hide, Disengage, Dodge, etc)
- Module compendia: Rules, Rollable Tables, & Talia Macros
- VFX & Animations for:
    - Darkness
    - Fog Cloud
- <details><summary>Items from Plex's notes</summary>

    - Goblin's Disguise (Without Top-Hat)
    - Sea Urchin
    - Coconut Shells x3
    - Jungle Vine (Rope) 50ft
    - Coral Fragment
    - Sea Shell x2
    - Wine Glass x2
    </details>

## Changed
- Changes have been made to most unusual materials when compared to their draft versions.
    <details><summary>Click here to see the changes to each.</summary>

    - <details><summary>Light-Shy Mushroom</summary>

        from
        > Bursts open when exposed to bright light, releasing a
        cloud of pitch-black spores that heavily obscure vision in
        a 10ft cube. The cloud dissipades after one minute.

        to
        > Bursts open when exposed to bright light, releasing a cloud of pitch-black spores that heavily obscure vision in a 10ft sphere. The cloud dissipates after one minute.
        </details>

    - <details><summary>Troll Musk Concentrate</summary>

        from
        > Upon coming into contact with a living creature, this fatty substance creates a 10ft radius aura of foul odor around it.
        > 
        > When a creature enters the effect’s area for the first time on a turn or starts its turn there, that creature must make a Constitution saving throw against the contraption’s Save DC or become poisoned until the start of their next turn.
        >
        > Trolls always succeed the saving throw

        to 
        > When this flask hits a creature or object, it bursts open and covers the target in a green liquid, a potent aphrodisiac for trolls.
        > 
        > Upon coming into contact with a living creature, this fatty substance creates a 10ft sphere of foul odour around that creature which persists for 10 minutes.
        >
        > When a creature enters the effect’s area for the first time on a turn or starts its turn there, that creature must make a Constitution saving throw against the contraption’s Save DC or become poisoned until the start of their next turn.
        > 
        > When a troll fails a saving throw against this effect, it becomes charmed instead of poisoned.
        </details>

    - <details><summary>Echoing Crystalbloom</summary>
        
        from   
        > When this crystalline flower shatters, creatures in a 10ft radius can make a Dexterity Saving Throw to avoid being covered in it’s fine dust.
        >
        > Any creature covered by the dust involunarily echoes
        it’s own speech for 10 minutes, making it much more
        difficult to form the verbal components of spells.
        >
        > Spells with verbal components cast by affected
        creatures have a minimum casting time of two rounds.

        to 
        > When this crystalline flower shatters, it covers creatures in a 10ft sphere in it's fine dust unless they succeed on a Dexterity saving throw against the contraption's save DC.
        >
        > Any creature covered by the dust involuntarily echoes it’s own speech for 10 minutes, making it much more difficult to form the verbal components of spells.
        >
        > While under this effect, casting a spell with verbal components requires a bonus action and the caster's full movement in addition to the spells normal requirements.
        </details>

    - <details><summary>Hurting Stone</summary>
        
        no changes
        > When this stone hits a creature or object after being
        dropped or thrown, it deals an additional 2d6 magical
        bludgeoning damage and loudly shouts “Ow!”.
        </details>

    - <details><summary>Sneezing Powder</summary>
            
        from   
        > This light powder hangs in the air for up to one minute,
        filling the volume of a 5ft cube. A creature entering or starting it’s turn in this cloud
        immediately uses it’s reaction to sneeze.

        to   
        > This light powder hangs in the air for up to one minute, filling the volume of a 10ft sphere. A creature entering or starting it’s turn in this cloud immediately uses it’s reaction to sneeze.
        </details>

    - <details><summary>Breezeblossom</summary>

        from   
        > It’s petals will always be carried away by a gentle
        breeze, going as far to create one themselves if needed.

        to  
        > It’s petals will always be carried away by a gentle breeze, going as far to create one themselves if needed. This breeze disperses any magical cloud or fog effects.
        </details>

    - <details><summary>Straightstep Briar</summary>
            
        from   
        > Creatures touching it’s oils need to make a Strength
        Saving Throw against the contraption’s Save DC or they
        need to start each of their turns by moving their entire
        movement in a straight line.

        to  
        > One fruit of this plant contains enough oil to cover a 10ft square for 10 turns.
        >
        > A creature touching this oil needs to succeed on a Strength saving throw against the contraption's save DC. On a fail, the creature needs to begin it's next 3 turns by moving it's full movement in a straight line in a direction of it's choice.
            
        </details>

    - <details><summary>Wandering Wart</summary>

        from   
        > Every six seconds, the spores of this mushroom teleport
        5ft laterally in a random direction, taking any creature
        they’re covering with them.
        >
        > A single creature can be affected by multiple
        instances of this effect, each one adding 5ft to the
        teleportation distance.


        to  
        > When this mushroom bursts open, it covers any creature in a 5ft radius in it's spores for one minute.
        >
        > A creature covered in these spores teleports 5ft laterally in a random direction at the beginning of it's turn. A single creature can be affected by multiple instances of this effect, each adding 5ft to the teleportation distance.
        </details>

    - <details><summary>Vanishing Velvet</summary>

        from 
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

        to  
        > Upon coming into contact with water, this moss turns itself and any creature it's covering mostly invisible for 10 minutes.
        >
        > During combat, an affected creature rolls a 1d10 at the start of every combatant's turn, loosing it's invisibility on a 1 and regaining or maintaining it on a roll of 2 or higher.
        </details>

    - <details><summary>Prismatic Thistle</summary>
            
        from   
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

        to
        > Sticks stubbornly to a creature, making it's outline glow vibrantly, shedding bright light in a radius of 5ft.
        >
        >Any attack roll against the affected creature has advantage if the attacker can see it, and the affected creature can’t benefit from being invisible.
        >
        >The effect ends if the creature removes the thistle using an action, or after 10 minutes.
        </details>
    </details>

## Fixed
- Contraption crafting rules are now referenceable via enricher
- Cunning Contraption now displays the item card
- Bear Spirit's Compelled Duel no longer gives Aviana a -100 to all Wisdom saving throws she makes

<details><summary><h2>Dev Details</h2></summary>  

- The following active effect flags related to shoving have been added:  
    - `flags.talia-custom.shove.sizeBonus` || ADD || NUMBER  
        for effects that make the actor count as a size larger or smaller for shoving
    - `flags.talia-custom.shove.distBonus` || ADD || NUMBER (in feet)  
        for effects that add or reduce the distance a creature can shove another creature. 
    - `flags.talia-custom.shove.isImmune` || ADD || NUMBER  
        for effects that grant or remove immunity to being shoved
</details>

# 0.1.1 - 2024/07/02
- Transferred the playerChangelog from TaliaCampaign repo to this repo. TaliaCampaign repo is slowly getting deprecated in favor of this one.

## Added
- Icon for Flexing
- Granted one additional 1st level spell slot to Fearghas and removed Mind Sliver from his known cantrips due to wild magic surge.
- Active Beast Spirit can now be changed by activating the chosen spirit's feature item.
- <details><summary>Beast Spirit: Elk</summary>

    - Features
        - Spirit of the Elk
        - Adept Forager
        - Stampede (unfinished, blocked by #33)  
            Until fixed, everything about this skill has to be done manually
        - Survival Instincts (unfinished, blocked by #33)  
            Until fixed, this skill needs to be used manually to grant temp hp.
        - Unstoppable
    </details>
- <details><summary>Beast Spirit: Bear</summary>

    - Features
        - Spirit of the Bear
        - Intimidating Presence
        - Savage Taunt
        - Compelled Duel
        - Ironfur
        - Survival of the Fittest
    </details>
- <details><summary>Beast Spirit: Tiger</summary>

    - Features
        - Spirit of the Tiger
        - Ambush Predator
        - Pouncing Strikes
        - Scent of Blood
        - Solitary Hunter
        - Rip and Tear
    </details>

## Fixed
- Grateful Fey Charm
- All characters now correctly show and use the OneDnD exhaustion system.
- Spells granted by spellbooks no longer duplicate when accessed by client and GM at the same time.
- Mantle of the Arcane Trickster again applies it's active effect when Mage Armor is being cast on the wearer if he's attuned to the mantle.

## Notes
- Rod of Hellish Flames is working as intended. When used it consumes it's use and applies an active effect to the user that maximises the damage of the next spell that deals fire or necrotic damage.

<details><summary><h2>Dev Details</h2></summary>  

- Jump distance in feet is now accessible within each actor's rollData under `actor.getRollData().talia.jumpDistance`. The number will always be a multiple of 5 (or 0).
- Three new Active Effects flags have been added:
    - `"flags.talia-custom.jumpDist.bonus"` | ADD | NUMBER  
        A number of ft to be added to the actor's maximum jump distance, can be negative.
    - `"flags.talia-custom.jumpDist.countDoubled"` | ADD | NUMBER  
        A number of times the sum of base distance + bonus should be doubled
    - `"flags.talia-custom.jumpDist.countHalved"` | ADD | NUMBER  
        A number of times the sum of base distance + bonus should be halved
- Added jump distance flag to active effects:
    - Adjust Density - Halved
    - Athletic Feat
</details>

# 0.1.0 - 2024/06/25

## Added
- Magic Item Charlatan's Die for Plex

- Player Macro: "Damage or Heal Self"
    > Macro allows users to apply a chosen amount of damage, healing, or temphp to owned tokens while respecting the system's application methods.
    This means parameters that alter damage taken, such as resistances or immunities, are taken into account.

## Changed
- Only 1 spice buff from Shalkoc's cooking can be active at any time but a new buff can now be applied after both a short and a long rest
- <details><summary>Armor of Agathys</summary>

    Changed how it works and added all of the spell's effects to the active effect.
    
    from
    > You gain 5 temporary hit points for the duration. If a creature hits you with a melee attack while you have these hit points, the creature takes 5 cold damage.

    to
    > You gain 5 temporary hit points. For the duration of the spell, if a creature hits you with a melee attack while you have temporary points, the creature takes 5 cold damage.
</details>

- <details><summary>Spellbook: Wither and Bloom</summary>

    Replaced the spell Wither and Bloom, granted by Vrazzak's spellbook, with newly added spell Life from Death.

    Wither and Bloom
    > You invoke both death and life upon a 10-foot-radius sphere centered on a point within range. Each creature of your choice in that area must make a Constitution saving throw, taking 2d6 necrotic damage on a failed save, or half as much damage on a successful one. Nonmagical vegetation in that area withers.
    >
    > In addition, one creature of your choice in that area can spend and roll one of its unspent Hit Dice and regain a number of hit points equal to the roll plus your spellcasting ability modifier.
    >
    > At Higher Levels
    >
    > When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d6 for each slot above the 2nd, and the number of Hit Dice that can be spent and added to the healing roll increases by one for each slot above 2nd.

    Life from Death
    > You invoke both death and life upon a 10-foot-radius sphere centered on a point within range. Each creature of your choice in that area must make a Constitution saving throw, taking 2d6 necrotic damage on a failed save, or half as much damage on a successful one. Nonmagical vegetation in that area withers.
    >
    > Then up to one creature of your choice in that area can regain a number of hit points equal to half of the total amount of damage this spell caused, rounded down.
    >
    > At Higher Levels
    > 
    > When you cast this spell using a spell slot of 3rd level or higher, the damage increases by 1d6 for each slot above the 2nd.
</details>

## Fixed
- Spellbooks now correctly grant and remove spells from actors upon equip/unequip.
- If the user has 1 or more inspirations and fails an Inscription check, the module will now ask for an optional reroll at the cost of an inspiration.
