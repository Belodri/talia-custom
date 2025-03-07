import { MODULE } from "../scripts/constants.mjs";

export default {
    register() {
        renderTileConfigHook();
    }
}

/**
 * The logic for this is in a wrapper on Tile.prototype._refreshMesh
 */
function renderTileConfigHook() {
    Hooks.on("renderTileConfig", onRenderTileConfigHook)

    /**
     * 
     * @param {TileConfig} app 
     * @param {JQuery} html 
     * @param {object} data 
     */
    function onRenderTileConfigHook(app, html, data) {

        const { BooleanField } = foundry.data.fields;
        const enableGmIgnoreOcclusionField = new BooleanField({
            label: "Gm Ignore Occlusion", 
            hint: "When set this tile is rendered invisible for GMs, no matter their occlusion state."
        }).toFormGroup({},{
            name: `flags.${MODULE.ID}.gmIgnoreOcclusion`,
            value: data.document.flags?.[MODULE.ID]?.gmIgnoreOcclusion ?? false
        }).outerHTML;
        

        const div = document.createElement("div");
        div.innerHTML = enableGmIgnoreOcclusionField;

        const overheadTab = html.find(`.tab[data-tab="overhead"]`)[0];
        if(!overheadTab) return;

        overheadTab.appendChild(div);
        app.setPosition({height: "auto"});
    }
}


