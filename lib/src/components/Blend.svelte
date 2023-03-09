<svelte:options tag="nefty-blend-item" />

<script lang="ts">
    import { useMarkdown, useTokenDisplay } from '@nefty/use';
    import { backIn } from 'svelte/easing';
    import { get_current_component } from 'svelte/internal';
    import { getBlend, getRequirments, settings } from '../store';
    import type { GetBlendResult } from '../types';
    import { dispatch, formatTokenWithoutSymbol } from '../utils';

    // COMPONENTS
    import './Slider.svelte';
    import './Selecter.svelte';
    import Sprite from './Sprite.svelte';

    // GLOBALS
    const component = get_current_component();

    // STATES
    let data = undefined;
    let selection = undefined;
    let selected = {};

    let marketUrl = '';
    let collectionName = '';

    // METHODS
    function swoop(node: any, params: any) {
        return {
            delay: params.key * 100,
            duration: 500,
            easing: backIn,
            css: (t, u) =>
                `transform: translate3d(${-u * (50 * params.key)}%, ${
                    u * 40
                }%, 0); opacity: ${t}`,
        };
    }

    const unsubscribe = settings.subscribe(
        async ({ config, collection, blend, account }) => {
            if (config && blend) {
                data = await getBlend({
                    atomic_url: config.atomic_url,
                    blend_id: blend.blend_id,
                    contract: blend.contract,
                });

                marketUrl = config.marketplace_url;
                collectionName = collection;

                if (account) {
                    selection = await getRequirments({
                        requirments: data.requirments,
                        atomic_url: config.atomic_url,
                        chain_url: config.chain_url,
                        account,
                    });

                    autoSelect(selection, data.requirments);
                }
            }
        }
    );

    const autoSelect = (
        selection: any,
        requirments: GetBlendResult['requirments']
    ) => {
        const list = Object.values(requirments);

        for (let i = 0; i < list.length; i++) {
            const { matcher, matcher_type, amount } = list[i];

            // If the matcher is a token we don't need to auto select
            if (matcher_type !== 'token') {
                if (selection[matcher] && selection[matcher].length >= amount) {
                    selected[matcher] = selection[matcher].slice(0, amount);
                }
            }
        }
    };

    const matchAssetRequirments = (selection: any, requirments: any) => {
        const { amount } = requirments;

        if (!selection) return false;

        if (amount > selection.length) return false;

        return true;
    };

    const matchTokenRequirments = (selection: any, requirments: any) => {
        const { value } = requirments;

        if (!selection) return false;

        const [tokenValue] = selection.split(' ');

        return value <= +tokenValue;
    };

    const getMarketUrl = (item: any) => {
        const includeCollection = item.matcher_type !== 'collection';

        // TODO: add mapping for matcher_type

        return `${marketUrl}?${
            includeCollection ? `collection_name=${collectionName}&` : ''
        }${item.matcher_type}=${item.matcher}`;
    };

    const close = () => {
        dispatch('blend', null, component);

        // Avoid onDestroy this doesn't work to clean up the subscription
        unsubscribe();
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
    <div class="blend {data.description ? '' : 'no-text'}">
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
                    on:click={() => dispatch('sign', { test: 1 }, component)}
                >
                    Blend
                </button>
            </section>
            <section class="blend-selection">
                <h2>Ingredients</h2>
                <small>Ingredients will be consumed</small>
                <div class="selection-group">
                    {#each data.items as item, key}
                        <div class="selection-item">
                            {#if selection}
                                <div
                                    class={matchAssetRequirments(
                                        selection[item.matcher],
                                        data.requirments[item.matcher]
                                    )
                                        ? 'owned'
                                        : 'needed'}
                                    transition:swoop={{ key }}
                                >
                                    <small class="type"
                                        >{item.matcher_type}</small
                                    >
                                    {#if item.matcher_type === 'collection' || item.matcher_type === 'template'}
                                        <figure class="visual">
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
                                    {:else if item.matcher_type === 'attributes' || item.matcher_type === 'schema'}
                                        <span class="visual visual--small">
                                            {item.description}
                                        </span>
                                    {:else}
                                        <span class="visual">
                                            {useTokenDisplay(
                                                item.token.value,
                                                item.token.precision
                                            )}
                                        </span>
                                    {/if}

                                    <h3>{item.name}</h3>

                                    {#if item.matcher_type !== 'token'}
                                        {#if matchAssetRequirments(selection[item.matcher], data.requirments[item.matcher])}
                                            <nefty-blend-selecter
                                                items={selection[item.matcher]}
                                                matchertype={item.matcher_type}
                                                amount={data.requirments[
                                                    item.matcher
                                                ].amount}
                                                selected={selected[
                                                    item.matcher
                                                ]}
                                            />
                                        {:else}
                                            <!-- svelte-ignore security-anchor-rel-noreferrer -->
                                            <a
                                                class="btn"
                                                href={getMarketUrl(item)}
                                                target="_blank"
                                                rel="noopener"
                                            >
                                                Get {data.requirments[
                                                    item.matcher
                                                ].amount} asset{(data.requirments[
                                                    item.matcher
                                                ].amount = 1 ? '' : 's')}
                                            </a>{/if}
                                    {:else if matchTokenRequirments(selection[item.matcher], data.requirments[item.matcher])}
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
                                            Get more {item.token.token_symbol}
                                        </a>
                                    {/if}
                                </div>
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
                    {@html useMarkdown(data.description)}

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
    </div>
{:else if data === null}
    <div>An error happend</div>
{:else}
    <div>loading blend...</div>
{/if}

<style lang="scss">
    @import '../global.scss';

    .blend {
        display: grid;
        grid-template-columns: 1fr 0.3fr;
        gap: 48px;

        &.no-text {
            grid-template-columns: 1fr;
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
    }

    .blend-results {
        background-color: var(--nb-bg-card);
        border-radius: var(--nb-radius);
        border: var(--nb-border-size) solid var(--nb-border);
        height: 40vh;
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
        // overflow: hidden;
    }

    .selection-item {
        display: flex;
        align-items: center;
        justify-content: center;
        width: clamp(180px, 30vw, 220px);
        aspect-ratio: 1/1.2;
        padding: 4px;
        border-radius: var(--nb-radius);
        background-color: rgba(0, 0, 0, 0.2);
        border: var(--nb-border-size) dashed var(--nb-border-card);

        > div {
            width: 100%;
            height: 100%;
            background-color: var(--nb-bg-card);
            border-radius: 8px;
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
</style>
