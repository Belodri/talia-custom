/*  UX
    - crafting UI window opened via macro
    - Drag & drop 1 spell from spellbook to window
    - select gemstone via dropdown menu
    - select spell level via dropdown menu
    - select type (cast or trigger)
        - if trigger, enter trigger condition into textbox
    - confirm

    - consume spell slot
    - roll scribing check
        - if unsuccessful: 
            - trigger WMS
        - if successful:
            # create spellgem
*/

/*  create spellgem

    create new item of type 'spellGem'      //CONFIG.DND5E.consumableTypes.spellGem = {label: "Spell Gem"};

    spellGem ->
        - set name ("Gem: Triggered Spell Name" OR "Gem: Cast Spell Name")  //idk
        - set description to include spell level, 

    selectedSpell.toObject -> 
        - fix values to scribe's spellcasting modifier

    preUseItem hook -> if type is spellGem -> return false and handle self
        - see Zhell's example
        - add excemption to WMS
*/

export function initSpellscribing() {
    CONFIG.DND5E.consumableTypes.spellGem = {label: "Spell Gem"};
}
export function setupSpellscribing() {
    
}