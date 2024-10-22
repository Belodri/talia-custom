import { TaliaCustomAPI } from "../../scripts/api.mjs";
import { MODULE } from "../../scripts/constants.mjs";

export default {
    register() {
        TaliaCustomAPI.add({Settlement}, "none");
    }
}



// just use a class to manage the single settlement of Promise
class Settlement {
    static flagKey = "settlementFlag";

    // Properties
    buildings = {
        /** @type {Map} */
        constructed: new foundry.utils.Collection(),
        /** @type {Map} */
        all: new foundry.utils.Collection(),
    }
    name = "Promise";
    foundingDate = { //Septimus 1st 1497
        year: 1497,
        month: 6,
        day: 0,
    };
    attributes = {
        authority: 0,
        economy: 0,
        community: 0,
        progress: 0,
        intrigue: 0,
        capacity: 4,
    };

    /**
     * Creates a new Settlement instance
     * @param {object|string|null} [data] - Initial data for the settlement. Can be an object or JSON string
     * @throws {Error} If data is a string but contains invalid JSON
     * @throws {TypeError} If data is neither an object nor a string
     */
    constructor(data) {
        if (data) {
            if (typeof data === 'string') {
                try {
                    const parsed = Settlement.fromJSON(data);
                    Object.assign(this, parsed);
                } catch (error) {
                    throw new Error(`Failed to construct Settlement from JSON string: ${error.message}`);
                }
                return;
            }
            if (typeof data !== 'object') {
                throw new TypeError('Settlement constructor data must be an object or JSON string');
            }
            Object.assign(this, data);
        }
    }

    /**
     * Converts the Settlement instance to a JSON-serializable object with type information
     * Handles special data types including Sets, Maps, Collections, and Dates
     * @returns {object} A plain object representation with type metadata
     * @throws {Error} If circular references are detected
     */
    toJSON() {
        // Set to track processed objects for circular reference detection
        const processed = new WeakSet();

        const serialize = (value, path = []) => {
            // Handle null/undefined
            if (value == null) return value;

            // Check for circular references in objects
            if (typeof value === 'object') {
                if (processed.has(value)) {
                    throw new Error(`Circular reference detected at path: ${path.join('.')}`);
                }
                processed.add(value);
            }

            try {
                // Handle Date objects
                if (value instanceof Date) {
                    if (isNaN(value.getTime())) {
                        throw new Error(`Invalid Date at path: ${path.join('.')}`);
                    }
                    return { __type: 'Date', value: value.toISOString() };
                }

                // Handle Sets
                if (value instanceof Set) {
                    return {
                        __type: 'Set',
                        value: Array.from(value).map((v, i) => serialize(v, [...path, `Set[${i}]`]))
                    };
                }

                // Handle Maps and Collections
                if (value instanceof Map) {
                    return {
                        __type: value.constructor.name,
                        value: Array.from(value.entries()).map(([k, v], i) => [
                            serialize(k, [...path, `${value.constructor.name}[${i}].key`]),
                            serialize(v, [...path, `${value.constructor.name}[${i}].value`])
                        ])
                    };
                }

                // Handle Arrays
                if (Array.isArray(value)) {
                    return value.map((v, i) => serialize(v, [...path, i]));
                }

                // Handle Objects
                if (typeof value === 'object') {
                    const obj = {};
                    for (const [key, val] of Object.entries(value)) {
                        obj[key] = serialize(val, [...path, key]);
                    }
                    return obj;
                }

                // Return primitive values directly
                return value;

            } catch (error) {
                // Add path information to error message if not already present
                if (!error.message.includes('path:')) {
                    error.message += ` at path: ${path.join('.')}`;
                }
                throw error;
            }
        };
        return serialize(this);
    }

    /**
     * Creates a Settlement instance from a JSON string or object
     * @param {string|object} json - JSON string or pre-parsed object to deserialize
     * @returns {Settlement} A new Settlement instance
     * @throws {SyntaxError} If the JSON string is malformed
     * @throws {TypeError} If the deserialized data contains invalid type markers
     * @throws {Error} If the data structure is invalid or contains unknown type markers
     * @static
     */
    static fromJSON(json) {
        // Parse JSON string if necessary
        let data;
        try {
            data = typeof json === 'string' ? JSON.parse(json) : json;
        } catch (error) {
            throw new SyntaxError(`Invalid JSON string: ${error.message}`);
        }

        const deserialize = (value, path = []) => {
            try {
                // Handle null/undefined
                if (value == null) return value;

                // Handle special types
                if (value && typeof value === 'object' && value.__type) {
                    switch (value.__type) {
                        case 'Set':
                            if (!Array.isArray(value.value)) {
                                throw new TypeError('Set value must be an array');
                            }
                            return new Set(value.value.map((v, i) => 
                                deserialize(v, [...path, `Set[${i}]`])));
                            
                        case 'Map':
                        case 'Collection':
                            if (!Array.isArray(value.value)) {
                                throw new TypeError(`${value.__type} value must be an array of entries`);
                            }
                            const entries = value.value.map(([k, v], i) => [
                                deserialize(k, [...path, `${value.__type}[${i}].key`]),
                                deserialize(v, [...path, `${value.__type}[${i}].value`])
                            ]);
                            return value.__type === 'Collection' 
                                ? new foundry.utils.Collection(entries)
                                : new Map(entries);
                            
                        case 'Date':
                            const date = new Date(value.value);
                            if (isNaN(date.getTime())) {
                                throw new TypeError('Invalid Date value');
                            }
                            return date;
                            
                        default:
                            throw new Error(`Unknown type marker: ${value.__type}`);
                    }
                }

                // Handle Arrays
                if (Array.isArray(value)) {
                    return value.map((v, i) => deserialize(v, [...path, i]));
                }

                // Handle Objects
                if (typeof value === 'object') {
                    const obj = {};
                    for (const [key, val] of Object.entries(value)) {
                        obj[key] = deserialize(val, [...path, key]);
                    }
                    return obj;
                }

                // Return primitive values directly
                return value;

            } catch (error) {
                // Add path information to error message if not already present
                if (!error.message.includes('path:')) {
                    error.message += ` at path: ${path.join('.')}`;
                }
                throw error;
            }
        };

        try {
            return new Settlement(deserialize(data));
        } catch (error) {
            throw new Error(`Failed to deserialize Settlement: ${error.message}`);
        }
    }

    static async saveToFlag() {
        const data = JSON.stringify(this);
        if(!game.user.isGM) throw new Error("Only GM can set world flags.")
        return await game.world.setFlag(MODULE.ID, Settlement.flagKey, data);
    }


    init() {
        let flagData = Settlement.loadFromFlagData() ?? {};

    }


    static loadFromFlagData() {
        return game.world.getFlag(MODULE.ID, Settlement.flagKey) ?? null;
    }

    static async setFlagData(data) {
        if(!game.user.isGM) throw new Error("Only GM can set world flags.")
        return await game.world.setFlag(MODULE.ID, Settlement.flagKey, data);
    }

    async importBuildingsFromJson() {
        const {StringField} = foundry.data.fields;
        const {DialogV2} = foundry.applications.api;

        const stringPart = new StringField({
            label: "Input JSON"
        }).toFormGroup({},{name: "jsonString"}).outerHTML;

        const input = await DialogV2.prompt({
            content: stringPart,
            ok: {
                callback: (event, button) => new FormDataExtended(button.form).object
            },
            rejectClose: false,
        });
        if(!input) return;
        const inputObj = JSON.parse(input.jsonString)

        for(const buildingData of Object.values(inputObj)) {
            const building = new Building(buildingData);
            this.buildings.all.set(building.id, building);        
        }
    }
} 

class Building {
    constructor({id, name, description, scale, attributes, requirements, specialEffects}) {
        this.id = id;
        this.name = name;
        this.description = description,
        this.scale = scale;
        this.attributes = {
            authority: attributes.authority || 0,
            economy: attributes.economy || 0,
            community: attributes.community || 0,
            progress: attributes.progress || 0,
            intrigue: attributes.intrigue || 0,
        };
        this.requirements = requirements || undefined;
        this.specialEffects = specialEffects || undefined;
    }
    
}

async function addBuildingsDataJson() {
    const {StringField} = foundry.data.fields;
    const {DialogV2} = foundry.applications.api;

    const stringPart = new StringField({
        label: "Input JSON"
    }).toFormGroup({},{name: "jsonString"}).outerHTML;

    const input = await DialogV2.prompt({
        content: stringPart,
        ok: {
            callback: (event, button) => new FormDataExtended(button.form).object
        },
        rejectClose: false,
    });
    if(!input) return;
    const inputObj = JSON.parse(input.jsonString)

    
    console.log(inputObj);
}


async function addBuildingToJournal(journalName = "Promise") {
    //get buildings from rules entry
    const rulePageUuid = "Compendium.talia-custom.rules.JournalEntry.SJAQXPyELYfOfRE4.JournalEntryPage.uruo07oEBNb25uEe";
    const rulePage = await fromUuid(rulePageUuid);

    //get substrings
    const subStrings = rulePage.text.content.split(/(?=<h3>)/);

    //get the parsed building data for each building
    const buildings = {};
    for(const substr of subStrings) {

    }

    //transform to object

    for(const substr of subStrings) {
        const titleMatch = substr.match(/<h3>(.*?)<\/h3>/);
        if(titleMatch) {
            const title = titleMatch[1];
            buildings[title] = substr
        }
    }

    //choose the building
    const choice = await (async () => {
        const choices = Object.keys(buildings).reduce((acc, curr) => {
            acc[curr] = curr;
            return acc;
        }, {});
        const selectBuilding = new foundry.data.fields.StringField({
            label: "Select a building",
            required: true,
            choices: choices
        }).toFormGroup({}, {name: "building", choices}).outerHTML;
        return await foundry.applications.api.DialogV2.prompt({
            window: {
                title: "Add Building"
            },
            content: `<fieldset>${selectBuilding}</fieldset>`,
            modal: true,
            rejectClose: false,
            ok: {
                label: "Ok",
                callback: (event, button) => new FormDataExtended(button.form).object,
            },
        });
    })();
    if(!choice) return;

    //get the parsed building data;

    //get the journal & page
    const journal = game.journal.getName(journalName);
    const buildingsPage = journal.pages.contents.find(e => e.name === "Buildings");
    
    //if the building is not yet built, add it to the journal
    if(!buildingsPage.text.content.includes(buildings[choice.building])) {
        await buildingsPage.update({"text.content": buildingsPage.text.content + buildings[choice.building]});
    }

    
}

/**
 * Parses an HTML string representing a building and extracts relevant data such as name, description, effects, and special effects.
 * 
 * @param {string} htmlString - The HTML string containing building data, including an <h3> tag for the name, a <p> tag for the description, and <li> elements for effects and special effects.
 * 
 * @returns {Object} - An object containing the parsed building data.
 * @returns {string} return.name - The name of the building, extracted from the <h3> tag.
 * @returns {string} return.description - The description of the building, extracted from the first <p> tag.
 * @returns {Object} return.effects - An object containing the effects of the building. Each effect (authority, economy, community, progress, intrigue) is a key, with a number as the value.
 * @returns {number} return.effects.authority - The value of the authority effect, defaulting to 0 if not specified.
 * @returns {number} return.effects.economy - The value of the economy effect, defaulting to 0 if not specified.
 * @returns {number} return.effects.community - The value of the community effect, defaulting to 0 if not specified.
 * @returns {number} return.effects.progress - The value of the progress effect, defaulting to 0 if not specified.
 * @returns {number} return.effects.intrigue - The value of the intrigue effect, defaulting to 0 if not specified.
 * @returns {string|null} return.specialEffects - A string describing the special effects of the building, or null if no special effects are present.
 */
function parseBuildingData(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    const name = doc.querySelector("h3")?.textContent || "";
    const description = doc.querySelector("p")?.textContent || "";


    // Set default values for all effects attributes
    const effects = {
        authority: 0,
        economy: 0,
        community: 0,
        progress: 0,
        intrigue: 0
    };
    
    // Find all <li> elements
    const listItems = doc.querySelectorAll('li');
    
    // Loop through the <li> elements and find the effects and special effects
    let specialEffects = '';
    listItems.forEach(li => {
        const strongTag = li.querySelector('strong');
        if (strongTag) {
            const strongText = strongTag.textContent.trim();
        
            // Check if this is the "Effects" line
            if (strongText.includes('Effects')) {
                const effectsText = li.textContent;
                
                // Regular expression to find the numbers associated with each effect
                const effectMatches = effectsText.match(/([+-]?\d+)\s*(Authority|Economy|Community|Progress|Intrigue)/gi);
                
                // If there are matches, update the effects object
                if (effectMatches) {
                    effectMatches.forEach(match => {
                        const [ , value, attribute ] = match.match(/([+-]?\d+)\s*(Authority|Economy|Community|Progress|Intrigue)/i);
                        effects[attribute.toLowerCase()] = parseInt(value, 10);  // Update the effects object
                    });
                }
            }
            
            // Check if this is the "Special Effects" line
            if (strongText.includes('Special Effects')) {
                specialEffects = li.textContent.replace(/.*Special Effects:\s*/, '').trim();
            }
        }
    });

    return {
        name,
        description,
        effects,
        specialEffects: specialEffects || null  // Return null if no special effects found
    };
}