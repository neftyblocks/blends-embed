import { useFetch, useImageUrl, useAssetData, useRetry, useTokenDisplay } from '@nefty/use';
import type { Payload, GetBlendResult } from '../types';
import { priceForInput } from '../utils';

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

const isBackedByTokens = (backed_tokens) => {
    const amount = backed_tokens.length > 0;

    if (amount) {
        const tokens = [];

        for (let i = 0; i < backed_tokens.length; i++) {
            const { amount, token_precision, token_symbol } = backed_tokens[i];
            tokens.push(`${useTokenDisplay(priceForInput(amount, token_precision), token_precision)} ${token_symbol}`);
        }

        return tokens.join(', ');
    }

    return null;
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
            const normal = [];
            const backed = [];

            for (let i = 0; i < assets.length; i++) {
                const { asset_id, template_mint, backed_tokens } = assets[i];

                const asset = useAssetData(assets[i]);
                const { video, img, name } = asset;

                const backedByTokens = isBackedByTokens(backed_tokens);

                const content = {
                    asset_id,
                    name,
                    mint: template_mint,
                    video: video ? useImageUrl(video as string) : null,
                    image: img ? useImageUrl(img as string) : null,
                    backedByTokens,
                };

                backedByTokens ? backed.push(content) : normal.push(content);
            }

            result.data[matcher] = [...normal, ...backed];
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
            const normal = [];
            const backed = [];

            for (let i = 0; i < assets.length; i++) {
                const { asset_id, template_mint, mutable_data, backed_tokens } = assets[i];

                const backedByTokens = isBackedByTokens(backed_tokens);

                const content = {
                    asset_id,
                    name: attribute_name,
                    mint: template_mint,
                    value: +mutable_data[attribute_name],
                    backedByTokens,
                };

                backedByTokens ? backed.push(content) : normal.push(content);
            }

            result.data[matcher] = [...normal, ...backed];
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
            const normal = [];
            const backed = [];

            for (let i = 0; i < assets.length; i++) {
                const { asset_id, template_mint, backed_tokens } = assets[i];

                const asset = useAssetData(assets[i]);
                const { video, img, name } = asset;
                const backedByTokens = isBackedByTokens(backed_tokens);

                const content = {
                    asset_id,
                    name,
                    mint: template_mint,
                    video: video ? useImageUrl(video as string) : null,
                    image: img ? useImageUrl(img as string) : null,
                    backedByTokens,
                };

                backedByTokens ? backed.push(content) : normal.push(content);
            }

            result.data[matcher] = [...normal, ...backed];
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
            const normal = [];
            const backed = [];

            for (let i = 0; i < assets.length; i++) {
                const { asset_id, template_mint, backed_tokens } = assets[i];
                const backedByTokens = isBackedByTokens(backed_tokens);

                const content = {
                    asset_id,
                    mint: template_mint,
                    backedByTokens,
                };

                backedByTokens ? backed.push(content) : normal.push(content);
            }

            result.data[template_id] = [...normal, ...backed];
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
            const normal = [];
            const backed = [];

            for (let i = 0; i < assets.length; i++) {
                const { asset_id, template_mint, backed_tokens } = assets[i];

                const asset = useAssetData(assets[i]);
                const { video, img, name } = asset;
                const backedByTokens = isBackedByTokens(backed_tokens);

                const content = {
                    asset_id,
                    name,
                    mint: template_mint,
                    video: video ? useImageUrl(video as string) : null,
                    image: img ? useImageUrl(img as string) : null,
                    backedByTokens,
                };

                backedByTokens ? backed.push(content) : normal.push(content);
            }

            result.data[collection_name] = [...normal, ...backed];
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

    const { data, error } = await useRetry({
        retries: 3,
        delay: 1500,
        retryOn: ({ data }) => data.length === 0,
        call: () =>
            useFetch<Payload>(`/neftyblends/v1/blends/${contract}/${blend_id}/claims`, {
                baseUrl: atomic_url,
                params: {
                    tx_id,
                },
            }),
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
