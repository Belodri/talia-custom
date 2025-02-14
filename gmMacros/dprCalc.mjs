import { TaliaCustomAPI } from "../scripts/api.mjs";

export default {
    register() {
        TaliaCustomAPI.add({
            DPRCalc: DPRCalc.calcSelected
        }, "GmMacros");
    }
}

/**
 * @typedef {object} DPRConfig
 * @property {number} targetAC - The target Armor Class to calculate against (1-40)
 * @property {boolean} chatMessage - Whether to output results to chat
 * @property {boolean} console - Whether to output results to console
 */

/**
 * @typedef {object} DPRResult
 * @property {number} hitChance - Probability of hitting (0-1)
 * @property {number} critChance - Probability of critical hit (0-1)
 * @property {number} effHitChance - Effective hit chance excluding crits
 * @property {number} effCritChance - Effective crit chance
 * @property {number} hitMin - Minimum damage on a normal hit
 * @property {number} hitMax - Maximum damage on a normal hit
 * @property {number} critMin - Minimum damage on a critical hit
 * @property {number} critMax - Maximum damage on a critical hit
 * @property {number} hitAvg - Average damage on a normal hit
 * @property {number} critAvg - Average damage on a critical hit
 * @property {number} effHitAvg - Expected damage from normal hits
 * @property {number} effCritAvg - Expected damage from critical hits
 * @property {number} effAvgTotal - Total expected damage per attack
 */

/**
 * Calculates Damage Per Round (DPR) statistics for attacks of npc actors
 */
class DPRCalc {
    /**
     * Default configuration values for DPR calculations
     * @type {DPRConfig}
     */
    static defaultConfig = {
        targetAC: 15,
        chatMessage: false,
        console: true,
    }

    #evaluated = false;

    /**
     * Stores calculation results for the actor
     * @type {{multiattack: string, items: {[key: string]: DPRResult}}}
     */
    #results = {
        multiattack: "",
        items: {}
    };

    /**
     * Creates a new DPR calculator instance
     * @param {Actor} actor - The actor to calculate DPR for
     * @param {DPRConfig} config - Configuration options
     */
    constructor(actor, config) {
        this.actor = actor;
        this.config = foundry.utils.mergeObject(DPRCalc.defaultConfig, config);
    }

    /**
     * Calculates DPR for currently selected tokens
     */
    static async calcSelected() {
        const actors = canvas.tokens.controlled.map(t => t.actor);
        if(!actors.length) {
            ui.notifications.warn("You need to select any number of tokens.");
            return;
        }

        const config = await DPRCalc.#configDialog();
        if(!config) return;

        for(const actor of actors) {
            const calc = new DPRCalc(actor, config);
            await calc.evaluate();
            calc.print();
        }
    }

    /**
     * Displays configuration dialog for DPR calculations
     * @returns {Promise<DPRConfig|null>}
     */
    static async #configDialog() {
        const { DialogV2 } = foundry.applications.api;
        const { NumberField, BooleanField } = foundry.data.fields;

        const acGroup = new NumberField({
            label: "Target AC",
            required: true,
            min: 1,
            max: 40,
            integer: true,
            initial: 15
        }).toFormGroup({}, {name: "targetAC"}).outerHTML;

        const chatMessageGroup = new BooleanField({
            label: "Create Chat Message?",
            hint: "Whisper to self",
            required: true,
            initial: false,
        }).toFormGroup({}, {name: "chatMessage"}).outerHTML;

        const result = await DialogV2.prompt({
            window: { 
                title: "DPR Calc" 
            },
            content: acGroup + chatMessageGroup,
            modal: false,
            rejectClose: false,
            ok: {
                callback: (event, button) => new FormDataExtended(button.form).object,
            }
        });

        return result;
    }

    /**
     * Constrains a number between minimum and maximum values
     * @param {number} min - Minimum allowed value
     * @param {number} num - Number to constrain
     * @param {number} max - Maximum allowed value
     * @returns {number}
     */
    static constrain(min, num, max) { return Math.min(max, Math.max(min, num)); }


    /**
     * Calculates flat damage for an item
     * @param {object} params - Parameters for damage calculation
     * @param {Item} params.item - The item to calculate damage for
     * @param {boolean} [params.critical=false] - Whether to calculate critical hit damage
     * @param {boolean} [params.minimize=false] - Whether to minimize the damage roll
     * @param {boolean} [params.maximize=false] - Whether to maximize the damage roll
     * @returns {Promise<number>}
     */
    static async #getFlatDamage({item, critical=false, minimize=false, maximize=false}) {
        const roll = await item.rollDamage({critical, options: {fastForward: true, chatMessage: false}});
        const result = await roll.clone().evaluate({minimize, maximize});
        return result.total;
    }

    /**
     * Calculates hit chance against target AC
     * @param {Item} item - The item to calculate hit chance for
     * @param {number} targetAC - The target Armor Class
     * @returns {number} Hit chance (0-1)
     */
    static #getHitChance(item, targetAC) {
        const toHitMod = Number.fromString(item.labels.toHit);
        const targetValue = targetAC - toHitMod;
        const hitChance = ( 20 - targetValue ) / 20;
        return DPRCalc.constrain( 0.05, hitChance, 1 );
    }

    /**
     * Calculates critical hit chance for an item
     * @param {Item} item - The item to calculate crit chance for
     * @returns {number} Critical hit chance (0-1)
     */
    static #getCritChance(item) {
        const chance = (21 - item.criticalThreshold ) / 20;
        return DPRCalc.constrain( 0, chance, 1 );
    }

    /**
     * Extracts plain text from item description HTML
     * @param {Item} item - The item to get description from
     * @returns {string}
     */
    static #getDescText(item) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(item.system.description.value, 'text/html');
        return doc.body.textContent ?? "";
    }

    /**
     * Evaluates DPR for all items on the actor
     * @throws {Error} If already evaluated
     */
    async evaluate() {
        if(this.#evaluated) throw new Error(`Actor "${this.actor.name}" already evaluated.`);
        if(this.actor.type !== "npc") {
            console.log(`${this.actor.name} is not an NPC`);
            return;
        }

        for(const item of this.actor.items) {
            const result = await this.#evalItem(item);
            if(result) this.#results.items[item.name] = result;
        }
        
        this.#evaluated = true;
    }

    /**
     * Evaluates DPR statistics for a single item
     * @param {Item} item - The item to evaluate
     * @returns {Promise<DPRResult|null>}  Returns `null` if the item doesn't have an attack or damage
     */
    async #evalItem(item) {
        if( item.name === "Multiattack" ) {  this.#results.multiattack = DPRCalc.#getDescText(item); }
        if( !item.hasAttack || !item.hasDamage ) return null;

        const hitChance = DPRCalc.#getHitChance(item, this.config.targetAC);
        const critChance = DPRCalc.#getCritChance(item);

        const hitMin = await DPRCalc.#getFlatDamage({ item, minimize: true });
        const hitMax = await DPRCalc.#getFlatDamage({ item, maximize: true });
        const critMin = await DPRCalc.#getFlatDamage({ item, minimize: true, critical: true });
        const critMax = await DPRCalc.#getFlatDamage({ item, maximize: true, critical: true });

        const hitAvg = ( hitMin + hitMax ) / 2;
        const critAvg = ( critMin + critMax ) / 2;

        const effHitChance = DPRCalc.constrain(0, ( hitChance - critChance ), 1);
        const effCritChance = DPRCalc.constrain(0, critChance, 1);

        const effHitAvg = hitAvg * effHitChance;
        const effCritAvg = critAvg * effCritChance;

        const effAvgTotal = effHitAvg + effCritAvg;

        const rounded = Object.entries({
            hitAvg, critAvg, effHitAvg, effCritAvg, effAvgTotal, 
        }).reduce((acc, [k, v]) => {
            acc[k] = v % 1 === 0 ? v : Math.round(v);
            return acc;
        }, {});

        return {
            hitChance, critChance, effHitChance, effCritChance, hitMin, hitMax, critMin, critMax,
            ...rounded,
        }
    }

    //#region Printing

    /**
     * Gets summary statistics for display
     * @param {DPRResult} obj - The DPR result to summarize
     * @returns {{[key: string]: string|number}}
     */
    static #getSummary(obj) {
        return {
            "avg. Damage/Attack": obj.effAvgTotal,
            "Hit Chance": `${Math.round(obj.hitChance * 100)}%`,
            "Crit Chance": `${Math.round(obj.critChance * 100)}%`,
            "Damage Range": `${obj.hitMin} to ${obj.critMax}`
        }
    }

    /**
     * Formats calculation results for printing
     * @returns {object}
     */
    #formatItemsToPrint() {
        return Object.entries(this.#results.items)
            .reduce((acc, [k, v]) => {
                acc[k] = DPRCalc.#getSummary(v);
                acc[k].details = v;
                return acc;
            }, {});
    }

    /**
     * Prints results to configured outputs (console and/or chat)
     */
    print() {
        if(!this.#evaluated) {
            console.warn("Not evaluated");
            return;
        }

        const formattedItems = this.#formatItemsToPrint();

        if(this.config.console) this.#printToConsole(formattedItems);
        if(this.config.chatMessage) this.#printToChatMessage(formattedItems);
    }

    /**
     * Prints results to console
     * @param {object} formattedItems - Formatted calculation results
     */
    #printToConsole(formattedItems) {
        console.group(`${this.actor.name} vs AC ${this.config.targetAC}`);
        if(this.#results.multiattack) console.log(`Multiattack: ${this.#results.multiattack}`);
        console.table(formattedItems);
        console.groupEnd();
    }

    /**
     * Generates HTML table for chat output
     * @param {object} formattedItems - Formatted calculation results
     * @returns {string} HTML table string
     */
    static #getTableHTML(formattedItems) {
        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        const headerRow = document.createElement('tr');

        // Get unique columns
        const headers = new Set(['(index)']);
        Object.values(formattedItems).forEach(item => {
            if (item && typeof item === 'object') {
                Object.keys(item)
                    .filter(k => k !== "details")
                    .forEach(key => headers.add(key));
            }
        });

        // Add header cells
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Data Rows
        const headersArray = Array.from(headers);
        Object.entries(formattedItems).forEach(([k, v]) => {
            const row = document.createElement("tr");

            const indexCell = document.createElement("td");
            indexCell.textContent = k;
            row.appendChild(indexCell);

            headersArray.slice(1).forEach(header => {
                const td = document.createElement("td");

                const cellValue = v?.[header];
                td.textContent = cellValue === null ? 'null' 
                    : typeof cellValue === 'object' ? 'Object'
                        : cellValue?.toString() ?? '';
                row.appendChild(td);
            });

            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        return table.outerHTML;
    }

    /**
     * Prints results to chat message
     * @async
     * @param {object} formattedItems - Formatted calculation results
     */
    async #printToChatMessage(formattedItems) {
        const chatData = {
            content: DPRCalc.#getTableHTML(formattedItems),
        };
        ChatMessage.applyRollMode(chatData, CONST.DICE_ROLL_MODES.SELF);
        await ChatMessage.create(chatData);
    }

    //#endregion
}
