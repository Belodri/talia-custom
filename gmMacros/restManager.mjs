import { TaliaCustomAPI } from "../scripts/api.mjs";
export default {
    register() {
        TaliaCustomAPI.add({rest: RestManager.rest}, "GmMacros");
    }
}

class RestManager {
    static async rest() { 
        if(!game.user.isGM) return;
        const config = await RestManager.restConfigDialog();

        return config ? Promise.all( 
            RestManager.getUniqueActors()
                .map(a => a[`${config.type}Rest`](config)) 
        ) : null;
    }

    static getUniqueActors() {
        return [...new Map(
            canvas.tokens.controlled.map(t => [t.actor.uuid, t.actor])
        ).values()];
    }

    static async restConfigDialog() {
        const restTypeField = new foundry.data.fields.StringField({
            label: "Rest Type",
            choices: Object.fromEntries( Object.keys(CONFIG.DND5E.restTypes).map(k => [k, k]) ),
            required: true,
        }).toFormGroup({},{name: "type"}).outerHTML;

        const advanceTimeField = new foundry.data.fields.BooleanField({
            label: "Advance time?",
            initial: true,
        }).toFormGroup({},{name: "advanceTime"}).outerHTML;

        const config = await foundry.applications.api.DialogV2.prompt({
            window: { title: "Rest Options" },
            content: restTypeField + advanceTimeField,
            ok: { 
                callback: (_, button) => new FormDataExtended(button.form).object 
            },
            rejectClose: false,
        });

        return config ? {
            dialog: false,
            type: config.type,
            newDay: config.type !== "short",  //any newDay stuff refreshes on any long or extended rest.
            advanceTime: config.advanceTime,
            autoHD: false,
        } : null;
    }
}
