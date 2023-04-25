export interface Settings {
    account?: {
        actor: string;
        permission: string;
    };
    blend?: {
        contract: string;
        blend_id: string;
    };
    config?: {
        atomic_url: string;
        chain_url: string;
        marketplace_url: string;
        profile_url: string;
        chain: string;
        collection?: string;
        query?: {
            page?: string;
            category?: string;
            search?: string;
        };
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
    category?: string;
    ingredient_match?: string;
    ingredient_owner?: string;
}

export interface GetBlendsResponse {
    content: Record<string, GetBlendsResult>;
    search: Record<string, string>;
    categories: string[];
}

export interface GetBlendsResult {
    blend_id: string;
    contract: string;
    name: string;
    description?: string;
    image: string;
    video: string;
    start_time: number;
    end_time: number;
    fulfilled?: number;
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
    status: 'active' | 'ended' | 'sold-out' | 'max-reached';
    display_data: Record<string, unknown> | null;
}

export interface GetBlendProperty {
    atomic_url: string;
    blend_id: string;
    contract: string;
    chain: string;
}

export interface BlendResultItem {
    name: string;
    matcher_type: string;
    matcher?: string;
    market_data: string | null;
    image: string | null;
    video: string | null;
}

export interface GetBlendResult {
    blend_id: string;
    contract: string;
    name: string;
    collection_name: string;
    description?: string;
    start_time: number;
    end_time: number;
    items: BlendResultItem[];
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
    security_id: string;
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
    status: 'active' | 'ended' | 'sold-out' | 'max-reached';
    backgroundImg: string | null;
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
