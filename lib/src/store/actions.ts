import { useFetch, useImageUrl, useAssetData } from '@nefty/use';

import type { GetBlendsProperty, Payload, GetBlendsResult, GetBlendProperty, GetBlendResult } from '../types';
import { blendNameAndImage, matchRarity, priceForInput } from '../utils';

let tokensJson: any = null;

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

            const { blend_img, blend_name } = blendNameAndImage(displayData, rolls[0].outcomes[0].results[0]);

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
                image: blend_img ? useImageUrl(blend_img) : null,
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
    chain,
}: GetBlendProperty): Promise<GetBlendResult | null> => {
    if (!contract) return null;

    const { data, error } = await useFetch<Payload>(`/neftyblends/v1/blends/${contract}/${blend_id}`, {
        baseUrl: atomic_url,
        params: {
            render_markdown: 'true',
        },
    });

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

        const items = [];
        const result = [];
        const requirements = {};

        // ------------------------------
        // INGREDIENTS & REQUIREMENTS
        // ingredients holds what should be displayed in the UI
        // requirements is what it will be checked against
        // the `matcher` is used to bond the two together
        // the `matcher_type` is used to determine what type of matcher and
        // which properties it will be checked against
        // ------------------------------
        for (let a = 0; a < ingredients.length; a++) {
            const { template, collection, attributes, schema, ft_amount, type, amount, index, display_data } =
                ingredients[a];

            let matcher;
            let matcher_type;
            let value;
            let token;

            // INGREDIENT - ATTRIBUTE
            if (type === 'ATTRIBUTE_INGREDIENT') {
                matcher_type = 'attributes';
                matcher = `${blend_id}|${contract}|${index}`;

                const displayData = display_data ? JSON.parse(display_data) : null;

                items.push({
                    name: attributes.collection_name,
                    description: displayData?.description,
                    matcher_type,
                    matcher,
                    video: null,
                    image: null,
                });
            }

            // INGREDIENT - BALANCE
            else if (type === 'BALANCE_INGREDIENT') {
                matcher = `${blend_id}|${contract}|${index}|${template.attribute_name}`;
                matcher_type = 'balance';

                const asset = useAssetData(template);
                const { img, video } = asset;

                value = template.cost;

                items.push({
                    name: template.attribute_name,
                    matcher_type,
                    matcher,
                    value,
                    video: video ? useImageUrl(video as string) : null,
                    image: img ? useImageUrl(img as string) : null,
                });
            }

            // INGREDIENT - SCHEMA
            else if (type === 'SCHEMA_INGREDIENT') {
                matcher = `${schema.c}|${schema.s}`;
                matcher_type = 'schema';

                const displayData = display_data ? JSON.parse(display_data) : null;

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

                // fetch is token is not yet cached
                if (!tokensJson) {
                    const { data } = await useFetch<any>(`/api/logos/${chain}`, {
                        baseUrl: 'https://rates.neftyblocks.com',
                    });

                    if (data) tokensJson = data;
                }

                const { token_symbol, token_contract } = ft_amount;

                const img = tokensJson[`${token_symbol}@${token_contract}`];

                value = priceForInput(ft_amount.amount, ft_amount.precision);

                token = {
                    ...ft_amount,
                    value,
                };

                items.push({
                    name: `${value} ${token_symbol}`,
                    matcher_type,
                    matcher,
                    video: null,
                    image: img ? useImageUrl(img.logo as string) : null,
                    token,
                });
            }

            requirements[matcher] = {
                key: type,
                collection_name,
                amount,
                value,
                token,
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
        let oddbased = true;

        for (let a = 0; a < outcomes.length; a++) {
            const { results, odds } = outcomes[a];

            const dropRate = (odds / totalOdds) * 100;

            if (dropRate === 100) {
                oddbased = false;
            }

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
                            supply: +template.max_supply === 0 ? '∞' : template.max_supply,
                        },
                        video: video ? useImageUrl(video as string) : null,
                        image: img ? useImageUrl(img as string) : null,
                    });
                }
            }
        }

        const { blend_name } = blendNameAndImage(display_data, rolls[0].outcomes[0].results[0]);

        return {
            blend_id,
            contract,
            name: blend_name,
            description: display_data?.description,
            start_time,
            end_time,
            items,
            results: result,
            category,
            ingredients_count,
            result_count: result.length,
            secure: security_id !== '0',

            odds: oddbased,
            requirements,
        };
    }

    return null;
};

const templateMintConfig = {
    is_transferable: 'true',
    is_burnable: 'true',
    order: 'desc',
    sort: 'template_mint',
};

const attributeConfig = {
    order: 'desc',
    sort: 'asset_id',
};

export const getAttributesAssetId = async ({ blend_id, contract, index, atomic_url, actor, matcher }) => {
    let result = {
        type: 'attributes',
        data: {},
    };

    const { data, error } = await useFetch<Payload>(
        `/neftyblends/v1/blends/${contract}/${blend_id}/ingredients/${index}/assets`,
        {
            baseUrl: atomic_url,
            params: {
                owner: actor,
                ...attributeConfig,
            },
        },
    );

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
export const getBalanceAssetId = async ({ blend_id, contract, index, atomic_url, actor, matcher, attribute_name }) => {
    let result = {
        type: 'balance',
        data: {},
    };

    const { data, error } = await useFetch<Payload>(
        `/neftyblends/v1/blends/${contract}/${blend_id}/ingredients/${index}/assets`,
        {
            baseUrl: atomic_url,
            params: {
                owner: actor,
                ...attributeConfig,
            },
        },
    );

    if (error) console.error(error);

    if (data) {
        const { data: assets } = data;

        if (assets.length) {
            result.data[matcher] = [];

            for (let i = 0; i < assets.length; i++) {
                const { asset_id, template_mint, mutable_data } = assets[i];

                result.data[matcher].push({
                    asset_id,
                    name: attribute_name,
                    mint: template_mint,
                    value: +mutable_data[attribute_name],
                });
            }
        }
    }

    return result;
};
export const getSchemaAssetId = async ({ collection_name, atomic_url, schema_name, actor, matcher }) => {
    let result = {
        type: 'schema',
        data: {},
    };

    const { data, error } = await useFetch<Payload>('/atomicassets/v1/assets', {
        baseUrl: atomic_url,
        params: {
            collection_name,
            schema_name,
            owner: actor,
            ...templateMintConfig,
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
export const getTemplateAssetId = async ({ template_id, collection_name, atomic_url, actor }) => {
    let result = {
        type: 'template',
        data: {},
    };

    const { data, error } = await useFetch<Payload>('/atomicassets/v1/assets', {
        baseUrl: atomic_url,
        params: {
            collection_name,
            template_id,
            owner: actor,
            ...templateMintConfig,
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
export const getCollectionAssetId = async ({ collection_name, atomic_url, actor }) => {
    let result = {
        type: 'collection',
        data: {},
    };

    const { data, error } = await useFetch<Payload>('/atomicassets/v1/assets', {
        baseUrl: atomic_url,
        params: {
            collection_name,
            owner: actor,
            ...templateMintConfig,
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
export const getTokenBalance = async ({ chain_url, actor, code, symbol, matcher }) => {
    let result = {
        type: 'token',
        data: {},
    };

    const { data, error } = await useFetch<Payload>('/v1/chain/get_currency_balance', {
        baseUrl: chain_url,
        method: 'POST',
        body: {
            code,
            symbol,
            account: actor,
        },
    });

    if (error) console.error(error);

    if (data) {
        result.data[matcher] = data[0];
    }

    return result;
};

export const getRequirements = async ({
    requirements,
    atomic_url,
    chain_url,
    actor,
}: {
    requirements: GetBlendResult['requirements'];
    atomic_url: string;
    chain_url: string;
    actor: string;
}) => {
    const fetchCalls = [];
    let results = {};

    const list = Object.values(requirements);

    for (let i = 0; i < list.length; i++) {
        const requirement = list[i];

        if (requirement.key === 'ATTRIBUTE_INGREDIENT') {
            const [blend_id, contract, index] = requirement.matcher.split('|');

            fetchCalls.push(
                getAttributesAssetId({
                    blend_id,
                    contract,
                    index,
                    actor,
                    atomic_url,
                    matcher: requirement.matcher,
                }),
            );
        } else if (requirement.key === 'BALANCE_INGREDIENT') {
            const [blend_id, contract, index, attribute_name] = requirement.matcher.split('|');
            fetchCalls.push(
                getBalanceAssetId({
                    blend_id,
                    contract,
                    index,
                    actor,
                    atomic_url,
                    matcher: requirement.matcher,
                    attribute_name,
                }),
            );
        } else if (requirement.key === 'SCHEMA_INGREDIENT') {
            const [, schema] = requirement.matcher.split('|');

            fetchCalls.push(
                getSchemaAssetId({
                    schema_name: schema,
                    collection_name: requirement.collection_name,
                    actor,
                    atomic_url,
                    matcher: requirement.matcher,
                }),
            );
        } else if (requirement.key === 'TEMPLATE_INGREDIENT') {
            fetchCalls.push(
                getTemplateAssetId({
                    template_id: requirement.matcher,
                    collection_name: requirement.collection_name,
                    actor,
                    atomic_url,
                }),
            );
        } else if (requirement.key === 'COLLECTION_INGREDIENT') {
            fetchCalls.push(
                getCollectionAssetId({
                    collection_name: requirement.matcher,
                    actor,
                    atomic_url,
                }),
            );
        } else if (requirement.key === 'FT_INGREDIENT') {
            const token = requirement.matcher.split('|');
            fetchCalls.push(
                getTokenBalance({
                    chain_url,
                    actor,
                    code: token[1],
                    symbol: token[0],
                    matcher: requirement.matcher,
                }),
            );
        }
    }

    const result = await Promise.allSettled(fetchCalls);

    for (let i = 0; i < result.length; i++) {
        const e = result[i];

        if (e.status === 'fulfilled') {
            results = { ...e.value.data, ...results };
        }
    }

    return results;
};

export const getClaims = async ({ contract, blend_id, tx_id, atomic_url }) => {
    const result = [];

    const { data, error } = await useFetch<Payload>(`/neftyblends/v1/blends/${contract}/${blend_id}/claims`, {
        baseUrl: atomic_url,
        params: {
            tx_id,
        },
    });

    if (error) console.error(error);

    if (data) {
        const outcomes = data.data[0].results;

        if (!outcomes.length) {
            result.push({
                name: 'empty',
                rarity: 'common',
                mint: null,
                empty: true,
                image: null,
            });
        } else {
            for (let b = 0; b < outcomes.length; b++) {
                const { template } = outcomes[b];

                if (!template) continue;

                const asset = useAssetData(template);
                const { img, video, name } = asset;

                result.push({
                    name,
                    mint: null,
                    rarity: 'common',
                    video: video ? useImageUrl(video as string) : null,
                    image: img ? useImageUrl(img as string) : null,
                });
            }
        }
    }

    return result;
};

export const getJobsCount = async ({ chain_url }) => {
    const { data, error } = await useFetch<any>('/v1/chain/get_table_by_scope', {
        baseUrl: chain_url,
        method: 'POST',
        body: {
            code: 'orng.wax',
            table: 'jobs.a',
            reverse: false,
            limit: 100,
            show_payer: false,
        },
    });

    if (error) console.error(error);

    return data ? data.rows.length : 0;
};
