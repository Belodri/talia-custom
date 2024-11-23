import { TaliaCustomAPI } from "../scripts/api.mjs";

export default {
    register() {
        TaliaCustomAPI.add({arcaneGate: arcaneGateRegionScript}, "RegionMacros");
    }
}

//script attached to region placed by the spell
//called from region behavior, execute script

/**
 *
 */
async function arcaneGateRegionScript(region, scene) {
    if(!region.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)) return;
    const itemUuid = region.getFlag("region-attacher", "itemUuid");
    if(!itemUuid) return;

    const gatesRegionsArray = scene.regions?.filter(r => r.getFlag("region-attacher", "itemUuid") === itemUuid) ?? [];

    if(gatesRegionsArray.length !== 2) return ui.notifications.info("You need to place exactly two gates.");

    const teleportBehaviorsArray = gatesRegionsArray.map(r => r.behaviors.find(b => b.type === "teleportToken"));

    await gatesRegionsArray[0].updateEmbeddedDocuments("RegionBehavior", [{_id: teleportBehaviorsArray[0].id, "system.destination": gatesRegionsArray[1].uuid}]);
    await gatesRegionsArray[1].updateEmbeddedDocuments("RegionBehavior", [{_id: teleportBehaviorsArray[1].id, "system.destination": gatesRegionsArray[0].uuid}]);
}
