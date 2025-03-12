import { MODULE } from "../scripts/constants.mjs";

/** @typedef {import("../system/dnd5e/module/documents/item.mjs").default} Item5e */
/** @typedef {import("../system/dnd5e/module/dice/dice.mjs").D20RollConfiguration} D20RollConfiguration */

export default {
    register() {
        Manager.init();
    }
}


class Manager {
    static CONFIG = {
        flagKeys: {
            itemAttackCount: "repeatAttack.itemAttackCount",
        },
        validActionTypes: ["mwak", "msak", "rwak", "rsak"],
    }

    static init() {
        Manager.registerRenderItemSheetHooks();
    }

    /**
     * Checks if a given item has both an attack action type and an individual-type targetType
     * @param {Item} item 
     */
    static isValidAttackItem(item) {
        return Manager.CONFIG.validActionTypes.includes(item?.system?.actionType)
            && Object.keys(CONFIG.DND5E.individualTargetTypes).includes(item?.system?.target?.type);
    }

    /**
     * Returns the set attack count of an item.
     * 
     * If the item is not valid, returns null;
     * If the item is valid but does not (yet) have an attack count set, returns default of 1.
     * @param {Item5e} item 
     * @returns {number | null} The attack count of the item, minimum of 1.
     */
    static getAttackCount(item) {
        if(!Manager.isValidAttackItem(item)) return null;

        const attackCount = item.getFlag(MODULE.ID, Manager.CONFIG.flagKeys.itemAttackCount) ?? 1;
        return Math.max(attackCount, 1);
    }

    /*----------------------------------------------------------------------------
                    Item Sheet           
    ----------------------------------------------------------------------------*/
    //#region 
    static registerRenderItemSheetHooks() {
        Hooks.on("renderItemSheet5e", (app, html, {item}={}) => {
            if (app.options.classes.includes("tidy5e-sheet")) return;

            const attackCount = Manager.getAttackCount(item);
            if(!attackCount) return;

            const extraCritDmgElem = html.find('div[data-form-group-for="system.critical.damage"]');
            if(!extraCritDmgElem) return;

            $(Manager.getAttackCountFieldHTML(attackCount)).insertAfter(extraCritDmgElem);
        });

        Hooks.on("tidy5e-sheet.renderItemSheet", (app, element, {item}, forced) => {
            //change item sheet
            const html = $(element);

            const attackCount = Manager.getAttackCount(item);
            if(!attackCount) return;

            const extraCritDmgElem = html.find('div[data-form-group-for="system.critical.damage"]');
            if(!extraCritDmgElem) return;

            const markupToInject = `
                    <div style="display: contents;" data-tidy-render-scheme="handlebars">
                        ${Manager.getAttackCountFieldHTML(attackCount)}
                    </div>
                `;
            $(markupToInject).insertAfter(extraCritDmgElem);
        });
    }

    /**
     * @param {number} attackCount 
     * @returns {string}
     */
    static getAttackCountFieldHTML(attackCount) {
        return new foundry.data.fields.NumberField({
            label: "Attack Count",
            min: 0,
            initial: 1,
            integer: true,
        }).toFormGroup({}, {
            name: `flags.${MODULE.ID}.${Manager.CONFIG.flagKeys.itemAttackCount}`,
            value: attackCount,
        }).outerHTML;
    }
    //#endregion


    /*----------------------------------------------------------------------------
                    Attack Rolls            
    ----------------------------------------------------------------------------*/

    /**
     * @param {Item5e} item 
     * @param {D20RollConfiguration} rollConfig
     */
    static onDnd5ePreRollAttack(item, rollConfig) {

    }
}
