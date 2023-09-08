import { useCountDown } from '@nefty/use';
import type { BlendResultItem } from '../types';

export const matchAssetRequirements = (
    selectionItems: any,
    requirements: any,
    isFullValidation: boolean
) => {
    const { amount } = requirements;

    if (!selectionItems) return false;

    if (!isFullValidation && selectionItems.length) return true;

    if (amount > selectionItems.length) return false;

    return true;
};

export const matchTokenRequirements = (
    selectionItems: any,
    requirements: any
) => {
    const { value } = requirements;

    if (!selectionItems) return false;

    const [tokenValue] = selectionItems.split(' ');

    return value <= +tokenValue;
};

export const getMarketUrl = (
    matcher_type: string,
    market_data: BlendResultItem['market_data'],
    platformUrl: string
) => {
    const marketArray = market_data.split('|');
    const extend = '&sort=price&order=asc';
    const marketUrl = `${platformUrl}/marketplace/listing`;

    const url = {
        attributes: `${marketUrl}?collection_name=${marketArray[0]}&schema_name=${marketArray[1]}${extend}`,
        collection: `${marketUrl}?collection_name=${marketArray[0]}${extend}`,
        schema: `${marketUrl}?collection_name=${marketArray[0]}&schema_name=${marketArray[1]}${extend}`,
        template: `${marketUrl}?collection_name=${marketArray[0]}&template_id=${marketArray[1]}${extend}`,
        balance: `${marketUrl}?collection_name=${marketArray[0]}&template_id=${marketArray[1]}${extend}`,
    };

    return url[matcher_type];
};

export const getDetailUrl = (
    matcher_type: string,
    market_data: BlendResultItem['market_data'],
    platformUrl: string
) => {
    const marketArray = market_data.split('|');

    const url = {
        attributes: `${platformUrl}/schemas/${marketArray[0]}/${marketArray[1]}`,
        collection: `${platformUrl}/collection/${marketArray[0]}`,
        schema: `${platformUrl}/schemas/${marketArray[0]}/${marketArray[1]}`,
        template: `${platformUrl}/templates/${marketArray[0]}/${marketArray[1]}`,
        balance: `${platformUrl}/templates/${marketArray[0]}/${marketArray[1]}`,
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
    TEMPLATE_HOLDINGS: `${text} NFTs from a template`,
    COLLECTION_HOLDINGS: `${text} NFTs from a collection`,
    SCHEMA_HOLDINGS: `${text} NFTs from a schema`,
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
    (lookupObject: Record<string, () => unknown>, defaultCase = '_default') =>
    (expression: string) =>
        (lookupObject[expression] || lookupObject[defaultCase])();

export const matchBlendLive = (
    start_time: string,
    end_time: string,
    now: number
) => {
    const countdownStart = useCountDown(+start_time, now);
    const countdownEnd = useCountDown(+end_time, now);

    if (start_time === '0' && end_time === '0') {
        return true;
    } else if (start_time === '0' && countdownEnd !== '0') {
        return true;
    } else if (end_time === '0' && countdownStart === '0') {
        return true;
    } else if (countdownStart === '0' && countdownEnd !== '0') {
        return true;
    } else {
        return false;
    }
};
