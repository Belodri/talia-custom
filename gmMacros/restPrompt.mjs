import { TaliaCustomAPI } from "../scripts/api.mjs";

export default {
    register() {
        TaliaCustomAPI.add({promptRest}, "GmMacros");
    }
}

async function promptRest() {
    const restType = await foundry.applications.api.DialogV2.wait({
        window: { title: "Prompt Rest"},
        content: "",
        modal: true,
        rejectClose: false,
        buttons: [
            { label: "Short Rest", action: "short",},
            { label: "Long Rest", action: "long",},
        ]
    });
    if(restType === null) return;
    const isLongRest = restType === "long";

    //advance time
    const changeMinutes = isLongRest ? CONFIG.DND5E.restTypes.long.duration.normal : CONFIG.DND5E.restTypes.short.duration.normal;
    const beforeDay = SimpleCalendar.api.currentDateTime().day;
    await SimpleCalendar.api.changeDate({minute: changeMinutes});
    const isNewDay = beforeDay !== SimpleCalendar.api.currentDateTime().day;
    

    Requestor.request({
        title: "Request",
        speaker: {alias: "Aerelia"},
        buttonData: [{
            label: isLongRest ? "Long Rest" : "Short Rest",
            scope: {
                isLongRest: isLongRest,
                isNewDay: isNewDay,
            },
            command: async function() {
                if(isLongRest) {
                    await actor.longRest({dialog: false, newDay: isNewDay});
                } else {
                    await actor.shortRest({dialog: false, newDay: isNewDay});
                }
            }
        }]
    })
}