import { BlendResultItem } from '../types';

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
    const extend = '&sort=price&order=asc';

    const url = {
        attributes: `${marketUrl}?collection_name=${marketArray[0]}&schema_name=${marketArray[1]}${extend}`,
        collection: `${marketUrl}?collection_name=${marketArray[0]}${extend}`,
        schema: `${marketUrl}?collection_name=${marketArray[0]}&schema_name=${marketArray[1]}${extend}`,
        template: `${marketUrl}?collection_name=${marketArray[0]}&template_id=${marketArray[1]}${extend}`,
        balance: `${marketUrl}?collection_name=${marketArray[0]}&template_id=${marketArray[1]}${extend}`,
    };

    return url[matcher_type];
};

export const matchRarity = (rarity: number) => {
    if (rarity <= 1) return 'legendary';
    if (rarity <= 5) return 'epic';
    if (rarity <= 10) return 'rare';
    if (rarity <= 25) return 'uncommon';
    return 'common';
};

const text = 'You do not hold enough';

export const matchSecurityReason = {
    TOKEN_HOLDING: `${text} tokens`,
    TEMPLATE_HOLDINGS: `${text} NFTs from a templates`,
    COLLECTION_HOLDINGS: `${text} NFTs from a collections`,
    SCHEMA_HOLDINGS: `${text} NFTs from a schemas`,
    '': '',
};

export const comparisonOperator = {
    0: (a: number, b: number) => a === b,
    1: (a: number, b: number) => a !== b,
    2: (a: number, b: number) => a > b,
    3: (a: number, b: number) => a >= b,
    4: (a: number, b: number) => a < b,
    5: (a: number, b: number) => a <= b,
};

export const switchFn =
    (lookupObject: Record<string, () => unknown>, defaultCase = '_default') => (expression: string) =>
        (lookupObject[expression] || lookupObject[defaultCase])();
