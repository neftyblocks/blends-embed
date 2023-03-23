export interface Settings {
    config?: {
        atomic_url: string;
        chain_url: string;
        marketplace_url: string;
        profile_url: string;
        chain: string;
        collection?: string;
    };
    account?: {
        actor: string;
        permission: string;
    };
    blend?: {
        contract: string;
        blend_id: string;
    };
    transactionId?: string;
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
    display_data: Record<string, unknown> | null;
}

export interface GetBlendProperty {
    atomic_url: string;
    blend_id: string;
    contract: string;
    chain: string;
}

export interface GetBlendResult {
    blend_id: string;
    contract: string;
    name: string;
    description?: string;
    start_time: number;
    end_time: number;
    items: {
        name: string;
        matcher_type: string;
        matcher?: string;
        image: string | null;
        video: string | null;
    }[];
    results: {
        name: string;
        image: string | null;
        video: string | null;
        empty?: boolean;
    }[];
    category: string;
    ingredients_count: number;
    result_count: number;
    secure: boolean;
    odds: boolean;
    requirements: Record<
        string,
        {
            amount: number;
            key: string;
            collection_name: string;
            // Matcher is a common name for a property that can be: template_id, collection_name, or asset_id, token_id
            matcher?: string;
            // the type of matcher will let you know which property was used: template, collection, token, schema, or attributes
            matcher_type: string;
            value?: number | Record<string, unknown>[];
        }
    >;
}

export interface TransactionAction {
    account: string;
    name: string;
    authorization: TransactionActionAuthorization[];
    data: {
        sale_id?: string | null;
        [key: string]: unknown;
    };
    hex_data?: string;
}

export interface TransactionActionAuthorization {
    actor: string;
    permission: string;
}
