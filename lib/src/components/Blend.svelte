<svelte:options tag="nefty-blend-item" />

<script lang="ts">
    import { get_current_component } from 'svelte/internal';
    import { getBlend, getClaims, getRequirements, settings } from '../store';
    import type { GetBlendResult } from '../types';
    import {
        dispatch,
        formatTokenWithoutSymbol,
        sortedRequirements,
        matchAssetRequirements,
        matchTokenRequirements,
        getMarketUrl,
        blendTransactionActions,
        swoop,
    } from '../utils';

    // COMPONENTS
    import Sprite from './Sprite.svelte';
    import './Slider.svelte';
    import './Selecter.svelte';

    // GLOBALS
    const component = get_current_component();

    // STATES
    let data = undefined;
    let selection = undefined;
    let loading = true;
    let selected = {};
    let claims = null;

    let selectionGroupElement;

    let showClaims = false;

    let marketUrl = '';
    let collectionName = '';
    let user = undefined;

    let selectedAssetsToBlend = [];
    let selectedTokensToBlend = [];
    let selectedBalanceAssets = [];

    const hasVisual = ['collection', 'template', 'token', 'balance'];

    // METHODS
    const unsubscribe = settings.subscribe(
        async ({ config, blend, account, transactionId }) => {
            // config flow
            if (config && blend) {
                data = await getBlend({
                    atomic_url: config.atomic_url,
                    blend_id: blend.blend_id,
                    contract: blend.contract,
                    chain: config.chain,
                });

                console.log('blend', data);

                marketUrl = config.marketplace_url;
                collectionName = config.collection;
            }

            // user flow
            user = account;

            if (account && data?.requirements) {
                selection = await getRequirements({
                    requirements: data.requirements,
                    atomic_url: config.atomic_url,
                    chain_url: config.chain_url,
                    actor: account.actor,
                });

                autoSelect(data.requirements);
            } else {
                selection = undefined;
            }

            // transaction flow
            if (transactionId) {
                // do something
                loading = true;

                claims = await getClaims({
                    atomic_url: config.atomic_url,
                    blend_id: blend.blend_id,
                    contract: blend.contract,
                    tx_id: transactionId,
                });

                console.log('claims', claims);

                showClaims = true;

                settings.update((s) => {
                    s.transactionId = undefined;
                    return s;
                });
            }

            loading = false;
        }
    );

    const updateSelection = ({ detail }, matcher: string) => {
        selected[matcher] = detail;
    };

    const autoSelect = (requirements: GetBlendResult['requirements']) => {
        const list = sortedRequirements(requirements);

        const selected_asset_ids = [];

        for (let i = 0; i < list.length; i++) {
            const { matcher, matcher_type, amount, value } = list[i];

            // If the matcher is a token we don't need to auto select
            if (matcher_type === 'token') {
                const [tokenValue] = selection[matcher].split(' ');

                if (+tokenValue >= value) {
                    selected[matcher] = selection[matcher];
                }
            } else {
                if (selection[matcher] && selection[matcher].length >= amount) {
                    const temp = [...selection[matcher]];

                    for (let j = 0; j < temp.length; j++) {
                        const asset = temp[j];
                        if (selected_asset_ids.includes(asset.asset_id)) {
                            temp.splice(j, 1);
                            j--;
                        }
                    }

                    selected[matcher] = temp.slice(0, amount);

                    for (let j = 0; j < selected[matcher].length; j++) {
                        const asset = selected[matcher][j];
                        selected_asset_ids.push(asset.asset_id);
                    }
                }
            }
        }
    };

    const validateSelection = (requirements) => {
        const list = sortedRequirements(requirements);

        // Reset the selected assets and tokens
        selectedAssetsToBlend = [];
        selectedTokensToBlend = [];
        selectedBalanceAssets = [];

        let meetRequirements = true;

        for (let i = 0; i < list.length; i++) {
            const { matcher, matcher_type, token, amount, value } = list[i];

            if (matcher_type === 'token') {
                if (matchTokenRequirements(selected[matcher], list[i])) {
                    // value or amount should be used

                    // TODO: add a check for the amount if multiple the same token is selected
                    selectedTokensToBlend.push(token);
                } else {
                    console.error('missing token');

                    meetRequirements = false;
                    break;
                }
            } else {
                if (matchAssetRequirements(selected[matcher], list[i])) {
                    for (let i = 0; i < selected[matcher].length; i++) {
                        const { asset_id } = selected[matcher][i];

                        if (
                            !selectedAssetsToBlend.includes(asset_id) &&
                            !selectedBalanceAssets.includes(asset_id)
                        ) {
                            matcher_type === 'balance'
                                ? selectedBalanceAssets.push(asset_id)
                                : selectedAssetsToBlend.push(asset_id);
                        } else {
                            console.error('duplicate asset');

                            meetRequirements = false;
                            break;
                        }
                    }
                } else {
                    console.error('missing asset');

                    meetRequirements = false;
                    break;
                }
            }
        }

        return meetRequirements;
    };

    const close = () => {
        // Avoid onDestroy this doesn't work to clean up the subscription
        unsubscribe();

        data = undefined;
        selection = undefined;
        loading = true;
        selected = {};
        claims = null;
        showClaims = false;

        dispatch('blend', null, component);
    };

    const blend = (requirements) => {
        const allowed = validateSelection(requirements);

        if (allowed) {
            const transactions = blendTransactionActions({
                account: user,
                blend_id: data.blend_id,
                contract: data.contract,
                asset_ids: selectedAssetsToBlend,
                balance_asset_ids: selectedBalanceAssets,
                tokens: selectedTokensToBlend,
            });

            animateCards();

            dispatch('sign', transactions, component);
        }
    };

    const animateCards = () => {
        const selectedAssets = selectionGroupElement.querySelectorAll(
            '.selection-item > div'
        );

        const center =
            selectionGroupElement.getBoundingClientRect().left +
            selectionGroupElement.getBoundingClientRect().width / 2;

        selectedAssets.forEach((asset, index) => {
            const assetCenter = asset.getBoundingClientRect().left + 100;
            const distance = center - assetCenter;

            // animate the asset to the center of the screen
            asset.animate(
                [
                    {
                        transform: 'translate3d(0, 0, 0)',
                    },
                    {
                        transform: `translate3d(${distance}px, -200%, 0)`,
                        opacity: 1,
                    },
                    {
                        transform: `translate3d(${distance}px, -200%, 0)`,
                        opacity: 0,
                    },
                ],
                {
                    duration: 1000,
                    delay: 50 * index,
                    easing: 'cubic-bezier(0.7, 0.06, 0.42, 0.99)',
                    fill: 'forwards',
                }
            );
        });
    };
</script>

<Sprite />

{#if data}
    <button class="btn-clear back" on:click={close}>
        <svg role="presentation" focusable="false" aria-hidden="true">
            <use xlink:href="#arrow_left" />
        </svg>
        back
    </button>
    <div
        class="blend {data.description ? '' : 'no-text'} {showClaims
            ? 'claims'
            : ''}"
    >
        {#if showClaims && claims}
            <section class="blend-results">
                <nefty-blend-slider items={claims} claims={true} />
                <div
                    class="result-bg"
                    style="background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTguNSAxNC41QTIuNSAyLjUgMCAwIDAgMTEgMTJjMC0xLjM4LS41LTItMS0zLTEuMDcyLTIuMTQzLS4yMjQtNC4wNTQgMi02IC41IDIuNSAyIDQuOSA0IDYuNSAyIDEuNiAzIDMuNSAzIDUuNWE3IDcgMCAxIDEtMTQgMGMwLTEuMTUzLjQzMy0yLjI5NCAxLTNhMi41IDIuNSAwIDAgMCAyLjUgMi41eiI+PC9wYXRoPjwvc3ZnPgo=');"
                />
            </section>
        {:else}
            <main>
                <section class="blend-results">
                    <nefty-blend-slider items={data.results} />
                    <img
                        class="result-bg"
                        src={data.results[0].image}
                        alt=""
                        loading="lazy"
                    />
                </section>
                <section>
                    <button
                        disabled={loading || !user}
                        class="btn btn--primary"
                        on:click={() => blend(data.requirements)}
                    >
                        {loading ? 'Loading' : user ? 'Blend' : 'Not logged in'}
                    </button>
                </section>
                <section class="blend-selection">
                    <h2>Ingredients</h2>
                    <small>Ingredients will be consumed</small>
                    <div
                        class="selection-group"
                        bind:this={selectionGroupElement}
                    >
                        {#each data.items as item, key}
                            <div class="selection-item">
                                {#if selection}
                                    <div
                                        class={matchAssetRequirements(
                                            selection[item.matcher],
                                            data.requirements[item.matcher]
                                        )
                                            ? 'owned'
                                            : 'needed'}
                                        transition:swoop={{ key }}
                                    >
                                        <small class="type"
                                            >{item.matcher_type}</small
                                        >
                                        {#if hasVisual.includes(item.matcher_type)}
                                            <figure
                                                class="visual {item.matcher_type}"
                                            >
                                                {#if item.video}
                                                    <video
                                                        src={item.video}
                                                        loop
                                                        autoplay
                                                        muted
                                                        playsinline
                                                    />
                                                {:else if item.image}
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                    />
                                                {/if}
                                            </figure>
                                        {:else}
                                            <span class="visual visual--small">
                                                {item.description
                                                    ? item.description
                                                    : ' '}
                                            </span>
                                        {/if}

                                        <h3>
                                            {#if item.value} {item.value} {/if}
                                            {item.name}
                                        </h3>

                                        {#if item.matcher_type !== 'token'}
                                            {#if matchAssetRequirements(selection[item.matcher], data.requirements[item.matcher])}
                                                <nefty-blend-selecter
                                                    items={selection[
                                                        item.matcher
                                                    ]}
                                                    matchertype={item.matcher_type}
                                                    amount={data.requirements[
                                                        item.matcher
                                                    ].amount}
                                                    selected={selected[
                                                        item.matcher
                                                    ]}
                                                    on:selected={(e) =>
                                                        updateSelection(
                                                            e,
                                                            item.matcher
                                                        )}
                                                />
                                            {:else}
                                                <!-- svelte-ignore security-anchor-rel-noreferrer -->
                                                <a
                                                    class="btn"
                                                    href={getMarketUrl(
                                                        item,
                                                        marketUrl,
                                                        collectionName
                                                    )}
                                                    target="_blank"
                                                    rel="noopener"
                                                >
                                                    Get {data.requirements[
                                                        item.matcher
                                                    ].amount} asset{(data.requirements[
                                                        item.matcher
                                                    ].amount = 1 ? '' : 's')}
                                                </a>{/if}
                                        {:else if matchTokenRequirements(selection[item.matcher], data.requirements[item.matcher])}
                                            <p class="balance">
                                                <small>current balance</small>
                                                {formatTokenWithoutSymbol(
                                                    selection[item.matcher],
                                                    2
                                                )}
                                                <span>
                                                    {item.token.token_symbol}
                                                </span>
                                            </p>
                                        {:else}
                                            <!-- svelte-ignore security-anchor-rel-noreferrer -->
                                            <a
                                                class="btn"
                                                href=""
                                                target="_blank"
                                                rel="noopener"
                                            >
                                                Get more {item.token
                                                    .token_symbol}
                                            </a>
                                        {/if}
                                    </div>
                                {:else if !user}
                                    <span
                                        transition:swoop={{ key }}
                                        class="no-user"
                                    >
                                        <svg
                                            role="presentation"
                                            focusable="false"
                                            aria-hidden="true"
                                        >
                                            <use xlink:href="#ghost" />
                                        </svg>
                                        <small>
                                            Our friendly ghost is here to remind
                                            you to log in first
                                        </small>
                                    </span>
                                {:else}
                                    <span class="loading-state" />
                                {/if}
                            </div>
                        {/each}
                    </div>
                </section>
            </main>
            {#if data.description}
                <aside class="blend-text">
                    <article class="markdown">
                        {@html data.description}

                        <template>
                            <h1>0</h1>
                            <h2>0</h2>
                            <h3>0</h3>
                            <h4>0</h4>
                            <h5>0</h5>
                            <strong />
                            <p />
                            <ul />
                            <li />
                            <a href="#0">0</a>
                            <img alt="" />
                            <table>
                                <th />
                                <td />
                            </table>
                        </template>
                    </article>
                </aside>
            {/if}
        {/if}
    </div>
{:else if data === null}
    <div>An error happend</div>
{:else}
    <div>loading blend...</div>
{/if}

<style lang="scss">
    @import '../style/global.scss';
    @import '../style/markdown.scss';
    @import '../style/button.scss';

    .blend {
        display: grid;
        grid-template-columns: 1fr 0.3fr;
        gap: 48px;

        &.no-text {
            grid-template-columns: 1fr;
        }

        &.claims {
            // animate grid to full width
            grid-template-columns: 1fr 0fr;
            transition: grid;
            transition: 0.6s;

            .blend-text,
            .blend-selection {
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .blend-results {
                height: 500px;
                transition: height 0.6s ease;
            }

            .result-bg {
                animation: bganimation 5s linear forwards;
            }

            @keyframes bganimation {
                0% {
                    filter: blur(120px);
                    background-position: 0% 0%;
                    background-size: 5% 14%;
                    transform: rotate(9deg) scale(1.5);
                }
                20% {
                    filter: blur(0px);
                }

                80% {
                    filter: blur(0px);
                }
                100% {
                    filter: blur(120px);
                    background-position: 100% 0%;
                    background-size: 5% 14%;
                    transform: rotate(9deg) scale(1.5);
                }
            }
        }

        & main {
            display: flex;
            flex-direction: column;
            gap: 48px;
        }
    }

    .back {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--nb-color);
        margin-bottom: 12px;

        &:hover {
            svg {
                transform: scale(1.1);
            }
        }

        &:active {
            svg {
                transform: scale(0.9);
            }
        }

        svg {
            width: 28px;
            height: 28px;
            transition: transform 0.15s ease;
        }
    }

    .blend-text {
        background-color: var(--nb-bg-card);
        border-radius: var(--nb-radius);
        border: var(--nb-border-size) solid var(--nb-border);
        padding: 12px;
        max-height: calc(100vh - var(--nb-markdown-offset));
        overflow: hidden auto;
    }

    .blend-results {
        background-color: var(--nb-bg-card);
        border-radius: var(--nb-radius);
        border: var(--nb-border-size) solid var(--nb-border);
        height: 350px;
        position: relative;
        overflow: hidden;
        z-index: 0;
    }

    .result-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: blur(120px);
        transform: translate3d(0, 0, 0);
        opacity: 0.3;
        z-index: -1;
        user-select: none;
    }

    .blend-selection {
        text-align: center;

        h2 {
            color: var(--nb-color-secondary);
            font-size: var(--nb-font-size--large);
            position: relative;
            z-index: 0;
            text-align: center;

            &::before {
                content: '';
                position: absolute;
                top: calc(50% + 1px);
                left: 0;
                transform: translateY(-50%);
                width: 100%;
                height: 2px;
                z-index: -1;
                background-color: var(--nb-border);
            }

            &::after {
                content: '';
                position: absolute;
                background-color: var(--nb-bg);
                display: block;
                filter: blur(3px);
                transform: translate3d(0, 0, 0);
                height: 100%;
                left: calc(50% - 97px);
                top: 0;
                width: 190px;
                z-index: -1;
            }
        }

        small {
            color: var(--nb-color-secondary);
            font-size: var(--nb-font-size--small);
        }
    }

    .selection-group {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        width: 100%;
        gap: var(--nb-gap);
        padding: 48px 0 72px;
    }

    .selection-item {
        display: flex;
        align-items: center;
        justify-content: center;
        width: clamp(180px, 30vw, 220px);
        aspect-ratio: 1/1.2;
        border-radius: var(--nb-radius);
        background-color: rgba(0, 0, 0, 0.2);
        border: var(--nb-border-size) dashed var(--nb-border-card);
        position: relative;

        > div {
            width: calc(100% - 4px);
            height: calc(100% - 4px);
            background-color: var(--nb-bg-card);
            border-radius: 8px;
            position: absolute;
            border: var(--nb-border-size) solid var(--nb-border-card);
            transition: transform 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
            box-shadow: 0 0 26px 0 var(--nb-shadow);

            &.needed {
                img,
                video {
                    filter: grayscale(1);
                }
            }
        }

        .no-user {
            display: flex;
            flex-direction: column;
            gap: 24px;
            align-items: center;
            width: 100%;
            position: absolute;

            svg {
                width: 48px;
                height: 48px;
                animation: floating 8s ease-in-out infinite;
            }
        }

        .visual {
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: var(--nb-font-size--large);
            width: 100%;
            height: 60%;
            padding: 12px;
            position: relative;
            overflow: hidden;

            &.token,
            &.balance {
                img {
                    width: 80%;
                    height: 80%;
                    padding: 10%;
                }
            }

            &--small {
                font-weight: 500;
                color: var(--nb-color-secondary);
                font-size: var(--nb-font-size--small);
            }
        }

        .balance {
            font-size: var(--nb-font-size--small);
            color: var(--nb-color-secondary);

            small {
                display: block;
            }
        }

        img,
        video {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        h3 {
            margin-bottom: 12px;
        }
    }

    .loading-state {
        width: 100%;
        height: 100%;
        background: var(--nb-bg-card);
        border-radius: 8px;
        animation: loading 1.1s ease-in-out infinite;
    }

    @keyframes loading {
        0%,
        100% {
            opacity: 0;
        }
        50% {
            opacity: 0.5;
        }
    }

    @keyframes floating {
        0%,
        100% {
            transform: translate3d(0, 0, 0) rotate(-3deg);
        }
        25% {
            transform: translate3d(2px, -10px, 0) rotate(0deg);
        }
        50% {
            transform: translate3d(0, 0, 0) rotate(3deg);
        }
        75% {
            transform: translate3d(-2px, -10px, 0) rotate(0deg);
        }
    }
</style>
