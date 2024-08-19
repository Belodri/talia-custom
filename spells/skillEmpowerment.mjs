import { TaliaCustomAPI } from "../scripts/api.mjs";

export default {
    register() {
        TaliaCustomAPI.add({skillEmpowerment}, "ItemMacros");
    }
}

async function skillEmpowerment(item) {
    const targetActor = game.user.targets.first()?.actor;
    const effect = item.effects?.contents[0];
    if(!targetActor || !effect) return false;

    const chosenSkillId = await chooseSkillDialog(targetActor);
    if(!chosenSkillId) return false;

    //figure out if it's a skill or a tool
    const isSkill = Object.keys(CONFIG.DND5E.skills).includes(chosenSkillId);

    //effect changes
    const changes = [{
        key: isSkill ? `system.skills.${chosenSkillId}.value` : `system.tools.${chosenSkillId}.prof`,
        mode: isSkill ? 4 : 0,
        priority: 20,
        value: "2"
    }];

    //effect description
    const label =  isSkill ? CONFIG.DND5E.skills[chosenSkillId]?.label : dnd5e.documents.Trait.keyLabel(`tool:${chosenSkillId}`);
    const newDesc = `For the duration of this spell you double your proficiency bonus when making ${label} checks.`;

    const retEff = await effect.update({"description": newDesc, "changes": changes});
    if(!retEff) return false;

    return true;
}

async function chooseSkillDialog(actor) {
    //check skills and tools

    // Get array of keys for the skills and tools the actor is proficient with
    const options = [
        ...Object.entries(actor.system.skills).filter(([key, value]) => value.proficient === 1),
        ...Object.entries(actor.system.tools).filter(([key, value]) => value.value === 1)
    ]
    .reduce((acc, [key, value]) => {
        const label =  CONFIG.DND5E.skills[key]?.label ?? dnd5e.documents.Trait.keyLabel(`tool:${key}`);
        return acc += `<option value="${key}">${label}</option>`;
    }, "");
    const content = `<form>
        <div class="form-group">
            <label>Select a skill the target is proficient in.</label>
            <div class="form-fields">
                <select name="chosen">${options}</select>
            </div>
        </div>
    </form>`;

    const choice = await Dialog.prompt({
        title: "Skill Empowerment",
        content: content,
        callback: ([html]) => new FormDataExtended(html.querySelector("form")).object,
        rejectClose: false
    });
    return choice?.chosen;
}