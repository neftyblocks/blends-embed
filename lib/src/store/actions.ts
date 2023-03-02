import { useFetch, useImageUrl, useAssetData } from '@nefty/use';
import type {
    GetBlendsProperty,
    Payload,
    GetBlendsResult,
    GetBlendProperty,
    GetBlendResult,
} from '../types';
import { matchRarity } from '../utils';

export const getBlends = async ({
    atomic_url,
    collection,
    page = 1,
}: GetBlendsProperty): Promise<GetBlendsResult[] | null> => {
    if (!atomic_url || !collection) return null;

    const { data, error } = await useFetch<Payload>('/neftyblends/v1/blends', {
        baseUrl: atomic_url,
        params: {
            collection_name: collection,
            visibility: 'visible',
            limit: '1000',
            page: `${page}`,
        },
    });

    if (error) {
        console.error(error);
        return null;
    }

    if (data) {
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
            } = data.data[i];

            if (is_hidden) continue;

            const { template } = rolls[0].outcomes[0].results[0];

            const asset = useAssetData(template);
            const { name, img } = asset;

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
                display_data: displayData,
                image: displayData?.image
                    ? useImageUrl(displayData.image)
                    : useImageUrl(img as string),
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

        const { template: firstResultTemplate } =
            rolls[0].outcomes[0].results[0];

        const asset = useAssetData(firstResultTemplate);
        const { name, img } = asset;

        const items = [];
        const result = [];
        const requirments = [];

        for (let a = 0; a < ingredients.length; a++) {
            const { template, type } = ingredients[a];

            console.log(ingredients[a]);

            if (!template) continue;

            // TODO: finish this
            requirments.push({
                key: type,
            });

            const asset = useAssetData(template);
            const { img, name } = asset;

            items.push({
                name,
                image: useImageUrl(img as string),
            });
        }

        // Locked to first array as we don't support multiple outcomes yet
        const totalOdds = rolls[0].total_odds;
        const outcomes = rolls[0].outcomes;

        for (let a = 0; a < outcomes.length; a++) {
            const { results, odds } = outcomes[a];

            const dropRate = (odds / totalOdds) * 100;
            const rarity = matchRarity(dropRate);

            if (!results.length) {
                result.push({
                    name: 'empty',
                    drop_rate: dropRate,
                    rarity,
                    mint: null,
                    empty: true,
                    image: null,
                });
            } else {
                for (let b = 0; b < results.length; b++) {
                    const { template } = results[b];

                    if (!template) continue;

                    const asset = useAssetData(template);
                    const { img, name } = asset;

                    result.push({
                        name,
                        drop_rate: dropRate,
                        rarity,
                        mint: {
                            amount: +template.issued_supply,
                            supply:
                                +template.max_supply === 0
                                    ? '∞'
                                    : template.max_supply,
                        },
                        image: useImageUrl(img as string),
                    });
                }
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
            display_data: displayData,
            image: displayData?.image
                ? useImageUrl(displayData.image)
                : useImageUrl(img as string),
        };
    }

    return null;
};

export const getRequirments = async () => {};
