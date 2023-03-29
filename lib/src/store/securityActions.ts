import { useFetch } from '@nefty/use';
import type { Payload } from '../types';
import { comparisonOperator, matchSecurityReason, switchFn } from '../utils';

export const getSecurityCheck = async ({ chain_url, actor, security_id, atomic_url, collection }) => {
    const response = {
        allowed: false,
        result: [],
        reason: '',
    };

    const [whitelistP, proofownP] = await Promise.allSettled([
        useFetch<any>('/v1/chain/get_table_rows', {
            baseUrl: chain_url,
            method: 'POST',
            body: {
                code: 'secure.nefty',
                scope: security_id,
                table: 'whitelists',
                limit: 1,
                json: true,
            },
        }),
        useFetch<any>('/v1/chain/get_table_rows', {
            baseUrl: chain_url,
            method: 'POST',
            body: {
                code: 'secure.nefty',
                scope: collection,
                table: 'proofown',
                limit: 1,
                lower_bound: security_id,
                upper_bound: security_id,
                json: true,
            },
        }),
    ]);

    if (whitelistP.status === 'fulfilled') {
        const { data } = whitelistP.value;

        if (data.rows.length > 0) {
            for (let i = 0; i < data.rows.length; i++) {
                const { account } = data.rows[i];

                if (account === actor) {
                    response.allowed = true;
                    response.result = [
                        'WHITELIST_CHECK',
                        {
                            account_name: actor,
                        },
                    ];

                    break;
                } else {
                    response.reason = 'not whitelisted';
                }
            }
        } else {
            response.reason = 'whitelist not found';
        }
    }

    if (proofownP.status === 'fulfilled') {
        const { data } = proofownP.value;
        const res = await ownership(data, actor, atomic_url, chain_url);

        if (res) {
            const { validtokens, missingAssets, validAssets, reason } = res;
            const valid = validtokens && !missingAssets;

            response.allowed = valid;

            if (valid) {
                response.result = [
                    'OWNERSHIP_CHECK',
                    {
                        account_name: actor,
                        asset_ids: validAssets,
                    },
                ];
            } else {
                response.reason = matchSecurityReason[reason];
            }
        } else {
            response.reason = 'proof of ownership failed';
        }
    }

    return response;
};

// --------------------------------------------------
// PROOF OF OWNERSHIP
// --------------------------------------------------
async function ownership(value, actor, atomic_url, chain_url) {
    const { rows } = value;

    let validAssets = [];
    let validtokens = true;
    let missingAssets = false;
    let reason = '';

    if (rows.length) {
        const {
            group: { filters, logical_operator },
        } = rows[0];

        for (let i = 0; i < filters.length; i++) {
            const [key, value] = filters[i];

            if (key === 'TOKEN_HOLDING') {
                const token = await proofOfTokenship({ value, actor, chain_url });

                if (+logical_operator === 1) {
                    validtokens = token;

                    if (token === true) {
                        validtokens = true;
                        break;
                    }
                } else {
                    validtokens = token;

                    if (token === false) {
                        validtokens = false;
                        reason = key;

                        break;
                    }
                }
            } else {
                const assets = await proofOfOwnership({ key, value, actor, atomic_url });

                if (assets.length) {
                    validAssets.push(...assets);

                    if (+logical_operator === 1) {
                        missingAssets = false;

                        break;
                    }
                } else {
                    missingAssets = true;
                    reason = key;
                }
            }
        }

        // if any of the assets is missing (not matching requirements) send back empty array
        validAssets = missingAssets ? [] : [...new Set(validAssets)];

        return { logical_operator, validtokens, missingAssets, validAssets, reason };
    }

    return null;
}

async function proofOfTokenship({ value, chain_url, actor }): Promise<boolean> {
    const [amount, symbol] = value.amount.split(' ');

    const { data, error } = await useFetch<any>('/v1/chain/get_currency_balance', {
        baseUrl: chain_url,
        method: 'POST',
        body: {
            code: value.token_contract,
            symbol,
            account: actor,
        },
    });

    if (error) console.error(error);

    if (data) {
        for (let i = 0; i < data.length; i++) {
            const [tokenAmount, tokenSymbol] = data[i].split(' ');

            if (tokenSymbol === symbol) {
                return comparisonOperator[+value.comparison_operator](+tokenAmount, +amount);
            }
        }
    }

    return false;
}

async function proofOfOwnership({ key, value, actor, atomic_url }): Promise<any> {
    const { collection_name, template_id, schema_name, comparison_operator, amount } = value;

    const assetsIds = [];
    const limit = `${+amount + 1}`;

    const cases = {
        TEMPLATE_HOLDINGS: async () => {
            const { data, error } = await useFetch<Payload>('/atomicassets/v1/assets', {
                baseUrl: atomic_url,
                method: 'GET',
                params: {
                    owner: actor,
                    collection_name,
                    template_id,
                    limit,
                },
            });

            if (error) return [];
            return data.data;
        },
        COLLECTION_HOLDINGS: async () => {
            const { data, error } = await useFetch<Payload>('/atomicassets/v1/assets', {
                baseUrl: atomic_url,
                method: 'GET',
                params: {
                    owner: actor,
                    collection_name,
                    limit,
                },
            });

            if (error) return [];
            return data.data;
        },
        SCHEMA_HOLDINGS: async () => {
            const { data, error } = await useFetch<Payload>('/atomicassets/v1/assets', {
                baseUrl: atomic_url,
                method: 'GET',
                params: {
                    owner: actor,
                    collection_name,
                    schema_name,
                    limit,
                },
            });

            if (error) return [];
            return data.data;
        },
        _default: async () => Promise.resolve([]),
    };

    const keySwitch = switchFn(cases, '_default');

    const assets = (await keySwitch(key)) as any[];

    for (let i = 0; i < assets.length; i++) {
        const { asset_id } = assets[i];

        assetsIds.push(asset_id);
    }

    if (comparisonOperator[+comparison_operator](assetsIds.length, +amount)) return assetsIds;
    else {
        return [];
    }
}
