import { useAssetData } from '@nefty/use';

export const blendNameAndImage = (displayData: any, firstResult: any) => {
    let blend_img;
    let blend_video;
    let blend_name;

    // data from the blend
    if (displayData) {
        blend_name = displayData.name;
        blend_img = displayData.image;
    }

    // data from the first result ::fallback
    if (firstResult?.template) {
        const asset = useAssetData(firstResult.template);

        const { name } = asset;
        const { image, video } = getVisuals(
            asset,
            firstResult.template.schema.format
        );

        if (!blend_name) blend_name = name;
        if (!blend_img) blend_img = image;
        // only set if no image data from the blend
        if (!blend_img && !blend_video) blend_video = video;
    
    // data from the first pool ::fallback
    } else if (firstResult?.pool) {
        const displayData = firstResult.pool.display_data
            ? JSON.parse(firstResult.pool.display_data)
            : null;

        if (displayData) {
            if (!blend_name) blend_name = displayData.name;
            if (!blend_img) blend_img = displayData.image;
            // only set if no image data from the blend
            if (!blend_img && !blend_video) blend_video = displayData.video;
        }
    }

    return { blend_name, blend_img, blend_video };
};

// Not checking on type
// const visualsTypes = ['image', 'video', 'ipfs', 'string'];

export const getVisuals = (asset: any, format?: any) => {
    const result = {
        image: null,
        video: null,
    };

    if (format) {
        for (let i = 0; i < format.length; i++) {
            const { name, type } = format[i];
            const lowName = name.toLowerCase();

            if (asset[name]) {
                if (lowName.startsWith('im')) {
                    if (!result.image) result.image = asset[name];
                } else if (lowName.includes('img')) {
                    if (!result.image) result.image = asset[name];
                } else if (lowName.startsWith('vid')) {
                    if (!result.video) result.video = asset[name];
                } else if (lowName.includes('vid')) {
                    if (!result.video) result.video = asset[name];
                }
            }
        }
    } else {
        const attributes = Object.keys(asset);

        for (let i = 0; i < attributes.length; i++) {
            const lowName = attributes[i].toLowerCase();

            if (asset[attributes[i]]) {
                if (lowName.startsWith('im')) {
                    if (!result.image) result.image = asset[attributes[i]];
                } else if (lowName.includes('img')) {
                    if (!result.image) result.image = asset[attributes[i]];
                } else if (lowName.startsWith('vid')) {
                    if (!result.video) result.video = asset[attributes[i]];
                } else if (lowName.includes('vid')) {
                    if (!result.video) result.video = asset[attributes[i]];
                }
            }
        }
    }

    return result;
};

const rarityNames = [
    'rarity',
    'Rarity',
    'variation',
    'Variation',
    'style',
    'Style',
];

export const getRarity = (data) => {
    for (let i = 0; i < rarityNames.length; i++) {
        if (data[rarityNames[i]]) return data[rarityNames[i]];
    }

    return null;
};
