const {
    SchemaField, NumberField
} = foundry.data.fields;

export function _defineDateSchema() {
    return {
        day: new NumberField({ integer: true, min: 0, max: 29 }),
        month: new NumberField({ integer: true, min: 0, max: 11 }),
        year: new NumberField({ integer: true })
    }
}

export function _defineAttributesSchema() {
    return {
        authority: new NumberField({ required: false, integer: true, initial: 0 }),
        economy: new NumberField({ required: false, integer: true, initial: 0 }),
        community: new NumberField({ required: false, integer: true, initial: 0 }),
        progress: new NumberField({ required: false, integer: true, initial: 0 }),
        intrigue: new NumberField({ required: false, integer: true, initial: 0 }),
    }
}

export function _defineModifiersSchema() {
    return {
        attributes: new SchemaField( _defineAttributesSchema() ),
        capacity: new NumberField({ integer: true, initial: 0 }),
    }
}
