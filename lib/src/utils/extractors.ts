import { useAssetData } from '@nefty/use';

export const blendNameAndImage = (displayData: any, firstResult: any) => {
    let blend_img;
    let blend_video;
    let blend_name;

    if (displayData) {
        blend_name = displayData.name;
        blend_img = displayData.image;
        blend_video = displayData.video;
    }

    if (firstResult?.template) {
        const asset = useAssetData(firstResult.template);
        const { name, img, video } = asset;

        if (!blend_name) blend_name = name;
        if (!blend_img) blend_img = img;
        if (!blend_video) blend_video = video;
    } else if (firstResult?.pool) {
        const displayData = firstResult.pool.display_data ? JSON.parse(firstResult.pool.display_data) : null;

        if (displayData) {
            if (!blend_name) blend_name = displayData.name;
            if (!blend_img) blend_img = displayData.image;
            if (!blend_video) blend_video = displayData.video;
        }
    }

    return { blend_name, blend_img, blend_video };
};

const visualsTypes = ['image', 'video', 'ipfs', 'string'];

export const getVisuals = (asset: any, format: any) => {
    const result = {
        image: null,
        video: null,
    };

    for (let i = 0; i < format.length; i++) {
        const { type, name } = format[i];

        if (visualsTypes.includes(type) && asset[name]) {
            if (name.startsWith('im')) {
                if (!result.image) result.image = asset[name];
            } else if (name.includes('img')) {
                if (!result.image) result.image = asset[name];
            } else if (name.startsWith('vid')) {
                if (!result.video) result.video = asset[name];
            } else if (name.includes('vid')) {
                if (!result.video) result.video = asset[name];
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
}