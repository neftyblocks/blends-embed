import { useFetch } from '@mvdschee/use';
import type { GetBlendsProperty, Payload, GetBlendsResult } from '../types';
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
        const results = [];

        for (let i = 0; i < data.data.length; i++) {
            const {
                rolls,
                blend_id,
                contract,
                start_time,
                end_time,
                ingredients,
            } = data.data[i];
            const { template } = rolls[0].outcomes[0].results[0];

            const asset = getAssetDataSet(template);
            const { name, img } = asset;

            const items = [];

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

            results.push({
                blend_id,
                contract,
                name,
                start_time,
                end_time,
                items,
                image: createImageUrl(img as string),
            });
        }

        return results;
    }

    return null;
};
