import { MODULE } from "../scripts/constants.mjs";

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

    /*----------------------------------------------------------------------------
                    Item Sheet           
    ----------------------------------------------------------------------------*/
    //#region 
    static registerRenderItemSheetHooks() {
        Hooks.on("renderItemSheet5e", (app, html, {item}={}) => {
            if (app.options.classes.includes("tidy5e-sheet")) return;

            const extraCritDmgElem = html.find('div[data-form-group-for="system.critical.damage"]');
            if(!extraCritDmgElem) return;

            $(Manager.getAttackCountFieldHTML(item)).insertAfter(extraCritDmgElem);
        })

        Hooks.on("tidy5e-sheet.renderItemSheet", (app, element, {item}, forced) => {
            //change item sheet
            const html = $(element);

            const extraCritDmgElem = html.find('div[data-form-group-for="system.critical.damage"]');
            if(!extraCritDmgElem) return;

            const markupToInject = `
                    <div style="display: contents;" data-tidy-render-scheme="handlebars">
                        ${Manager.getAttackCountFieldHTML(item)}
                    </div>
                `;
            $(markupToInject).insertAfter(extraCritDmgElem);
        });
    }

    static getAttackCountFieldHTML(item) {
        if(!Manager.isValidAttackItem(item)) return "";

        const flagValue = item.getFlag(MODULE.ID, Manager.CONFIG.flagKeys.itemAttackCount) ?? 1;
        return new foundry.data.fields.NumberField({
            label: "Attack Count",
            min: 0,
            initial: 1,
            integer: true,
        }).toFormGroup({}, {
            name: `flags.${MODULE.ID}.${Manager.CONFIG.flagKeys.itemAttackCount}`,
            value: flagValue,
        }).outerHTML;
    }

    /**
     * Checks if a given item has both an attack action type and an individual-type targetType
     * @param {Item} item 
     */
    static isValidAttackItem(item) {
        return Manager.CONFIG.validActionTypes.includes(item?.system?.actionType)
            && Object.keys(CONFIG.DND5E.individualTargetTypes).includes(item?.system?.target?.type);
    }
    //#endregion


}
