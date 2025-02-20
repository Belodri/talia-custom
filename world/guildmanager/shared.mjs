const {
    SchemaField, NumberField
} = foundry.data.fields;

function defineDateSchema() {
    return {
        day: new NumberField({ integer: true, min: 0, max: 29 }),
        month: new NumberField({ integer: true, min: 0, max: 11 }),
        year: new NumberField({ integer: true })
    }
}

function defineAttributesSchema() {
    return {
        brawn: new NumberField({ required: false, integer: true, initial: 0, label: "Brawn" }),
        cunning: new NumberField({ required: false, integer: true, initial: 0, label: "Cunning" }),
        spellcraft: new NumberField({ required: false, integer: true, initial: 0, label: "Spellcraft" }),
        influence: new NumberField({ required: false, integer: true, initial: 0, label: "Influence" }),
        reliability: new NumberField({ required: false, integer: true, initial: 0, label: "Reliability" }),
    }
}

export default {
    defineDateSchema,
    defineAttributesSchema,
};
