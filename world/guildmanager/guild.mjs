import { Adventurer } from "./adventurer.mjs";
import { Mission } from "./mission.mjs";

/**
 * 
 */
export class Guild {
    
    adventurers = new foundry.utils.Collection();
    missions = new foundry.utils.Collection();
    assignments = new Map();

    constructor(dataObject) {
        //set adventurers
    }
}
