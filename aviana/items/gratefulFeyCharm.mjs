/*
    Wearing this charm grants you resistance to one type of damage while and making you vulnerable to another. Using your reaction, you can change one or both.

    Additionally, taking damage of a type you're vulnerable to from a hostile creature during combat lets you make one additional attack when you use the attack action on your following turn. This effect stacks.
*/

import { _foundryHelpers } from "../../scripts/_foundryHelpers.mjs";

export async function gratefulFeyCharm(item) {
    const damageTypeKeys = Object.keys(CONFIG.DND5E.damageTypes);
    const choice = await userChosenTypes(damageTypeKeys);

    const newChanges = [
        {
            key: `system.traits.dr.value`,
            mode: 2,
            priority: 20,
            value: `${choice.chosenResist}`
        },
        {
            key: `system.traits.dv.value`,
            mode: 2,
            priority: 20,
            value: `${choice.chosenVuln}`
        }  
    ];
    const newDescription = `<p>Grants resistance to ${choice.chosenResist} damage and vulnerability to ${choice.chosenVuln} damage.</p>`;

    const itemEffect = item.effects.getName(item.name);
    await itemEffect.update({changes: newChanges, description: newDescription});

    ui.notifications.info(`Resistance: ${choice.chosenResist} </br> Vulnerability: ${choice.chosenVuln}`);
    _foundryHelpers.displayItemWithoutEffects(item);
}

/**
 * 
 * @param {string[]} damageTypeKeys 
 * @returns {object} choice
 * @returns {string} choice.chosenResist
 * @returns {string} choice.chosenVuln
 */
async function userChosenTypes(damageTypeKeys) {
    const options = damageTypeKeys.reduce((acc, e) => acc += `<option value="${e}">${CONFIG.DND5E.damageTypes[e].label}</option>`,"");
 
    const content =  `<form>
                        <div class="form-group">
                            <label>Resistance: </label>
                            <div class="form-fields">
                                <select name="chosenResist">${options}</select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Vulnerable: </label>
                            <div class="form-fields">
                                <select name="chosenVuln">${options}</select>
                            </div>
                        </div>
                    </form>`;

    const choice = await Dialog.prompt({
        title: "Fey Charm",
        content: content,
        callback: ([html]) => new FormDataExtended(html.querySelector("form")).object,
        rejectClose: false
    });
    return choice;
}