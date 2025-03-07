import { Helpers } from "../../utils/helpers.mjs";
import Guild from "./guild.mjs";
import TaliaDate from "../../utils/TaliaDate.mjs";
import shared from "./shared.mjs";
import { MODULE } from "../../scripts/constants.mjs";
import Mission from "./mission.mjs";

/** @typedef {import("../../foundry/common/utils/collection.mjs").default} Collection */

/**
 * 
 * @typedef {object} Attributes
 * @property {number} brawn            Physical prowess, combat ability, and endurance.
 * @property {number} cunning          Stealth, subterfuge, strategy, and knowledge.
 * @property {number} spellcraft       Magical affinity, knowledge and powers.
 * @property {number} influence        Social skills, manipulation, charisma, and leadership.
 * @property {number} reliability      Accountability, perseverance, and loyalty.
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
        expThresholds: [0, 2, 5, 9, 14, 20],    // how much exp is needed for a given level, starting with level 0.
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

    static DEFAULT_IMG = "icons/svg/cowled.svg";

    static #NAMES = null;

    static defineSchema() {
        const {
            StringField, SetField, SchemaField, HTMLField, NumberField, EmbeddedDataField, BooleanField, FilePathField, ObjectField, ArrayField
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
            _missionResults: new ObjectField({initial: {}}),
            baseExp: new NumberField({ integer: true, initial: 0, min: 0, label: "Base Exp" }),
            _deathDate: new EmbeddedDataField( TaliaDate, { required: false, nullable: true, initial: null }),
            _pastDeathDates: new ArrayField( new EmbeddedDataField( TaliaDate )),
            _creationDate: new EmbeddedDataField( TaliaDate, { initial: TaliaDate.now() }),
            img: new FilePathField({ categories: ["IMAGE"], label: "Image" }),
            hidden: new BooleanField({label: "Is Hidden?"}),
        }
    }

    //#region Getters

    /** @type {Guild} */
    get guild() { return this.parent; }

    get state() {
        if(this.isDead) return "dead";
        const mission = this.assignedMission;
        if(!mission) return "waiting";
        if(mission.hasStarted && !mission.hasReturned) return "away";
        else return "assigned";
    }

    /** @returns {Mission | undefined} */
    get assignedMission() { 
        return this.guild.missions.find(mis => !mis.hasFinished && mis.assignedAdventurers.has(this.id)) 
    }

    /** @returns {Mission[]} All missions that have this character assigned. */
    get allAssignedMissions() {
        return this.guild.missions.filter(mis => mis.assignedAdventurers.has(this.id)) 
    }

    get isAssigned() { return !!this.assignedMission; }

    get isDead() { return !!this._deathDate; }

    get deathDate() { return this._deathDate; }

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
        this.missionResults = this._prepareMissionResults();
        this.exp = this._prepareExp();
        this.attributes = this._prepareAttributes();
    }

    /** @returns {Collection<string, import("./Resolver.mjs").AdventurerResult} */
    _prepareMissionResults() {
        return new foundry.utils.Collection( 
            Object.entries(  this._missionResults )
        );
    }

    _prepareExp() {
        const expThresholds = Adventurer.CONFIG.expThresholds;

        const exp = this.missionResults
            .reduce((acc, res) => acc += res.expGained , this.baseExp);

        let level = 0;
        for(level; level <= expThresholds.length; level++) {
            if( !expThresholds[level + 1] || expThresholds[level + 1] > exp ) break;
        }

        let forNext = expThresholds[level + 1] ?? Infinity;
        const isMax = forNext === Infinity; 
        const missing = isMax ? Infinity : forNext - expThresholds[level];

        return {
            total: exp,
            level,
            missing,
            isMax,
            forNext
        }
    }

    /**
     * @typedef {object} EvaluatedAttribute
     * @property {string} attributeKey
     * @property {string} label
     * @property {string} explanation
     * @property {number} base
     * @property {number} total
     * @property {number} mod
     * @property {number} bonus
     * @property {number} totalRollMod
     * @property {string} modDisplay
     * @property {string} totalRollModDisplay
     */

    /** @returns {{[attributeKey: string]: EvaluatedAttribute }} */
    _prepareAttributes() {
        /** @type {{[attributeKey: string]: number}} */
        const initAttr = this._attributes;

        return Object.entries( initAttr)
            .reduce((acc, [attr, value]) => {
                const getDisplayMod = (modifier) => `${modifier >= 0 ? "+" : ""}${modifier}`;

                const base = value;
                const total = base;     // to allow for easy expansion in the future

                const mod = Math.floor( ( total - 10 ) / 2 );
                const bonus = this.exp.level;
                const totalRollMod = mod + bonus;

                acc[attr] = {
                    attributeKey: attr,
                    label: Adventurer.ATTRIBUTE_LABELS[attr].label,
                    explanation: Adventurer.ATTRIBUTE_LABELS[attr].explanation,
                    base, 
                    total, 
                    mod, 
                    bonus,
                    totalRollMod, 
                    modDisplay: getDisplayMod(mod),
                    totalRollModDisplay: getDisplayMod(totalRollMod),
                }
                return acc;
            }, {});
    }

    //#endregion

    //#region Random Generation

    /**
     * Randomly generates data for an adventurer.
     * @param {Guild} guild 
     * @param {object} [options={}] 
     * @param {string} options.sex 
     * @param {string} options.race 
     * @param {string} options.charClass 
     * @param {string} options.name 
     */
    static async getRandomData(guild, {sex, race, charClass, name} = {}) {
        if(!sex) sex = Adventurer._getRandomSex();
        if(!charClass) charClass = Adventurer._getRandomCharClass();
        if(!race) race = Adventurer._getRandomRace();
        if(!name) name = await Adventurer._getRandomName( sex, race );

        const img = await Adventurer._getNextAvailableImg( guild, sex, race );
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

    static _getRandomSex() { 
        const [sex] = Helpers.getRandomArrayElements(Adventurer.CONFIG.sex, 1);
        return sex;
    }

    static _getRandomCharClass() {
        const [charClass] = Helpers.getRandomArrayElements(Adventurer.CONFIG.charClass, 1);
        return charClass;
    }

    static _getRandomRace() {
        const [race] = Helpers.getWeightedRandomKeys(Adventurer.CONFIG.raceWeights, 1);
        return race;
    }

    static _getRandomAttributes(charClass) {
        const { diceCount, diceSize, charClassBonus } = Adventurer.CONFIG.baseAttributeRoll;

        return Adventurer.ATTRIBUTE_KEYS.reduce((acc, curr) => {
            let sum = curr === charClass ? charClassBonus : 0;

            for(let i = 0; i < diceCount; i++) {
                sum += Helpers.getRandomInt(1, diceSize);
            }

            acc[curr] = sum;
            return acc;
        }, {});
    }

    /**
     * @param {Guild} guild 
     * @param {string} sex 
     * @param {string} race 
     * @returns {string}
     */
    static async _getNextAvailableImg(guild, sex, race) {
        const takenImages = new Set( 
            guild.adventurers.filter(adv => 
                adv.details.sex === sex 
                && adv.details.race === race
                && adv.img !== Adventurer.DEFAULT_IMG
            ).map(adv => adv.img)
        );

        const target = `TaliaCampaignCustomAssets/c_Icons/Adventurer_Tokens/${race}/${sex}`;
        const extensions = Object.keys(CONST.IMAGE_FILE_EXTENSIONS)
            .map(t => `.${t.toLowerCase()}`);
        const data = await FilePicker.browse("data", target, { extensions });
        if(!data?.files?.length) return Adventurer.DEFAULT_IMG;

        return data.files.find(path => !takenImages.has(path)) 
            ?? Adventurer.DEFAULT_IMG;
    }

    /**
     * Returns a random name for a given sex and race.
     * @param {"male" | "female"} sex 
     * @param {string} race
     * @returns {Promise<string>}
     */
    static async _getRandomName(sex, race) {
        const names = await Adventurer._fetchNames();

        const firstNames = names?.[sex]?.[race];
        const lastNames = names?.family?.[race];

        if(!firstNames || !lastNames) {
            const defaults = Adventurer.CONFIG.defaultNames;
            return `${defaults[sex]} ${defaults.family}`;
        }

        const [firstName] = Helpers.getRandomArrayElements(firstNames, 1);
        const [lastName] = Helpers.getRandomArrayElements(lastNames, 1);

        return `${firstName} ${lastName}`;
    }

    static async _fetchNames() {
        if( Adventurer.#NAMES ) return Adventurer.#NAMES;

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
        const advRes = foundry.utils.deepClone(mission.results.adventurerResults[this.id]);

        const updates = {
            [`_missionResults.${mission.id}`]: advRes
        };
        if(advRes.died) updates._deathDate = TaliaDate.now();

        return this.update(updates);
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
            "baseExp", "img", "hidden"
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

    async delete({force=false}={}) {
        let assignedIds = new Set();

        for(const mis of this.guild.missions) {
            if(mis?.assignedAdventurerIds?.has?.(this.id)) {
                if(force) await mis.unassignAdventurer(this.id);
                else assignedIds.add(mis.id);
            }
        }

        if(assignedIds.size) {
            console.error({assignedIds});
            throw new Error("To delete assigned adventurers, pass '{force=true}' argument.");
        }

        return this.guild.deleteEmbedded([this.id]);
    }

    async unassign() {
        if(this.state === "assigned") return this.assignedMission.unassignAdventurer(this);
    }

    async revive() {
        if(this.state !== "dead") throw new Error("Only a dead adventurer can be revived.");

        const newPastDeaths = this._pastDeathDates;
        const death = this._deathDate.toObject();
        newPastDeaths.push(death);
        return this.update({"_deathDate": null, "_pastDeathDates": newPastDeaths});
    }

    async kill() {
        if(this.state !== "waiting") throw new Error("Only a waiting adventurer can be killed.");
        return this.update({"_deathDate": TaliaDate.now()});
    }

    async toggleHidden() {
        return this.update({hidden: !this.hidden});
    }

    static async createAdventurerDataDialog() {
        const { DialogV2 } = foundry.applications.api;
        const { StringField } = foundry.data.fields;

        const { sex, charClass, race } = Adventurer.CONFIG;

        const sexField = new StringField({
            label: "Sex",
            choices: sex.reduce((acc, curr) => {
                acc[curr] = curr;
                return acc;
            }, {}),
            required: false,
            blank: true
        }).toFormGroup({}, { name: "sex" }).outerHTML;

        const charClassField = new StringField({
            label: "Character Class",
            choices: charClass.reduce((acc, curr) => {
                acc[curr] = curr;
                return acc;
            }, {}),
            required: false,
            blank: true
        }).toFormGroup({}, { name: "charClass" }).outerHTML;

        const raceField = new StringField({
            label: "Race",
            choices: race.reduce((acc, curr) => {
                acc[curr] = curr;
                return acc;
            }, {}),
            required: false,
            blank: true
        }).toFormGroup({}, { name: "race" }).outerHTML;

        const nameField = new StringField({
            label: "Name",
            required: false,
            blank: true
        }).toFormGroup({}, {name: "name"}).outerHTML;

        const choices = await DialogV2.prompt({
            window: { title: "Adventurer Creator" },
            position: { width: 500, height: "auto" },
            content: `<p>Any blank fields are generated randomly.</p>` + sexField + raceField + charClassField + nameField, 
            modal: false, 
            rejectClose: false, 
            ok: { callback: (event, button) => new FormDataExtended(button.form).object }
        });
        return choices;
    }
}
