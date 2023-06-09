import { useFetch, useImageUrl, useAssetData } from '@nefty/use';
import type { Payload, GetBlendProperty, GetBlendResult } from '../types';
import {
    blendNameAndImage,
    displayTime,
    getVisuals,
    matchRarity,
    priceForInput,
} from '../utils';

let tokensJson: any = null;

export const getBlend = async ({
    atomic_url,
    blend_id,
    contract,
    chain,
}: GetBlendProperty): Promise<GetBlendResult | null> => {
    if (!contract) return null;

    const { data, error } = await useFetch<Payload>(
        `/neftyblends/v1/blends/${contract}/${blend_id}`,
        {
            baseUrl: atomic_url,
            params: {
                render_markdown: 'true',
            },
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
            use_count,
            account_limit,
            account_limit_cooldown,
            max,
        } = data.data;

        const now = new Date().getTime();

        const result = [];
        const items = {};
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
            let token;
            let ingredients_amount = 0;
            let collectionName = collection_name;

            // INGREDIENT - ATTRIBUTE
            if (type === 'ATTRIBUTE_INGREDIENT') {
                matcher_type = 'attributes';
                matcher = `${blend_id}|${contract}|${index}`;
                collectionName = attributes.collection_name;

                const displayData = display_data
                    ? JSON.parse(display_data)
                    : null;

                const message = attributes.attributes
                    .map(({ name, allowed_values }) => {
                        const values = allowed_values.join(', ');
                        return `${name} equals "${values}"`;
                    })
                    .join(' and ');

                items[matcher] = {
                    name: attributes.collection_name,
                    description: displayData?.description || message,
                    matcher_type,
                    matcher,
                    market_data: `${attributes.collection_name}|${attributes.schema_name}`,
                    video: null,
                    image: null,
                };
            }

            // INGREDIENT - BALANCE
            else if (type === 'BALANCE_INGREDIENT') {
                matcher = `${blend_id}|${contract}|${index}|${template.attribute_name}`;
                matcher_type = 'balance';
                collectionName = template.collection.collection_name;

                const asset = useAssetData(template);
                const { image, video } = getVisuals(
                    asset,
                    template.schema.format
                );

                value = template.cost;

                items[matcher] = {
                    name: template.attribute_name,
                    matcher_type,
                    matcher,
                    market_data: `${template.collection.collection_name}|${template.template_id}`,
                    value,
                    video: video ? useImageUrl(video as string) : null,
                    image: image ? useImageUrl(image as string) : null,
                };
            }

            // INGREDIENT - SCHEMA
            else if (type === 'SCHEMA_INGREDIENT') {
                matcher = `${schema.c}|${schema.s}`;
                matcher_type = 'schema';
                collectionName = schema.c;

                const displayData = display_data
                    ? JSON.parse(display_data)
                    : null;

                items[matcher] = {
                    name: schema.c,
                    description: displayData?.description,
                    matcher_type,
                    matcher,
                    market_data: `${schema.c}|${schema.s}`,
                    video: null,
                    image: null,
                };
            }

            // INGREDIENT - TEMPLATE
            else if (type === 'TEMPLATE_INGREDIENT') {
                matcher = template.template_id;
                matcher_type = 'template';
                collectionName = template.collection.collection_name;

                const asset = useAssetData(template);
                const { name } = asset;

                const { video, image } = getVisuals(
                    asset,
                    template.schema.format
                );

                items[matcher] = {
                    name,
                    matcher_type,
                    matcher,
                    market_data: `${template.collection.collection_name}|${template.template_id}`,
                    video: video ? useImageUrl(video as string) : null,
                    image: image ? useImageUrl(image as string) : null,
                };
            }

            // INGREDIENT - COLLECTION
            else if (type === 'COLLECTION_INGREDIENT') {
                matcher = collection?.collection_name;
                matcher_type = 'collection';
                collectionName = collection?.collection_name;

                const {
                    data: { img },
                } = collection;

                items[matcher] = {
                    name: matcher,
                    matcher_type,
                    matcher,
                    market_data: collection.collection_name,
                    video: null,
                    image: img ? useImageUrl(img as string) : null,
                };
            }

            // INGREDIENT - TOKEN
            if (type === 'FT_INGREDIENT') {
                matcher = `${ft_amount.token_symbol}|${ft_amount.token_contract}`;
                matcher_type = 'token';

                // fetch the tokens is not yet cached
                if (!tokensJson) {
                    const { data } = await useFetch<Record<string, unknown>>(
                        `/api/logos/${chain}`,
                        {
                            baseUrl: 'https://rates.neftyblocks.com',
                        }
                    );

                    if (data) tokensJson = data;
                }

                const { token_symbol, token_contract } = ft_amount;

                const img = tokensJson[`${token_symbol}@${token_contract}`];

                value = priceForInput(ft_amount.amount, ft_amount.precision);

                token = {
                    ...ft_amount,
                    value,
                };

                if (items[matcher]) {
                    value += items[matcher].value;

                    if (token) {
                        token.amount += items[matcher].token.amount;
                        token.value += items[matcher].token.value;
                    }
                }

                items[matcher] = {
                    name: token_symbol,
                    matcher_type,
                    matcher,
                    value,
                    video: null,
                    market_data: null,
                    image: img ? useImageUrl(img.logo as string) : null,
                    token,
                };
            }

            ingredients_amount = amount;

            if (requirements[matcher] && type !== 'FT_INGREDIENT') {
                ingredients_amount += requirements[matcher].amount;
            }

            requirements[matcher] = {
                key: type,
                collection_name: collectionName,
                amount: ingredients_amount,
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
        let max_reached = false;

        let backgroundImg = null;

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
                    const { template, pool } = results[b];

                    if (template) {
                        const issued_supply = +template.issued_supply;
                        const max_supply = +template.max_supply;
                        const maxReached =
                            max_supply === 0
                                ? false
                                : issued_supply === max_supply;

                        if (maxReached) max_reached = true;

                        const asset = useAssetData(template);
                        const { name } = asset;

                        const { image, video } = getVisuals(
                            asset,
                            template.schema.format
                        );

                        result.push({
                            name,
                            drop_rate: dropRate,
                            rarity,
                            matcher_type: 'template',
                            market_data: `${template.collection.collection_name}|${template.template_id}`,
                            mint: {
                                amount: +template.issued_supply,
                                supply:
                                    +template.max_supply === 0
                                        ? '∞'
                                        : template.max_supply,
                            },
                            video: video ? useImageUrl(video as string) : null,
                            image: image ? useImageUrl(image as string) : null,
                        });

                        if (!backgroundImg) {
                            backgroundImg = useImageUrl(
                                image as string,
                                300,
                                true
                            );
                        }
                    } else if (pool) {
                        const displayData = pool.display_data
                            ? JSON.parse(pool.display_data)
                            : null;

                        if (displayData) {
                            result.push({
                                name: displayData.name,
                                drop_rate: dropRate,
                                rarity,
                                matcher_type: 'pool',
                                mint: null,
                                video: displayData.video
                                    ? useImageUrl(displayData.video as string)
                                    : null,
                                image: displayData.image
                                    ? useImageUrl(displayData.image as string)
                                    : null,
                            });
                        }
                    }
                }
            }
        }

        const { blend_name } = blendNameAndImage(
            display_data,
            rolls[0].outcomes[0].results[0]
        );

        const soldOut = +max !== 0 && +use_count >= +max;

        return {
            blend_id,
            contract,
            collection_name,
            name: blend_name,
            description: display_data?.description,
            start_time,
            end_time,
            items: Object.values(items),
            results: result,
            category,
            ingredients_count,
            result_count: result.length,
            secure: security_id !== '0',
            security_id,
            odds: oddbased,
            requirements,
            account_limit: +account_limit,
            account_limit_cooldown: +account_limit_cooldown,
            count: {
                current: +use_count,
                max: +max,
            },
            status:
                displayTime(start_time, end_time, now) === 'ended'
                    ? 'ended'
                    : soldOut
                    ? 'sold-out'
                    : max_reached
                    ? 'max-reached'
                    : 'active',
            backgroundImg,
        };
    }

    return null;
};
