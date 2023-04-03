import { useFetch, useImageUrl, useAssetData } from '@nefty/use';
import type { GetBlendsProperty, Payload, GetBlendsResult } from '../types';
import { blendNameAndImage, displayTime } from '../utils';

export const getBlends = async ({ atomic_url, collection, page = 1 }: GetBlendsProperty): Promise<
    GetBlendsResult[] | null
> => {
    const { data, error } = await useFetch<Payload>('/neftyblends/v1/blends', {
        baseUrl: atomic_url,
        params: {
            collection_name: collection,
            visibility: 'visible',
            limit: '1000',
            page: `${page}`,
            order: 'asc',
        },
    });

    if (error) {
        console.error(error);
        return null;
    }

    if (data) {
        const now = new Date().getTime();
        const content: GetBlendsResult[] = [];

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
                max,
                use_count,
            } = data.data[i];

            if (is_hidden) continue;
            let max_reached = false;
            const items = [];
            const result = [];

            for (let a = 0; a < ingredients.length; a++) {
                const { template } = ingredients[a];

                if (!template) continue;

                const asset = useAssetData(template);
                const { img, name } = asset;

                items.push({
                    name,
                    image: useImageUrl(img as string),
                });
            }

            // Locked to first array as we don't support multiple outcomes yet
            const outcomes = rolls[0].outcomes;

            for (let a = 0; a < outcomes.length; a++) {
                const { results } = outcomes[a];

                if (!results.length) {
                    result.push({
                        name: 'empty',
                        empty: true,
                        image: null,
                    });
                } else {
                    for (let b = 0; b < results.length; b++) {
                        const { template } = results[b];

                        if (!template) continue;

                        const issued_supply = +template.issued_supply;
                        const max_supply = +template.max_supply;
                        const maxReached = max_supply === 0 ? false : issued_supply === max_supply;

                        if (maxReached) max_reached = true;

                        const asset = useAssetData(template);
                        const { img, name } = asset;

                        result.push({
                            name,
                            image: useImageUrl(img as string),
                        });
                    }
                }
            }

            const displayData = display_data ? JSON.parse(display_data) : null;

            const { blend_img, blend_name } = blendNameAndImage(displayData, rolls[0].outcomes[0].results[0]);

            const soldOut = +max !== 0 && +use_count >= +max;

            content.push({
                blend_id,
                contract,
                name: blend_name,
                start_time,
                end_time,
                items,
                results: result,
                category,
                ingredients_count,
                result_count: result.length,
                secure: security_id !== '0',
                display_data: displayData,
                status:
                    displayTime(start_time, end_time, now) === 'ended'
                        ? 'ended'
                        : soldOut
                        ? 'sold-out'
                        : max_reached
                        ? 'max-reached'
                        : 'active',
                image: blend_img ? useImageUrl(blend_img) : null,
            });
        }

        return content;
    }

    return null;
};
