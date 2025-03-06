import { MODULE } from "../../scripts/constants.mjs";
import TaliaDate from "../../utils/TaliaDate.mjs";
import Mission from "./mission.mjs";
import Adventurer from "./adventurer.mjs";
import Guild from "./guild.mjs";

const {HandlebarsApplicationMixin, DocumentSheetV2} = foundry.applications.api;
export default class GuildApp extends HandlebarsApplicationMixin(DocumentSheetV2) {
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
            waiting: "fa-regular fa-user",
            assigned: "fa-solid fa-user-check",
        }
    }

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

        const adv = this.guild.adventurers.get(dragData.adventurerId);
        if(adv.hidden || adv.assigned || adv.dead) return;

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
            contentClasses: ["standard-form"],
            height: "1000px",
            width: "1500px",
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
            createRandomAdventurer: GuildApp.#createRandomAdventurer,
        },
        dragDrop: [{ dragSelector: '[data-drag]', dropSelector: '[data-drop]' }],
    }

    static PARTS = {
        header: { template: `modules/${MODULE.ID}/templates/guildTemplates/header.hbs` },
        navigation: { template: `modules/${MODULE.ID}/templates/guildTemplates/navigation.hbs` },
        general: { template: `modules/${MODULE.ID}/templates/guildTemplates/general.hbs`, scrollable: [""]},
        log: { template: `modules/${MODULE.ID}/templates/guildTemplates/log.hbs`, scrollable: [""] },
        graveyard: { template: `modules/${MODULE.ID}/templates/guildTemplates/graveyard.hbs`, scrollable: [""] },
        gmtab: { template: `modules/${MODULE.ID}/templates/guildTemplates/gmTab.hbs`, scrollable: [""] }
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

        //this.guild.validate({changes: submitData, clean: true, fallback: false});
        //this.guild.updateSource(submitData);
        //return {flags: { [MODULE.ID]: { Guild: this.guild.toObject() }}};
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

    static async #createRandomAdventurer(event, target) {
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

    async _prepareContext(options) {
        // prepare tabs
        const tabs = {
            general: { label: "Guild Hall" },
            log: { label: "Mission Log" },        
            graveyard: { label: "Graveyard" },
        };
        if(game.user.isGM) tabs.gmtab = { label: "GM Tab" }

        for (const [k, v] of Object.entries(tabs)) {
            v.cssClass = (this.tabGroups.main === k) ? "active" : "";
            v.id = k;
        }

        const missions = this.guild.missions
            .map(mis => this.#prepareMissionContext(mis))
            .sort((a, b) => {   //Sort order: returned -> ready/none -> others
                const getPrio = (mis) => mis.hasReturned ? 1
                    : mis.hasStarted ? -1 : 0;
                return getPrio(b.mission) - getPrio(a.mission);
            });
        
        const adventurers = this.guild.adventurers
            .map(adv => this.#prepareAdventurerContext(adv))
            .sort((a, b) => {   //Sort order: away last, others by name
                const aPrio = a.adventurer.status === "away" ? -1 : 0;
                const bPrio = b.adventurer.status === "away" ? -1 : 0;
                return aPrio === bPrio
                    ? a.adventurer.name.localeCompare(b.adventurer.name)
                    :  bPrio - aPrio
            });

        return {
            tabs,
            missions,
            adventurers,
            isGM: game.user.isGM,
            source: this.guild.toObject(),
            guild: this.guild
        };
    }

    //#endregion

    //#region Mission Context

    /**
     * @param {Mission} mission 
     */
    #prepareMissionContext(mission) {
        const context = {};

        context.config = {
            mission: Mission.CONFIG,
            adventurer: Adventurer.CONFIG,
        }

        context.assignmentContext = {
            count: mission._assignedAdventurerIds.size,
            max: Mission.CONFIG.maxAdventurers,
            tooltip: `Each mission must have between ${Mission.CONFIG.minAdventurers} and ${Mission.CONFIG.maxAdventurers} adventurers.`,
        };
        
        switch (mission.state.key) {
            case "logged":  
                context.duration = {
                    title: `Duration`,
                    label: `${mission.duration.total} days`,
                    tooltip: `Report received on ${mission.returnDate.displayString}`,
                };
                context.status = {
                    tooltip: `The report has been reviewed and archived.`,
                    label: "Status: Archived",
                    icon: GuildApp.ICONS.mission.logged,
                };
                break;

            case "returned": 
                context.button = {
                    action: "finishMission",
                    label: "Receive Mission Report",
                };
                context.duration = {
                    title: `Duration`,
                    label: `${mission.duration.total} days`,
                    tooltip: `Report received on ${mission.returnDate.displayString}`,
                };
                context.status = {
                    tooltip: `A report has been received and is ready for review.`,
                    label: "Status: Report received",
                    icon: GuildApp.ICONS.mission.returned,
                };
                break;

            case "ongoing": 
                context.duration = {
                    title: `Est. Return`,
                    label: `${mission.estimated.remaining} days`,
                    tooltip: `Expected to return by ${mission.estimated.returnDate.displayString}`,
                };
                context.status = {
                    tooltip: `Assumed to be ongoing until a report has been received.`,
                    label: "Status: Ongoing",
                    icon: GuildApp.ICONS.mission.ongoing,
                };
                break;

            case "ready": 
                context.button = {
                    action: "startMission",
                    label: "Start Mission",
                };
                context.duration = {
                    title: "Est. Duration",
                    label: `${mission.estimated.durationInDays} days`,
                    tooltip: `Estimated to take ${mission.estimated.durationInDays} days.`,
                };
                context.status = {
                    tooltip: `The party is ready to venture out.`,
                    label: "Status: Ready",
                    icon: GuildApp.ICONS.mission.ready,
                };
                break;

            case "none":
            default: 
                context.duration = {
                    title: "Est. Duration",
                    label: `${mission.estimated.durationInDays} days`,
                    tooltip: `Estimated to take ${mission.estimated.durationInDays} days.`,
                };
                context.status = {
                    tooltip: `The guild has received a request for help.`,
                    label: "Status: Open",
                    icon: GuildApp.ICONS.mission.none,
                };
                break;
        }

        return { mission, context }
    }
    //#endregion

    //#region Adventurer Context

    /** @param {Adventurer} adv  */
    #prepareAdventurerContext(adv) {
        const context = {};
        
        switch (adv.state) {
            case "dead":
                context.status = {
                    label: "Dead",
                    icon: GuildApp.ICONS.adventurer.dead,
                    tooltip: `Reported dead on ${adv.deathDate.displayString}`
                }

                break;

            case "away":
                context.status = {
                    label: "On Mission",
                    icon: GuildApp.ICONS.mission.ongoing,
                    tooltip: `Currently away on mission "${adv.assignedMission.name}"`
                }
                context.defaultCollapse = true;
                break;

            case "assigned":
                context.status = {
                    label: "Ready",
                    icon: GuildApp.ICONS.adventurer.assigned,
                    tooltip: `Assigned to mission "${adv.assignedMission.name}"`
                }
                context.defaultCollapse = true;
                break;

            case "waiting":
            default:
                context.status = {
                    label: "Waiting",
                    icon: GuildApp.ICONS.adventurer.waiting,
                    tooltip: `Waiting for assignment.`
                }

                break;
        }

        return { adventurer: adv, context };
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
                    const mission = this.misJQ(jq);
                    return !!mission.assignedAdventurers.size && !mission.hasStarted;
                },
                callback: (jq) => this.misJQ(jq).unassignAll()
            },
            {
                name: "(GM) Edit",
                icon: `<i class="${ic.edit}"></i>`,
                condition: (jq) => game.user.isGM,
                callback: (jq) => this.misJQ(jq).edit()
            },
            {
                name: "(GM) Delete",
                icon: `<i class="${ic.delete}"></i>`,
                condition: (jq) => game.user.isGM,
                callback: (jq) => this.misJQ(jq).delete()
            },
            {
                name: "(GM) Return Now",
                icon: `<i class="${ic.mission.returnNow}"></i>`,
                condition: (jq) => {
                    const mission = this.misJQ(jq);
                    return game.user.isGM && !!mission.hasStarted && !mission.hasReturned
                },
                callback: (jq) => this.misJQ(jq).update({returnDate: TaliaDate.now()})
            },
            {
                name: "(GM) Display Report",
                icon: `<i class="fa-solid fa-book-bookmark"></i>`,
                condition: (jq) => game.user.isGM 
                    && this.misJQ(jq).hasStarted,
                callback: (jq) => this.misJQ(jq).displaySummaryMessage()
            },
            {
                name: "(GM) Display Rolls",
                icon: `<i class="fa-solid fa-dice-d20"></i>`,
                condition: (jq) => game.user.isGM 
                    && this.misJQ(jq).hasStarted,
                callback: (jq) => this.misJQ(jq).displayRolls()
            }, {
                name: "(GM) Toggle Hidden",
                icon: `<i class="fa-regular fa-eye-slash"></i>`,
                condition: (jq) => game.user.isGM && !this.misJQ(jq).assignedAdventurers.size,
                callback: (jq) => this.misJQ(jq).toggleHidden()
            }
        ];
    }

    /** 
     * @param {JQuery} jq  
     * @returns {Mission}
     */
    misJQ(jq) {
        const card = jq.closest(".mission-card")[0];
        return this.guild.missions.get(card.dataset.missionId);
    }

    //#endregion

    //#region Adventurer Context Menu

    _getAdventurerCardContextMenuItems() {
        const ic = GuildApp.ICONS;
        return [
            {
                name: "Unassign",
                icon: `<i class="${ic.adventurer.unassign}"></i>`,
                condition: (jq) => this.advJQ(jq).state === "assigned",
                callback: (jq) => this.advJQ(jq).unassign()
            },
            {
                name: "(GM) Edit",
                icon: `<i class="${ic.edit}"></i>`,
                condition: (jq) => game.user.isGM,
                callback: (jq) => this.advJQ(jq).edit()
            },
            {
                name: "(GM) Delete",
                icon: `<i class="${ic.delete}"></i>`,
                condition: (jq) => game.user.isGM,
                callback: (jq) => this.advJQ(jq).delete()
            },
            {
                name: "(GM) Revive",
                icon: `<i class="${ic.adventurer.revive}"></i>`,
                condition: (jq) => game.user.isGM 
                    && this.advJQ(jq).isDead,
                callback: (jq) => this.advJQ(jq).revive()
            },
            {
                name: "(GM) Kill",
                icon: `<i class="${ic.adventurer.dead}"></i>`,
                condition: (jq) => game.user.isGM 
                    && this.advJQ(jq).state === "waiting",
                callback: (jq) => this.advJQ(jq).kill()
            },
            {
                name: "(GM) Toggle Hidden",
                icon: `<i class="fa-regular fa-eye-slash"></i>`,
                condition: (jq) => game.user.isGM 
                    && ["waiting", "dead"].includes(this.advJQ(jq).state),
                callback: (jq) => this.advJQ(jq).toggleHidden()
            }
        ]
    }

    /** 
     * @param {JQuery} jq  
     * @returns {Adventurer}
     */
    advJQ(jq) {
        const card = jq.closest(".adventurer-card")[0];
        return this.guild.adventurers.get(card.dataset.adventurerId);
    }

    //#endregion
}
