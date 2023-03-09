import { useFetch, useImageUrl, useAssetData } from '@nefty/use';
import type {
    GetBlendsProperty,
    Payload,
    GetBlendsResult,
    GetBlendProperty,
    GetBlendResult,
} from '../types';
import { findAttributeParent, matchRarity, priceForInput } from '../utils';

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
        // ingredients holds what should be displayed in the UI
        // requirements is what it will be checked against
        // the `matcher` is used to bond the two together
        // the `matcher_type` is used to determine what type of matcher and
        // which properties it will be checked against
        // ------------------------------
        for (let a = 0; a < ingredients.length; a++) {
            const {
                template,
                collection,
                attributes,
                schema,
                ft_amount,
                type,
                amount,
                index,
                display_data,
            } = ingredients[a];

            let matcher;
            let matcher_type;
            let value;

            // INGREDIENT - ATTRIBUTE
            if (type === 'ATTRIBUTE_INGREDIENT') {
                matcher_type = 'attributes';

                const attr = attributes.attributes;

                matcher = `${attributes.collection_name}|${
                    attributes.schema_name
                }|${attr.map(({ name }) => name).join('&')}|${index}`;

                // quickly find out where the attribute is nested
                const { data } = await useFetch<Payload>(
                    '/atomicassets/v1/assets',
                    {
                        baseUrl: atomic_url,
                        params: {
                            schema_name: attributes.schema_name,
                            collection_name,
                            limit: '1',
                        },
                    }
                );

                if (data) {
                    for (let i = 0; i < attr.length; i++) {
                        const { name } = attr[i];

                        const result = findAttributeParent(name, data.data[0]);

                        attr[i].pre = result;
                    }
                }

                value = attr;

                const displayData = display_data
                    ? JSON.parse(display_data)
                    : null;

                items.push({
                    name: attributes.collection_name,
                    description: displayData?.description,
                    matcher_type,
                    matcher,
                    video: null,
                    image: null,
                });
            }

            // INGREDIENT - SCHEMA
            else if (type === 'SCHEMA_INGREDIENT') {
                matcher = `${schema.c}|${schema.s}`;
                matcher_type = 'schema';

                const displayData = display_data
                    ? JSON.parse(display_data)
                    : null;

                items.push({
                    name: schema.c,
                    description: displayData?.description,
                    matcher_type,
                    matcher,
                    video: null,
                    image: null,
                });
            }

            // INGREDIENT - TEMPLATE
            else if (type === 'TEMPLATE_INGREDIENT') {
                matcher = template?.template_id;
                matcher_type = 'template';

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
            else if (type === 'COLLECTION_INGREDIENT') {
                matcher = collection?.collection_name;
                matcher_type = 'collection';

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
                matcher_type = 'token';

                const { token_symbol } = ft_amount;

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

export const getAttributesAssetId = async ({
    schema_name,
    collection_name,
    attribute,
    atomic_url,
    account,
    matcher,
}) => {
    let result = {
        type: 'attributes',
        data: {},
    };

    const { data, error } = await useFetch<Payload>('/atomicassets/v1/assets', {
        baseUrl: atomic_url,
        params: {
            schema_name,
            collection_name,
            owner: account,
            [attribute.key]: attribute.value,
            ...assetsConfig,
        },
    });

    if (error) console.error(error);

    if (data) {
        const { data: assets } = data;

        if (assets.length) {
            result.data[matcher] = [];

            for (let i = 0; i < assets.length; i++) {
                const { asset_id, template_mint } = assets[i];

                const asset = useAssetData(assets[i]);
                const { video, img, name } = asset;

                result.data[matcher].push({
                    asset_id,
                    name,
                    mint: template_mint,
                    video: video ? useImageUrl(video as string) : null,
                    image: img ? useImageUrl(img as string) : null,
                });
            }
        }
    }

    return result;
};
export const getSchemaAssetId = async ({
    collection_name,
    atomic_url,
    schema_name,
    account,
    matcher,
}) => {
    let result = {
        type: 'schema',
        data: {},
    };

    const { data, error } = await useFetch<Payload>('/atomicassets/v1/assets', {
        baseUrl: atomic_url,
        params: {
            collection_name,
            schema_name,
            owner: account,
            ...assetsConfig,
        },
    });

    if (error) console.error(error);

    if (data) {
        const { data: assets } = data;

        if (assets.length) {
            result.data[matcher] = [];

            for (let i = 0; i < assets.length; i++) {
                const { asset_id, template_mint } = assets[i];

                const asset = useAssetData(assets[i]);
                const { video, img, name } = asset;

                result.data[matcher].push({
                    asset_id,
                    name,
                    mint: template_mint,
                    video: video ? useImageUrl(video as string) : null,
                    image: img ? useImageUrl(img as string) : null,
                });
            }
        }
    }

    return result;
};
export const getTemplateAssetId = async ({
    template_id,
    collection_name,
    atomic_url,
    account,
}) => {
    let result = {
        type: 'template',
        data: {},
    };

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
            result.data[template_id] = [];

            for (let i = 0; i < assets.length; i++) {
                const { asset_id, template_mint } = assets[i];

                result.data[template_id].push({
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
    let result = {
        type: 'collection',
        data: {},
    };

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
            result.data[collection_name] = [];

            for (let i = 0; i < assets.length; i++) {
                const { asset_id, template_mint } = assets[i];

                const asset = useAssetData(assets[i]);
                const { video, img, name } = asset;

                result.data[collection_name].push({
                    asset_id,
                    name,
                    mint: template_mint,
                    video: video ? useImageUrl(video as string) : null,
                    image: img ? useImageUrl(img as string) : null,
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
    let result = {
        type: 'token',
        data: {},
    };

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
        result.data[matcher] = data[0];
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

        if (requirment.key === 'ATTRIBUTE_INGREDIENT') {
            const [, schema] = requirment.matcher.split('|');

            for (
                let i = 0;
                i < (requirment.value as Record<string, any>[]).length;
                i++
            ) {
                const { allowed_values, name, pre } = requirment.value[i];

                for (let a = 0; a < allowed_values.length; a++) {
                    const value = allowed_values[a];

                    fetchCalls.push(
                        getAttributesAssetId({
                            schema_name: schema,
                            collection_name: requirment.collection_name,
                            attribute: {
                                key: `${pre}.${name}`,
                                value,
                            },
                            account,
                            atomic_url,
                            matcher: `attribute-${name}-${a}:${requirment.matcher}`,
                        })
                    );
                }
            }
        } else if (requirment.key === 'SCHEMA_INGREDIENT') {
            const [, schema] = requirment.matcher.split('|');

            fetchCalls.push(
                getSchemaAssetId({
                    schema_name: schema,
                    collection_name: requirment.collection_name,
                    account,
                    atomic_url,
                    matcher: requirment.matcher,
                })
            );
        } else if (requirment.key === 'TEMPLATE_INGREDIENT') {
            fetchCalls.push(
                getTemplateAssetId({
                    template_id: requirment.matcher,
                    collection_name: requirment.collection_name,
                    account,
                    atomic_url,
                })
            );
        } else if (requirment.key === 'COLLECTION_INGREDIENT') {
            fetchCalls.push(
                getCollectionAssetId({
                    collection_name: requirment.matcher,
                    account,
                    atomic_url,
                })
            );
        } else if (requirment.key === 'FT_INGREDIENT') {
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
            if (e.value.type === 'attributes') {
                const keys = Object.keys(e.value.data);
                const key = keys[0].split(':')[1];

                const temp = [];

                for (let a = 0; a < keys.length; a++) {
                    temp.push(...e.value.data[keys[a]]);
                }

                results = {
                    [key]: temp,
                    ...results,
                };
            } else {
                results = { ...e.value.data, ...results };
            }
        }
    }

    return results;
};
