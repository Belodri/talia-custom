import { TaliaCustomAPI } from "../../../scripts/api.mjs";

export default {
    register() {
        TaliaCustomAPI.add({breathOfTheDragon: breathOfTheDragonDialog}, "ItemMacros")
    }
}

async function breathOfTheDragonDialog(item) {
    const kiItem = item.actor.items.get(item.system.consume.target);
    
    const damageTypes = ['acid', 'cold', 'fire', 'lightning', 'poison'];

    const content = `
        <form>
            <div class="form-group">
                <label>Shape</label>
                <div class="form-fields">
                    <select name="shape">
                        <option value="line">Line</option>
                        <option value="cone">Cone</option>
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>Consume</label>
                <div class="form-fields">
                    <select name="consume">
                        <option value="uses">Uses (${item.system.uses.value}/${item.system.uses.max}</option>
                        <option value="ki">${item.system.consume.amount} Ki (${kiItem.system.uses.value}/${kiItem.system.uses.max})</option>
                    </select>
                </div>
            </div>
        </form>`;

    const buttons = {};
    for(const type of damageTypes) {
        buttons[type] = {
            label: CONFIG.DND5E.damageTypes[type].label,
            callback: ([html]) => {
                return { 
                    ...new FormDataExtended(html.querySelector("form")).object,
                    damageType: type
                }
            }
        }
    }

    const choices = await Dialog.wait({
        title: item.name,
        content,
        buttons,
        close: () => null
    });
    if(!choices) return false;

    const itemSystem = {
        target: {
            type: choices.shape,
            value: choices.shape === "line" ? 30 : 20,
            width: choices.shape === "line" ? 5 : null,
        },
        damage: {
            parts: [[item.system.damage.parts[0][0], choices.damageType]],
        }
    }

    await item.actor.updateEmbeddedDocuments("Item", [{_id: item._id, "system": itemSystem}]);

    const config = {
        consumeUsage: choices.consume === "uses" ? true : null,
        consumeResource: choices.consume === "uses" ? null : true
    }
    const options = {
        skipItemMacro: true, 
        configureDialog: false,
        flags: {
            "dnd5e.use.consumedUsage": true,
            "dnd5e.use.consumedResource": true,
        }
    }

    return await item.use(config, options);
}