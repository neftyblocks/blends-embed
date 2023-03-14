import type { TransactionAction } from '../types';

export const blendTransactionActions = ({
    account,
    contract,
    blend_id,
    asset_ids,
    tokens,
    balance_asset_ids,
}): TransactionAction[] => {
    const { actor, permission } = account;
    const security_check = false;

    const actions = [];

    // both craft.tag and blend.nefty use the same transfer action
    const tokensActions = [];
    const assetsActions = [];

    if (tokens.length > 0) {
        for (let i = 0; i < tokens.length; i++) {
            const { token_precision, token_symbol, token_contract, value } = tokens[i];
            tokensActions.push(
                {
                    account: contract,
                    name: 'openbal',
                    authorization: [
                        {
                            actor,
                            permission,
                        },
                    ],
                    data: {
                        owner: actor,
                        token_symbol: `${token_precision},${token_symbol}`,
                    },
                },
                {
                    account: token_contract,
                    name: 'transfer',
                    authorization: [
                        {
                            actor,
                            permission,
                        },
                    ],
                    data: {
                        from: actor,
                        to: contract,
                        quantity: `${value.toFixed(token_precision)} ${token_symbol}`,
                        memo: 'deposit',
                    },
                },
            );
        }
    }

    if (asset_ids.length > 0) {
        assetsActions.push(
            {
                account: contract,
                name: 'announcedepo',
                authorization: [
                    {
                        actor,
                        permission,
                    },
                ],
                data: {
                    owner: actor,
                    count: asset_ids.length,
                },
            },
            {
                account: 'atomicassets',
                name: 'transfer',
                authorization: [
                    {
                        actor,
                        permission,
                    },
                ],
                data: {
                    from: actor,
                    to: contract,
                    asset_ids: asset_ids,
                    memo: 'deposit',
                },
            },
        );
    }

    if (contract === 'blenderizerx') {
        actions.push({
            account: 'atomicassets',
            name: 'transfer',
            authorization: [
                {
                    actor,
                    permission,
                },
            ],
            data: {
                from: actor,
                to: contract,
                asset_ids,
                memo: blend_id,
            },
        });
    }

    if (contract === 'blend.nefty') {
        const check = security_check ? { security_check } : {};
        actions.push(...tokensActions, ...assetsActions, {
            account: contract,
            name: security_check ? 'fuse' : 'nosecfuse',
            authorization: [
                {
                    actor,
                    permission,
                },
            ],
            data: {
                claimer: actor,
                blend_id: blend_id,
                transferred_assets: asset_ids,
                own_assets: balance_asset_ids,
                ...check,
            },
        });
    }

    if (contract === 'craft.tag') {
        if (security_check) {
            actions.push(...tokensActions, ...assetsActions, {
                account: contract,
                name: 'fuse',
                authorization: [
                    {
                        actor,
                        permission,
                    },
                ],
                data: {
                    claimer: actor,
                    blend_id: blend_id,
                    transferred_assets: asset_ids,
                    own_assets: balance_asset_ids,
                    security_check: security_check,
                },
            });
        } else {
            actions.push({
                account: 'atomicassets',
                name: 'transfer',
                authorization: [
                    {
                        actor,
                        permission,
                    },
                ],
                data: {
                    from: actor,
                    to: contract,
                    asset_ids: asset_ids,
                    memo: `blend:${blend_id}`,
                },
            });
        }
    }

    return actions;
};
