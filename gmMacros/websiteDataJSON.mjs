import { TaliaCustomAPI } from "../scripts/api.mjs";
import TaliaDate from "../utils/TaliaDate.mjs";
import Settlement from "../world/settlement/settlement.mjs";
export default {
    register() {
        TaliaCustomAPI.add({websiteDataJSON}, "GmMacros");
    }
}

function getItemData(item) {
    const physicalItemTypes = ["consumable", "container", "equipment", "loot", "tool", "weapon"];

    if(item.type === "feat") return _getFeatItemData(item);
    if(item.type === "spell") return _getSpellItemData(item);
    if(physicalItemTypes.includes(item.type)) {
        return _getPhysicalItemData(item);
    }
}

function _getSpellItemData(item) {
    return {
        name: item.name,
        section: "spell-items",
        description: item.system.description.value,
        spellLevel: item.labels.level,
        spellRange: item.labels.range,
        spellSchool: item.labels.school,
    }
}

function _getFeatItemData(item) {
    return {
        name: item.name,
        section: "feature-items",
        description: item.system.description.value,
        requirements: item.system.requirements,
    }
}

function _getPhysicalItemData(item) {
    const combinedLabel = item.system.type?.label
        ? item.system.type?.subtype
            ? `${item.system.type.label} (${item.system.type.subtype})`
            : item.system.type.label
        : "Container";

    const attunementLabel = item.system.attunement === "required" 
        ? "Requires Attunement"
        : "";

    return {
        name: item.name,
        section: "physical-items",
        description: item.system.description.value,
        quantity: item.system.quantity,
        combinedLabel,
        attunementLabel
    }
}


async function websiteDataJSON() {
    if(!game.user.isGM) return;

    setTimeout(async() => {
        const exportData = {
            playerData: getActorItemsData(),
            settlementData: await getSettlementData("Promise"),
            ingameDate: TaliaDate.now().displayString,
        };

        const jsonString = JSON.stringify(exportData, null, 2);

        console.log(jsonString);

        try {
            await navigator.clipboard.writeText(jsonString);
            // eslint-disable-next-line no-alert
            alert("JSON copied to clipboard!");
        } catch (err) {
            console.error("Failed to copy: ", err);
        }

    }, 3000);
}

async function getSettlementData(settlementName) {
    const settlement = Settlement.getName(settlementName);
    if(!settlement) return;

    const app = settlement.app;
    const context = await app._prepareContext();


    const general = {
        name: settlementName,
        attributes: { ...settlement.attributes },
        capacity: { ...settlement.capacity },
    };

    const effects = context.effectsContext
        .filter(e => e.isActive)
        .map(e => ({
            endDateStr: e.endDateStr,
            flavorText: e.flavorText,
            grants: e.grants,
            isTemporary: e.isTemporary,
            name: e.name,
            remainingDays: e.remainingDays,
            section: "effect-items"
        }));
    
    const buildings = context.buildingsContext
        .map(b => ({
            constructionDateDisplay: b.constructionDateDisplay,
            effectText: b.effectText,
            flavorText: b.flavorText,
            grants: b.grants,
            name: b.name,
            isRecent: b.isRecent,
            requires: b.requires,
            scale: b.scale,
            section: "building-items"
        }));
    
    const settlementData = {
        general,
        effects,
        buildings,
    }
    
    return settlementData;
}

function getActorItemsData() {
    const pcNames = ["Aviana Winterwing", "Fearghas MacAllistar", "Plex", "Shalkoc Zornax"];
    const actorItems = {};

    for(const actorName of pcNames) {
        const workingActor = game.actors.getName(actorName, {strict: true});
        
        const itemsArray = [];
        workingActor.items.forEach(i => {
            const itemData = getItemData(i);
            if(itemData) {
                itemsArray.push(itemData);
            }
        });
        
        actorItems[actorName] = itemsArray;
    }

    return actorItems;
}

