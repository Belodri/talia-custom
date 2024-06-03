export function initCooking() {
    CONFIG.DND5E.lootTypes.spices = {label: "Spices"};
}
export function setupCooking() {
    Hooks.on("dnd5e.restCompleted", (actor, result) => {
        cookingMain(actor, result);
        console.log(actor, result);
    });
}

const allSpices = {
    "Chili Pepper": {
        "changes": [
            {
                "key": "system.attributes.init.bonus",
                "mode": 2,
                "value": "2",
                "priority": 20 
            }
        ],
        "description": "<p>+2 bonus to initiative rolls</p>",
    },
};

async function cookingMain(actor, result) {
    if(!result.longRest) return;
    if(!actor.name.includes("Shalkoc")) return;

    /** @type {Item5e[]} */
    const spices = actor.items.filter(i => i.system?.type?.value === 'spices');
    const chosenSpiceName = await userChosenSpice(spices);
    if(typeof chosenSpiceName !== 'string') return;

    const chosenSpice = spices.find(i => i.name === chosenSpiceName);

    const effect = getSpiceEffectData(chosenSpice);



    //get active users
    const users = game.users.filter(user => user.active && !user.isGM);


}


async function userChosenSpice(spices) {
    const options = spices.reduce((acc, e) => acc += `<option value="${e.name}">${e.name}</option>`,"");

   const content =  `<form>
                        <div class="form-group">
                            <label>Spices:</label>
                            <div class="form-fields">
                                <select name="chosen">${options}</select>
                            </div>
                        </div>
                    </form>`;

    const choice = await Dialog.prompt({
        title: "Select",
        content: content,
        callback: ([html]) => new FormDataExtended(html.querySelector("form")).object,
        rejectClose: false
    });
    return choice.chosen;
}



function getSpiceEffectData(spice) {
    thisSpice = allSpices[spice.name];
    const effData = {
        "icon": spice.img,
        "duration": {
            "rounds": null,
            "seconds": 86400,           
        },
        "disabled": false,
        "name": spice.name,
        "changes": thisSpice.changes,
        "description": thisSpice.description
    };
    return effData;
}




const effData = {
    "icon": "icons/svg/aura.svg",
    "origin": "Actor.9TajUYZuROcPzR4K",
    "duration": {
        "rounds": null,
        "startTime": null,
        "seconds": 86400,
        "combat": null,
        "turns": null,
        "startRound": null,
        "startTurn": null
    },
    "disabled": false,
    "name": "Black Pepper",
    "_id": "CTsCKVqSIPiYpDsU",
    "changes": [
        {
            "key": "system.attributes.init.bonus",
            "mode": 2,
            "value": "2",
            "priority": 20
        }
    ],
    "description": "<p>+2 bonus to initiative rolls</p>",
    "transfer": false,
    "statuses": [],
    "flags": {
        "dae": {
            "stackable": "multi",
            "specialDuration": [],
            "showIcon": false,
            "macroRepeat": "none"
        },
        "ActiveAuras": {
            "isAura": false,
            "aura": "None",
            "nameOverride": "",
            "radius": "",
            "alignment": "",
            "type": "",
            "customCheck": "",
            "ignoreSelf": false,
            "height": false,
            "hidden": false,
            "displayTemp": false,
            "hostile": false,
            "onlyOnce": false,
            "wallsBlock": "system"
        }
    },
    "tint": null
}


const data = await Dialog.prompt({
    title: "Example",
    content: `
        <form>
            <div class="form-group">
                <label for="exampleSelect">Example Select</label>
                <div class="form-fields">
                    <select name="exampleSelect">
                        <option value="option1">Option One</option>
                        <option value="option2">Option Two</option>
                        <option value="option3">Option Three</option>
                    </select>
                </div>
            </div>
        </form>
    `,
    callback: ([html]) => new FormDataExtended(html.querySelector("form")).object
});

const options = HandlebarsHelpers.selectOptions(spices, {hash:{"name"}});
const options = spices.reduce((acc, e) => acc+`<option value="${e.name}">${e.name}</option>`,"");