import { MODULE } from "../../scripts/constants.mjs";
import Building from "./building.mjs";
import TaliaDate from "../../utils/TaliaDate.mjs";

const {HandlebarsApplicationMixin, DocumentSheetV2} = foundry.applications.api;
export default class SettlementApp extends HandlebarsApplicationMixin(DocumentSheetV2) {

    /**
     * 
     * @param {Settlement} settlement 
     * @param {object} [options] 
     */
    constructor(settlement, options = {}) {
        super({...options, document: settlement.parent, settlement: settlement});
        this.settlement = settlement;
    }

    static DEFAULT_OPTIONS = {
        id: "SettlementApp",
        classes: ["sheet", "talia-custom", "settlement"],
        sheetConfig: false,
        window: {
            resizable: false,
            contentClasses: ["standard-form"]
        },
        position: {
            height: 950,
            width: 900,
        },
        form: {
            submitOnChange: true,
            closeOnSubmit: false,
        },
        actions: {
            openNotes: SettlementApp.#openNotes,
        }
    }

    static PARTS = {
        header: { template: `modules/${MODULE.ID}/templates/settlementTemplates/header.hbs` },
        navigation: { template: `modules/${MODULE.ID}/templates/settlementTemplates/navigation.hbs` },
        general: { template: `modules/${MODULE.ID}/templates/settlementTemplates/general.hbs`, scrollable: [""] },
        buildings: { template: `modules/${MODULE.ID}/templates/settlementTemplates/buildings.hbs`, scrollable: [""] },
        effects: { template: `modules/${MODULE.ID}/templates/settlementTemplates/effects.hbs`, scrollable: [""] },
    }

    tabGroups = {
        main: "general"
    }

    _attachFrameListeners() {
        super._attachFrameListeners();
        new ContextMenu(this.element, ".building-card", this._getBuildingCardContextMenuItems());
        new ContextMenu(this.element, ".effect-card", this._getEffectCardContextMenuItems());
    }

    _prepareSubmitData(event, form, formData) {
        const submitData = foundry.utils.expandObject(formData.object);

        this.settlement.validate({changes: submitData, clean: true, fallback: false});
        this.settlement.updateSource(submitData);
        return {flags: { [MODULE.ID]: { Settlement: this.settlement.toObject() }}};

    }

    //#region Cross client sync

    #updateHookId = null;

    _onFirstRender(context, options) {
        super._onFirstRender(context, options);

        const hookId = Hooks.on("updateJournalEntry", (document, changed, options, userId) => {
            if(userId === game.user.id 
                || !changed.flags?.[MODULE.ID]?.Settlement
                || !document.apps[this.id]
            ) return;

            this.settlement.syncWithDocument();
            this.render();
        });

        this.#updateHookId = hookId;
    }

    _onClose(options) {
        super._onClose(options);
        Hooks.off("updateJournalEntry", this.#updateHookId);
    }
    //#endregion

    //#region Actions

    static async #openNotes(event, target) {
        return this.document.sheet.render(true);
    }
    //#endregion

    //#region Context

    async _prepareContext(options) {
        const tabs = {
            general: { label: "General" },
            buildings: { label: "Buildings" },
            effects: { label: "Effects" },
        };
        for (const [k, v] of Object.entries(tabs)) {
            v.cssClass = (this.tabGroups.main === k) ? "active" : "";
            v.id = k;
        }

        const context = {};
        const settlement = this.settlement;
        const source = settlement.toObject();
        const isGM = game.user.isGM;

        const makeField = (path, options = {}) => {
            const field = settlement.schema.getField(path);
            const value = foundry.utils.getProperty(source, path);

            return {
                field: field,
                value: value,
                ...options
            };
        };

        const fields = {};
        fields.unlocked = makeField("unlocked");

        const buildingsContext = Object.values(settlement.buildings)
            .map(building => this._prepareBuilding(building))
            .sort((a, b) => a.id.localeCompare(b.id, "en"));

        const effectsContext = Object.values(settlement.effects)
            .map(effect => this._prepareEffect(effect))
            .sort((a, b) =>           //sort by least remaining duration first, alphabetically 2nd
                a.remainingDays === b.remainingDays 
                    ? a.name.localeCompare(b.name, "en") 
                    : a.remainingDays - b.remainingDays
            );

        context.fields = fields;
        context.buildingsContext = buildingsContext;
        context.effectsContext = effectsContext;
        context.tabs = tabs;
        context.settlement = settlement;
        context.source = source;
        context.isGM = isGM;

        return context;
    }

    static _getAttrDisplayString(attributes, setPrefix = false) {
        return Object.entries(attributes)
            .filter(([_, v]) => v)
            .map(([k, v]) => {
                const prefix = (v > 0 && setPrefix) ? "+" : ""; 
                const attr = k.at(0).toUpperCase() + k.slice(1); 
                return `${prefix}${v} ${attr}`;
            })
            .join(", ");
    }

    _prepareBuilding(building) {
        const isBuilt = building.isBuilt;
        const isRecent = building.isRecentlyConstructed;
        const allReqsMet = building.allRequirementsMet;

        const grants = [
            SettlementApp._getAttrDisplayString(building.modifiers.attributes, true),
            building.modifiers.capacity ? `${building.modifiers.capacity > 0 ? "+" : ""}${building.modifiers.capacity} Capacity` : "",
            building.effectText
        ].filter(Boolean);

        const requires = [
            { 
                displayString: SettlementApp._getAttrDisplayString(building.requirements.attributes),
                classList: !isBuilt 
                    ? building._attributesMet 
                        ? "req-met"
                        : "req-not-met"
                    : ""
            }, { 
                displayString: [...building.requirements.buildings]
                    .map(id => Building.database.get(id).name)
                    .join(", "),
                classList: !isBuilt 
                    ? building._buildingsMet
                        ? "req-met"
                        : "req-not-met"
                    : ""
            }, {
                displayString: [...building.requirements.unlocked]
                    .map(str => str)
                    .join(", "),
                classList: !isBuilt 
                    ? building._unlockedMet
                        ? "req-met"
                        : "req-not-met"
                    : ""
            }
        ].filter(item => item.displayString);

        const constructionDateDisplay = isBuilt ? building.constructionDate.displayString : "";

        const conditionalClasses = [];
        if( isBuilt ) conditionalClasses.push("highlight");
        if( isRecent ) conditionalClasses.push("is-recent");
        if( allReqsMet ) conditionalClasses.push("all-reqs-met");
        if( building._scaleMet && !isBuilt ) conditionalClasses.push("scale-met");
        const classList = conditionalClasses.join(" ");

        return {
            effectText: building.effectText, 
            flavorText: building.flavorText, 
            id: building.id, 
            name: building.name, 
            scale: building.scale,
            constructionDateDisplay,
            isRecent,
            grants,
            requires,
            classList
        };
    }

    _prepareEffect(effect) {
        const isGM = game.user.isGM;
        const isTemporary = effect.isTemporary;
        const isActive = effect.isActive;

        const grants = [ 
            SettlementApp._getAttrDisplayString(effect.modifiers.attributes, true),
            effect.modifiers.capacity ? `${effect.modifiers.capacity > 0 ? "+" : ""}${effect.modifiers.capacity} Capacity` : "",
            effect.effectText
        ].filter(Boolean);

        const conditionalClasses = [];
        if( isTemporary ) conditionalClasses.push("is-temporary");
        if( isActive ) conditionalClasses.push("highlight");
        if( !isActive && !isGM) conditionalClasses.push("hidden");
        const classList = conditionalClasses.join(" ");
        
        return {
            id: effect.id,
            name: effect.name,
            isTemporary,
            isActive,
            beginDateStr: effect.beginDate.displayString,
            endDateStr: isTemporary ? effect.endDate.displayString : "",
            remainingDays: effect.remainingDays,
            grants,
            flavorText: effect.flavorText,
            classList
        }
    }
    //#endregion

    //#region ContextMenu
    _getBuildingCardContextMenuItems() {
        return [
            {
                name: "Build",
                icon: `<i class="fa-solid fa-person-digging"></i>`,
                condition: (jq) => {
                    const building = this._getBuildingFromJQ(jq);
                    return !building.isBuilt && building.allRequirementsMet;
                },
                callback: this._onBuildButton.bind(this)
            },
            {
                name: "Cancel Construction",
                icon: `<i class="fa-regular fa-circle-xmark"></i>`,
                condition: (jq) => {
                    const building = this._getBuildingFromJQ(jq);
                    return building.isRecentlyConstructed;
                },
                callback: this._onCancelConstructionButton.bind(this)
            },
            {
                name: "Force Build (GM)",
                icon: `<i class="fa-thin fa-person-digging"></i>`,
                condition: (jq) => {
                    const building = this._getBuildingFromJQ(jq);
                    return game.user.isGM && !building.isBuilt;
                },
                callback: this._onBuildButton.bind(this)
            },
            {
                name: "Force Cancel (GM)",
                icon: `<i class="fa-thin fa-circle-xmark"></i>`,
                condition: (jq) => {
                    const building = this._getBuildingFromJQ(jq);
                    return game.user.isGM && building.isBuilt;
                },
                callback: this._onCancelConstructionButton.bind(this)
            },
            {
                name: "Modify Construction Date (GM)",
                icon: `<i class="fa-thin fa-calendar"></i>`,
                condition: (jq) => {
                    const building = this._getBuildingFromJQ(jq);
                    return game.user.isGM && building.isBuilt;
                },
                callback: this._onModifyConstructionDateButton.bind(this)
            }
        ]
    }

    _getEffectCardContextMenuItems() {
        return [
            {
                name: "Activate",
                icon: '<i class="fa-solid fa-plus"></i>',
                condition: (jq) => {
                    const effect = this._getEffectFromJQ(jq);
                    return game.user.isGM && !effect.isActive
                },
                callback: async (jq) => {
                    const effect = this._getEffectFromJQ(jq);
                    await effect.activate();
                }
            },
            {
                name: "Deactivate",
                icon: '<i class="fa-solid fa-minus"></i>',
                condition: (jq) => {
                    const effect = this._getEffectFromJQ(jq);
                    return game.user.isGM && effect.isActive
                },
                callback: async (jq) => {
                    const effect = this._getEffectFromJQ(jq);
                    await effect.deactivate();
                }
            },
            {
                name: "Modify Begin Date",
                icon: `<i class="fa-thin fa-calendar"></i>`,
                condition: () => game.user.isGM,
                callback: async (jq) => {
                    const effect = this._getEffectFromJQ(jq);
                    const newDate = await TaliaDate.fromDialog();
                    if( newDate ) await effect.setBeginDate(newDate);
                }
            }
        ]
    }

    _getEffectFromJQ(jq) {
        const card = jq.closest(".effect-card")[0];
        const id = card.dataset.id;
        return this.settlement.effects[id];
    }

    /** 
     * @param {JQuery} jq  
     * @returns {Building}
     */
    _getBuildingFromJQ(jq) {
        const card = jq.closest(".building-card")[0];
        const id = card.dataset.id;
        return this.settlement.buildings[id];
    }

    async _onModifyConstructionDateButton(jq) {
        const building = this._getBuildingFromJQ(jq);
        const newDate = await TaliaDate.fromDialog();
        if(newDate) await building.setConstructionDate(newDate);
    }

    async _onCancelConstructionButton(jq) {
        const building = this._getBuildingFromJQ(jq);
        await building.destroy();
    }

    async _onBuildButton(jq) {
        const building = this._getBuildingFromJQ(jq);
        await building.build();
    }
    //#endregion
}
