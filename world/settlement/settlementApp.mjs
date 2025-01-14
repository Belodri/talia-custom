import { MODULE } from "../../scripts/constants.mjs";
import Building from "../../world/settlement/building.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

/**
 * @typedef {object} BuildingDisplayData
 * @property {string} sId
 * @property {string} name
 * @property {boolean} isConstructed                Is this building constructed in this settlement?
 * @property {boolean} canBeConstructed             Can this building be constructed in this settlement?
 * @property {string} constructionDate              Construction date or "-" if not constructed
 * @property {number} scale
 * @property {number} [capacity]
 * @property {string} attributeDisplay
 * @property {string} [req_attributes]
 * @property {string} [req_buildingNames]
 * @property {string} [req_specialists]
 * @property {string} flavorText
 * @property {string} [specialEffectText]
 */

/**
 * @typedef {object} ExampleFormData
 * @property {string} settlementName
 * @property {{[key: string]: number}} attributes
 * @property {number} capacityAvailable
 * @property {number} capacityMax
 * @property {BuildingDisplayData[]} allBuildings   Sort all buildings by name alphabetically.
 */ 

export default class SettlementApp extends HandlebarsApplicationMixin(ApplicationV2) {
/*     // eslint-disable-next-line no-useless-constructor
    constructor() {
        super();
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            width: 1200,
            height: 800,
            popOut: true,
            minimizable: true,
            resizeable: true,
            id: "settlementApp",
            template: `modules/${MODULE.ID}/templates/settlementAppTemplate.hbs`,
        })
    }
    
 */
    constructor(settlement, options = {}) {
        options.title = settlement.name;

        super(options);
        this.settlement = settlement;
        this.allBuildingInstances = Building.allBuildingInstances;
    }

    static DEFAULT_OPTIONS = {
        id: "settlementApp",
        classes: [MODULE.ID, "settlement"],
        form: {
            submitOnChange: true,
            closeOnSubmit: false,
        },
        window: {
            contentClasses: ["standard-form"],
            resizable: true,
        },
        position: {
            width: 1000,
            height: 800,
        },
        actions: {
            abort: this.#onAbortConstruction,
            build: this.#onConstructBuilding,
        }
    }

    static PARTS = {
        header: { template: `modules/${MODULE.ID}/templates/settlementTemplates/sheet-header.hbs` },
        nav: { template: `modules/${MODULE.ID}/templates/settlementTemplates/sheet-nav.hbs` },
        overview: { template: `modules/${MODULE.ID}/templates/settlementTemplates/sheet-overview.hbs` },
        buildings: { template: `modules/${MODULE.ID}/templates/settlementTemplates/sheet-buildings.hbs` },
    }

    tabGroups = {
        main: "overview"
    }

    static _getAttrString(attributes, setPrefix = false) {
        return Object.entries(attributes)
            .filter(([_, v]) => v)
            .map(([k, v]) => { 
                const prefix = (v > 0 && setPrefix) ? "+" : ""; 
                const attr = k.at(0).toUpperCase() + k.slice(1); 
                return `${prefix}${v} ${attr}`;
            })
            .join(", ");
    }

    _getBuildingDisplayData(building) {


        const obj = {};
        obj.name = building.name;
        obj.sId = building.sId;
        obj.scale = building.scale;
        obj.flavorText = building.flavorText;

        obj.isRecentConstruction = building.recentlyConstructed;

        const meetsScale = building.meetsScale(this.settlement);
        const meetsSpec = building.meetsSpecialistRequirements(this.settlement);
        const meetsBuild = building.meetsBuildingRequirements(this.settlement);
        const meetsAttr = building.meetsBuildingRequirements(this.settlement);

        const meetsAll = meetsScale && meetsSpec && meetsBuild && meetsAttr;
        const isRecent = building.recentlyConstructed;
        const hasBuild = this.settlement.buildings.has(building.sId);

        obj.buttonText = isRecent ? "Abort" : "Build";
        obj.buttonAction = isRecent ? "abort" 
            : !hasBuild && meetsAll ? "build"
                : "";
        obj.isButtonDisabled = !isRecent && !hasBuild && !meetsAll;
        obj.isButtonHidden = !isRecent && hasBuild;
        

        obj.isConstructed = building.isConstructed;
        obj.constructionDate = building.constructionDateDisplay;

        //grants
        obj.grantList = [];
        const attrString = SettlementApp._getAttrString(building.attributes, true);
        if(attrString) obj.grantList.push(attrString);

        const capacity = building.capacity;
        const capacityString = capacity ? `${capacity > 0 ? "+" : ""}${capacity} Capacity` : "";
        if(capacityString) obj.grantList.push(capacityString);

        if(building.specialEffectText) obj.grantList.push(building.specialEffectText);

        //requires
        obj.reqList = [];
        const reqs = building.requirements;
        if(building.hasAttributeRequirements) {
            const reqStr = SettlementApp._getAttrString(reqs.attributes);
            obj.reqList.push(reqStr);
        }

        if(building.hasBuildingRequirements) {
            const str = [...reqs.buildingIds]
                .map(sId => Building.database.get(sId).name )
                .join(", ");
            obj.reqList.push(str);
        }

        if(building.hasSpecialistRequirements) {
            const str = [...reqs.specialists]
                .join(", ");
            obj.reqList.push(str);
        }

        return obj;
    }


    _prepareContext(options) {
        const c = {};

        const tabs = {
            overview: { label: "Overview" },
            buildings: { label: "Buildings" },
        }
        for(const [k, v] of Object.entries(tabs)) {
            v.cssClass = (this.tabGroups.main === k) ? "active" : "";
            v.id = k;
        }
        c.tabs = tabs;

        c.settlementName = this.settlement.name;
        c.attributes = this.settlement.attributes;
        c.capacityAvailable = this.settlement.capacityAvailable;
        c.capacityMax = this.settlement.capacity;

        const settlementBuildings = this.settlement.buildings;
        c.allBuildings = [
            ...settlementBuildings.map(b => this._getBuildingDisplayData(b)),
            ...this.allBuildingInstances
                .filter(b => !settlementBuildings.has(b.sId))
                .map(b => this._getBuildingDisplayData(b))
        ].sort((a, b) => a.scale - b.scale);

        return c;
    }

    /**
     * 
     * @param {SubmitEvent} event 
     * @param {HTMLFormElement} form 
     * @param {FormDataExtended} formData 
     */
    static async #onSubmit(event, form, formData) {
        console.log({event, form, formData});
    }

    /**
     * 
     * @param {PointerEvent} event 
     * @param {HTMLElement} target 
     */
    static async #onConstructBuilding(event, target) {
        const sId = target.dataset.buildingid;
        await Building.build(this.settlement, sId);
        this.render();
    }

    /**
     * 
     * @param {PointerEvent} event 
     * @param {HTMLElement} target 
     */
    static async  #onAbortConstruction(event, target) {
        const sId = target.dataset.buildingid;
        const building = this.settlement.buildings.get(sId);
        await building.destroy();
        this.render();
    }
}
