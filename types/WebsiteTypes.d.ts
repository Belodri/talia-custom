declare namespace JsonSchema {
    type Schema = {
        ingameDate: string;
        actors: ActorData[];
        sharedStorage: SharedStorageData;
        settlement?: SettlementData;
        journals: JournalData[];
    }

    type Currency = {
        pp: number;
        gp: number;
        sp: number;
        cp: number;
    }

    type SharedStorageData = {
        currency: Currency;
        items: ItemData[];
    }

    type ActorData = {
        name: string;
        currency: Currency;
        spells: SpellData[];
        features: FeatureData[];
        items: ItemData[];
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
        carried: number,
        stored: number,
        typeLabel: string,
        category: "consumable" | "container" | "equipment" | "loot" | "tool" | "weapon",
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
        attributes: SettlementAttributes;
        capacity: number;
        other: string;
    }

    type JournalData = {
        name: string;
        pages: JournalPage[];
    }

    type JournalPage = {
        name: string;
        index: number;
        htmlContent: string;
    }
}
