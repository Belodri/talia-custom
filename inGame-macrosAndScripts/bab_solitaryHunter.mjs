/*
    - needs to return true if both the user and the target are isolated
    - needs to be fully synchronous
*/

if(!token) return false;
const targets = game.user.targets;
if(targets.size !== 1) return false;    //require exactly 1 target

const target = targets.first();


if(!isIsolated(target) || !isIsolated(token)) return false;
else return true;  

function isIsolated(token) {
    //check tokens of same disposition
    const dispos = token.document?.disposition;
    if(!dispos) return false;
    
    //get other tokens of same disposition
    const allyTokens = canvas.scene.tokens
        .filter(t => t.id !== token.id && t.disposition === dispos && !t.hidden)
        .map(t => t.object)    //get the token objects instead of the tokenDocuments
    
    const alliesInSight = allyTokens.filter(t => !CONFIG.Canvas.polygonBackends.sight
        .testCollision(t.center, token.center, {type: "sight", mode: "any"}));
    if(alliesInSight.length === 0) return true;
    else return false;
}