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
 * @property {number} reliability      Reliability gauges how consistently the adventurer can be counted on to complete tasks and follow through without undermining the guild or mission.
 */

/**
 * @typedef {object} EvaluatedAttribute
 * @property {number} base
 * @property {number} bonus
 * @property {number} total
 * @property {number} mod
 * @property {number} exp
 */

export default class Adventurer extends foundry.abstract.DataModel {
    constructor(...args) {
        super(...args);
    
        //for type annotations
        /** @type {Record<string, EvaluatedAttribute>} */
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
        expTable: { //survived missions to exp bonus
            2: 1,
            5: 2,
            9: 3,
            14: 4,
            20: 5
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
            _attributeBonuses: new SchemaField( shared.defineAttributesSchema(), { label: "Bonuses" } ),
            survivedMissions: new NumberField({ integer: true, initial: 0, min: 0 }),
            _isDead: new BooleanField(),
            img: new FilePathField({ categories: ["IMAGE"], label: "Image" }),
        }
    }

    get assignedMission() {
        return this.parent.missions.find(m => m.assignedAdventurers.has(this.id));
    }

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

        const expBonus = (() => {
            const expTable = Adventurer.CONFIG.expTable;
            const thresholds = Object.keys(expTable).map(Number).filter(m => this.survivedMissions >= m);
            return thresholds.length ? expTable[Math.max(...thresholds)] : 0;
        })();

        const attributes = Object.entries(this._attributes)
            .reduce((acc, [attr, value]) => {
                const base = value;
                const bonus = this._attributeBonuses[attr];
                const total = base + bonus;
                const mod = Math.floor( ( total - 10 ) / 2 );

                const exp = expBonus;

                acc[attr] = {
                    base, bonus, total, mod, exp,
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
}
