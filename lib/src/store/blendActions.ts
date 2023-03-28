import { useFetch, useImageUrl, useAssetData } from '@nefty/use';
import type { Payload, GetBlendProperty, GetBlendResult } from '../types';
import { blendNameAndImage, matchRarity, priceForInput } from '../utils';

let tokensJson: any = null;

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
