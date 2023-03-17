import { useAssetData, useTokenDisplay } from '@nefty/use';

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

export const getMarketUrl = (item: any, marketUrl: string, collectionName: string) => {
    const includeCollection = item.matcher_type !== 'collection';

    // TODO: add mapping for matcher_type

    return `${marketUrl}?${includeCollection ? `collection_name=${collectionName}&` : ''}${item.matcher_type}=${
        item.matcher
    }`;
};
