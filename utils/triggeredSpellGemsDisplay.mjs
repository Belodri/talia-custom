import { TaliaCustomAPI } from "../scripts/api.mjs";
import { MODULE } from "../scripts/constants.mjs";

export default {
    register() {
        Hooks.on("getSceneControlButtons", (controls) => {
            const bar = controls.find(c => c.name === "token");
            bar.tools.push({
                name: "trigger-gem-display",
                title: "Spell Gem Triggers",
                icon: "fas fa-gem",
                visible: game.user.isGM,
                onClick: async () => GemDisplay.toggleDisplay(),
                button: true
            });
        });

        Hooks.once("ready", () => {
            if(!game.user.isGM) return;
            GemDisplay.init();
        });
    }
}

class GemDisplay {
    /** An object with actor names as keys, and a collection of item uuids with their respective items as values*/
    static itemLog = {};

    static displayOptions = {
        anchorId: "hotbar",
        styles: {
            position: "absolute",
            bottom: 0,
            left: "610px",
            display: 'inline-block',
            "padding-inline": '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            borderRadius: '10px',
            marginLeft: '10px',
        },
    }

    static element = null;

    static init() {
        GemDisplay.initPlayerChars();
        GemDisplay.registerHooks();
        GemDisplay.initDisplay();
    }

    static initPlayerChars() {
        for(const player of game.users.players) {
            const actor = player.character;
            if(actor.type !== "character") continue;

            GemDisplay.itemLog[actor.name] = new foundry.utils.Collection();

            actor.itemTypes.consumable
                .filter(i => i.system.type.value === "spellGem" && i.system.equipped && i.name.startsWith("Triggered"))
                .forEach(i => GemDisplay.addItem(i));
        }
    }

    static registerHooks() {
        Hooks.on("updateItem", (item, data, options, userId) => {
            const equipped = data.system?.equipped;
            if(typeof equipped !== "boolean") return;

            if(equipped === true ) GemDisplay.addItem(item);
            else if(equipped === false) GemDisplay.removeItem(item);

            GemDisplay.updateText();
        });

        Hooks.on("deleteItem", (item, options, userId) => {
            if(GemDisplay.itemLog[item.actor.name]) {
                GemDisplay.removeItem();
                GemDisplay.updateText();
            }
        });
    }

    static initDisplay() {
        const opts = GemDisplay.displayOptions;

        // Find the anchor element
        const anchorElement = document.getElementById(opts.anchorId);
        if (!anchorElement) {
            console.error(`Element with id "${opts.anchorId}" not found`);
            return;
        }

        // Create the element div
        GemDisplay.element = document.createElement('div');
        
        // Apply all styles
        Object.assign(GemDisplay.element.style, opts.styles);

        // Insert after the anchor element
        if (anchorElement.nextSibling) {
            anchorElement.parentNode.insertBefore(GemDisplay.element, anchorElement.nextSibling);
        } else {
            anchorElement.parentNode.appendChild(GemDisplay.element);
        }

        GemDisplay.updateText();
    }

    static toggleDisplay() {
        if (GemDisplay.element.style.display === "none") {
            GemDisplay.element.style.display = "block";
        } else {
            GemDisplay.element.style.display = "none";
        }
    }

    static addItem(item) { GemDisplay.itemLog[item.actor.name].set(item.uuid, item) }

    static removeItem(item) { GemDisplay.itemLog[item.actor.name]?.delete(item.uuid) }

    static updateText() {
        if (GemDisplay.element) {
            GemDisplay.element.innerHTML = GemDisplay.getDisplayText();
        }
    }

    static getDisplayText() {
        const htmlString = Object.entries(GemDisplay.itemLog)
            .reduce((acc, [actorName, itemCollection]) => {
                if(!itemCollection.size) {
                    return acc;
                }

                const firstName = actorName.split(" ")[0];
                const firstPart = `${firstName}(${itemCollection.size})`;

                let secondPart = "";
                if(itemCollection.size === 1) {
                    const item = itemCollection.contents[0];
                    secondPart = `: ${GemDisplay._getItemString(item)}`
                }

                acc += `<p>${firstPart}${secondPart}</p>`;
                return acc;
            }, "");
        return htmlString || "<p>None</p>";
    }

    static _getItemString(item) {
        const htmlString = item.system.description.value;
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, "text/html");

        // Select the second row of the table (tbody > tr:nth-of-type(2))
        const secondRow = doc.querySelector("table tbody tr:nth-of-type(2)");
        
        let triggerCond = "";
        // Extract the text from the <p> tag inside the second row's <td>
        if (secondRow) {
            const paragraph = secondRow.querySelector("td p");
            triggerCond = paragraph ? paragraph.textContent.trim() : "No trigger";
        }

        const trimmedName = item.name.replace("Triggered: ", "");
        return `${trimmedName} ["${triggerCond}"]`;
    }
}
