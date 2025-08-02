/**
 * @import Roll from "../foundry/client-esm/dice/roll.mjs";
 * @import DiceTerm from "../foundry/client-esm/dice/terms/dice.mjs";
 * @import Die from "../foundry/client-esm/dice/terms/die.mjs";
 */

export default class RollModifiers {
    static register() {
        Die.MODIFIERS.kct = keepClosestTo.name;
        Die.prototype[keepClosestTo.name] = keepClosestTo;
    }
}

/**
 * Keep the roll that's closest to the target number from the result set. 
 * If no number target number is provided, the target is the rounded, mathematical middle of the die.
 * In case of ties, the result is rerolled.
 * 
 * 2d20kct2     Keep the die closest to 1
 * 5d20kct10    Keep the die closest to 10
 * 3d20kct      Keep the die closest to 10 (the rounded, mathematical middle)
 * 
 * @this {Die}
 * @param {string} modifier         The matched modifier query
 * @returns {Promise<false|void>}   False if the modifier was unmatched.
 */
async function keepClosestTo(modifier) {
    // Match the "keepClosestTo" modifier
    const rgx = /kct([0-9]+)?/i;
    const match = modifier.match(rgx);
    if(!match) return false;
    let [targetStr] = match.slice(1);

    const target = targetStr !== undefined 
        ? parseInt(targetStr)
        : Math.round(this.faces / 2);
    
    // Prevent infinite loop
    let rerolls = 0;
    rerollLoop: while (rerolls < 100) {
        /** @type {import("../foundry/client-esm/dice/_types.mjs").DiceTermResult} */
        let nearestResult = null;

        for(const result of this.results) {
            if(!result.active) continue;
            if(nearestResult === null) {
                nearestResult = result;
                continue;
            }

            const resultDistance = Math.abs(target - result.result);
            const nearestResultDistance = Math.abs(target - nearestResult.result);

            if(resultDistance < nearestResultDistance) {
                nearestResult = result;
                continue;
            } else if(resultDistance > nearestResultDistance) continue;

            // Same value
            if(result.result === nearestResult.result) continue;

            // Equal distance but different value
            // Tiebreaker: reroll
            const originalLength = this.results.length;
            this.reroll(`r${result.result}`);
            const afterFirstRerollLength = this.results.length;

            // Prevent the new rolls from being rerolled
            result.active = true;
            delete result.rerolled;
            for(let i = originalLength; i < afterFirstRerollLength; i++) {
                this.results[i].active = false;
            }

            this.reroll(`r${nearestResult.result}`);

            // Reapply the first rerolls
            result.active = false;
            result.rerolled = true;
            for(let i = originalLength; i < afterFirstRerollLength; i++) {
                this.results[i].active = true;
            }
            rerolls++;
            continue rerollLoop;
        }

        for(const result of this.results) {
            if(result !== nearestResult && result.active) {
                result.active = false;
                result.discarded = true;
            }
        }
        return;
    }

    if ( rerolls >= 100 ) throw new Error("Maximum recursion depth for keepClosestTo dice roll exceeded");
}

/*
    Add:
    setFixed (1d10sf5) to make the die always result in the fixed number. Cleaner and easier than 1d10min5max5)
*/

