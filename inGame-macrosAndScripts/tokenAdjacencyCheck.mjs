import { TaliaCustomAPI } from "../scripts/api.mjs";

export default {
    _onSetup() {
        TaliaCustomAPI.add({
            tokensAdjacent
        });
    }
}

/**
 * Determines if two tokens are adjacent or overlapping on a canvas divided into 100x100 pixel cells.
 * Tokens are considered adjacent if they are in neighboring cells (including diagonally)
 * or if they overlap in any way.
 * 
 * @param {Token} token1 - The first token to check.
 * @param {Token} token2 - The second token to check.
 * @returns {boolean} True if the tokens are adjacent or overlapping, false otherwise.
 */
function tokensAdjacent(token1, token2) {
    // Calculate half sizes once
    const halfSize1 = token1.h / 2;
    const halfSize2 = token2.h / 2;

    // Calculate distances between centers
    const dx = Math.abs(token1.center.x - token2.center.x);
    const dy = Math.abs(token1.center.y - token2.center.y);

    // Check if tokens are adjacent or overlapping
    return dx < halfSize1 + halfSize2 + 100 && dy < halfSize1 + halfSize2 + 100;
}
