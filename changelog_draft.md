# Structure
- Each feature branch appends its entries to this file under the appropriate category.
- Prefix each entry with one of the following tags: `add:`, `change:`, `remove:`, or `fix:` to specify the type of change.
- In case of merge conflicts, **retain all entries** to ensure no changes are lost.
- During release preparation, entries from this file are reviewed, organized, and moved into the main `changelog.md`.
# Drafts
- Spell gems are now considered to be spells instead of consumables for bab.
    - modified SpellGem creation to record spellSchool and component (only somatic, set for all spell gems) in flag on spell gem
    - modified the following methods in bab's code:
        - `RollHooks.preDisplayCard`
        - `FilterManager.itemTypes`
        - `FilterManager.spellSchools`
        - `FilterManager.spellComponents`
        - `FilterManager.spellLevels`
    - updated items to use bab instead of ActiveEffects to modify spell attacks and spell save DCs
        - Circlet of Blasting +1
        - Infernal Amulet
        - Sun Statue
        - Bless
        - Potion of Heroism
        - High Priest's Obsidian Battleaxe
    - updated items to work with these changes
        - Rod of Hellish Flames
    
    In summary this means that spellgems should now benefit from the same conditional bonuses that apply to actual spells.

    > **Note:**  
    > Spell gems created before this patch do not work with bonuses that apply only to spells of a certain school.   
    > At the time of writing, Evocation Wizard's feature Empowered Evocation is the only thing affected by this.
- fixed: Active Effects with automated repeating item use trigger 'onTurnEnd' not triggering
- fixed: Status effects should now be toggled off correctly, even in cases where the Active Effect created by the status effect also had statuses other than itself.