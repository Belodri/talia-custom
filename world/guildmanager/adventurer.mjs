import { Helpers } from "../../utils/helpers.mjs";
import Guild from "./guild.mjs";
import TaliaDate from "../../utils/TaliaDate.mjs";
import shared from "./shared.mjs";
import { MODULE } from "../../scripts/constants.mjs";

/**
 * 
 * @typedef {object} Attributes
 * @property {number} brawn            Physical prowess, combat ability, and endurance.
 * @property {number} cunning          Stealth, subterfuge, strategy, and knowledge.
 * @property {number} spellcraft       Magical affinity, knowledge and powers.
 * @property {number} influence        Social skills, manipulation, charisma, and leadership.
 * @property {number} reliability      Accountability, perseverance, and loyalty.
 */

/**
 * @typedef {object} EvaluatedAttribute
 * @property {number} base
 * @property {number} total
 * @property {number} mod
 * @property {number} totalRollMod
 * @property {string} label
 */

export default class Adventurer extends foundry.abstract.DataModel {
    constructor(...args) {
        super(...args);
    
        //for type annotations
        /** @type {{[attributeKey: string]: EvaluatedAttribute}} */
        this.attributes ??= {}
    }

    static CONFIG = {
        sex: ["male", "female"],
        charClass: ["brawn", "cunning", "spellcraft", "influence"],
        race: ["human", "dragonborn", "dwarf", "elf", "orc", "tiefling"],
        namesJsonPath: `modules/${MODULE.ID}/jsonData/fantasyNames.json`,
        defaultNames: {
            male: "John",
            female: "Ann",
            family: "Default"
        },
        raceWeights: {
            human: 10,
            dragonborn: 1,
            dwarf: 4,
            elf: 6,
            orc: 5,
            tiefling: 2
        },
        baseAttributeRoll: {
            diceCount: 3,
            diceSize: 6,
            charClassBonus: 3,
        },
        expTable: { // (survived missions + criticalRolls) to exp bonus
            2: 1,
            5: 2,
            9: 3,
            14: 4,
            20: 5
        },
        levels: {
            0: {
                rollBonus: 0,
                expMin: 0,
                icon: "fa-solid fa-kiwi-bird"
            },
            1: {
                rollBonus: 1,
                expMin: 2,
                icon: "fa-solid fa-dice-one"
            },
            2: {
                rollBonus: 2,
                expMin: 5,
                icon: "fa-solid fa-dice-two"
            },
            3: {
                rollBonus: 3,
                expMin: 9,
                icon: "fa-solid fa-dice-three"
            },
            4: {
                rollBonus: 4,
                expMin: 14,
                icon: "fa-solid fa-dice-four"
            },
            5: {
                rollBonus: 5,
                expMin: 20,
                icon: "fa-solid fa-dice-five"
            },
        },
        states: {
            waiting: {
                iicon: "fa-solid fa-user",
                label: "Dead"
            },
            assigned: {
                icon: "fa-solid fa-user-check",
                label: "Assigned"
            },
            away: {
                icon: "fa-solid fa-route",
                label: "Away"
            },
            dead: {
                icon: "fa-solid fa-skull",
                label: "Dead"
            }
        }
    }

    static ATTRIBUTE_LABELS = {
        brawn: {
            label: "Brawn",
            explanation: "Physical prowess, combat ability, and endurance."
        },
        cunning: {
            label: "Cunning",
            explanation: "Stealth, subterfuge, strategy, and knowledge."
        },
        spellcraft: {
            label: "Spellcraft",
            explanation: "Magical affinity, knowledge and powers."
        },
        influence: {
            label: "Influence",
            explanation: "Social skills, manipulation, charisma, and leadership."
        },
        reliability: {
            label: "Reliability",
            explanation: "Accountability, perseverance, and loyalty."
        }
    }

    static ATTRIBUTE_KEYS = ["brawn", "cunning", "spellcraft", "influence", "reliability"];

    static #NAMES = null;

    static defineSchema() {
        const {
            StringField, SetField, SchemaField, HTMLField, NumberField, EmbeddedDataField, BooleanField, FilePathField
        } = foundry.data.fields;

        return {
            id: new StringField({ required: true, nullable: false, blank: false }),
            name: new StringField({ required: true, blank: false, label: "Name" }),
            details: new SchemaField({ 
                sex: new StringField({ choices: Adventurer.CONFIG.sex, blank: false, initial: Adventurer.CONFIG.sex[0] }),
                race: new StringField({ choices: Adventurer.CONFIG.race, blank: false, initial: Adventurer.CONFIG.race[0] }),
                charClass: new StringField({ choices: Adventurer.CONFIG.charClass, blank: false, initial: Adventurer.CONFIG.charClass[0] })
            }),
            _attributes: new SchemaField( shared.defineAttributesSchema(), { label: "Attributes" } ),
            survivedMissions: new NumberField({ integer: true, initial: 0, min: 0 }),
            criticalRolls: new NumberField({ integer: true, initial: 0, min: 0 }),
            _deathDate: new EmbeddedDataField( TaliaDate, { required: false, nullable: true, initial: null }),
            img: new FilePathField({ categories: ["IMAGE"], label: "Image" }),
        }
    }

    //#region Getters

    get level() { return this.expBonus; }

    get state() {
        if(this.isDead) return "dead";
        const mission = this.assignedMission;
        if(!mission) return "waiting";
        if(mission.hasStarted && !mission.hasReturned) return "away";
        else return "assigned";
    }

    get assignedMission() {
        return this.parent.missions.find(m => !m.isFinished && m.assignedAdventurers.has(this.id));
    }

    get isAssigned() { return !!this.assignedMission; }

    get isDead() { return !!this._deathDate; }

    /**
     * @returns {number} The exp bonus this adventurer adds to rolls.
     */
    get expBonus() {
        const expTable = Adventurer.CONFIG.expTable;
        const combinedExp = this.survivedMissions + this.criticalRolls;
        const thresholds = Object.keys(expTable)
            .map(Number)
            .filter(m => combinedExp >= m);
        return thresholds.length ? expTable[Math.max(...thresholds)] : 0;
    }

    /**
     * @typedef {object} AttrLabelObject
     * @property {number} mod
     * @property {number} total
     * @property {string} key
     * @property {string} label
     * @property {string} explanation
     */

    /**
     * @returns {{[attributeKey: string]: AttrLabelObject}}
     */
    get attributeLabels() {
        return Object.entries(this.attributes).reduce((acc, [attr, props]) => {
            acc[attr] = {
                mod: props.mod,
                label: Adventurer.ATTRIBUTE_LABELS[attr].label,
                explanation: Adventurer.ATTRIBUTE_LABELS[attr].explanation,
                total: props.total,
                key: attr
            }
        }, {});
    }

    //#endregion

    /**
     * Update this Adventurer, propagating the changes to the parent Guild.  
     * @param {object} changes          New values which should be applied to the data model
     * @param {object} [options={}]     Options which determine how the new data is merged
     * @returns {Promise<object>}       An object containing the changed keys and values
     */
    async update(changes, options = {}) {
        return this.parent.updateEmbedded(this, changes, options);
    }

    //#region Data preparation
    _initialize(...args) {
        super._initialize(...args);
        this.prepareDerivedData();
    }

    prepareDerivedData() {
        const attributes = Object.entries(this._attributes)
            .reduce((acc, [attr, value]) => {
                const base = value;
                const total = base;
                const mod = Math.floor( ( total - 10 ) / 2 );
                const totalRollMod = mod + this.expBonus;
                const label = Adventurer.ATTRIBUTE_LABELS[attr];

                acc[attr] = {
                    base, total, mod, totalRollMod, label
                }
                return acc;
            }, {});

        this.attributes = attributes;
    }
    //#endregion

    //#region Random Generation

    /**
     * Randomly generates data for an adventurer.
     */
    static async getRandomData() {
        const sex = Adventurer._getRandomSex();
        const charClass = Adventurer._getRandomCharClass();
        const race = Adventurer._getRandomRace();
        const name = await Adventurer._getRandomName( sex, race );
        const img = Adventurer._getRandomImg( charClass, sex, race );
        const attributes = Adventurer._getRandomAttributes( charClass );

        return {
            name,
            img,
            _attributes: attributes,
            details: {
                sex, charClass, race
            },
        }
    }

    static _getRandomAttributes(charClass) {
        return Adventurer.ATTRIBUTE_KEYS.reduce((acc, curr) => {
            acc[curr] = Adventurer._getRandomAttributeValue(curr, charClass);
            return acc;
        }, {});
    }

    static _getRandomAttributeValue(attribute, charClass) {
        const { diceCount, diceSize, charClassBonus } = Adventurer.CONFIG.baseAttributeRoll;
        
        let sum = attribute === charClass 
            ? charClassBonus 
            : 0;
        for(let i = 0; i < diceCount; i++) {
            sum += Helpers.getRandomInt(1, diceSize);
        }
        return sum;
    }

    static _getRandomCharClass() {
        const [charClass] = Helpers.getRandomArrayElements(Adventurer.CONFIG.charClass, 1);
        return charClass;
    }

    static _getRandomSex() { 
        const [sex] = Helpers.getRandomArrayElements(Adventurer.CONFIG.sex, 1);
        return sex;
    }

    static _getRandomRace() {
        const [race] = Helpers.getWeightedRandomKeys(Adventurer.CONFIG.raceWeights, 1);
        return race;
    }

    //TODO _getRandomImg implementation
    static _getRandomImg( charClass, sex, race ) {
        return "icons/svg/cowled.svg";
    }

    /**
     * Returns a random name for a given type and race.
     * @param {"male" | "female" | "family"} type 
     * @param {string} race
     * @returns {Promise<string>}
     */
    static async _getRandomName(type, race) {
        const names = await Adventurer._fetchNames();

        const raceNames = names?.[type]?.[race];
        if(!raceNames) return Adventurer.CONFIG.defaultNames[type];

        const [name] = Helpers.getRandomArrayElements(raceNames, 1);
        return name;
    }

    static async _fetchNames() {
        if( Adventurer.NAMES ) return Adventurer.#NAMES;

        const path = `modules/${MODULE.ID}/jsonData/fantasyNames.json`;

        const response = await fetch(Adventurer.CONFIG.namesJsonPath);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const json = await response.json();
        Adventurer.#NAMES = json;
        return Adventurer.#NAMES;
    }

    //#endregion

    //#region Mission Results Handling

    async _onMissionFinish(mission) {
        const advResults = Object.values(mission.results)
            .reduce((acc, { adventurerId, isCritical, causedDeath }) => {
                if (adventurerId === this.id) {
                    acc.hasResults = true;
                    if (isCritical) acc.critsCount++;
                    if (causedDeath) acc.died = true;
                }
                return acc;
            }, { hasResults: false, critsCount: 0, died: false });

        // should never happen but just in case
        if (!advResults.hasResults) return;

        const changes = {};
        if (advResults.died) {
            changes._deathDate = TaliaDate.now();
        } else {
            changes.survivedMissions = this.survivedMissions + 1;
            if (advResults.critsCount) {
                changes.criticalRolls = this.criticalRolls + advResults.critsCount;
            }
        }

        return this.update(changes) //async
    }

    //#endregion
}
