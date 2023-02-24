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
}

export interface GetBlendsResult {
    blend_id: string;
    contract: string;
    name: string;
    image: string;
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
    image: string;
}
