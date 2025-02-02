import { TaliaCustomAPI } from "../scripts/api.mjs";

export default {
    register() {
        TaliaCustomAPI.add({darknessRegion}, "RegionMacros");
    }
}

/** 
 * On Darkness spell or similar items, attach the template to a region via RegionAttacher.
 * Set a region behavior to "Execute Script" and subscribe to the events:
 * - "Region Boundary Changed"
 * - "Behavior Status Changed"
 * 
 * and call this script. (Don't forget to pass the required arguments!)
 */
async function darknessRegion({region, behavior, event}) {
    if(!game.user.isGM) return;

    if(event?.name === "behaviorStatus") {
        if(event.data.active === true) {
            //setTimeout to allow regionAttacher to set a flag on the template first.
            setTimeout(async () => {
                await createLight(region, event);
            }, 500);
        } else if( event.data.active === false) {
            await destroyLight(region);
        }
    }
    else if( event?.name === "regionBoundary" ) {
        await syncLightPosition(region);
    }
}

/** Creates a new light (if none already exists) and attaches it to the region. */
async function createLight(region, event) {
    const templateUuid = getTemplateUuid(region);
    if(!templateUuid) return;

    const existingLight = getLight(templateUuid);
    if( existingLight && !existingLight._destroyed ) return;

    const template = await fromUuid(templateUuid);
    if(!template?.t === "circle") return;

    const lightData = {
        config: {
            negative: true,
            dim: template.distance,
        },
        x: template.x,
        y: template.y,
        flags: {
            "talia-custom": {
                sourceTemplateUuid: templateUuid
            }
        }
    };

    return await template.parent.createEmbeddedDocuments("AmbientLight", [lightData]);
}

/** Destroys an existing light that's attached to the region */
async function destroyLight(region) {
    const templateUuid = getTemplateUuid(region);
    if(!templateUuid) return;

    const existingLight = getLight(templateUuid);
    if( !existingLight || existingLight._destroyed ) return;

    return await existingLight.delete();
}

/** Syncs the position of the light with the template */
async function syncLightPosition(region) {
    const template = await fromUuid( getTemplateUuid(region) );
    if(!template) return;

    const light = getLight(template.uuid);
    if(!light) return;

    if( template.distance === light.config.dim 
        && template.x === light.x
        && template.y === light.y
    ) return;

    const updates = {
        "config.dim": template.distance,
        "x": template.x,
        "y": template.y
    };

    return await light.update(updates);
}

/** Helper to get the uuid of the attached template of a given region */
function getTemplateUuid(region) {
    return region.getFlag("region-attacher", "attachedTemplate") ?? null;
}

/** Helper to get the AmbientLight document from a given template uuid */
function getLight(templateUuid) {
    return canvas.scene.lights.find(l => l.flags["talia-custom"]?.sourceTemplateUuid === templateUuid);
}
