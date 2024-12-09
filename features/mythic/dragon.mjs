import ChatCardButtons from "../../utils/chatCardButtons.mjs";

export default {
    register() {
        instinctiveGreed();
        mystifyingMiasma();
    }
}

/** Registers the instinctive greed feature */
function instinctiveGreed() {
    const HOARDNAME = "Shalkoc's Hoard";
    const EXCLUDED_LOOT_TYPES = ["ingredient", "junk"];
    const VALID_SKILL_IDS = ["dec", "ins", "itm", "per", "prc", "ste"];

    const validLootTypes = Object.keys(CONFIG.DND5E.lootTypes)
        .filter(s => !EXCLUDED_LOOT_TYPES.includes(s));

 
    /**
     * Calculates the multiplier. Returns:
     * - null if no valid hoard could be found
     * - 2 if hoardWealth exceeds partyWealth
     * - 1 if hoardWealth exceeds actorWealth
     * - 0 otherwise
     * @param {Actor5e} actor 
     * @returns {2 | 1 | 0 | null}     
     */
    function calculateMult(actor) {
        /**
         * Calculates the total wealth of an actor (currency + loot - excluded loot types) in gold pieces (GP).
         * @param {Actor5e} a       The actor whose wealth is being calculated.
         * @returns {number}        The total wealth of the actor in gold pieces (GP).
         */
        function calculateWealthInGP(a) {
            const wealthObj = a.getWealth();
            const totalExcludedLootValue = EXCLUDED_LOOT_TYPES.reduce((sum, type) => {
                return sum + (wealthObj.loot[type] ?? 0);
            }, 0);
            const combinedLootValue = wealthObj.loot._total - totalExcludedLootValue;
            return wealthObj.currency + combinedLootValue;
        }


        const hoard = game.actors.getName(HOARDNAME);
        if(!hoard || !hoard.flags["item-piles"]?.data?.enabled) {
            console.error(`Could not find a valid hoard actor with name: ${HOARDNAME}`);
            return null;
        }

        const hoardWealth = calculateWealthInGP(hoard);
        let actorWealth = 0;
        let partyWealth = 0;

        for(let user of game.users.players) {
            const characterWealth = calculateWealthInGP(user.character);
            if(user.character.name === actor.name) {
                actorWealth = characterWealth;
            }
            partyWealth += characterWealth;
        }

        // 2 if hoardWealth exceeds partyWealth, 1 if hoardWealth exceeds actorWealth, 0 otherwise
        return hoardWealth > partyWealth ? 2 : hoardWealth > actorWealth ? 1 : 0;
    }

    /**
     * MUTATES rollDataConfig
     */
    Hooks.on("dnd5e.preRollDamage", (item, rollDataConfig) => {
        const featItem = item.actor.itemTypes.feat.find(i => i.name === "Instinctive Greed");
        if(!featItem) return;

        //only add damage if the item deals poison damage natively
        const isItemPoisonDamage = item.system.damage?.parts?.some(p => p[1] === "poison");
        if(!isItemPoisonDamage) return;

        //get the multiplier, return if mult is 0 or null
        const mult = calculateMult(item.actor);
        if(!mult) return;

        //find all rollConfigs with damage type "poison"
        const allPoisonRollConfigs = rollDataConfig.rollConfigs.filter(r => r.type === "poison");
        //only add the damage parts to the first one
        const poisonRollConfig = allPoisonRollConfigs[0];

        //get mythic rank
        const mythicRank = rollDataConfig.data.flags["talia-custom"]?.mythicRank ?? 0;

        //check if the item is a breath weapon and add a * 2 multiplier if true
        const isBreath = item.system.properties?.has("breath");
        const partString = `(${mythicRank} * ${mult}${isBreath ? " * 2" : ""})`;

        //add the string to parts
        poisonRollConfig.parts.push(partString);
    });


    /**
     * MUTATES rollDataConfig
     */
    Hooks.on("dnd5e.preRollSkill", (actor, rollDataConfig, skillId) => {
        if(!VALID_SKILL_IDS.includes(skillId)) return;
        const featItem = actor.itemTypes.feat.find(i => i.name === "Instinctive Greed");
        if(!featItem) return;

        const mult = calculateMult(actor);
        if(!mult) return;

        const mythicRank = rollDataConfig.data.flags["talia-custom"]?.mythicRank ?? 0;
        rollDataConfig.parts.push(`(${mythicRank} * ${mult})`);
    });
}

/** Registers the chat card buttons for the Mystifying Miasma feature */
function mystifyingMiasma() {
    const MAIN_NAME = "Mystifying Miasma";
    const CLOUD_NAME = "Mystifying Miasma Cloud";
    const SKILL_DC = 30;

    ChatCardButtons.register({
        itemName: "Mystifying Miasma",
        buttons: [
            {
                label: "Apply Cloud Effects",
                callback: async({actor, item}) => {
                    // applies the main effect to the actor
                    // applies the cloud effect to all creatures on the scene

                    //check if actor has main effect already, don't reapply the main effect;
                    let mainEffectOnActor = actor.appliedEffects.find(e => e.name === MAIN_NAME);
                    if(!mainEffectOnActor) {
                        [mainEffectOnActor] = await game.dfreds.effectInterface.addEffect({ effectName: MAIN_NAME, uuid: actor.uuid });
                    }

                    //if not on active scene return;
                    if(!canvas.scene?.active) return;

                    //add the cloudeffect to all other actors that are not the main actor and that don't already have it
                    const createdCloudEffects = [];
                    for(let token of canvas.scene.tokens) {
                        // avoid main actor
                        if(!token.actor?.uuid || token.actor.uuid === actor.uuid) continue;
                        //avoid duplicates
                        if(token.actor.appliedEffects.some(e => e.name === CLOUD_NAME)) continue;
                        
                        createdCloudEffects.push(game.dfreds.effectInterface.addEffect({effectName: CLOUD_NAME, uuid: token.actor.uuid}));
                    }
                    const resolved = (await Promise.all(createdCloudEffects)).flatMap(res => res);

                    //add created cloud effects as dependents
                    await mainEffectOnActor.addDependent(...resolved);
                }
            }
        ]
    })
}
