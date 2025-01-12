const { NumberField, ObjectField, DataField } = foundry.data.fields;

export function _defineAttributesSchema() {
    return {
        authority: new NumberField({ required: false, integer: true, initial: 0}),
        economy: new NumberField({ required: false, integer: true, initial: 0}),
        community: new NumberField({ required: false, integer: true, initial: 0}),
        progress: new NumberField({ required: false, integer: true, initial: 0}),
        intrigue: new NumberField({ required: false, integer: true, initial: 0}),
    }
}

export function _defineDateSchema() {
    return {
        day: new NumberField({ required: false, nullable: true, integer: true, min: 0, max: 29}),
        month: new NumberField({ required: false, nullable: true, integer: true, min: 0, max: 11}),
        year: new NumberField({ required: false, nullable: true, integer: true})
    }
}

export function _getCurrentDate(inDays = false) {
    const { day, month, year } = SimpleCalendar.api.currentDateTime();
    return inDays ? dateToDays({day, month, year}) : { day, month, year };
}


