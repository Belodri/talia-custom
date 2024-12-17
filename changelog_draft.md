# Structure
- Each feature branch appends its entries to this file under the appropriate category.
- Prefix each entry with one of the following tags: `add:`, `change:`, `remove:`, or `fix:` to specify the type of change.
- In case of merge conflicts, **retain all entries** to ensure no changes are lost.
- During release preparation, entries from this file are reviewed, organized, and moved into the main `changelog.md`.
# Drafts
- add: Scene Effects
- fix: Skill Empowerment failing without notification if no target was available.
- add: Realm Effect: Muspelheim
- fix: Jump no longer restricts target destination. (Please don't start jumping out of the map...)
- add: Jump description now displays the maximum distance you can jump.
- fix: Jump now automatically updates the elevation of the jumping token to match the elevation of the target location.
Refactored Jump, divingStrike, mythicLegend(legendaryVigor) to implement the addition of jumpDistance to rollData.
- add: Bag of Scolding