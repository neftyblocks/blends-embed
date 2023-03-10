import { useTokenDisplay } from '@nefty/use';

export const dispatch = (
    name: string,
    detail: any,
    component: any,
    composed = true
) => {
    component.dispatchEvent(
        new CustomEvent(name, {
            detail,
            composed, // propagate across the shadow DOM
        })
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
