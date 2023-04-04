import { useAssetData } from '@nefty/use';

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
            if (!blend_name) blend_name = displayData.name;
            if (!blend_img) blend_img = displayData.image;
        }
    }

    return { blend_name, blend_img };
};
