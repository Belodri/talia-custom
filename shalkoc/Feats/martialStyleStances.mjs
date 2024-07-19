import { _foundryHelpers } from "../../scripts/_foundryHelpers.mjs";
import { TaliaCustomAPI } from "../../scripts/api.mjs";

export default {
    _onInit() {
        CONFIG.DND5E.featureTypes.class.subtypes.martialStyleStance = "Martial Style Stance";
    },
    _onSetup() {
        TaliaCustomAPI.add({
            activateMartialStyleStance
        });
    }
}
/*
    Item macro for feature "Shifting Stances"
    await TaliaCustom.activateMartialStyleStance(item);
 */
async function activateMartialStyleStance(item) {
    const actor = item.actor;
    const knownStances = actor.itemTypes.feat.filter(feat => feat.system?.type?.subtype === "martialStyleStance");
    const activeStances = actor.appliedEffects.filter(eff => knownStances.map(stance => stance.name).includes(eff.name));

    const activeStancesNames = activeStances.map(stance => stance.name);
    const availableStances = knownStances.filter(stance => !activeStancesNames.includes(stance.name));
    const options = availableStances.reduce((acc, cur) => acc += `<option value="${cur.name}">${cur.name}</option>`,"");

    const content = `<form>
        <div class="form-group">
            <label>Stance</label>
            <div class="form-fields">
                <select name="chosenStance">${options}</select>
            </div>
        </div>
    </form>`;

    const buttons = {
        stance: {
            label: `Enter Stance - 1 Ki`,
            callback: ([html]) => new FormDataExtended(html.querySelector("form")).object,
        }
    };

    if(activeStances.length !== 0) {
        buttons.stance.label = `Change Stance - 1 Ki`;
        buttons.noStance = {
            label: activeStances.length === 1 ? `Exit ${activeStances[0].name}` : `Exit all Stances`,
            callback: () => "noStance"
        }
    }

    const dialogOutput = await Dialog.wait({
        title: "Shifting Stances",
        content: content,
        buttons: buttons,
        close: () => null
    });

    if(dialogOutput === null) return;

    //display main item info
    await _foundryHelpers.displayItemInfoOnly(item);

    //consume ki if a stance was chosen
    if(dialogOutput !== "noStance") {
        //consume ki of the main feat
        const configuration = await dnd5e.applications.item.AbilityUseDialog.create(item, item._getUsageConfig());
        const ret = await item.consume(item, configuration, {});
        if(ret === false) return;   //return early if no ki is spent but it should have been consumed
    }

    //deactivate current stances
    const promises = [];
    for(const stance of activeStances) {
        promises.push(stance.update({disabled: true}));
    }
    await Promise.all(promises);

    //return here if noStance
    if(dialogOutput === "noStance") return;

    //switch to new stance and display it's info
    const stanceItem = knownStances.find(stance => stance.name === dialogOutput.chosenStance);
    const effect = stanceItem.effects.getName(stanceItem.name);

    await _foundryHelpers.displayItemInfoOnly(stanceItem);
    await effect?.update({disabled: false});
    ui.notifications.info(`You've adopted the ${stanceItem.name} stance.`);
}