/* eslint-disable no-unreachable */
import { MODULE } from "../../scripts/constants.mjs";
import TaliaDate from "../../utils/TaliaDate.mjs";
import Mission from "./mission.mjs";
import Adventurer from "./adventurer.mjs";
import Guild from "./guild.mjs";

const {HandlebarsApplicationMixin, DocumentSheetV2} = foundry.applications.api;
export default class GuildApp extends HandlebarsApplicationMixin(DocumentSheetV2) {

    /**
     * @param {Guild} guild 
     * @param {object} [options] 
     */
    constructor(guild, options = {}) {
        super({...options, document: guild.parent, guild: guild});
        this.guild = guild;
        this.#dragDrop = this.#createDragDropHandlers();
    }

    //#region Drag Drop

    #dragDrop;

    get dragDrop() { return this.#dragDrop; }

    /**
     * Create drag-and-drop workflow handlers for this Application
     * @returns {DragDrop[]}     An array of DragDrop handlers
     * @private
     */
    #createDragDropHandlers() {
        return this.options.dragDrop.map((d) => {
            d.permissions = {
                dragstart: this._canDragStart.bind(this),
                drop: this._canDragDrop.bind(this),
            };
            d.callbacks = {
                dragstart: this._onDragStart.bind(this),
                dragover: this._onDragOver.bind(this),
                drop: this._onDrop.bind(this),
            };
            return new DragDrop(d);
        });
    }

    /**
     * Actions performed after any render of the Application.
     * Post-render steps are not awaited by the render process.
     * @param {ApplicationRenderContext} context      Prepared context data
     * @param {RenderOptions} options                 Provided render options
     */
    _onRender(context, options) {
        this.#dragDrop.forEach((d) => d.bind(this.element));
    }

    /**
     * Define whether a user is able to begin a dragstart workflow for a given drag selector
     * @param {string} selector       The candidate HTML selector for dragging
     * @returns {boolean}             Can the current user drag this selector?
     */
    _canDragStart(selector) { return true }

    /**
     * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
     * @param {string} selector       The candidate HTML selector for the drop target
     * @returns {boolean}             Can the current user drop on this selector?
     */
    _canDragDrop(selector) { return true }

    /**
     * Callback actions which occur at the beginning of a drag start workflow.
     * @param {DragEvent} event       The originating DragEvent
     */
    _onDragStart(event) {
        const el = event.currentTarget;
        if ('link' in event.target.dataset) return;

        // Extract the data you need
        let dragData = null;

        if (!dragData) return;

        // Set data transfer
        event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    }

    _onDragOver(event) {
        
    }

    /**
     * Callback actions which occur when a dragged element is dropped on a target.
     * @param {DragEvent} event       The originating DragEvent
     * @protected
     */
    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);

        // Handle different data types
        switch (data.type) {
            // write your cases
        }
    }

  
    //#endregion

    static DEFAULT_OPTIONS = {
        id: "GuildApp",
        classes: ["sheet", "talia-custom", "guild"],
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
            openNotes: GuildApp.#openNotes,
        },
        dragDrop: [{ dragSelector: '[data-drag]', dropSelector: '[data-drop]' }],
    }

    static PARTS = {
        header: { template: `modules/${MODULE.ID}/templates/guildTemplates/header.hbs` },
        navigation: { template: `modules/${MODULE.ID}/templates/guildTemplates/navigation.hbs` },
        general: { template: `modules/${MODULE.ID}/templates/guildTemplates/general.hbs` },
        //missions: { template: `modules/${MODULE.ID}/templates/guildTemplates/missions.hbs`, scrollable: [""] },
        //adventurers: { template: `modules/${MODULE.ID}/templates/guildTemplates/adventurers.hbs`, scrollable: [""] },
        //graveyard: { template: `modules/${MODULE.ID}/templates/guildTemplates/graveyard.hbs`, scrollable: [""] },
        //log: { template: `modules/${MODULE.ID}/templates/guildTemplates/log.hbs`, scrollable: [""] }
    }

    tabGroups = {
        main: "general"
    }

    _attachFrameListeners() {
        super._attachFrameListeners();
        new ContextMenu(this.element, ".mission-card", this._getMissionCardContextMenuItems());
        new ContextMenu(this.element, ".adventurer-card", this._getAdventurerCardContextMenuItems());
    }

    _prepareSubmitData(event, form, formData) {
        const submitData = foundry.utils.expandObject(formData.object);

        this.guild.validate({changes: submitData, clean: true, fallback: false});
        this.guild.updateSource(submitData);
        return {flags: { [MODULE.ID]: { Guild: this.guild.toObject() }}};
    }

    //#region Cross client sync

    #updateHookId = null;

    _onFirstRender(context, options) {
        super._onFirstRender(context, options);

        const hookId = Hooks.on("updateJournalEntry", (document, changed, options, userId) => {
            if(userId === game.user.id 
                || !changed.flags?.[MODULE.ID]?.Guild
                || !document.apps[this.id]
            ) return;

            this.guild.syncWithDocument();
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

    #makeField(source, path, options={}) {
        const field = this.guild.schema.getField(path);
        const value = foundry.utils.getProperty(source, path);

        return {
            field: field,
            value: value,
            ...options
        };
    }

    async _prepareContext(options) {
        const tabs = {
            general: { label: "Guild Hall" },
            //graveyard: { label: "Graveyard" },
            //log: { label: "Mission Log" },
        };
        for (const [k, v] of Object.entries(tabs)) {
            v.cssClass = (this.tabGroups.main === k) ? "active" : "";
            v.id = k;
        }

        const context = {};
        const guild = this.guild;
        const source = guild.toObject();
        const isGM = game.user.isGM;

        const fields = {};
        //fields.unlocked = this.#makeField(source, "unlocked");

        const adventurers = this._prepareAdventurersContext();
        const missions = this._prepareMissionsContext();

        context.fields = fields;
        context.adventurers = adventurers;
        context.missions = missions;
        context.tabs = tabs;
        context.guild = guild;
        context.source = source;
        context.isGM = isGM;

        return context;
    }

    //#region Mission Context

    _prepareMissionsContext() {
        const act = []
        const log = [];

        for(const mission of this.guild.missions) {
            if(mission.hasFinished) log.push(mission);
            else act.push(mission);
        }

        const active = act
            .sort((a, b) => {
                const getSortPriority = (mis) => {
                    return mis.hasReturned ? 0      // Returned missions first
                        : !mis.hasStarted ? 1       // Not started missions second
                            : 2;                    // Started missions last
                }

                const aPrio = getSortPriority(a);
                const bPrio = getSortPriority(b);

                if (aPrio !== bPrio) {
                    return aPrio - bPrio;
                }
                // For started missions, sort by daysUntilReturn (ascending)
                if (aPrio === 2) {
                    return a.daysUntilReturn - b.daysUntilReturn;
                }
                return 0; // Keep order if in the same category without further sorting
            })
            .map(mis => this.getMissionCardContext(mis));
        
        const logged = log
            .sort((a, b) => b.finishDate.inDays - a.finishDate.inDays)
            .map(mis => this.getMissionCardContext(mis));

        return { active, logged };
    }

    /**
     * @typedef {object} MissionCardContext
     * @property {string} id
     * @property {object} [state]
     * @property {string} [state.icon]
     * @property {object} risk
     * @property {string} risk.label
     * @property {string} risk.icon
     * @property {string} name
     * @property {string} description
     * @property {string} reward
     * @property {DcData} dcData
     * @property {number} durationInMonths
     * @property {number} daysUntilReturn
     * @property {{[checkResultId: string]: CheckResult}} results
     * @property {object[]} assigned 
     */

    /**
     * @typedef {object} AssignedAdventurerData
     * @property {string} id
     * @property {string} name
     * @property {string} img
     * @property {object} level
     * @property {string} level.icon
     * @property {{[attributeKey: string]: EvaluatedAttribute}} attributes 
     */

    /**
     * @typedef {object} DcData
     * @property {string} key
     * @property {string} label
     * @property {string} explanation
     * @property {number} dc
     * @property {string} name          //the name of the assigned adventurer who'll roll this
     * @property {string} bonus         // the bonus for the roll (example "+3" or "-4")
     * @property {string} img
     */

    /**
     * 
     * @param {Mission} mis 
     * @returns 
     */
    getMissionCardContext(mis) {
        const reward = (() => {
            const rewardStrings = [];
            if(mis.rewards.gp) rewardStrings.push(`${mis.rewards.gp}gp`);

            for(const record of mis.rewards.items) {
                rewardStrings.push(`${record.quantity}x ${record.itemName}`);
            }

            for(const str of mis.rewards.other) rewardStrings.push(str);

            return rewardStrings.join(", ");
        })();

        const bestAll = mis.bestForChecks;
        const dcData = Object.entries(mis.dc)
            .reduce((acc, [attr, dc]) => {
                const best = bestAll[attr];
                const bestBonus = best?.attributes[attr].totalRollMod ?? null;

                acc[attr] = {
                    key: attr,
                    label: Adventurer.ATTRIBUTE_LABELS[attr].label,
                    explanation: Adventurer.ATTRIBUTE_LABELS[attr].explanation,
                    dc, 
                    name: best?.name ?? "",
                    bonus: best ? `${bestBonus >= 0 ? "+" : ""}${bestBonus}` : "",
                    img: best?.img ?? "",
                };
                return acc;
            }, {});

        const assigned = mis.assignedAdventurers.map(adv => {
            return {
                id: adv.id,
                name: adv.name,
                img: adv.img,
                level: {
                    icon: Adventurer.CONFIG.levels[adv.level].icon,
                },
                attributes: adv.attributes,
            }
        });

        return {
            id: mis.id,
            name: mis.name,
            description: mis.description,
            durationInMonths: mis.durationInMonths,
            state: Mission.CONFIG.states[mis.state],
            risk: Mission.CONFIG.risk[mis.risk],
            reward,
            dcData,
            daysUntilReturn: mis.daysUntilReturn,
            results: mis.results,
            assigned,
        }
    }
    //#endregion

    //#region Adventurer Context

    _prepareAdventurersContext() {
        const aliveAdv = [];
        const deadAdv = [];

        for(const adv of this.guild.adventurers) {
            if(adv.isDead) deadAdv.push(adv);
            else aliveAdv.push(adv);
        }

        const alive = aliveAdv.sort((a, b) => 
            (a.isAssigned - b.isAssigned)           // Sort by isAssigned (false before true)
            || a.name.localeCompare(b.name, "en")   // Then by name
        ).map(adv => this.getAdventurerCardContext(adv));
        
        const dead = deadAdv.sort((a, b) => 
            b._deadDate.inDays - a._deadDate.inDays // Sort descending, most recent deaths first
        ).map(adv => this.getAdventurerCardContext(adv));
        
        return { alive, dead };
    }

    /**
     * @typedef {object} AdventurerCardContext
     * @property {string} id
     * @property {string} name
     * @property {string} img
     * @property {object} state
     * @property {string} state.icon
     * @property {string} state.label 
     * @property {object} level
     * @property {object} level.icon
     * @property {object} description
     * @property {object} assignedMission
     * @property {object} assignedMission.name
     * @property {string} [deathDate]
     * @property {{[attributeKey: string]: EvaluatedAttribute}} attributes 
     */

    getAdventurerCardContext(adv) {
        return {
            id: adv.id,
            name: adv.name,
            img: adv.img,
            description: adv.description,
            state: Adventurer.CONFIG.states[adv.state],
            level: Adventurer.CONFIG.levels[adv.level],
            assignedMission: adv.assignedMission,
            deathDate: adv.deathDate ? adv.deathDate.displayString : "",
            attributes: adv.attribtues
        }
    }

    //#endregion

    //#region ContextMenu
    _getMissionCardContextMenuItems() {
        return;
        //UNFINISHED

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

    _getAdventurerCardContextMenuItems() {
        return;
        //UNFINISHED

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

    _getAdventurerFromJQ(jq) {
        const card = jq.closest(".adventurer-card")[0];
        const id = card.dataset.id;
        return this.guild.adventurers.get(id);
    }

    /** 
     * @param {JQuery} jq  
     * @returns {Building}
     */
    _getMissionFromJQ(jq) {
        const card = jq.closest(".mission-card")[0];
        const id = card.dataset.id;
        return this.guild.missions.get(id);
    }
    //#endregion


}

/**
 * @typedef {object} AssignedData
 * @property {string} id
 * @property {string} name
 * @property {string} img
 * @property {string} adventurerCardHTML    // a template of the adventurer's card
 * 
 */

/**
 * @typedef {object} AdventurerCardData
 * @property {string} id
 * @property {string} name
 * @property {string} img
 */
