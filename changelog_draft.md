# Structure
- Each feature branch appends its entries to this file under the appropriate category.
- Prefix each entry with one of the following tags: `add:`, `change:`, `remove:`, or `fix:` to specify the type of change.
- In case of merge conflicts, **retain all entries** to ensure no changes are lost.
- During release preparation, entries from this file are reviewed, organized, and moved into the main `changelog.md`.
# Drafts
add: 
- Sound effects for:
    - Toll the Dead
    - Fire Bolt
    - Ray of Frost
    - Mind Sliver
    - Shocking Grasp

- Animation effects for:
    - Mind Sliver
    - Stunned Condition

fix: 
- Mystifying Miasma Cloud 1h duration [#221](https://github.com/Belodri/talia-custom/issues/221)
- Diving Strike can now target tokens of any size.
- Critical hits & misses now display correctly, even if the total roll is lower/higher than target value.

change:
- Grapple
    - removed automated token dragging
    - removed automated size limitation

- changed: Wyrmreaver Gauntlets: Guarding Runes
    from
    > Guarding Runes
    > 
    > Additionally, whenever you finish a long rest, choose one of the following damage types: acid, cold, fire, lightning, or poison. You have resistance to the chosen damage type until you finish another long rest.

    to
    > Guarding Runes
    > 
    > You have resistance to one of the following damage types of your choice: acid, cold, fire, lightning, or poison. You can change the chosen type when you finish a long rest.

add:
    optional disable of "consume" buttons in item cards