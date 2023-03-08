import { useFetch, useImageUrl, useAssetData } from '@nefty/use';
import type {
    GetBlendsProperty,
    Payload,
    GetBlendsResult,
    GetBlendProperty,
    GetBlendResult,
} from '../types';
import { matchRarity, priceForInput } from '../utils';

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
            order: 'asc',
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
            collection_name,
        } = data.data;

        const { template: firstResultTemplate } =
            rolls[0].outcomes[0].results[0];

        const asset = useAssetData(firstResultTemplate);
        const { name, img } = asset;

        const items = [];
        const result = [];
        const requirments = {};

        // ------------------------------
        // INGREDIENTS & REQUIREMENTS
        // ------------------------------
        for (let a = 0; a < ingredients.length; a++) {
            const { template, collection, ft_amount, type, amount } =
                ingredients[a];

            let matcher;
            let matcher_type;
            let value = 0;

            // INGREDIENT - TEMPLATE
            if (type === 'TEMPLATE_INGREDIENT') {
                matcher = template?.template_id;
                matcher_type = 'template_id';

                const asset = useAssetData(template);
                const { img, video, name } = asset;

                items.push({
                    name,
                    matcher_type,
                    matcher,
                    video: video ? useImageUrl(video as string) : null,
                    image: img ? useImageUrl(img as string) : null,
                });
            }

            // INGREDIENT - COLLECTION
            if (type === 'COLLECTION_INGREDIENT') {
                matcher = collection?.collection_name;
                matcher_type = 'collection_name';

                const {
                    data: { img },
                } = collection;

                items.push({
                    name: matcher,
                    matcher_type,
                    matcher,
                    video: null,
                    image: img ? useImageUrl(img as string) : null,
                });
            }

            // INGREDIENT - TOKEN
            if (type === 'FT_INGREDIENT') {
                matcher = `${ft_amount.token_symbol}|${ft_amount.token_contract}`;
                matcher_type = 'token_symbol|token_contract';

                const { token_symbol, token_contract } = ft_amount;

                // const tokens = await useFetch(
                //     'https://neftyblocks.com/api/helpers/token_images',
                //     {
                //         params: {
                //             tokensIds: `${token_symbol}_${token_contract}`,
                //         },
                //     }
                // );

                // console.log(tokens);
                value = priceForInput(ft_amount.amount, ft_amount.precision);

                items.push({
                    name: token_symbol,
                    matcher_type,
                    matcher,
                    video: null,
                    image: null,
                    token: {
                        ...ft_amount,
                        value,
                    },
                });
            }

            requirments[matcher] = {
                key: type,
                collection_name,
                amount,
                value,
                matcher_type,
                matcher,
            };
        }

        // ------------------------------
        // RESULTS
        // ------------------------------
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
                    const { img, video, name } = asset;

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
                        video: video ? useImageUrl(video as string) : null,
                        image: img ? useImageUrl(img as string) : null,
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
            requirments,
            image: displayData?.image
                ? useImageUrl(displayData.image)
                : useImageUrl(img as string),
        };
    }

    return null;
};

const assetsConfig = {
    is_transferable: 'true',
    is_burnable: 'true',
    order: 'desc',
    sort: 'template_mint',
};

export const getTemplateAssetId = async ({
    template_id,
    collection_name,
    atomic_url,
    account,
}) => {
    let result = {};

    const { data, error } = await useFetch<Payload>('/atomicassets/v1/assets', {
        baseUrl: atomic_url,
        params: {
            collection_name,
            template_id,
            owner: account,
            ...assetsConfig,
        },
    });

    if (error) console.error(error);

    if (data) {
        const { data: assets } = data;

        if (assets.length) {
            result = {
                [template_id]: [],
            };

            for (let i = 0; i < assets.length; i++) {
                const { asset_id, template_mint } = assets[i];

                result[template_id].push({
                    asset_id,
                    mint: template_mint,
                });
            }
        }
    }

    return result;
};
export const getCollectionAssetId = async ({
    collection_name,
    atomic_url,
    account,
}) => {
    let result = {};

    const { data, error } = await useFetch<Payload>('/atomicassets/v1/assets', {
        baseUrl: atomic_url,
        params: {
            collection_name,
            owner: account,
            ...assetsConfig,
        },
    });

    if (error) console.error(error);

    if (data) {
        const { data: assets } = data;

        if (assets.length) {
            result = {
                [collection_name]: [],
            };

            for (let i = 0; i < assets.length; i++) {
                const { asset_id, template_mint } = assets[i];

                result[collection_name].push({
                    asset_id,
                    mint: template_mint,
                });
            }
        }
    }

    return result;
};

export const getTokenBalance = async ({
    chain_url,
    account,
    code,
    symbol,
    matcher,
}) => {
    let result = {};

    const { data, error } = await useFetch<Payload>(
        '/v1/chain/get_currency_balance',
        {
            baseUrl: chain_url,
            method: 'POST',
            body: {
                code,
                symbol,
                account,
            },
        }
    );

    if (error) console.error(error);

    if (data) {
        result[matcher] = data[0];
    }

    return result;
};

export const getRequirments = async ({
    requirments,
    atomic_url,
    chain_url,
    account,
}: {
    requirments: GetBlendResult['requirments'];
    atomic_url: string;
    chain_url: string;
    account: string;
}) => {
    const fetchCalls = [];
    let results = {};

    const list = Object.values(requirments);

    for (let i = 0; i < list.length; i++) {
        const requirment = list[i];

        if (requirment.key === 'TEMPLATE_INGREDIENT') {
            fetchCalls.push(
                getTemplateAssetId({
                    template_id: requirment.matcher,
                    collection_name: requirment.collection_name,
                    account,
                    atomic_url,
                })
            );
        }

        if (requirment.key === 'COLLECTION_INGREDIENT') {
            fetchCalls.push(
                getCollectionAssetId({
                    collection_name: requirment.matcher,
                    account,
                    atomic_url,
                })
            );
        }

        if (requirment.key === 'FT_INGREDIENT') {
            const token = requirment.matcher.split('|');
            fetchCalls.push(
                getTokenBalance({
                    chain_url,
                    account,
                    code: token[1],
                    symbol: token[0],
                    matcher: requirment.matcher,
                })
            );
        }
    }

    const result = await Promise.allSettled(fetchCalls);

    for (let i = 0; i < result.length; i++) {
        const e = result[i];

        if (e.status === 'fulfilled') {
            results = { ...e.value, ...results };
        }
    }

    return results;
};
