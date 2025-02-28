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
 * @property {string} attributeKey
 * @property {string} label
 * @property {string} explanation
 * @property {number} base
 * @property {number} total
 * @property {number} mod
 * @property {number} expBonus
 * @property {number} totalRollMod
 * @property {string} modDisplay
 * @property {string} totalRollModDisplay
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
        levels: {
            0: {
                level: 0,
                rollBonus: 0,
                expMin: 0,
                icon: "fa-solid fa-kiwi-bird",
                hint: "Level 0"
            },
            1: {
                level: 1,
                rollBonus: 1,
                expMin: 2,
                icon: "fa-solid fa-dice-one",
                hint: "Level 1"
            },
            2: {
                level: 2,
                rollBonus: 2,
                expMin: 5,
                icon: "fa-solid fa-dice-two",
                hint: "Level 2"
            },
            3: {
                level: 3,
                rollBonus: 3,
                expMin: 9,
                icon: "fa-solid fa-dice-three",
                hint: "Level 3"
            },
            4: {
                level: 4,
                rollBonus: 4,
                expMin: 14,
                icon: "fa-solid fa-dice-four",
                hint: "Level 4"
            },
            5: {
                level: 5,
                rollBonus: 5,
                expMin: 20,
                icon: "fa-solid fa-dice-five",
                hint: "Level 5"
            },
        },
        states: {
            waiting: {
                icon: "fa-solid fa-user",
                hint: "Waiting to be assigned",
                key: "waiting",
            },
            assigned: {
                icon: "fa-solid fa-user-check",
                hint: "Assigned to a mission",
                key: "assigned",
            },
            away: {
                icon: "fa-solid fa-route",
                hint: "On a mission",
                key: "away",
            },
            dead: {
                icon: "fa-solid fa-skull",
                hint: "Dead",
                key: "dead",
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
                sex: new StringField({ choices: Adventurer.CONFIG.sex, blank: false, initial: Adventurer.CONFIG.sex[0], label: "Sex" }),
                race: new StringField({ choices: Adventurer.CONFIG.race, blank: false, initial: Adventurer.CONFIG.race[0], label: "Race" }),
                charClass: new StringField({ choices: Adventurer.CONFIG.charClass, blank: false, initial: Adventurer.CONFIG.charClass[0], label: "Character Class" })
            }),
            _attributes: new SchemaField( shared.defineAttributesSchema(), { label: "Attributes" } ),
            survivedMissions: new NumberField({ integer: true, initial: 0, min: 0, label: "Survived Missions" }),
            criticalRolls: new NumberField({ integer: true, initial: 0, min: 0, label: "Critical Rolls" }),
            _deathDate: new EmbeddedDataField( TaliaDate, { required: false, nullable: true, initial: null }),
            img: new FilePathField({ categories: ["IMAGE"], label: "Image" }),
        }
    }

    //#region Getters

    get exp() { return this.survivedMissions + this.criticalRolls; }

    get expForLevelUp() { 
        const expMinNext = Adventurer.CONFIG.levels[this.level + 1]?.expMin;
        return expMinNext 
            ? expMinNext - this.exp
            : null;  
    }

    get level() { 
        const levels = Adventurer.CONFIG.levels;
        const combinedExp = this.survivedMissions + this.criticalRolls;

        let lastLevel = levels[0];

        for (const level of Object.values(levels)) {
            if (level.expMin > combinedExp) return lastLevel.level;
            lastLevel = level;
        }

        return lastLevel.level;
    }

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
        return Adventurer.CONFIG.levels[this.level].rollBonus;
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
                const getDisplayMod = (modifier) => `${modifier >= 0 ? "+" : ""}${modifier}`;

                const base = value;
                const total = base;     // to allow for easy expansion in the future

                const mod = Math.floor( ( total - 10 ) / 2 );
                const expBonus = this.expBonus;
                const totalRollMod = mod + expBonus;

                acc[attr] = {
                    attributeKey: attr,
                    label: Adventurer.ATTRIBUTE_LABELS[attr].label,
                    explanation: Adventurer.ATTRIBUTE_LABELS[attr].explanation,
                    base, 
                    total, 
                    mod, 
                    expBonus,
                    totalRollMod, 
                    modDisplay: getDisplayMod(mod),
                    totalRollModDisplay: getDisplayMod(totalRollMod),
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

    async edit() {
        const makeField = (path, options={}) => {
            const field = this.schema.getField(path);
            const value = foundry.utils.getProperty(source, path);
    
            return {
                field: field,
                value: value,
                ...options
            };
        }

        const { DialogV2 } = foundry.applications.api;
        const source = this.toObject();

        // Fields that don't require special handling
        const fieldPaths = [
            "name", 
            "_attributes.brawn", "_attributes.cunning", "_attributes.spellcraft", "_attributes.influence", "_attributes.reliability",
            "details.sex", "details.race", "details.charClass",
            "survivedMissions", "criticalRolls", "img",
        ];

        const mainFields = fieldPaths.reduce((acc, curr) => {
            const field = makeField(curr);
            const element = field.field.toFormGroup({}, { value: field.value });
            acc += element.outerHTML;
            return acc;
        }, "");

        const changes = await DialogV2.prompt({
            window: { title: "Adventurer Editor" },
            position: { width: 500, height: "auto" },
            content: mainFields, 
            modal: false, 
            rejectClose: false, 
            ok: { callback: (event, button) => new FormDataExtended(button.form).object }
        });

        if(!changes) return;
        return this.update(changes);
    }
}
