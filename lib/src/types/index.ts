export interface Settings {
    atomic_url: string;
    chain_url: string;
    collection: string;
    account: string;
}

export interface Payload {
    success: boolean;
    message?: string;
    data?: any[];
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
