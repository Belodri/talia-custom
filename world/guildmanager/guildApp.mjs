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

        const dragData = {
            adventurerId: el.dataset?.adventurerId,
        };
        
        if (!dragData.adventurerId) return;

        // Set data transfer
        event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    }

    /**
     * Callback actions which occur when a dragged element is dropped on a target.
     * @param {DragEvent} event       The originating DragEvent
     * @protected
     */
    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);

        const adventurerId = data?.adventurerId;
        const missionId = event.currentTarget?.dataset?.missionId;
        if(adventurerId && missionId) {
            const mission = this.guild.missions.get(missionId);
            return mission.assignAdventurer(adventurerId);
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
            unassign: GuildApp.#unassign,
            startMission: GuildApp.#startMission,
            finishMission: GuildApp.#finishMission,
            toggleCollapse: GuildApp.#toggleCollapse,
            createNewMission: GuildApp.#createNewMission,
            createNewAdventurer: GuildApp.#createNewAdventurer,
        },
        dragDrop: [{ dragSelector: '[data-drag]', dropSelector: '[data-drop]' }],
    }

    static PARTS = {
        header: { template: `modules/${MODULE.ID}/templates/guildTemplates/header.hbs` },
        navigation: { template: `modules/${MODULE.ID}/templates/guildTemplates/navigation.hbs` },
        general: { template: `modules/${MODULE.ID}/templates/guildTemplates/general.hbs`, scrollable: [""]},
        //missions: { template: `modules/${MODULE.ID}/templates/guildTemplates/missions.hbs`, scrollable: [""] },
        //adventurers: { template: `modules/${MODULE.ID}/templates/guildTemplates/adventurers.hbs`, scrollable: [""] },
        graveyard: { template: `modules/${MODULE.ID}/templates/guildTemplates/graveyard.hbs`, scrollable: [".scrollable"] },
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
/* 
    _prepareSubmitData(event, form, formData) {
        const submitData = foundry.utils.expandObject(formData.object);

        this.guild.validate({changes: submitData, clean: true, fallback: false});
        this.guild.updateSource(submitData);
        return {flags: { [MODULE.ID]: { Guild: this.guild.toObject() }}};
    }
 */
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

    /**
     * @param {PointerEvent} event - The originating click event
     * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
     */
    static async #unassign(event, target) {
        const advId = target.dataset?.adventurerId;
        if(!advId) return;

        const adv = this.guild.adventurers.get(advId);
        const mis = adv?.assignedMission;

        return mis.unassignAdventurer(adv);
    }

    static async #startMission(event, target) {
        const misId = target.dataset?.missionId;
        if(!misId) return;

        const mis = this.guild.missions.get(misId);
        return mis.start();
    }

    static async #finishMission(event, target) {
        const misId = target.dataset?.missionId;
        if(!misId) return;

        const mis = this.guild.missions.get(misId);
        return mis.finish();
    }

    static async #createNewMission(event, target) {
        return this.guild.createRandomMission();
    }

    static async #createNewAdventurer(event, target) {
        return this.guild.createRandomAdventurer();
    }

    /**
     * @param {PointerEvent} event - The originating click event
     * @param {HTMLElement} target - the capturing HTML element which defined a [data-action]
     */
    static async #toggleCollapse(event, target) {
        target.classList.toggle("collapsed");
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
        this.guild.syncWithDocument();

        const tabs = {
            general: { label: "Guild Hall" },
            graveyard: { label: "Graveyard" },    //todo: graveyard
            //log: { label: "Mission Log" },        //todo: log
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

    //#endregion

    //#region Mission Context

    _prepareMissionsContext() {
        const act = []
        const log = [];

        for(const mission of Object.values(this.guild._missions)) {
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
     * @property {object} state
     * @property {string} state.icon
     * @property {string} state.hint
     * @property {object} risk
     * @property {string} risk.hint
     * @property {string} risk.icon
     * @property {string} name
     * @property {string} description
     * @property {string} reward
     * @property {DcData} dcData
     * @property {number} durationInDays
     * @property {number} daysUntilReturn
     * @property {object} results
     * @property {import("./Resolver.mjs").CheckResults} results.checkResults
     * @property {import("./Resolver.mjs").AdventurerResults} results.adventurerResults
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
     */
    static _getMissionRewardsHTMLString(mis) {
        const rewards = mis?.rewards;
        if(!rewards) return "";

        const parts = [];
        if(rewards.gp) parts.push(`<li>${rewards.gp}gp</li>`);

        const itemRecordPart = Object.values(rewards.itemRecords)
            .filter(v => v.uuid)
            .map(v => `<li>${v.quantity}x ${v.name}</li>`)
            .join("");
        if(itemRecordPart) parts.push(itemRecordPart);

        const otherPart = Array.from(rewards.other)
            .map(str => `<li>${str}</li>`)
            .join("");
        if(otherPart) parts.push(otherPart);

        const allJoined = parts.join("");
        
        if(!allJoined) return "";
        return `<ul>${allJoined}</ul>`;
    }

    /**
     * 
     * @param {Mission} mis 
     */
    getMissionCardContext(mis) {
        const dcDataRaw = Object.entries(mis.dc)
            .reduce((acc, [attr, dc]) => {
                acc[attr] = {
                    key: attr,
                    label: Adventurer.ATTRIBUTE_LABELS[attr].label,
                    explanation: Adventurer.ATTRIBUTE_LABELS[attr].explanation,
                    dc,
                }
                return acc;
            }, {});

        const bestAll = mis.bestForMainChecks;
        const assigned = mis.assignedAdventurers.map(adv => {
            return {
                id: adv.id,
                name: adv.name,
                img: adv.img,
                attributes: Object.values(adv.attributes)
                    .reduce((acc, curr) => {
                        const isHighlighted = bestAll[curr.attributeKey]?.id === adv.id
                            || curr.attributeKey === "reliability";

                        const spanClass = isHighlighted 
                            ? "highlighted"
                            : "greyed";
                        
                        acc[curr.attributeKey] = {
                            totalBonus: adv.attributes[curr.attributeKey].totalRollModDisplay,
                            spanClass,
                        }
                        return acc;
                    }, {}),
            }
        });

        const missionButtonStates = {
            ready: {
                display: true,
                action: "startMission",
                label: "Start Mission",
            },
            returned: {
                display: true,
                action: "finishMission",
                label: "Receive Mission Report",
            }
        }
        const missionButton = missionButtonStates[mis.state.key] ?? {};


        const assignmentsDisplay = {
            label: `${mis.assignedAdventurers.size}/${Mission.CONFIG.maxAdventurers}`,
            tooltip: `Each mission must have between ${Mission.CONFIG.minAdventurers} and ${Mission.CONFIG.maxAdventurers} adventurers.`,
        }


        const getStateVars = () => {
            const assigned = {
                label: `${mis.assignedAdventurers.size}/${Mission.CONFIG.maxAdventurers}`,
                tooltip: `Each mission must have between ${Mission.CONFIG.minAdventurers} and ${Mission.CONFIG.maxAdventurers} adventurers.`,
            }

            const ret = {}
            switch (mis.state.key) {
                case "logged":  
                    ret.durLabel = ``;
                    ret.durTooltip = `Report received on ${mis.returnDate.displayString}`;
                    ret.statusLabel = ``;
                    ret.statusTooltip = `The report has been reviewed and logged.`;
                    ret.statusIcon = GuildApp.ICONS.mission.logged;
                    break;
                case "returned": 
                    ret.durLabel = ``;
                    ret.durTooltip = `Report received on ${mis.returnDate.displayString}`;
                    ret.statusLabel = `Report ready`;
                    ret.statusTooltip = `The report for this mission is ready for you to review.`;
                    ret.statusIcon = GuildApp.ICONS.mission.returned;
                    break;
                case "ongoing": 
                    ret.durLabel = `~ ${mis.estimatedReturnDate.displayString}`;
                    ret.durTooltip = `Expected to return by ${mis.estimatedReturnDate.displayString}`;
                    ret.statusLabel = `Ongoing`;
                    ret.statusTooltip = `Currently still ongoing`;
                    ret.statusIcon = GuildApp.ICONS.mission.ongoing;
                    break;
                case "ready": 
                    ret.assigned = assigned;
                    ret.durLabel = `~ ${mis.estimatedDurationInDays} days`;
                    ret.durTooltip = `Estimated duration: ${mis.estimatedDurationInDays} days`;
                    ret.statusLabel = `Ready`;
                    ret.statusTooltip = `Ready to start`;
                    ret.statusIcon = GuildApp.ICONS.mission.ready;
                    break;
                case "none":
                    ret.assigned = assigned;
                    ret.durLabel = `~ ${mis.estimatedDurationInDays} days`;
                    ret.durTooltip = `Estimated duration: ${mis.estimatedDurationInDays} days`;
                    ret.statusLabel = ``;
                    ret.statusTooltip = `To start this mission, assign at least ${Mission.CONFIG.minAdventurers} adventurers to it.`;
                    ret.statusIcon = GuildApp.ICONS.mission.none;
                    break;
            }

            return ret;
        }
        //show estimated time if the mission hasn't returned yet
        
        return {
            id: mis.id,
            name: mis.name,
            description: mis.description,
            stateVars: getStateVars(),
            hasReturned: mis.hasReturned,
            durationInDays: mis.durationInDays,
            state: mis.state,
            risk: mis.risk,
            reward: GuildApp._getMissionRewardsHTMLString(mis),
            dcDataRaw,
            daysUntilReturn: mis.daysUntilReturn > 0 ? mis.daysUntilReturn : null,
            results: mis.results,
            assigned,
            missionButton
        }
    }
    //#endregion

    static ICONS = {
        edit: "fa-solid fa-pen-to-square",
        delete: "fa-solid fa-trash",
        mission: {
            logged: "fa-solid fa-book",
            returned: "fa-solid fa-book-open",
            ongoing: "fa-solid fa-route",
            ready: "fa-solid fa-clipboard-list",
            none: "fa-regular fa-clipboard",
            unassignAll: "fa-solid fa-users-slash",
            returnNow: "fa-solid fa-forward-fast",
        },
        adventurer: {
            unassign: "fa-solid fa-user-minus",
            revive: "fa-solid fa-heart-pulse",
            dead: "fa-solid fa-skull",
        }
    }

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
            b._deathDate.inDays - a._deathDate.inDays // Sort descending, most recent deaths first
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
        const currentLevel = adv.level;
        const currentExp = adv.exp;
        const nextLevelObj = Adventurer.CONFIG.levels[currentLevel + 1];
        
        const nextLevelTooltip = nextLevelObj 
            ? `${currentExp}/${nextLevelObj.expMin} exp`
            : "max";

        const level = {
            current: adv.level,
            explanation: "Each level grants a +1 bonus to all checks.",
        }

        const exp = {
            current: adv.exp,
            forNext: nextLevelObj?.expMin ?? "max",
            explanation: "Each successful mission and each natural 20 grant +1 exp."
        }

        const cssClassesArray = [];
        if(adv.isDead || adv.state === "away") cssClassesArray.push("collapsed");
        
        return {
            id: adv.id,
            name: adv.name,
            img: adv.img,
            description: adv.description,
            state: Adventurer.CONFIG.states[adv.state],
            exp,
            level,
            assignedMission: adv.assignedMission,
            deathDate: adv.deathDate ? adv.deathDate.displayString : "",
            attributes: Object.values(adv.attributes),
            cssClasses: cssClassesArray.join(" "),
        }
    }

    //#endregion


    //#region Mission Context Menu
    _getMissionCardContextMenuItems() {
        const ic = GuildApp.ICONS;
        return [
            {
                name: "Unassign All Adventurers",
                icon: `<i class="${ic.mission.unassignAll}"></i>`,
                condition: (jq) => {
                    const mission = this._getMissionFromJQ(jq);
                    return !!mission.assignedAdventurers.size && !mission.hasStarted;
                },
                callback: this._onUnassignAll.bind(this)
            },
            {
                name: "(GM) Edit",
                icon: `<i class="${ic.edit}"></i>`,
                condition: (jq) => game.user.isGM,
                callback: this._onEditMission.bind(this)
            },
            {
                name: "(GM) Delete",
                icon: `<i class="${ic.delete}"></i>`,
                condition: (jq) => game.user.isGM,
                callback: this._onDeleteMission.bind(this)
            },
            {
                name: "(GM) Return Now",
                icon: `<i class="${ic.mission.returnNow}"></i>`,
                condition: (jq) => {
                    const mission = this._getMissionFromJQ(jq);
                    return game.user.isGM && !!mission.hasStarted && !mission.hasReturned
                },
                callback: this._onForceReturn.bind(this)
            },
        ];
    }

    /** 
     * @param {JQuery} jq  
     * @returns {Mission}
     */
    _getMissionFromJQ(jq) {
        const card = jq.closest(".mission-card")[0];
        const id = card.dataset.missionId;
        return this.guild.missions.get(id);
    }

    async _onUnassignAll(jq) {
        const mission = this._getMissionFromJQ(jq);
        await mission.unassignAll();
    }

    async _onEditMission(jq) {
        const mission = this._getMissionFromJQ(jq);
        await mission.edit();
    }

    async _onDeleteMission(jq) {
        const mission = this._getMissionFromJQ(jq);
        await mission.delete();
    }

    async _onForceReturn(jq) {
        const mission = this._getMissionFromJQ(jq);
        await mission.update({returnDate: TaliaDate.now()});
    }

    //#endregion

    //#region Adventurer Context Menu

    _getAdventurerCardContextMenuItems() {
        const ic = GuildApp.ICONS;
        return [
            {
                name: "Unassign",
                icon: `<i class="${ic.adventurer.unassign}"></i>`,
                condition: (jq) => {
                    const adv = this._getAdventurerFromJQ(jq);
                    return adv.state === "assigned"
                },
                callback: this._onUnassignAdventurer.bind(this)
            },
            {
                name: "(GM) Edit",
                icon: `<i class="${ic.edit}"></i>`,
                condition: (jq) => game.user.isGM,
                callback: this._onEditAdventurer.bind(this)
            },
            {
                name: "(GM) Delete",
                icon: `<i class="${ic.delete}"></i>`,
                condition: (jq) => game.user.isGM,
                callback: this._onDeleteAdventurer.bind(this)
            },
            {
                name: "(GM) Revive",
                icon: `<i class="${ic.adventurer.revive}"></i>`,
                condition: (jq) => {
                    const adv = this._getAdventurerFromJQ(jq);
                    return game.user.isGM && adv.isDead
                },
                callback: this._onReviveAdventurer.bind(this)
            },
            {
                name: "(GM) Kill",
                icon: `<i class="${ic.adventurer.dead}"></i>`,
                condition: (jq) => {
                    const adv = this._getAdventurerFromJQ(jq);
                    return game.user.isGM && adv.state === "waiting"
                },
                callback: this._onKillAdventurer.bind(this)
            },
        ]
    }

    async _onEditAdventurer(jq) {
        const adventurer = this._getAdventurerFromJQ(jq);
        await adventurer.edit();
    }

    async _onDeleteAdventurer(jq) {
        const adventurer = this._getAdventurerFromJQ(jq);
        await adventurer.delete();
    }

    async _onUnassignAdventurer(jq) {
        const adventurer = this._getAdventurerFromJQ(jq);
        await adventurer.unassign();
    }

    async _onReviveAdventurer(jq) {
        const adventurer = this._getAdventurerFromJQ(jq);
        await adventurer.revive();
    }

    async _onKillAdventurer(jq) {
        const adventurer = this._getAdventurerFromJQ(jq);
        await adventurer.kill();
    }

    /** 
     * @param {JQuery} jq  
     * @returns {Adventurer}
     */
    _getAdventurerFromJQ(jq) {
        const card = jq.closest(".adventurer-card")[0];
        const id = card.dataset.adventurerId;
        return this.guild.adventurers.get(id);
    }

    //#endregion
}
