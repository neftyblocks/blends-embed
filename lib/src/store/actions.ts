import { useFetch } from '@nefty/use';
import type {
    GetBlendsProperty,
    Payload,
    GetBlendsResult,
    GetBlendProperty,
    GetBlendResult,
} from '../types';
import { createImageUrl, getAssetDataSet } from '../utils';

export const getBlends = async ({
    atomic_url,
    collection,
}: GetBlendsProperty): Promise<GetBlendsResult[] | null> => {
    if (!atomic_url || !collection) return null;

    const { data, error } = await useFetch<Payload>('/neftyblends/v1/blends', {
        baseUrl: atomic_url,
        params: {
            collection_name: collection,
        },
    });

    if (error) {
        console.error(error);
        return null;
    }

    if (data) {
        const content = [];

        for (let i = 0; i < data.data.length; i++) {
            const {
                rolls,
                blend_id,
                contract,
                start_time,
                end_time,
                ingredients,
                ingredients_count,
                security_id,
                display_data,
                is_hidden,
                category,
            } = data.data[i];

            if (is_hidden) continue;

            const { template } = rolls[0].outcomes[0].results[0];

            const asset = getAssetDataSet(template);
            const { name, img } = asset;

            const items = [];
            const result = [];

            for (let a = 0; a < ingredients.length; a++) {
                const { template } = ingredients[a];

                if (!template) continue;

                const asset = getAssetDataSet(template);
                const { img, name } = asset;

                items.push({
                    name,
                    image: createImageUrl(img as string),
                });
            }

            for (let a = 0; a < rolls[0].outcomes.length; a++) {
                const { results } = rolls[0].outcomes[a];

                for (let b = 0; b < results.length; b++) {
                    const { template } = results[b];
                    if (!template) continue;

                    const asset = getAssetDataSet(template);
                    const { img, name } = asset;

                    result.push({
                        name,
                        image: createImageUrl(img as string),
                    });
                }
            }

            const displayData = display_data ? JSON.parse(display_data) : null;

            content.push({
                blend_id,
                contract,
                name: displayData?.name || name,
                start_time,
                end_time,
                items,
                results: result,
                category,
                ingredients_count,
                result_count: result.length,
                secure: security_id !== '0',
                display_data: display_data ? JSON.parse(display_data) : null,
                image: displayData?.image
                    ? createImageUrl(displayData.image)
                    : createImageUrl(img as string),
            });
        }

        return content;
    }

    return null;
};

export const getBlend = async ({
    atomic_url,
    blend_id,
    contract,
}: GetBlendProperty): Promise<GetBlendResult | null> => {
    if (!atomic_url || !blend_id || !contract) return null;

    const { data, error } = await useFetch<Payload>(
        `/neftyblends/v1/blends/${contract}/${blend_id}`,
        {
            baseUrl: atomic_url,
        }
    );

    if (error) {
        console.error(error);
        return null;
    }

    if (data) {
        const {
            rolls,
            blend_id,
            contract,
            start_time,
            end_time,
            ingredients,
            ingredients_count,
            security_id,
            display_data,
            category,
        } = data.data;

        const { template } = rolls[0].outcomes[0].results[0];

        const asset = getAssetDataSet(template);
        const { name, img } = asset;

        const items = [];
        const result = [];

        for (let a = 0; a < ingredients.length; a++) {
            const { template } = ingredients[a];

            if (!template) continue;

            const asset = getAssetDataSet(template);
            const { img, name } = asset;

            items.push({
                name,
                image: createImageUrl(img as string),
            });
        }

        for (let a = 0; a < rolls[0].outcomes.length; a++) {
            const { results } = rolls[0].outcomes[a];

            for (let b = 0; b < results.length; b++) {
                const { template } = results[b];
                if (!template) continue;

                const asset = getAssetDataSet(template);
                const { img, name } = asset;

                result.push({
                    name,
                    image: createImageUrl(img as string),
                });
            }
        }

        const displayData = display_data ? JSON.parse(display_data) : null;

        return {
            blend_id,
            contract,
            name: displayData?.name || name,
            description: displayData?.description,
            start_time,
            end_time,
            items,
            results: result,
            category,
            ingredients_count,
            result_count: result.length,
            secure: security_id !== '0',
            display_data: display_data ? JSON.parse(display_data) : null,
            image: displayData?.image
                ? createImageUrl(displayData.image)
                : createImageUrl(img as string),
        };
    }

    return null;
};
