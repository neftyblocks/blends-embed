export interface Settings {
    config?: {
        atomic_url: string;
        chain_url: string;
    };
    collection?: string;
    account?: string;
    blend?: {
        contract: string;
        blend_id: string;
    };
}

export interface Payload {
    success: boolean;
    message?: string;
    data?: any[] | any;
    query_time: number;
}

export interface GetBlendsProperty {
    atomic_url: string;
    collection: string;
    page?: number;
}

export interface GetBlendsResult {
    blend_id: string;
    contract: string;
    name: string;
    description?: string;
    image: string;
    start_time: number;
    end_time: number;
    items: {
        name: string;
        image: string;
    }[];
    results: {
        name: string;
        image: string | null;
        drop_rate: number;
        rarity: string;
        mint: {
            amount: number;
            supply: string;
        } | null;
        empty?: boolean;
    }[];
    category: string;
    ingredients_count: number;
    result_count: number;
    secure: boolean;
    display_data: any | null;
}

export interface GetBlendProperty {
    atomic_url: string;
    blend_id: string;
    contract: string;
}

export interface GetBlendResult {
    blend_id: string;
    contract: string;
    name: string;
    description?: string;
    image: string;
    start_time: number;
    end_time: number;
    items: {
        name: string;
        image: string;
    }[];
    results: {
        name: string;
        image: string | null;
        empty?: boolean;
    }[];
    category: string;
    ingredients_count: number;
    result_count: number;
    secure: boolean;
    display_data: any | null;
}
