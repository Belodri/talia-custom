import { MODULE } from "../../scripts/constants.mjs";
import TaliaDate from "../../utils/TaliaDate.mjs";

const {HandlebarsApplicationMixin, DocumentSheetV2} = foundry.applications.api;
export default class GuildApp extends HandlebarsApplicationMixin(DocumentSheetV2) {

    /**
     * 
     * @param {Guild} guild 
     * @param {object} [options] 
     */
    constructor(guild, options = {}) {
        super({...options, document: guild.parent, guild: guild});
        this.guild = guild;
    }

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
        }
    }

    static PARTS = {
        header: { template: `modules/${MODULE.ID}/templates/guildTemplates/header.hbs` },
        navigation: { template: `modules/${MODULE.ID}/templates/guildTemplates/navigation.hbs` },
        general: { template: `modules/${MODULE.ID}/templates/guildTemplates/general.hbs` },
        missions: { template: `modules/${MODULE.ID}/templates/guildTemplates/missions.hbs`, scrollable: [""] },
        adventurers: { template: `modules/${MODULE.ID}/templates/guildTemplates/adventurers.hbs`, scrollable: [""] },
        graveyard: { template: `modules/${MODULE.ID}/templates/guildTemplates/graveyard.hbs`, scrollable: [""] },
        log: { template: `modules/${MODULE.ID}/templates/guildTemplates/log.hbs`, scrollable: [""] }
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
        return {flags: { [MODULE.ID]: { Guild: this.settlement.toObject() }}};
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

    async _prepareContext(options) {
        const tabs = {
            general: { label: "Guild" },
            graveyard: { label: "Graveyard" },
            log: { label: "Mission Log" },
        };
        for (const [k, v] of Object.entries(tabs)) {
            v.cssClass = (this.tabGroups.main === k) ? "active" : "";
            v.id = k;
        }

        const context = {};
        const guild = this.guild;
        const source = guild.toObject();
        const isGM = game.user.isGM;

        const makeField = (path, options = {}) => {
            const field = guild.schema.getField(path);
            const value = foundry.utils.getProperty(source, path);

            return {
                field: field,
                value: value,
                ...options
            };
        };

        const fields = {};
        //fields.unlocked = makeField("unlocked");

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

    _prepareMissionsContext() {
        const getSortPriority = (mission) => {
            if (mission.hasReturned) return 0;           // Returned missions first
            if (!mission.hasStarted) return 1;           // Not started missions second
            return 2;                                    // Started missions last
        };

        // prepare and filter missions
        const filtered = Object.values(guild.missions)
            .reduce((acc, mis) => {
                const misObj = this._prepareMission(mis);
                if(mis.isOver) acc.logged.push(misObj);
                else acc.active.push(misObj);
                return acc;
            }, { active: [], logged: []});

        filtered.active.sort((a, b) => {
            const priorityA = getSortPriority(a);
            const priorityB = getSortPriority(b);

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }

            // For started missions, sort by daysUntilReturn (ascending)
            if (priorityA === 2) {
                return a.daysUntilReturn - b.daysUntilReturn;
            }

            return 0; // Keep order if in the same category without further sorting
        });

        filtered.logged.sort((a, b) => b.finishDate.inDays - a.finishDate.inDays );

        return filtered;
    }

    _prepareAdventurersContext() {
        const filtered = Object.values(guild._adventurers)
            .reduce((acc, adv) => {
                const advObj = this._prepareAdventurer(adv);
                if(adv.isDead) acc.dead.push(advObj);
                else acc.alive.push(advObj);
                return acc;
            }, { alive: [], dead: [] });

        filtered.alive.sort((a, b) => (a.isAssigned - b.isAssigned)             // Sort by isAssigned (false before true)
            || a.name.localeCompare(b.name, "en"));                             // Then by name

        filtered.dead.sort((a, b) => b._deathTimestamp - a._deathTimestamp )    // Sort descending, most recent deaths first

        return filtered;
    }

    //#endregion

    //#region ContextMenu
    _getMissionCardContextMenuItems() {
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
