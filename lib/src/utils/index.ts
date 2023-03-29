import { useAssetData, useCountDown, useTokenDisplay } from '@nefty/use';
import type { BlendResultItem } from '../types';

export * from './animations';
export * from './transaction';

export const dispatch = (name: string, detail: any, component: any, composed = true) => {
    component.dispatchEvent(
        new CustomEvent(name, {
            detail,
            composed, // propagate across the shadow DOM
        }),
    );
};

export const matchRarity = (rarity: number) => {
    if (rarity <= 1) return 'legendary';
    if (rarity <= 5) return 'epic';
    if (rarity <= 10) return 'rare';
    if (rarity <= 25) return 'uncommon';
    return 'common';
};

export const priceForInput = (amount: string | number, precision = 8) => {
    return +amount / Math.pow(10, precision);
};

export const formatTokenWithoutSymbol = (selection: string, precision = 8) => {
    const [tokenValue] = selection.split(' ');

    return useTokenDisplay(tokenValue, precision);
};

export const blendNameAndImage = (displayData: any, firstResult: any) => {
    let blend_img;
    let blend_name;

    if (displayData) {
        blend_name = displayData.name;
        blend_img = displayData.image;
    }

    if (firstResult?.template) {
        const asset = useAssetData(firstResult.template);
        const { name, img } = asset;

        if (!blend_name) blend_name = name;
        if (!blend_img) blend_img = img;
    } else if (firstResult?.pool) {
        const displayData = firstResult.pool.display_data ? JSON.parse(firstResult.pool.display_data) : null;

        if (displayData) {
            blend_name = displayData.name;
            blend_img = displayData.image;
        }
    }

    return { blend_name, blend_img };
};

export const sortedRequirements = (requirements: any): any[] => {
    const list = Object.values(requirements);

    list.sort((a, b) => {
        if (a.matcher_type === 'balance') return -1;
        if (b.matcher_type === 'balance') return 1;

        if (a.matcher_type === 'attributes') return -1;
        if (b.matcher_type === 'attributes') return 1;

        if (a.matcher_type === 'template') return -1;
        if (b.matcher_type === 'template') return 1;

        if (a.matcher_type === 'schema') return -1;
        if (b.matcher_type === 'schema') return 1;

        if (a.matcher_type === 'collection') return -1;
        if (b.matcher_type === 'collection') return 1;

        if (a.matcher_type === 'token') return -1;
        if (b.matcher_type === 'token') return 1;

        return 0;
    });

    return list;
};

export const matchAssetRequirements = (selectionItems: any, requirements: any) => {
    const { amount } = requirements;

    if (!selectionItems) return false;

    if (amount > selectionItems.length) return false;

    return true;
};

export const matchTokenRequirements = (selectionItems: any, requirements: any) => {
    const { value } = requirements;

    if (!selectionItems) return false;

    const [tokenValue] = selectionItems.split(' ');

    return value <= +tokenValue;
};

export const getMarketUrl = (matcher_type: string, market_data: BlendResultItem['market_data'], marketUrl: string) => {
    const marketArray = market_data.split('|');

    const url = {
        attributes: `${marketUrl}?collection_name=${marketArray[0]}&schema_name=${marketArray[1]}`,
        collection: `${marketUrl}?collection_name=${marketArray[0]}`,
        schema: `${marketUrl}?collection_name=${marketArray[0]}&schema_name=${marketArray[1]}`,
        template: `${marketUrl}?collection_name=${marketArray[0]}&template_id=${marketArray[1]}`,
        balance: `${marketUrl}?collection_name=${marketArray[0]}&template_id=${marketArray[1]}`,
    };

    return url[matcher_type];
};

export const displayTime = (time, now, end = false) => {
    const countdown = useCountDown(time, now);

    if (countdown === '0') {
        return end ? 'no end' : 'live';
    } else {
        return end ? `ending in ${countdown}` : `live in ${countdown}`;
    }
};

export const switchFn =
    (lookupObject: Record<string, () => unknown>, defaultCase = '_default') => (expression: string) =>
        (lookupObject[expression] || lookupObject[defaultCase])();

export const comparisonOperator = {
    0: (a: number, b: number) => a === b,
    1: (a: number, b: number) => a !== b,
    2: (a: number, b: number) => a > b,
    3: (a: number, b: number) => a >= b,
    4: (a: number, b: number) => a < b,
    5: (a: number, b: number) => a <= b,
};

const text = 'You do not hold enough';

export const matchSecurityReason = {
    TOKEN_HOLDING: `${text} tokens`,
    TEMPLATE_HOLDINGS: `${text} NFTs from a templates`,
    COLLECTION_HOLDINGS: `${text} NFTs from a collections`,
    SCHEMA_HOLDINGS: `${text} NFTs from a schemas`,
    '': '',
};
