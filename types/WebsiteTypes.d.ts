declare namespace JsonSchema {
    type Schema = {
        ingameDate: string;
        actors: ActorData[];
        settlement?: SettlementData;
        journals: JournalData[];
    }

    type ActorData = {
        name: string,
        spells: SpellData[],
        features: FeatureData[],
        physicalItems: ItemData[]
    }

    type SpellData = {
        name: string,
        description: string,
        spellLevel: string,
        spellSchool: string,
        range: string
    }

    type FeatureData = {
        name: string,
        description: string,
        requirements: string
    }

    type ItemData = {
        name: string,
        description: string,
        quantity: number,
        inStorage: boolean,
        typeLabel: string,
        requiresAttunement: boolean
    }

    type SettlementData = {
        name: string;
        attributes: SettlementAttributes;
        capacity: SettlementCapacity;
        buildings: SettlementBuildingData[];
        currentEffects: SettlementEffectData[];
    }

    type SettlementAttributes = {
        authority: number;
        economy: number;
        community: number;
        progress: number;
        intrigue: number;
    }

    type SettlementCapacity = {
        max: number;
        available: number;
    }

    type SettlementModifiers = {
        attributes: SettlementAttributes;
        capacity: number;
    }

    type SettlementBuildingData = {
        name: string;
        flavorText: string;
        scale: number;
        requirements: SettlementBuildingRequirements;
        effects: SettlementMutator;
        constructionDate?: string;
    }

    type SettlementBuildingRequirements = {
        attributes: SettlementAttributes;
        buildings: string[],
        unlocks: string[]
    }

    type SettlementEffectData = {
        name: string;
        flavorText: string;
        remainingDays: number;
        effects: SettlementMutator;
    }

    type SettlementMutator = {
        modifiers: SettlementModifiers;
        other: string;
    }

    type JournalData = {
        name: string;
        pages: JournalPage[];
    }

    type JournalPage = {
        name: string;
        htmlContent: string;
    }
}
