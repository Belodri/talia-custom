# 2.9.0 - 2025/06/15

-   <details><summary><h2>Added</h2></summary>

    - GM Macro 'Teleport Selected Tokens'
    </details>

-   <details><summary><h2>Fixed</h2></summary>

    - RestManager
        - Rest results are now public by default.
        - Added a message detailing rest begin and end

    - Exhaustion
        - Now actually affects rolls and spell DC (It didn't do anything before)
        - Removing the exhaustion effect now actually removes it from the actor

    - Fixed various bugs with jumping and teleportation abilities
        - Jump action
        - Eagle Spirit's Diving Strike
        - Fey Step
        - Soulknife's Psychic Teleportation
    </details>

# 2.8.0 - 2025/06/01

-   <details><summary><h2>Added</h2></summary>

    - Items
        - Astral Hoardling
        - Vandree Assassin Garb
    
    - Rules
        - Rest variation: Gritty-Lite
            - Short Rest: Duration: 8 hours, during which a character sleeps for at least 6 hours and performs no more than 2 hours of light activity.
            - Long Rest: Duration: 24 hours. A character can't benefit from more than one long rest in a 5-day period.
            - Extended Rest: Duration: 1 month, spent mostly in Promise. Is not interrupted by strenuous activity or rolling initiative. Only interrupted by leaving the island of Promise for more than 1 day at a time or for more than 4 days in total.

    - Animations
        - Psychic Blade
        - Psychic Blade (thrown)

    </details>

-   <details><summary><h2>Changed</h2></summary>

    -   <details><summary><strong>Void-Tainted Warlock Rebalance</strong></summary>

        - Void Form (1st level)
            - Added Reaping Claws scaling from the removed Ravenous Feast
            - Minor wording changes for clarity

            -   <details><summary>Details</summary>

                from
                > You can use your bonus action to awaken the ferocity and hunger of your patron, morphing its form with yours. This transformation lasts for 10 minutes or until you choose to end it as an action. During this time you gain the following abilities:
                > - Heightened Senses.  Your senses become supernaturally keen. You have darkvision out to a range of 60 feet and advantage on Dexterity (Stealth), Wisdom (Perception), and Wisdom (Survival) checks.
                > - Voracious Mind. You cannot concentrate on spells. If you’re concentrating on a spell when you enter this form, it ends immediately.
                > - Psychic Link. Your body counts as a spellcasting focus for your warlock spells.
                > - Reaping Claws. You sprout razor-sharp claws, which are natural weapons with a reach of 5 feet. You have proficiency with these weapons and can use your Charisma modifier for the attack and damage rolls made using these natural weapons. On a hit, your claws deal 1d6 slashing damage.
                > 
                > Starting at 10th level, you can choose to use a Boon of Eldritch Hunger immediately after using this feature as part of the same bonus action.
                > 
                > You can use this feature twice and you regain all expended uses when you finish a short or long rest.

                to
                > You can use your bonus action to awaken the ferocity and hunger of your patron, morphing its form with yours. This transformation lasts for 10 minutes or until you choose to end it as an action. During this time you gain the following abilities:
                > - Heightened Senses.  Your senses become supernaturally keen. You have darkvision out to a range of 60 feet and advantage on Dexterity (Stealth), Wisdom (Perception), and Wisdom (Survival) checks.
                > - Voracious Mind. You cannot concentrate on spells. If you are concentrating on a spell when you activate this form, your concentration on it ends.
                > - Psychic Link. Your body counts as a spellcasting focus for your warlock spells.
                > - Reaping Claws. You sprout razor-sharp claws, which are natural melee weapons with a reach of 5 feet. You have proficiency with these weapons and can use your Charisma modifier for the attack and damage rolls made using these natural weapons. On a hit, your claws deal 1d6 slashing damage, or 1d10 slashing damage once you reach 10th level in this class.
                >
                > Starting at 10th level, when you activate this feature, you can also choose to use one of your Boons of Eldritch Hunger as part of the same bonus action.
                > 
                > You can use this feature twice and you regain all expended uses of it when you finish a short or long rest.
                </details>

        - Essence Shards (1st level)
            - Shard Acquisition: Now 1 per Reaping Claw hit, plus 1 additional if crit or kill (max one additional).
            - Minor wording changes for clarity

             -  <details><summary>Details</summary>

                from
                > If you hit a creature with the claws granted by your Void Form, you tear out a shard of its essence to feed your patron. You can never have more shards than you have Warlock levels and you lose all remaining shards when your Void Form ends.
                > 
                > Starting at 6th level, you immediately gain 2 shards upon entering your Void Form. This number increases to 4 at level 10, and to 6 at level 14.

                to
                > Your strikes tear your targets' essence. When you hit a creature with an attack using your Reaping Claws, you gain one Essence Shard. If the attack is a critical hit or reduces the target to 0 hit points, you gain one additional Essence Shard.
                >
                > The maximum number of Essence Shards you can hold at one time is equal to your warlock level. You lose any unspent Essence Shards when your Void Form ends.
                > 
                > Starting at 6th level, you immediately gain 2 Essence Shards when you activate your Void Form. When you reach 10th and 14th level in this class, this number increases to 4 and 6 respectively.
                </details>

        - Boons of Eldritch Hunger (1st level)
            - Removed the general 14th-level rule granting an additional bonus action.
            -   <details><summary>Details</summary>

                from
                > You can use your bonus action to expend Essence Shards for your patron to devour in exchange for various boons. You unlock these boons as you gain Warlock levels, as seen below. Additional boons can be unlocked through killing powerful aberrations and feeding them to your patron (at your GM's discretion).
                > 
                > Additionally, starting at 14th level, when you activate a boon that cost 2 shards or less for the first time during your turn, you can immediately take one additional bonus action.

                to
                > You can use your bonus action to expend Essence Shards for your patron to devour in exchange for various boons. You unlock these boons as you gain Warlock levels, as seen below. Additional boons can be unlocked through killing powerful aberrations and feeding them to your patron (at your GM's discretion).
                </details>

        - Accrued Vitality (1st level Boon of Eldritch Hunger)
            - Temporary HP for initial shard increased to 1d8 + Charisma modifier (was 1d8).
            - Added: Can grant an additional bonus action if it's the first bonus action taken this turn.
            -   <details><summary>Details</summary>

                from 
                > You can expend 1 Essence Shard to gain 1d8 temporary hit points. You can choose to expend one or more additional Essence Shards to increase the temporary hit points gained by 1d8 per additional shard.

                to
                > You can expend 1 Essence Shard to gain temporary hit points equal to 1d8 + your Charisma modifier. You can choose to expend one or more additional Essence Shards to increase the temporary hit points gained by 1d8 per additional shard.
                > Additionally, if this ability is the first bonus action you've taken during this turn, you can choose to immediately take one additional bonus action.
                </details>

        - Grasping Talons (1st level Boon of Eldritch Hunger)
            - Reach effect duration increased to 1 minute (was until end of next turn).
            - Added: Can grant an additional bonus action if it's the first bonus action taken this turn.
            -   <details><summary>Details</summary>

                from 
                > You can expend 1 Essence Shard to increase the reach of your Reaping Claws by 5 feet until the end of your next turn.

                to
                > You can expend 1 Essence Shard to increase the reach of your Reaping Claws by 5 feet for 1 minute.
                > Additionally, if this ability is the first bonus action you've taken during this turn, you can choose to immediately take one additional bonus action.
                </details>
        
        - Netherwalk (1st level Boon of Eldritch Hunger)
            - Essence Shard cost reduced to 1 (was 2).
            - Added: Can grant an additional bonus action if it's the first bonus action taken this turn.
            -   <details><summary>Details</summary>

                from
                > You can expend 2 Essence Shards to increase your walking speed by 20 feet for 10 minutes.

                to
                > You can expend 1 Essence Shard to increase your walking speed by 20 feet for 10 minutes.
                > Additionally, if this ability is the first bonus action you've taken during this turn, you can choose to immediately take one additional bonus action.
                </details>

        - Mindrazor (6th level Boon of Eldritch Hunger)
            - Damage bonus duration increased to 1 minute (was until end of next turn).
            -   <details><summary>Details</summary>

                from
                > You can expend 3 Essence Shards to add an extra 3d8 psychic damage to the damage of your Reaping Claws until the end of your next turn.

                to
                > You can expend 3 Essence Shards to add an extra 3d8 psychic damage to the damage of your Reaping Claws for 1 minute.
                </details>

        - Bloodrazor (6th level Boon of Eldritch Hunger)
            - Crit range increase duration changed to 1 minute (was until end of next turn).
            -   <details><summary>Details</summary>

                from
                > You can expend 3 Essence Shards to increase the critical range of attacks you make with your Reaping Claws by 2 until the end of your next turn.

                to
                > You can expend 3 Essence Shards to increase the critical range of attacks you make with your Reaping Claws by 2 for 1 minute.
                </details>

        - Phase Shift (6th level Boon of Eldritch Hunger)
            - Added: Can grant an additional bonus action if it's the first bonus action taken this turn.
            -   <details><summary>Details</summary>

                from
                > You can expend 2 Essence Shards to teleport to an unoccupied space you can see within 30 feet.

                to
                > You can expend 2 Essence Shards to teleport to an unoccupied space you can see within 30 feet.
                > Additionally, if this ability is the first bonus action you've taken during this turn, you can choose to immediately take one additional bonus action.
                </details>

        - Eviscerate (10th level Boon of Eldritch Hunger)
            - Essence Shard cost increased to 4 (was 3).
            - Advantage effect duration increased to 1 minute (was until end of next turn).
            -   <details><summary>Details</summary>

                from
                > You can expend 3 Essence Shards to gain advantage on melee weapon attacks until the end of your next turn.

                to
                > You can expend 4 Essence Shards to gain advantage on melee weapon attacks for 1 minute.
                </details>

        - Ravenous Feast (10th level)
            - Removed as a standalone feature.
            - Effects partly integrated into Void Form and Essence Shards features.
            -   <details><summary>Details</summary>

                previously
                > You gain an additional Essence Shard when you land a critical hit with your claws against a creature for the first time on each turn and when you reduce a creature to 0 hit points for the first time on each turn.
                > 
                > Additionally, the damage die of your Reaping Claws grows to a d10.
                </details>


        - Feeding Frenzy (14th level)
            - Devouring effect text expanded and clarified.
            - Added: Gain Essence Shard upon devouring a target if Void Form is active.
            - Minor wording changes for clarity
            -   <details><summary>Details</summary>

                from
                > As an action, you can unleash your patron’s hunger. Choose one creature you can see within 60 feet of you which must make a Charisma saving throw against your spell save DC. On a failed saving throw, the creature takes 10d10 psychic damage, and half as much on a successful save. 
                > If this ability reduces the creature’s hit points to 0, it dies and you can choose to use this ability again immediately as part of the same action. 
                > 
                > Aberrations have disadvantage on the saving throw and take an extra 5d10 psychic damage on a failed save, or half as much on a successful save. When a creature is killed by this ability, its corpse is dragged into the void to be devoured by your patron.
                >
                > Once you use this feature, you can't use it again until you finish a long rest.
                
                to
                > As an action, you can unleash your patron’s hunger onto one creature you can see within 60 feet. The target must make a Charisma saving throw against your spell save DC. If the target is an aberration, it has disadvantage on this saving throw.
                > On a failed save, the target takes 10d10 psychic damage, or 15d10 psychic damage if it's an aberration. On a successful save, the creature takes half as much damage.
                > 
                > The target, along with everything it's wearing or carrying, is dragged into the void and devoured by your patron if this damage leaves it with 0 hit points. A creature devoured this way leaves behind no corpse and can be restored to life only by means of a true resurrection or a wish spell.
                >
                > If a target is devoured this way, you can use this ability again immediately as part of the same action. If your Void Form is active, you also gain one Essence Shard.
                >
                > Once you use this feature, you can't use it again until you finish a long rest.
                </details>
        </details>

    - Mythic Powers now regain expended uses on an extended rest.

    - All Exotic Currencies are now consumable items. The item type of the following items has been changed from 'loot' to 'consumable':
        - Dreamfeather
        - Hearthstone
        - Soul Coin

    - Alchemy Harvesting requestor messages are now visible to all players. 

    </details>

-   <details><summary><h2>Removed</h2></summary>

    - Alchemy Recipe for Potion of Immediate Rest
    - Electrum Pieces. Any electrum pieces owned were converted to silver pieces.

    </details>

# 2.7.0 - 2025/05/25

-   <details>
    <summary><h2>Added</h2></summary>
    
    - Races
        - Changeling
    - Backgrounds
        - Urchin
    - Subclasses
        - Soulknife
    - Spells
        - Anatagonize
    - Items
        - Dispelling Stone
        - Psychic Blade
        - Psychic Blade (thrown)
        - Shortbow +2
        - Sun Blade
        - Glamoured Studded Leather
        - Gloves of Thievery
        - Boots of Elvenkind
        - Cloak of Elvenkind
        - Rogue's Mantle
        - Echo Stone
        - Portable Hole
        - Bag of Holding
        - Lamp
        - Ball Bearings (bag of 1000)
    - Features
        - Shapechanger
        - City Secrets
        - Psionic Energy
        - Psi-Powered Knack
        - Psychic Whispers
        - Mark Soul
        - Phantom Pain
        - Psychic Teleportation
        - Psychic Veil
        - Soul Form
        - Sneak Attack
        - Cunning Action
        - Actor
        - Mobile
        - Skill Expert
        - Grasping Shadow
        - Shadow Strike
        - Ominous Will
        - Living Shadow
    </details>

-   <details>
    <summary><h2>Changed</h2></summary>

    - Refactored data exporter for character website
    </details>


# 2.6.0 - 2025/05/18

-   <details>
    <summary><h2>Added</h2></summary>

    - **Multiroll System**

        To make rolling multiple identical dice rolls more convenient, a new field `Roll Count` has been added to the roll configuration dialog for attack rolls, saving throws, skill checks, ability checks, and damage rolls. It determines how many times that roll configuration should be rolled (default 1).

        **Optional Modifiers**

        Any modifiers applied to the initial roll will also apply to all subsequent rolls without further checks. So please 
        be careful when adding optional modifiers (for example Guidance, Fury of the Small, or Inspiring Flex) and make sure they should apply to all rolls you make.
        
        **Skip Additional Surge Checks**

        When you use this feature to make multiple attack rolls, you can check the "Skip Additional Surge Checks" checkbox. This is for abilities that involve multiple attack rolls which do not cause surges individually (Eldritch Blast or Scorching Ray for example). For multiattacks, leave it unchecked (as each individual attack could cause a surge).

        **Damage Rolls & Crits**

        Because damage rolls for regular hits and for crits can have different configurations and modifiers, they must be rolled separately. For example: You cast Scorching Ray and land 3 hits and 2 crits. When multirolling the damage, you should first roll the 2 crits and then the 3 hits (or the other way around, order doesn't matter).

        **Chat Cards**

        To avoid spamming the chat, the results of multirolls are summarized with details such as individual rolls hidden behind a collapsible 'Details' dropdown.

        **Known Issues**
        - **Missing auto-collapse:** The 'Details' dropdown should expand and collapse automatically the same way as other, similar dropdowns.
        - **Incorrect flat damage modifications:** Flat damage modifications (from effects like "Any acid damage you take is reduced by 5.") are applied only once when applying multirolled damage, even if the source of the damage was technically multiple individual hits. Until this is fixed, we'll just handle it manually in the rare cases it does come up. Percentile damage modifications (resistance, vulnerability, etc.) are working correctly.
        - **Skip Surges Checkbox** The 'Skip Additional Surge Checks' checkbox shows even for attacks with items that cannot cause wild magic surges. This is simply a display issue as the code makes sure to not roll surges for items that shouldn't be able to. So it's fine to leave it unchecked when you make a multiroll attack with, for example, a mundane dagger, as that item can never cause a surge. 
    </details>

# 2.5.0 - 2025/05/11

-   <details>
    <summary><h2>Added</h2></summary>

    - Spells
        - Synaptic Static
        - Wellspring of Life
    - Items
        - Springseed
        - Black Dragonhide Cloak
        - Manual of Fiendish Flesh Golems
        - Headband of Intellect
    </details>

-   <details>
    <summary><h2>Changed</h2></summary>

    - Fishy Magic Mythic Power
        from
        > When you cast a spell that targets only one creature and doesn't have a range of self, you can spend 1 Mythic Power to target a second creature in range with the same spell.
        > 
        > If the spell fires a projectile, the projectile looks like a fish. If the spell doesn't, all targeted creatures smell like fish.

        to
        > When you cast a spell you can expend 1 Mythic Power to make a copy immediately after you cast it. The copy does not require any components and does not consume spell slots. The copy is considered to be a part of the original spell and should you fail to cast the original spell, the casting of the copy also fails. You can choose new targets for the copy.
    </details>

-   <details>
    <summary><h2>Fixed</h2></summary>

    - Added missing money to Emilio
    - Various typos in wild magic surge descriptions.
    </details>

# 2.4.0 - 2025/05/04
-   <details>
    <summary><h2>Added</h2></summary>

    - Inspirations for Emilio
    </details>

-   <details>
    <summary><h2>Fixed</h2></summary>

    - Various connectivity issues
    - A console error that occured when importing an actor under certain circumstances.  
    </details>

# 2.3.0 - 2025/04/27
-   <details>
    <summary><h2>Added</h2></summary>

    - Backgrounds
        - Voidwalker

    - Subclasses
        - Void-Tainted

    - Features
        - Moderately Armored
        - Tough

        - Accrued Vitality
        - Bloodrazor
        - Eldritch Energies
        - Eviscerate
        - Grasping Talons
        - Mindrazor
        - Nether Surge
        - Netherwalk
        - Phase Shift
        - Rend
        - Schism
        - Twist of Fate

        - Agonizing Blast
        - Book of Ancient Secrets
        - Devil's Sight
        - Grasp of Hadar
        - Hidden Heart
        - Trickster's Escape

        - Boons of Eldritch Hunger
        - Essence Shards
        - Feeding Frenzy
        - Ravenous Feast
        - Reaping Claws
        - Starbonded
        - Thirsting Claws
        - Void Form
        

    - Spells
        - Dissonant Whispers
        - Gift of Alacrity
        - Tasha's Mind Whip
        - Blink
        - Abhorrent Apparition
        - Void Torrent
        - Howling Horrors
        - Dying of the Light
        - Freedom of Movement
        - Eldritch Blast
        - Hellfire
        - Frostbite
        - Arms of Hadar
        - Alarm
        - Fear

    - Items
        - Adamantine Breastplate
        - Crown of the Wrath Bringer
        - Eldritch Claw Tattoo
        - Robe of Stars
        - Hooded Lantern
    </details>

-   <details>
    <summary><h2>Changed</h2></summary>

    - Players can no longer see the vision fields of other player characters when deselecting their own token.
    </details>

-   <details>
    <summary><h2>Fixed</h2></summary>

    - StatusEnricherDialog origin UUID retrieval
    - Token Action Hud missing categories
    - Token Action Hud settings dialog error
    - ItemsWithSpells settings dialog error 
    </details>

# 2.2.0 - 2025/04/20
-   <details>
    <summary><h2>Added</h2></summary>

    - Spells
        - Tether Essence
        - Reverse Gravity
    - Additional inspirations for Naami
    - Monster Features
        - Pack Tactics
    </details>

-   <details>
    <summary><h2>Changed</h2></summary>

    -   Toggle Status Effect Enricher Button

        ![toggleStatusEffect enricher button](imgs/toggleStatusEffectEnricherButton.png)

        Shift-clicking this button now opens a dialog to configure the status effect's duration.
        This includes options for special durations, for example making the effect expire at the end of the target's next turn in combat.

    - Refactored the code for ActiveEffects with repeating effects.
    - Monster Features
        - Minion
    </details>

-   <details>
    <summary><h2>Fixed</h2></summary>

    - A bug where settlement data would not load correctly if multiple journal entries shared the same name as the settlement.
    - Monster Features
        - Fear Aura
        - Frightful Presence
    </details>

# 2.1.0 - 2025/04/13
-   <details>
    <summary><h2>Added</h2></summary>

    - Currency Chat Logger
        - Tracks changes to actor currency and automatically sends a summary message to chat after a short delay
        - Chat message includes a breakdown of each currency type and the total value gained/spent in gp
        - Only triggers if currency logging is enabled for the actor (via toggle button on the actor sheet, if setting is enabled)
        - Debounce delay is configurable via GM setting (default 10 seconds)
        - Supports tracking across multiple currency updates within the debounce window, merging them into one summary message

    - Spells
        - Guiding Bolt
    </details>

-   <details>
    <summary><h2>Changed</h2></summary>

    - Raise Dead: Material cost changed from 500gp diamond to 5000gp diamond.
    - Cure Wounds: Reverted the previous buff (2d8 healing / spell level) back to raw (1d8 healing / spell level).
    - Gift of the Metallic Dragon: The Cure Wounds spell from this feat is now cast at 2nd level to compensate for the change to the spell itself.
    
    - Naami Spells
        - Replaced Inflict Wounds with Guiding Bolt
        - Replaced Prayer of Healing with Cure Wounds

    - Multiattack Button
        - Now fully supports both attack and damage rolls.
        - Non-optional bonuses are fully taken into account, while non-optional bonuses can only be applied to attack rolls.

        - Left-Click opens dialog to choose the number of attacks to be made.
        - Shift-Click skips the dialog and uses the item's base attack count (if set).
        - Ctrl-Click only rolls the damage of the last multiattack from the same message.

    - WebsiteData: Added dialog to select the player characters whose data should be exported to `websiteDataJSON` macro.
    </details>

-   <details>
    <summary><h2>Fixed</h2></summary>

    - Wild Magic: Surges are now correctly filtered by severity.
    - Selfless Healer: Added missing x2 multiplier.
    - Twinned Metamagic
        - Now avoids updates and further dialogs if the dialog to choose the spell level is cancelled.
        - Added missing minimum sorcery point cost for cantrips (1 SP).
    - Channeled Metamagic: Added the missing 1d10 to the number of dice rolled to determine the temporary reduction in maximum hit points (for a total default of 2d10 per sorcery point).
    </details>

# 2.0.0 - 2025/04/06
-   <details>
    <summary><h2>Added</h2></summary>

    - Character: Naami

    - Features
        - Hand of Healing (replaces Quickened Healing)
        - Metamagic: Subtle Spell
        - Metamagic: Twinned Spell
        - Metamagic: Heightened Spell
        - Healer
        - Channeled Metamagic

    - Spells
        - Whirlwind
        - Regenerate
        - Life Transference
        - Sleep
        - Healing Word
        - Blindness Deafness
        - Prayer of Healing
        - Mass Cure Wounds
        - Raise Dead
        - Heal
        - Ray of Enfeeblement
        - Wall of Force
        - Doom of Stacked Stones
        - False Life
        - Harm
        - Death God's Touch
    
    - Items
        - Dagger of Warning
        - Two-Bird Sling
        - Belt of Dwarvenkind
        - Figurine of Wondrous Power, Onyx Dog
        - Wand of Magic Detection
        - Keoghtom's Ointment
        - Staff of Power
        - Amulet of Fragile Tranquility
        - Little Finger of Dam'ghur
    </details>

-   <details>
    <summary><h2>Fixed</h2></summary>

    - Size-altering Active Effects can now be applied by non-GM clients.
    - Potion of Giant Size now correctly doubles both maximum and current hit points.
    - Weapons affected by Oil of Sharpness are now correctly tagged as magical.
    </details>

-   <details>
    <summary><h2>Changed</h2></summary>

    - Full rewrite of Spell Gem Trigger display
        - Refreshes automatically on scene change and can be refreshed manually through UI toggle
        - Allows non-GM users to display the triggers of all owned actors
        - Supports NPC actors in addition to PC actors
        - Supports runtime configuration via `TaliaCustom.Other.GemDisplay.configure()`

    - Full rewrite of "Damage of Heal Self"
        - Supports both numbers and roll formulas
        - Applies to all controlled tokens instead of just one
        - Renamed to "Damage or Heal Controlled" to reflect this change

    </details>

# 1.25.0 - 2025/03/23
-   <details>
    <summary><h2>Added</h2></summary>

    - Spells    
        - Cloudkill
        - Binding Shadows
        - Summon Umbral Spirit
            - Umbral Spirit actor
        - Shadow Monsters
        - Living Shadows
        - Douse Light
        - Candle's Insight
        - Augury
        - Sword Burst
        - Spare the Dying
        - Dancing Lights
        - Mind Blank
        - Deadly Sting

    - Features
        - Piercing the Veil
        - Shadowslip
        - Witchcraft
        - Altered Spellcasting Ability
        - Channeled Metamagic
        - Selfless Healer
        - Curing Hands

    Items
        - Ancient Adamantine Plate
        - Abjurer's Bangle
        - Broth of Needful Fortitude
        - Cap of Water Breathing
        - Oathgold Coin

    Race
        - Halfling (Witch of the Veil)
    </details>

-   <details>
    <summary><h2>Changed</h2></summary>

    - Triggered spell gem overlay now refreshes display data when toggled on.
    - Refactored `changesToConditions` (no mechanical changes)
    - The 'dead' status effect should now be displayed as an overlay on tokens by default to make it easier to discern living from dead.
    </details>

-   <details>
    <summary><h2>Fixed</h2></summary>

    - Fixed an error with triggered spell gem overlay if the equipped or attuned status of an item was modified while the item wasn't embedded on actor.
    - Ginseng Root Powder should now increase current hp by the same amount as max hp even when the actor wasn't at full health when consuming it.  
    </details>

# 1.24.0 - 2025/03/16
-   <details>
    <summary><h2>Added</h2></summary>

    - Spells
        - Polymorph
            Applying the transformation is handled manually; just tell me what you want to polymorph into.
        - Find Traps (changed to ritual)

    - Extended Rest recovery period for items (no mechanical changes, yet)

    - Multiattack button to item chat cards to speed up resolving multiple identical attack/damage rolls against a single target
        > Clicking the multiattack button while targeting a single token rolls the number of attacks the item was configured to roll (default 1). This number can be overridden by shift-clicking the button instead, allowing for up to 10 attacks to be rolled at once.
        > 
        > The attack configuration dialog is only shown for the first attack, all others will use the same configuration. That means if the first attack is rolled with advantage, so are all other attacks.
        > 
        > Once the attacks have been rolled, damage is rolled automatically without a damage configuration dialog, which will be added in the future. Until then, only flat, static modifiers to damage rolls work with this feature!
        > The number of damage rolls depends on the number of attacks that hit the target and critical hits are accounted for.
        > 
        > Until these issues are fixed, consider this feature mainly to be used for NPCs as they rarely have dynamic modifiers to damage rolls.
        > 
        Known issues:
        - No damage roll configuration dialog means bonuses from dynamic sources such as BaB are not applied.
        - The Multiattack button appears on Vice Grip but doesn't work as the Vice Grip card cannot roll attacks.
    </details>

-   <details>
    <summary><h2>Changed</h2></summary>

    - Refactored the code for RestManager and ExtendedRest (no mechanical changes)
    </details>

# 1.23.0 - 2025/03/08
-   <details>
    <summary><h2>Added</h2></summary>

    - Buildings
        - Shrine
        - Temple
        - Monastery
        - Cathedral
        - Engineer's Workshop
        - Airship Dockyard
        - Gallows
        - Market Square
        - Training Grounds
        - Homeless Shelter
        - Courthouse
        - City Walls
        - Stocks

    - Spells Plex learned from scrolls to Plex's character
        - Comand
        - Darkness
        - Knock
        - Major Image
        - Longstrider
        - Silence
        - Globe of Invulnerability
        - Death Ward

    - Script that automatically updates Shalkoc's spice list journal whenever he opens it so the amount of spices listed matches their actual quantities in his inventory. 

    - Toggleable display for equipped triggered spell gems with trigger condition. For Non-GM users, only spell gems equipped by their assigned character are displayed. 

    - Full implementation of GuildManager

    - Feature to allow GM clients to ignore tile occlusion. Toggleable in Tile config ui.
    </details>

-   <details>
    <summary><h2>Changed</h2></summary>

    - Spell gems now track their spell slot level (and trigger condition if they are triggered) in a flag. This has no immediate impact on how spell gems work. (Note that spell gems created before this patch do not track their spell slot)
    </details>

-   <details>
    <summary><h2>Fixed</h2></summary>

    - Synchronisation issues between existing settlements and the database

    - 3rd party module causing errors on player clients when an active effect is created or deleted on an actor they don't own through the use of a GM client proxy. [Link to commit in Belodri/fvtt-terrain-mapper_fork]( https://github.com/Belodri/fvtt-terrain-mapper_fork/commit/9429c65272906aa347bc0421709f693159e5b31f)
    </details>

# 1.22.0 - 2025/03/02

- Added first functional implementation of GuildManager. A some features are missing and a few bugs are to be expected but the core is working.

# 1.21.0 - 2025/02/23

-   <details>
    <summary><h2>Added</h2></summary>

    - Spells
        - Aganazzar's Scorcher
        - Contact Other Plane
        - Disintegrate
        - Etherealness
        - Knock
        - Major Image
        - Mordenkainen's Magnificent Mansion
        - Otiluke's Resilient Sphere
        - Plane Shift
        - Project Image
        - Remove Curse
        - Scatter
        - Silent Image
        - Tongues
        - Unseen Servant
        -   <details>
            <summary>Mental Prison (changed)</summary>

            from
            > You attempt to bind a creature within an illusory cell that only it perceives. One creature you can see within range must make an Intelligence saving throw. The target succeeds automatically if it is immune to being charmed.
            > 
            > On a successful save, the target takes 5d10 psychic damage, and the spell ends. On a failed save, the target takes 5d10 psychic damage, and you make the area immediately around the target's space appear dangerous to it in some way. You might cause the target to perceive itself as being surrounded by fire, floating razors, or hideous maws filled with dripping teeth. Whatever form the illusion takes, the target can't see or hear anything beyond it and is restrained for the spell's duration. If the target is moved out of the illusion, makes a melee attack through it, or reaches any part of its body through it, the target takes 10d10 psychic damage, and the spell ends.

            to
            > You attempt to bind a creature within an illusory cell that only it perceives. One creature you can see within range must make an Intelligence saving throw. The target succeeds automatically if it is immune to being charmed.
            > 
            > On a successful save, the target takes 5d10 psychic damage, and the spell ends. On a failed save, the target takes 5d10 psychic damage, and you make the area immediately around the target's space appear dangerous to it in some way. You might cause the target to perceive itself as being surrounded by fire, floating razors, or hideous maws filled with dripping teeth. Whatever form the illusion takes, the target is blinded and deafened to anything beyond it and is restrained for the spell's duration. If the target is moved out of the illusion, makes a melee attack through it, or reaches any part of its body through it, the target takes 10d10 psychic damage, and the spell ends.    
            </details>

        -   <details>
            <summary>Power Word Stun (changed)</summary>

            from
            > You speak a word of power that can overwhelm the mind of one creature you can see within range, leaving it dumbfounded. If the target has 150 hit points or fewer, it is stunned. Otherwise, the spell has no effect.
            > 
            > The stunned target must make a Constitution saving throw at the end of each of its turns. On a successful save, this stunning effect ends.

            to
            > You speak a word of power that can overwhelm the mind of one creature you can see within range, leaving it dumbfounded. If the target has hit points equal to or fewer than 10 * your caster level, it is stunned. Otherwise, the spell has no effect.
            >
            > The stunned target must make a Constitution saving throw at the end of each of its turns. On a successful save, this stunning effect ends.
            </details>

    - Creatures
        - Unseen Servant
    - Items
        - Leaden Fist
    </details>

-   <details>
    <summary><h2>Changed</h2></summary>

    - Updated items to use bab instead of ActiveEffects to modify spell attacks and spell save DCs (no mechanical changes).  
    This might cause the the spell attack bonus and spell save DC displayed on your character sheet to appear lower than they are because the evaluation of which bonuses apply to any given spell are now evaluated only when the spell is cast.

        - Circlet of Blasting +1
        - Infernal Amulet
        - Sun Statue
        - Bless
        - Potion of Heroism
        - High Priest's Obsidian Battleaxe
    </details>

-   <details>
    <summary><h2>Fixed</h2></summary>

    - Active Effects with automated repeating item use trigger 'onTurnEnd' should now trigger correctly

    - Status effects should now be toggled off correctly, even in cases where the Active Effect created by the status effect also had statuses other than itself.

    - A spell cast from a spell gem should now benefit from the same conditional bonuses that would apply to that spell if cast under the same circumstances. 
        > **Note**  
        > Spell gems created before this patch do not work with bonuses that apply only to spells of a certain school.   
        > Evocation Wizard's feature Empowered Evocation should be the only thing affected by this.

        <details>

        - Spell gems are now considered to be spells instead of consumables for various calculations.
        - Modified creation of spell gems to record spell school and component (only somatic, set for all spell gems) in flag on spell gem
        
        - Modified the following methods in bab's code:
            - `RollHooks.preDisplayCard`
            - `FilterManager.itemTypes`
            - `FilterManager.spellSchools`
            - `FilterManager.spellComponents`
            - `FilterManager.spellLevels`
        </details>
    - Rod of Hellish Flames' Surge of Brimstone should now work with spells cast from spell gems.
    </details>

# 1.20.0 - 2025/02/15

-   <details>
    <summary><h2>Added</h2></summary>

    - Utility class `DetectionChecker` to API
    - GmMacro `DPRCalc`
    - Creatures
        - War Devil
    </details>

-   <details>
    <summary><h2>Changed</h2></summary>

    - Tiger Spirit: Evaluation of isolated targets is now fully automated. The macro has been changed to allow for manual toggling if needed.
    </details>

-   <details>
    <summary><h2>Fixed</h2></summary>

    - Error when calling `wrap_Actor_prototype_toggleStatusEffect` with only a single argument.
    - Errors with 'dead' status effect and 'Mark NPC Defeated' GmMacro
    </details>

# 1.19.0 - 2025/02/11

-   <details>
    <summary><h2>Added</h2></summary>

    - Item use reminders for Active Effects with repeating effects. The following items have been updated to use this mechanic:
        - Hold Person
        - Slow
        - Hold Monster
        - Phantasmal Horror

    - Items
        - Ring of Greater Regeneration
        - Silver Tears (replacing Condensed Order)
        - Bracers of Defense
        - Boots of Vile Darkness
    - Spells
        - Astral Projection
    - (GM) overview of equipped triggered spell gems
    </details>

-   <details>
    <summary><h2>Added (Spoilers)</h2></summary>

    - Creatures
        - Githyanki Gish
        - Githyanki Knight
        - Githyanki Xenomancer
        - Ziraji Hunter
        - Black Earth Priest
        - Dragon Hunter
        - Battle Mage
        - Voidclaw Zombie
        - Shadow Assassin
    </details>

-   <details>
    <summary><h2>Removed</h2></summary>

    - Item: Condensed Order (replaced by Silver Tears)
    </details>

-   <details>
    <summary><h2>Changed</h2></summary>

    - Replaced Aviana's "Silver Wing Shield" feature item with an equivalent equipment item. (No mechanical changes)
    - Stone's Endurance: Added auto roll on use and removed "healing" tag (no mechanical changes).
    - Tiger Spirit's Solitary Hunter bonus is now toggled on/off manually via a macro since I can't figure out how to make the vision check work properly.
    </details>

-   <details>
    <summary><h2>Fixed</h2></summary>

    - Error when no flag for a repeating effect could be found on an active effect
    - Certain Active Effects which carry status effects did not apply as expected if the Active Effect used the same icon file as the carried status effect.
    - Certain Active Effects which carry status effects were misconfigured after breaking changes in 3rd party module. The following items affected by this have been fixed:
        - Hold Monster
        - Hold Person
        - Invisibility
        - Greater Invisibility
        - Sleet Storm
        - Grease
        - Earth Tremor
        - Telekinesis
        - Evard's Black Tentacles
        - Wall of Sand
        - Sapping Sting
        - Stunning Strike
        - Raulothim's Psychic Lance
        - Phantasmal Horror
        - Malice
        - Drow Poison
        - Torpor  
        ...as well as any potions, spell scrolls, or spell gems based on these
    - Various item descriptions in compendium (no mechanical changes):
        - Sapping Sting
        - Thunder Step
        - Jim's Magic Missile
    </details>

# 1.18.0 - 2025/02/04

-   <details>
    <summary><h2>Added</h2></summary>

    - Dialog to select the duration for Status Effects applied via enricher (by shift-clicking enricher)
    - Automatic repeating damage rolls for active effects (cannot use items or account for origin rollData yet)
    - Scene Effects
        - New Moon's Shroud
        - Blood Moon's Spite

    </details>

-   <details>
    <summary><h2>Added (Spoilers)</h2></summary>

    - Creatures
        - Infernal Chancellor
        - Devil Adjudicator
        - Pain Devil
        - Devil Jurist
        - Devil Notary (minion)
        - Lemure
        - Deva
        - Champion
        - Githzerai Zerth
        - Ashari Stoneguard
        - Gray Render
        - Wendigo
    </details>

-   <details>
    <summary><h2>Fixed</h2></summary>

    - Feature: Step of the Wind duration (and application)
    - Spell: Darkness
    - Spell: Arcane Gate
    </details>

# 1.17.0 - 2025/01/28

-   <details>
    <summary><h2>Added</h2></summary>

    - Settlement Overview and ingame date to website
    - Items
        - Jim's Lance of Compensation (documentation only, was added in 1.14.0) 

    - Spells
        - Suggestion
    </details>

-   <details>
    <summary><h2>Added (Spoilers)</h2></summary>

    - Items
        - Bracers of Asmodeus
        - Infernal Amulet
        - Ring of Treachery
        - Amulet of Appearance
        - Condensed Order
    
    - Creatures
        - Horned Devil
        - Merregon
        - Pit Fiend
        - Black Abishai
        - Green Abishai
        - Orthon
        - Imp
    </details>

-   <details>
    <summary><h2>Fixed</h2></summary>

    - Clientside click interaction with tiles on "Promise" scene
    </details>

-   <details>
    <summary><h2>Code</h2></summary>

    - Rewrote script for website data export 
    </details>

# 1.16.0 - 2025/01/21

-   <details>
    <summary><h2>Added</h2></summary>

    - Item: Boots of Blinding Speed
    - Application: Settlement
    - Realm Effect: Avernus
    </details>

# 1.15.0 - 2025/01/07

-   <details>
    <summary><h2>Added</h2></summary>

    Sound effects:
    - Toll the Dead
    - Fire Bolt
    - Ray of Frost
    - Mind Sliver
    - Shocking Grasp

    Animation effects:
    - Mind Sliver
    - Stunned Condition

    - 'Consume Usage' and 'Consume Resource' buttons can now be hidden from item cards if the respective checkboxes on item sheets are ticked.  
    </details>

-   <details>
    <summary><h2>Fixed/Changed</h2></summary>

    - Restored actor link for Find Familiar spell 
    - Fixed missing duration of Mystifying Miasma Cloud
    - Diving Strike can now target tokens of any size.
    - Critical hits & misses now display correctly, even if the total roll is lower/higher than target value.
    - Grapple
        - removed automated token dragging
        - removed automated size limitation
        - Grappled effect is automatically applied if the target of the grapple fails the contest.
    -   <details>
        <summary>Wyrmreaver Gauntlets (Guarding Runes)</summary>
        
        Refactored implementation and rewrorded the item description to clarify that the resistance buff does not automatically end. No mechanical changes.

        from
        > Additionally, whenever you finish a long rest, choose one of the following damage types: acid, cold, fire, lightning, or poison. You have resistance to the chosen damage type until you finish another long rest.

        to
        > You have resistance to one of the following damage types of your choice: acid, cold, fire, lightning, or poison. You can change the chosen type when you finish a long rest.
        </details>
    </details>

-   <details>
    <summary><h2>Known Issues</h2></summary>

    - Legendary Vigor's effect duration incorrectly displays as 'expired' under certain circumstances. This is a visual bug only; the effect duration is handled correctly. This is a bug with another module (see issue https://github.com/DFreds/dfreds-effects-panel/issues/56)
    </details>



# 1.14.0 - 2024/12/17

-   <details>
    <summary><h2>Added</h2></summary>

    - Realm Effect: Muspelheim
    - Item: Bag of Scolding
    </details>

-   <details>
    <summary><h2>Fixed/Changed</h2></summary>

    - Skill Empowerment no longer fails without displaying a notification if no token was targetted.
    - Jump
        - No longer restricts target destination (please don't jump out of the map or into walls...)
        - Maximum jump distance is now displayed in the item card.
        - The elevation of the jumping token now automatically updates to match the elevation of the target location.
    - Fixed missing sound effect for Diving Strike
    </details>

-   <details>
    <summary>Code</summary>

    - Added jumpDistance to rollData.
    - Refactored jump, divingStrike, mythicLegend#legendaryVigor to implement the addition of jumpDistance to rollData.
    - Added Scene Effects utility class and UI integration.
    </details>

# 1.13.1

- Updated each player character to mythic rank 2.
- Changed the wording of Mythic Lich's 'Essence Tithe' feature to clarify the order of events:

    from
    > Your mastery of forbidden magic allows you to replace costly material components with the essence of life itself. When casting a spell that consumes a material component with a specified gold piece cost, you may forgo the component and instead offer a tithe of life essence equal to 1d10 hit points per 25 gp of the component’s cost (minimum 1d10).
    > 
    > To pay the tithe, choose any number of willing creatures within 60 feet and divide the hit point damage among them as you choose. A creature's tithe cannot be higher than the amount of hit points than it has remaining and this damage cannot be reduced or mitigated in any way. If the sum of hit points lost this way does not meet or exceed the required cost, the spell fails, but the spell slot is not expended.

    to
    > Your mastery of forbidden magic allows you to replace costly material components with the essence of life itself. When casting a spell that consumes a material component with a specified gold piece cost, you may forgo the component and instead offer a tithe of life essence equal to 1d10 hit points per 25 gp of the component’s cost (minimum 1d10).
    > 
    > To pay the tithe, you must first choose any number of willing creatures within 60 feet. After rolling the tithe, divide the hit point damage among the willing  creatures as you choose. A creature's tithe cannot be higher than the amount of hit points than it has remaining and this damage cannot be reduced or mitigated in any way. If the sum of hit points lost this way does not meet or exceed the required cost, the spell fails, but the spell slot is not expended.

# 1.13.0 - 2024/12/10

<details>
<summary><h2>Added</h2></summary>

- Features
    - Mythic Dragon 2 Passive
    - Mythic Dragon 2 Active
    - Mythic Lich 2 Passive
    - Mythic Lich 2 Active
    - Mythic Legend 2 Passive (changed)
    - Mythic Legend 2 Active

- Spells
    - Withering Touch
    - Gravecraft
    - Soul Cage
    - Speak with Dead
    - Life Leech

- Items
    - Unholy Grimoire of Profanation
    - Soul in a Cage
    - Tiny Silver Cage

- Actors
    - Shalkoc's Hoard

</details>

<details>
<summary><h2>Changed</h2></summary>

- API
    - added actor (this) to Hooks.callAll("talia_addToRollData", this, rollData, taliaObj)
    - refactored itemProperties
    - added "Breath" item property to types: "consumable", "equipment", "weapon", "feat", "spell"
    - added "Breath" item property to items: "Breath of the Dragon" (Shalkoc & Compendium)
    - added Actor5e.prototype.getWealth() method
</details>

# 1.12.0 - 2024/12/03

<details>
<summary><h2>Added</h2></summary>

- Spells
    - Longstrider
    - See Invisibility
    -   <details>
        <summary>Revivify</summary>

        from
        > Components: V, S, M (diamonds worth 300 gp, which the spell consumes)

        to
        > Components: V, S, M (a diamond worth 5000 gp, which the spell consumes)
        </details>
    - Steel Wind Strike
    - Protection from Poison
    - Silence
    - Heroes' Feast
    - Blade Ward
    - Absorb Elements

- Items
    - Armor of the Litr Rune

- Features
    - Mythic Trickster 2 - Active
    - Mythic Trickster 2 - Passive

- Rules
    - Reduced Statistics
</details>

<details>
<summary><h2>Changed</h2></summary>

- Chat messages now display critical successes and fumbles for skill checks, tool checks, ability checks, and saving throws, in addition to the default attack rolls and death saves.
</details>

# 1.11.0 - 2024/11/26

<details>
<summary><h2>Added</h2></summary>

- Spells
    - Anticipate Arcana
    - Command
    -   <details>
        <summary>Ray of Sickness</summary>

        from
        > A ray of sickening greenish energy lashes out toward a creature within range. Make a ranged spell attack against the target. On a hit, the target takes 2d8 poison damage and must make a Constitution saving throw. On a failed save, it is also poisoned until the end of your next turn.
        > 
        > At Higher Levels. When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d8 for each slot level above 1st.

        to
        > A ray of sickening greenish energy lashes out toward a creature within range. Make a ranged spell attack against the target. On a hit, the target takes 2d8 poison damage and becomes poisoned until the end of your next turn.
        > 
        > At Higher Levels. When you cast this spell using a spell slot of 2nd level or higher, the damage increases by 1d8 for each slot level above 1st.
        </details>
    -   <details>
        <summary>Chill Touch</summary>

        from
        > You create a ghostly, skeletal hand in the space of a creature within range. Make a ranged spell attack against the creature to assail it with the chill of the grave. On a hit, the target takes 1d8 necrotic damage, and it can't regain hit points until the start of your next turn. Until then, the hand clings to the target.
        > 
        > If you hit an undead target, it also has disadvantage on attack rolls against you until the end of your next turn.
        > 
        > This spell's damage increases by 1d8 when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8).

        to
        > You create a ghostly, skeletal hand in the space of a creature within range. Make a ranged spell attack against the creature to assail it with the chill of the grave. On a hit, the target takes 1d8 necrotic damage, and it can't regain hit points until the start of your next turn. Until then, the hand clings to the target.
        > 
        > If you hit an undead target, it also has disadvantage on attack rolls against you until the start of your next turn.
        > 
        > This spell's damage increases by 1d8 when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8).
        </details>
    - Stinking Cloud
    - Microscopic Proportions
</details>

<details>
<summary><h2>Changed</h2></summary>

- Removed rerolling of initiative at the start of every round in combat as it makes working with active effects about as pleasant as french kissing a cheese grater.
-   <details>
    <summary>Master of Chance</summary>

    from 
    > You have a bonus to skill checks with one skill equal to 5 times your Charisma modifier.
    > This bonus changes to a different skill whenever you make a skill check, though it can apply to the same skill multiple times in a row.
    > You are not aware of which skill this bonus currently affects.

    to
    > When you make any skill check, roll an additional d12. If it lands on a 12, you gain a bonus to that skill check equal to 5 times your Charisma modifier.
    </details>
-   <details>
    <summary>Cure Wounds</summary>

    from
    > A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier. This spell has no effect on undead or constructs.
    >
    > At Higher Levels. When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 1d8 for each slot level above 1st.

    to
    > A creature you touch regains a number of hit points equal to 2d8 + your spellcasting ability modifier. This spell has no effect on undead or constructs.
    > 
    > At Higher Levels. When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 2d8 for each slot level above 1st.
    </details>
-   <details>
    <summary>Legendary Vigor</summary>

    from
    > Before making a Strength or Constitution ability check or saving throw, you can expend 1 Mythic Power to automatically succeed, treating the result as a critical success without rolling.
    
    to
    > By expending 1 Mythic Power as a free action on your turn, you can achieve feats of strength and endurance that most would consider to lie firmly in the realm of myth and legend. Alternatively, while it is not your turn, you can use this feature as a reaction, which you take before making a Strength or Constitution ability check or saving throw.
    > 
    > For 1 round per Mythic Rank, you gain the following benefits:
    > - Whenever you make a Strength or Constitution ability check or saving throw, you treat a d20 roll of 19 or lower as a 20.
    > - When using the Grapple action, you can grapple creatures of any size as if they were no more than one size larger than you.
    > - The damage of your melee weapon attacks against structures and objects increases by a factor of 10 per Mythic Rank.
    > - The maximum distance you can jump and the distance you can shove a creature when you use the Shove action both increase by a factor of 10 per mythic rank.
    > - Your carrying capacity and the weight you can push, drag, or lift increases by a factor of 10 per Mythic Rank.
    > 
    > Immediately after this effect ends, the grappled condition ends on any creature grappled by you if its size exceeds the maximum size you can grapple.
    </details>

-   <details>
    <summary>Chef Feat</summary>

    - Various UI/UX improvements
    - Mechanical changes:
    
    from
    > Time spent mastering the culinary arts has paid off, granting you the following benefits:
    > - Increase your Dexterity, Constitution, or Wisdom by 1, to a maximum of 20.
    > - You gain proficiency with cook's utensils if you don't already have it.
    > - As part of a short rest, you can cook a quick snack for your party, provided you have ingredients and cook's utensils on hand. Doing so takes one snack item for each party member and lets everyone in your party regain hit points equal to 1d8 * your proficiency bonus.
    > - When you finish a long rest and at the cost of one meal item per party member, you can make a meal for your party that gives them temporary hit points equal to 2d4 * your proficiency bonus.

    to
    > Time spent mastering the culinary arts has paid off, increasing your Dexterity score by 1, to a maximum of 20, and granting you proficiency with cook's utensils if you didn't already have it.
    > 
    > If you have ingredients and cook's utensils on hand, you can prepare up to 10 meals during one hour of dedicated work or as part of a short or long rest. Each meal requires one food and, optionally, one spice.
    > 
    > When preparing a meal, you can choose to enhance either its restorative or preventative properties, granting it one of the following benefits:
    > - Restorative. The creature regains a number of hit points equal to 1d8 * your proficiency bonus.
    > - Preventative. The creature gains a number of temporary hit points equal to 2d4 * your proficiency bonus.
    > 
    > Meals retain these enhanced properties only while fresh, meaning they must be consumed within 30 minutes of preparation. A creature that consumes a fresh meal gains the selected benefit as well as the effect of any spice used to flavor the meal.
    > 
    > A creature can benefit from only one enhanced meal per rest period.
    </details>
</details>

<details>
<summary><h2>Removed</h2></summary>

- Removed subtype "snack" from lootTypes.food
</details>


# 1.10.0 - 2024/11/19

<details>
<summary><h2>Added</h2></summary>

-   <details>
    <summary>Rules: Exhaustion</summary>

    Added rules for exhaustion (no gameplay changes) and fixes several issues with exhaustion integration in the system. The rules are worded as follows:
    > While you have the Exhaustion condition, you experience the following effects.
    >
    > Exhaustion Levels. This condition is cumulative. Each time you receive it, you gain 1 Exhaustion level. You die if your Exhaustion level is 10.
    >
    > D20 Tests Affected. When you make a D20 Test the roll is reduced by your Exhaustion level.
    >
    > Spell Save DCs Affected. Your Spell Save DC (or other Ability Save DC) is reduced by your Exhaustion level.
    >
    > Removing Exhaustion Levels. Finishing a Long Rest removes 1 of your Exhaustion levels. When your Exhaustion level reaches 0, the condition ends.
    </details>

-   <details>
    <summary>Spells</summary>
    
    - Detect Thoughts
    </details>

-   <details>
    <summary>Items</summary>
    
    - Medallion of Thoughts
    - Necklace of Fireballs
    - Oil of Immovability
    - Potion of Mind Restoration
    - Wardstone
    - Ioun Stone, Sandstone
    </details>
- Mythic Legend 2 Feature: Unflinching
- GmMacro `displayChoices()` to access any GmMacros via a UI.
- GmMacro `promptHarvestHerbs()` (so it's added to the displayChoices UI)
</details>

<details>
<summary><h2>Changed</h2></summary>

-   <details>
    <summary>Beast Spirit's Blessing</summary>

    In addition to the mechanical changes, spirits can now be activated by using the feature itself.

    from
    > During each short or long rest, you can spend some time training your physical abilities. Doing so will grant you the blessing of one of the beast spirits that guide or inspire you, depending on the kind of training you do.

    to
    > During each short or long rest, you can spend some time training your physical abilities. Doing so will grant you the blessing of one of the beast spirits that guide or inspire you, depending on the kind of training you do.
    > 
    > At level 12, your bond with the beast spirits strengthens, allowing you to exchange one blessing for another even when you're not taking a rest. Calling for a spirit's blessing this way takes an action and gives you one level of exhaustion.
-   <details>
    <summary>Contingency</summary>

    Reworked the spell's implementation. To activate the contingency, use contingency again when the trigger conditions occur and simply choose not to expend a spell slot.
    </details>
- All items with a use limit of day, dawn, or dusk have been changed to have a use limit per long rest instead.
- Removed restPrompt GmMacro (replaced by `rest()` GmMacro)
- Replaced `GmMacros.spellbook.addSpell/removeSpell` with `SpellbookManager.addSpell/removeSpell`;
</details>


# 1.9.0 - 2024/11/12

<details>
<summary><h2>Added</h2></summary>

- Plex Level 12
    - HD roll: 5
    - (ASI) +2 INT

-   <details>
    <summary>Items</summary>

    - Ioun Stone, Language Knowledge
    - Conch of Teleportation
    - Amulet of Proof against Detection and Location
    - Hoarfrost Shield
    - Bottle of Bagiennik Snot
    </details>

-   <details>
    <summary>Spells</summary>

    - Temporal Shunt
    - Gravity Fissure
    - Chain Lightning
    - Otiluke's Freezing Sphere
    - Curse of Biting Cold
    - Vortex Swap
    - Darkness
    </details>

-   <details>
    <summary>Rule: Alternate Skill Checks</summary>

    > Whenever you’re asked to make a skill check outside of combat, you may ask the DM if you can use a different skill by explaining how your character would approach the challenge. This can be expressed in whatever way you want - whether through description, narration, or in-character acting. The DM will consider your explanation and decide if the substitution is appropriate, and may adjust the difficulty (DC) of the check to reflect the nature of using the alternative skill.
    > 
    > Example Scenario: Imagine your ship has just sunk, and you're asked to make an Athletics (Strength) check to swim to the shore you can see in the distance. Depending on your character’s skills, you might approach this task differently. Here are a few examples for potential substitutions:
    > 
    > - Animal Handling (Wisdom): You recall seeing dolphins earlier and attempt to encourage them to guide you to shore.
    > - Nature (Intelligence): You’ve read about ocean currents and use this knowledge to align yourself with a helpful current.
    > - Survival (Wisdom): Having survived similar dangers, you focus on staying calm and moving efficiently.
    > - Performance (Charisma): You draw from water ballet skills you once learned to impress a merfolk, moving gracefully and efficiently through the waves.
    > 
    > Remember, creative substitutions are encouraged to enrich gameplay and give your character unique ways to face challenges, but they don’t guarantee success or a reduced difficulty.
    </details>

-   <details>
    <summary>Random Tables</summary>

    - Props - Settlements
    - Props - Nature
    </details>
- GmMacro `rest()` to choose a rest type and rest the actors of all selected tokens.
- Implemented damage absorption.
</details>

<details>
<summary><h2>Changed</h2></summary>

-   <details>
    <summary>Resting</summary>

    - Rests are now initiated by the GM.
    - Added rest type "extended rest" which lasts for 2 weeks.
    - Features which are used during the rest should now be used manually after the rest is completed. Of course they can just be roleplayed as being used during the rest itself, this is purely a mechanical change.
    </details>

-   <details>
    <summary>Chef Feat & Cooking</summary>

    - Remade the UI and workflow for Cooking
    - No longer initiates the rest.
    - Each serving now requires 1 food and (optionally) 1 spice.
    </details>
</details>

<details>
<summary><h2>Fixed</h2></summary>

- Items which roll to regain their expended uses now do so automatically again. This happens only after taking a rest and doesn't work for all rest types. (WIP)
- Error when a non-actor combatant was present during a combatTurnChange event.
</details>

<details>
<summary><h2>Removed Modules</h2></summary>

- Monk's Little Details
- Monk's Token Bar (Replaced the movement restriction in combat with custom code)
</details>

# 1.8.0 - 2024/11/05

<details>
<summary><h2>Added</h2></summary>

-   <details>
    <summary>Level 12</summary>

    - Aviana
        - HD roll: 10
        - (Feat) Guardian's Reflex (+1 CON)
    -Fearghas
        - HD roll: 5
        - (Feat) Ironclad Heritage (+1 STR)
    -Shalkoc
        - HD roll: 8
        - (Feat) Gift of the Metallic Dragon (+1 WIS)
    </details>

-   <details>
    <summary>Spells</summary>

    - Cure Wounds
    - Sending
    - Slow
    -   <details>
        <summary>Guidance</summary>

        Changed the spell because I cannot implement the option to roll the die after the ability check due to technical limitations.

        from
        > You touch one willing creature. Once before the spell ends, the target can roll a d4 and add the number rolled to one ability check of its choice. It can roll the die before or after making the ability check. The spell then ends.

        to
        > You touch one willing creature. Once before the spell ends, the target can roll a d4 and add the number rolled to one ability check of its choice. It has to roll the die before making the ability check. The spell then ends.
        </details>
    </details>

-   <details>
    <summary>Feats</summary>

    - Guardian's Reflex
    - Ironclad Heritage
    - Gift of the Metallic Dragon
    - Versatility through Unpredictability
    </details>
- GM Macro `generateAttackDescriptions` - used to generate and update monster attacks
</details>

<details>
<summary><h2>Fixed</h2></summary>

- Jump: improved performance by removing crosshairs animation.
- Fey Step: improved performance by removing crosshairs animation.
- Removed custom crosshairs class (replaced by Sequencer).
- Eating the same spice twice in a row should now correctly refresh the effect's duration.
- Missing import in `pcItemsToJSON` macro.
- Added timeout functionality to `pcItemsToJSON` macro so it can be used from the console.
</details>


# 1.7.0 - 2024/10/29

<details>
<summary><h2>Added</h2></summary>

- Condition "Dazed"
    > A dazed creature can only do one of the following things on their turn: move, use an action, or use a bonus action. If a creature becomes dazed during their turn, their turn ends. The cure ailment power, lesser restoration spell, and greater restoration spell remove the dazed condition. At the GM's discretion, other powers, spells, or effects might also remove the dazed condition.
    >
    > When a dazed creature is affected by a spell or effect that gives them an extra action on their turn (like the haste spell or the fighter's Action Surge feature), they can still take this extra action, in addition to the movement, action, or bonus action allowed by the dazed condition.
    > 
    > Some creatures in this book have immunity to the dazed condition. At the GM's discretion, a creature published in the core rules or another supplement who has immunity to the paralyzed or stunned condition also has immunity to the dazed condition.
- Item "Abyssal Nail Polish"
- Item "Voidborn Explorer's Spellbook"

-   <details>
    <summary>Spells</summary>

    - Call of the Void
    - Legend Lore
    - Forbiddance
    - Word of Recall
    - Foresight
    - Sign of Sanctuary
    </details>
- GM Macro `pcItemsToJSON` - used to update the character website
</details>

<details>
<summary><h2>Changed</h2></summary>

- Formatting of spell gem descriptions (no functionality change)
</details>

<details>
<summary><h2>Fixed</h2></summary>

- Spellbooks once again have the equipment type 'spellbook'
- Custom conditions are now implemented correctly and should no longer throw errors when applied via the character sheet.
</details>

# 1.6.0 - 2024/10/22

<details>
<summary><h2>Added</h2></summary>

- 'Fixed' Necklace of Mighty Breath by adding an upgraded version.
- Spirit of the Eagle features
    - Spirit of the Eagle
    - Keen Sight
    - Billowing Wings
    - Diving Strike
    - Double Down
- Condition "Distracted"
    > A distracted creature cannot take reactions.
- Spellscribing to rules (no changes)
</details>

<details>
<summary><h2>Changed</h2></summary>

- Activating (changing to) a new Beast Spirit can now cause a wild magic surge.
- Spirit of the Bear: Reduced the duration of the Taunted effect from Savage Taunt and Compelled Duel from three turns to two turns.
-   <details>
    <summary>Spirit of the Elk</summary>

    -   Adept Forager (unchanged)
    -   <details>
        <summary>Stampede -> Battering Ram</summary>

        from
        > As a bonus action, you charge forward in a straight line up to a distance equal to your maximum jump distance.
        > You pass through creatures in your path, pushing them backward in the direction of your charge. The distance each creature is pushed is equal to the distance you can shove a creature of that size.
        > Colliding with a creature does not slow or stop your charge.

        to
        > When you take the Attack action on your turn, you can replace one of your attacks with a special charge attack.
        >
        > You move up to 50 feet in a straight line that is 5 feet wide, stopping when you hit the first creature in your path. The creature must make a Strength saving throw (DC = 8 + your Strength modifier + your Constitution modifier + your proficiency bonus). On a failed save, the creature takes 1d12 + your Strength modifier bludgeoning damage and is knocked back a distance equal to how far you charged before hitting it (to a maximum of 50 feet).
        >
        > If the creature is knocked back into another creature or a solid object, additional effects occur based on the distance it was knocked back:
        >
        > - Less than 30 feet: The creature is distracted until the start of its next turn.
        > - 30 to 40 feet: The creature is restrained until the end of its next turn.
        > - More than 40 feet: The creature is paralyzed until the end of its next turn.
        >
        > If the creature collides with another creature, both creatures suffer the same effect.
        </details>
    
    -   <details>
        <summary>Survival Instincts</summary>

        from
        > When you use Stampede, you gain an amount of temporary hit points equal to your barbarian level.
        > Additionally, the distance you're able to shove a creature is increased by 10ft.

        to
        > Your walking speed is increased by 20ft, you have a 1d6 bonus to your initiative rolls and, as long as you aren't incapacitated, you cannot be surprised.
        > Using Battering Ram grants you an amount of temporary hit points equal to your barbarian level.
        </details>
    
    -   <details>
        <summary>Unstoppable</summary>

        from
        > As long as you're not incapacitated, your movement speed cannot be reduced.
        > 
        > Additionally, when using Stampede, you can charge through and break objects, such as walls, up to 5ft thick.
        > Stampede can also charge through magical barriers by succeeding on a Strength saving throw against the caster's spell save DC. If the barrier requires concentration to sustain, breaking through it immediately ends the caster's concentration.

        to
        > As long as you're not incapacitated, your movement speed cannot be reduced and you are immune to being frightened, restrained, grappled, or knocked prone..
        >
        > Additionally, you can use Battering Ram to charge through and break solid objects, such as walls, up to 5ft thick.
        > You can also charge through and create holes in magical barriers this way if you succeed on a Strength saving throw against the caster's spell save DC. If the barrier requires concentration to maintain, breaking through it immediately ends the caster's concentration on the barrier.
        </details>
    </details>
</details>

<details>
<summary><h2>Fixed</h2></summary>

- Feral Instinct now correctly grants advantage on automatic initiative rolls
- Applying the incapacitated status no longer throws an error (fixed in DAE 11.3.65)
- Continual Flame Gem no longer duplicates auras.
- Beast Spirit Blessing activations appearing twice in the chat log.
-   <details>
    <summary>Barbaric Critical</summary>

    Fixed the deleted effect and clarified the wording of the ability so it better reflects the implementation.

    from
    > Attack rolls against you or creatures within 5ft of you have their critical hit threshold reduced by 1. When you reach level 13 and 17, this increases to a reduction in critical hit threshold of 2 and 3 respectively.
    >
    > Additionally whenever a hostile creature scores a critical hit against you, you recover 1 spent Rage. When you reach level 13 and 17, this increases the amount of Rage you recover to 2 and 3 respectively.

    to
    > If you or a creature within 5ft of you is the first target of an attack roll, that attack's critical hit threshold is reduced by 1. Additionally, whenever a hostile creature scores a critical hit against you, you recover 1 spent Rage.
    > At levels 13 and 17, the reduction to the critical hit threshold and the amount of Rage you recover both increase by 1.
    </details>
</details>

# 1.5.0 - 2024/10/15
<details>
<summary><h2>Added</h2></summary>

- Items can now have limited uses per turn or per round which are regained automatically (only works while in combat).
</details>

<details>
<summary><h2>Changed</h2></summary>

- HP bars for player character tokens are now visible for everyone.
- Sun Statue is no longer soulbound.

-   <details>
    <summary>Sneaky Spellshite's Amulet</summary>

    - No longer soulbound
    - Now tracks and regains uses per turn automatically
    - Minor mechanical buff

    from
    > Once per turn, you can deal an extra 1d6 damage per character level to one creature you hit with a spell attack if you are hidden from them or if you are invisible.
    > Additionally whenever you make a spell attack while hidden or invisible, the critical range of the spell attack is increased by 2.

    to
    > The critical range of spell attacks you make while hiding or invisible is increased by 2.
    > Once per turn, when you make a spell attack while hiding or invisible, you can add an extra 1d6 damage per character level to that attack's damage roll.
    </details>
</details>

<details>
<summary><h2>Fixed</h2></summary>

- Towering Pillar of Hats now grants the correct bonus again.
</details>

# 1.4.0 - 2024/10/01

<details>
<summary><h2>Added</h2></summary>

- Rule for "Undoing a Surge"
- The chat card of wild magic surges now mention the surge's severity.
</details>

<details>
<summary><h2>Changed</h2></summary>

- Overhauled all wild magic surge effects, making them much more impactful.
-   <details>
    <summary>Reduced Active Effect Bloat</summary>

    Reduced active effect bloat by moving the following active effects to character data.
    - Powerful Build
    - Unarmored Defense (Barbarian)
    - Fast Movement
    - Feral Instinct
    - Silver Wing Shield
    - Athletic (jumpDist.bonus flag -> actor flag)
    - Unarmored Defense (Monk)
    - Purity of Body
    - Evasion
    </details>
</details>

<details>
<summary><h2>Fixed</h2></summary>

- Relentless Rage
- Formatting error with wild magic surges
- Steeling Drink image
- Sunbeam now no longer requires multiple casts, no mechanical changes
- Sun Statue (updated with new Sunbeam)
- Bless now works without the extra s
</details>

# 1.3.0 - 2024/09/10

An upcoming update for the Foundry D&D module, wihch is gonna release in 1-2 weeks, is gonna break pretty much all code that interacts with items in any way (which is like 80% of all my code) so I'm not gonna fix any more stuff until that's out.

<details>
<summary><h2>Added</h2></summary>

- Items
- Bugman's Ale

-   <details>
    <summary>Loot Item Category: Trade Goods</summary>

    Subcategories:
    - Livestock
    </details>
</details>

<details>
<summary><h2>Fixed</h2></summary>

- Fixed Skill Empowerment not displaying in chat if the same buff was chosen twice in a row.
</details>

# 1.2.0 - 2024/09/03

<details>
<summary><h2>Added</h2></summary>

- Spells
    - Contingency
    - Create or Destroy Water
    - Maelstrom
- Items
    - Instant Door
    - Wine of the Winter Court
    - Shadow Lantern
    - Cane of Tides
</details>

<details>
<summary><h2>Changed</h2></summary>

-   <details>
    <summary>Evocation Savant</summary>

    from
    > Beginning when you select this school at 2nd level, the gold and time you must spend to copy an evocation spell into your spellbook is halved.

    to
    > As a bonus action, you can swap out any of your prepared spells with an unprepared evocation spell you know. You can use this feature a number of times per day equal to your proficiency bonus.
    </details>
</details>

<details>
<summary><h2>Fixed</h2></summary>

- Spell Failure chance now applies only when the item is attuned, not if it's just equipped.
- Wild Magic Surges throwing an error instead of triggering properly.

- Size-changing effects work again. Also fixed the following related items:
    - Spell: Enlarge/Reduce
    - Item: Potion of Giant Size
    - Item: Potion of Diminuation
    - Item: Potion of Growth
    Known Issue: Currently the effects of Enlarge/Reduce stack with the effects of Potion of Diminuation/Growth even though they shouldn't.
</details>

<details>
<summary><h2>Dev Details</h2></summary>

- Wild magic surge chance can now be set per scene via a flag `scene.flags.talia-custom.surgeChance = {number between 0 and 1}`. If no flag is found, a default chance of 5% will be used.
- To grow or shrink an actor, make a non-transfer active effect with the change `macro.execute || CUSTOM || "daeMacro_sizeChange" {Number of steps}`.
    Number of steps can be positive (to grow) or negative (to shrink).
    Example: `macro.execute || CUSTOM || "daeMacro_sizeChange" -1` - shrinks the actor by 1 category on effect application, grows by 1 on effect end
</details>

# 1.1.0 - 2024/08/27

<details>
<summary><h2>Added</h2></summary>

- Feature: Aspect of the Wyrm
- Feature: Relentless Rage
- Rule: Ancient Armor and Shields
- Automation for handling Arcane Spell Failure
- Magic Item: Ancient Chainmail of Celerity
- Magic Item: Glasses of Scarlet Sight
- Magic Item: Ring of Free Action

-   <details>
    <summary>Spells</summary>

    - Arcane Gate
        Unfortunately I cannot implement the directional part of this spell, the rest works though.
    - Sunbeam
    - Gates and Wards 
    </details>

-   <details>
    <summary>Trade Goods: Food (Snacks)</summary>

    - Bread
    - Chocolate
    - Chocolate Chip Cookies
    - Honey Cookies
    - Mead
    - Mixed Jellied Fruits
    - Mulled Wine
    - Pistachio Pie
    - Rhubarb Pie
    </details>

-   <details>
    <summary>Trade Goods: Food (Meals)</summary>

    - Cheese
    - Dried Meat
    - Eggs and Sausage
    - Eggs, Rice, and Green Beans
    - Goulash
    - Grilled Ribs
    - Grilled Steak
    - Smoked Meats
    </details>
</details>

<details>
<summary><h2>Changed</h2></summary>

- Leveled up characters from 10 to 11.

-   <details>
    <summary>Dwarf (Mountain) racial feature: Speed</summary>

    from
    > Your speed is not reduced by wearing heavy armor.

    to
    > Your speed is not reduced by wearing armor.
    </details>

-   <details>
    <summary>Resting, Chef Feat, Cooking, Spices, and Food</summary>

    Big changes to the way resting works.
    Rests are now initiated either by the GM or by Shalkoc by using his Chef feat.
    If Shalkoc uses his Chef feat, he'll either cook a meal during a long rest or a snack during a short rest. In both cases he can choose to flavour the food with spices.
    The food items are now split into two categories: meals, which are eaten during long rests, and snacks, which are eaten during short rests.

    To be able cook, Shalkoc needs to have enough food items on him. Or rather he needs to have a single food item (say for example Goulash) on him which has a quantity that's larger than or equal to the number of active player characters. 
    Using multiple different food items at once is not possible at the moment.

    While a number of food items are required to cook during a rest, using a spice item while cooking is optional and if used, only one will be consumed, no matter how many characters are resting.
    
    The added items will also be available for sale from merchants and serve as a test for various kinds of merchant, loot, and trading related additions that I'm working on.
    </details>
</details>

<details>
<summary><h2>Fixed</h2></summary>

- TaliaUtils.Helpers.SECONDS is now correctly accessible as a static property.
- Fixed faulty rolling of player inspirations.
- Effects granted by spices have been added to dfred's CE
- Fixed spices' item type not matching the assigned itemType in the config.
- Fixed `displayItemInfoOnly()` helper displaying a message when it shouldn't and not displaying one when it should. Also supports pop-out now.
- Temporary fix for Wyrmreaver Gauntlets until I can figure out a better solution. At least they no longer break everything when used.
</details>

<details>
<summary><h2>Dev Details</h2></summary>

- added message flag `talia-custom.hideFromSelf || boolean` to hide chat messages from the author
- added GM macro `TaliaCustom.GmMacros.requestRest()` to request a long/short rest from any actor that clicks the msg button.
    also advances time and checks if newDay item use refresh should be triggered
    Note: This will have to be reworked properly once the 4.0.0 changes to resting are out.
- added helper function `isRollSuccess(roll)` to easily determine if a d20 roll is a success against it's own target value.
- added helper function `getRandomInt(min, max)` to easily generate random integers inclusively
- added helper function `checkAttunement(item)` to easily check an item's attunement status
</details>

# 1.0.0 - 2024/08/20

Rewrote/restructured most of the code to better integrate with the v12 changes and future system updates.
Expect lots of bugs and please report each one you encounter in the discord.

## Known Issues
- Size changing effects no longer work and need to be rewritten from the ground up.
- Shalkoc's item "Wyrmreaver Gauntlets" break on activation. Their passive still works as intended.

<details>
<summary><h2>Added</h2></summary>

- Common Action: Jump
</details>

# 0.6.0 - 2024/08/13
<details>
<summary><h2>Added</h2></summary>

-   <details>
    <summary>Common Action: Grapple</summary>

    Allows grappling and moving of other tokens.
    To release the grapple, simply delete the grappling active effect on the grappling actor or delete the grappled condition on the grappled actor.
    </details>
- Spell: Traitorous Blood
</details>

<details>
<summary><h2>Changed</h2></summary>

-   <details>
    <summary>Reckless Attack</summary>

    Changed so it's easier to integrate with other effects.
    
    from
    > Starting at 2nd level, you can throw aside all concern for defense to attack with fierce desperation. When you make your first attack on your turn, you can decide to attack recklessly. Doing so gives you advantage on melee weapon attack rolls using Strength during this turn, but leaves you flat-footed (attack rolls against you have advantage) until the start of your next turn.

    to
    > Starting at 2nd level, you can throw aside all concern for defence to attack with fierce desperation. When you make an attack, you can decide to attack recklessly. Doing so gives you advantage on melee weapon attack rolls, but attack rolls against you have advantage. These effects last until the start your next turn.
    </details>
</details>
<details>
<summary><h2>Fixed</h2></summary>

- Vice Grip is now typed as a melee weapon and can be affected by buffs and debuffs involving these. No gameplay changes, just future proofing.
- Rage
    - Added the effects of Totem Barbarian's level 3 Eagle feature to the Rage feature itself. (no mechanical change)
    - It now correctly adds the damage on melee weapon attacks using Strength only instead of to all damage.
</details>

<details>
<summary><h2>Dev Details</h2></summary>

- api function `requestRoll` to allow macros and players to make us of the system's roll request feature added via enrichers. Check enrichers for documentation.
</details>


# 0.5.0 - 2024/08/06
<details>
<summary><h2>Added</h2></summary>

- Rules: Legendary Resistances
- Rules: Triggered Abilities

-   <details>
    <summary>Item Property: Soul-Bound</summary>

    This property can be found on item types that are normally tradeable (Equipment, Weapons, Consumables, Containers, Loot, and Tools).  
    If set on an item, please don't trade it to others or put it into a storage chest that others have access to.

    -   <details>
        <summary>Aviana Soul-Bound items</summary>

        - Lethal Limbs
        - Strionic Resonator
        - Spelleater's Charm
        - Royal Commander's Cloak
        - Grateful Fey's Charm
        - Rod of Unwilling Retribution
        - Cursed Thunderfeet Footwraps
        </details>
    
    -   <details>
        <summary>Fearghas Soul-Bound items</summary>

        - High Priest's Obsidian Battleaxe
        - Ring of Unbridled Power
        - Rod of Hellish Flames
        - Dead Knight's Chain Shirt
        - Spellbook: Strength through suffering (of others)
        - Spellbook: Unholy Grimoire of Blood
        </details>

    -   <details>
        <summary>Plex Soul-Bound items</summary>

        - Sneaky Spellshite's Amulet
        - Mantle of the Arcane Trickster
        - Swiftstrider's Boots
        - Shaman's Lucky Charms
        - Sun Statue

        </details>

    -   <details>
        <summary>Shalkoc Soul-Bound items</summary>

        - Unarmed Strike (Draconic Strike)
        - Drunken Brawler's Dancing Shoes
        - Handwraps of Swift Strikes
        - Necklace of Mighty Breath
        - +3 Dragonhide Belt
        - Wyrmreaver Gauntlets
        </details>

    </details>
- Common Action: Dodge
-   <details>
    <summary>The following status conditions now have actual effects</summary>

    - blinded
    - deafened
    - dodging
    - grappled (only setting movement to 0 for now)
    - invisible
    - paralyzed
    - petrified
    - poisoned
    - prone
    - restrained
    - stunned
    - unconscious
    </details>
- Macro for assigning player inspirations
-   <details>
    <summary>Spells (spoiler warning)</summary>

    - Arcane Eye
    - Death Ward
    - Fire Shield
    - Guardian of Nature
    - Raulothim's Psychic Lance
    - Minor Illusion
    -   <details>
        <summary>Resistance (changed)</summary>

        from
        > You touch one willing creature. Once before the spell ends, the target can roll a d4 and add the number rolled to one saving throw of its choice. It can roll the die before or after making the saving throw. The spell then ends.

        to
        > You touch one willing creature. For the duration of the spell, the creature adds a d4 to all saving throws.
        </details>
    - Thorn Whip
    - Vicious Mockery
    - Revelation Through Battle
    - Phantasmal Horror
    </details>
-   <details>
    <summary>Magic Items (spoiler warning)</summary>

    - Tankard of Plenty
    - Guardian Scale of Abjuration
    - Guardian Scale of Conjuration
    - Guardian Scale of Divination
    - Guardian Scale of Enchantment
    - Guardian Scale of Evocation
    - Guardian Scale of Illusion
    - Guardian Scale of Necromancy
    - Guardian Scale of Transmutation
    - Broken Sentinel Statue (alongside Ironfeather Sentinel actor)
    </details>

-   <details>
    <summary>Mythic Features (major spoiler warning!)</summary>

    - Mythic Power (1 for each)
    - Legendary Vigor
    - Titanous Strength
    - Fishy Magic
    - Master of Chance
    - Rejuvination
    - Legendary Resistance
    - The Price of Knowledge
    - Spectral Hand
    </details>

</details>

<details>
<summary><h2>Fixed</h2></summary>

- Attunements not working (very bandaid fix, will likely break again, system devs have no idea what's causing it and don't want to provide support since the bug isn't happening in never versions).
- Renamed Plant Muscle Fibers to Plant Muscle Fibres so they can actually be harvested now.
- Breath of the Dragon now has the correct number of free uses per day instead of half. Also fixed it's description.
</details>

<details>
<summary><h2>Dev Details (also major spoiler warning)</h2></summary>  

- added flag `flags.talia-custom.mythicRank` = 0 to every player character.
- added macro "Set Mythic Rank" which sets the mythic rank for selected actor. 
    For player characters it also changes their alignment to instead dislpay their mythic path and rank.

- added macro "Recharge Mythic Power" which Simple Calendar will execute every sunday ingame.
    It recharges any expended uses of Mythic Power for all characters which have `flags.talia-custom.mythicRank` set to a truthy value.

- API function `TaliaCustom.breathOfTheDragonDialog(item)`
    ItemMacro for Breath of the Dragon

- API function `TaliaCustom.gmScripts.playerInspirations()`
    Rolls inspiration for each active player and whispers the result to a different player.
    The generated chat message is also pinned.

- _foundryHelpers function `insertListLabels(htmlString, newLabels)`
    Used to add item properties to chat cards. Added to Wild and Soul-Bound properties. 
</details>

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
