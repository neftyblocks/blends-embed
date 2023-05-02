<svelte:options tag="nefty-blend-item" />

<script lang="ts">
    import { get_current_component, onMount } from 'svelte/internal';
    import {
        getBlend,
        getClaims,
        getJobsCount,
        getRequirements,
        getSecurityCheck,
        settings,
    } from '../store';
    import { useSWR } from '@nefty/use';
    import type { GetBlendResult } from '../types';
    import {
        dispatch,
        formatTokenWithoutSymbol,
        sortedRequirements,
        matchAssetRequirements,
        matchTokenRequirements,
        getMarketUrl,
        blendTransactionActions,
        displayTime,
        displayStatus,
    } from '../utils';

    // COMPONENTS
    import './Slider.svelte';
    import './Selecter.svelte';

    // GLOBALS
    const component = get_current_component();

    // STATES
    // settings data
    let user = undefined;
    let localConfig = undefined;

    // blend data
    let data = undefined;
    let selection = undefined;
    let selected = {};
    let claims = null;
    let warnJobs = 0;

    // DOM
    let selectionGroupElement;

    // TIMERS
    let now = new Date().getTime();

    // FLAGS
    let loading = true;
    let showClaims = false;
    let allowBlend = true;

    // TRANSACTION
    let selectedAssetsToBlend = [];
    let selectedTokensToBlend = [];
    let selectedBalanceAssets = [];
    let selectedSecurity: null | any[] = null;

    const hasVisual = ['collection', 'template', 'token', 'balance'];

    // METHODS
    const unsubscribe = settings.subscribe(
        async ({ config, blend, account, transactionId }) => {
            user = account;

            // config flow
            if (config && blend && !transactionId) {
                localConfig = config;

                const tempdata = await useSWR<GetBlendResult>(
                    `blend-${blend.blend_id}`,
                    () =>
                        getBlend({
                            atomic_url: config.atomic_url,
                            blend_id: blend.blend_id,
                            contract: blend.contract,
                            chain: config.chain,
                        })
                );

                if (tempdata.collection_name === config.collection) {
                    data = tempdata;

                    if (data.odds) {
                        warnJobs = await getJobsCount({
                            chain_url: config.chain_url,
                        });
                    }
                } else {
                    data = null;

                    dispatch(
                        'error',
                        {
                            type: 'invalid',
                            message: 'Blend is not from this collection',
                        },
                        component
                    );
                }
            }

            // user flow
            if (account && !transactionId) {
                if (data?.requirements) {
                    await updateRequirments();
                } else {
                    selection = undefined;
                }

                if (data?.secure) {
                    allowBlend = false;

                    const { allowed, result, reason } = await getSecurityCheck({
                        atomic_url: config.atomic_url,
                        chain_url: config.chain_url,
                        security_id: data.security_id,
                        actor: user.actor,
                        collection: config.collection,
                    });

                    if (allowed) {
                        allowBlend = true;
                        selectedSecurity = result;
                    } else {
                        dispatch(
                            'error',
                            {
                                type: 'security',
                                message: reason,
                            },
                            component
                        );
                    }
                }
            }

            // transaction flow
            if (transactionId) {
                loading = true;

                if (transactionId !== 'unset') {
                    const contract = blend.contract;

                    if (contract === 'blend.nefty') {
                        claims = await getClaims({
                            atomic_url: config.atomic_url,
                            blend_id: blend.blend_id,
                            contract,
                            tx_id: transactionId,
                        });
                    } else if (contract === 'blenderizerx') {
                        claims = data.results;
                    } else {
                        claims = [];
                    }

                    showClaims = true;

                    setTimeout(() => {
                        settings.update((s) => {
                            s.transactionId = null;
                            return s;
                        });
                    }, 1000);
                } else {
                    settings.update((s) => {
                        s.transactionId = null;
                        return s;
                    });
                }
            }

            loading = false;
        }
    );

    onMount(() => {
        const interval = setInterval(() => {
            now = new Date().getTime();
        }, 1000);

        return () => {
            clearInterval(interval);
            unsubscribe();
        };
    });

    const updateRequirments = async () => {
        selection = undefined;

        selection = await getRequirements({
            requirements: data.requirements,
            atomic_url: localConfig.atomic_url,
            chain_url: localConfig.chain_url,
            actor: user.actor,
        });

        autoSelect(data.requirements);
    };

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
                if (selection[matcher] && selection[matcher].length) {
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

    const validateSelection = (
        requirements,
        isFullValidation = false,
        dispatchError = false
    ) => {
        const list = sortedRequirements(requirements);

        // Reset the selected assets and tokens
        selectedAssetsToBlend = [];
        selectedTokensToBlend = [];
        selectedBalanceAssets = [];

        let meetRequirements = true;

        for (let i = 0; i < list.length; i++) {
            const { matcher, matcher_type, token } = list[i];

            if (matcher_type === 'token') {
                if (matchTokenRequirements(selected[matcher], list[i])) {
                    selectedTokensToBlend.push(token);
                } else {
                    if (dispatchError) {
                        dispatch(
                            'error',
                            {
                                type: 'requirements',
                                message: 'missing token',
                            },
                            component
                        );
                    }

                    meetRequirements = false;
                    break;
                }
            } else {
                if (
                    matchAssetRequirements(
                        selected[matcher],
                        list[i],
                        isFullValidation
                    )
                ) {
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
                            if (dispatchError) {
                                dispatch(
                                    'error',
                                    {
                                        type: 'requirements',
                                        message: 'duplicate asset',
                                    },
                                    component
                                );
                            }

                            meetRequirements = false;
                            break;
                        }
                    }
                } else {
                    if (dispatchError) {
                        dispatch(
                            'error',
                            {
                                type: 'requirements',
                                message: 'missing asset',
                            },
                            component
                        );
                    }

                    meetRequirements = false;
                    break;
                }
            }
        }

        return meetRequirements;
    };

    const close = () => {
        dispatch('blend', null, component);
    };

    const blend = (requirements) => {
        const allowed = validateSelection(requirements, true, true);

        if (allowed) {
            const transactions = blendTransactionActions({
                account: user,
                blend_id: data.blend_id,
                contract: data.contract,
                asset_ids: selectedAssetsToBlend,
                balance_asset_ids: selectedBalanceAssets,
                tokens: selectedTokensToBlend,
                security_check: selectedSecurity,
            });

            animateCards();

            loading = true;

            dispatch('sign', transactions, component);
        }
    };

    const reset = async () => {
        loading = true;
        await updateRequirments();

        showClaims = false;
        claims = null;
        loading = false;
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

<svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="0"
    height="0"
    style="position: absolute"
>
    <symbol
        id="refresh"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path
            d="M3 22v-6h6"
        /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></symbol
    >
    <symbol
        id="arrow_left"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><line x1="19" y1="12" x2="5" y2="12" /><polyline
            points="12 19 5 12 12 5"
        /></symbol
    >
    <symbol
        id="ghost"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><path d="M9 10h.01" /><path d="M15 10h.01" /><path
            d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"
        /></symbol
    >
    <symbol
        id="blender"
        xml:space="preserve"
        fill-rule="evenodd"
        fill="currentColor"
        stroke-linejoin="round"
        stroke-miterlimit="2"
        clip-rule="evenodd"
        viewBox="0 0 48 48"
        ><path
            fill-rule="nonzero"
            d="M15 44c-.8 0-1.5-.3-2.1-.9-.6-.6-.9-1.3-.9-2.1v-2a8.8 8.8 0 0 1 4.4-7.6l-2-10H9c-.8 0-1.5-.3-2.1-1-.6-.5-.9-1.2-.9-2V9.5c0-.8.3-1.5.9-2.1.6-.6 1.3-.9 2.1-.9h27l-4.4 24.9c1.4 1 2.5 2 3.3 3.4A7.4 7.4 0 0 1 36 39v2c0 .8-.3 1.5-.9 2.1-.6.6-1.3.9-2.1.9H15Zm-1.2-25.6L12 9.5H9v8.8l4.8.1Zm5.3 11.1h9.8l3.5-20H15.1l4 20ZM15 41h18v-2c0-1.8-.7-3.3-2-4.6a7 7 0 0 0-5-1.9h-4c-2 0-3.7.7-5 2a6.2 6.2 0 0 0-2 4.5v2Z"
        /></symbol
    >
</svg>

{#if data}
    <button class="btn-clear back" on:click={close}>
        <svg role="presentation" focusable="false" aria-hidden="true">
            <use xlink:href="#arrow_left" />
        </svg>
        Blends
    </button>
    <div
        class="blend {data.description ? '' : 'no-text'} {showClaims
            ? 'claims'
            : ''}"
    >
        <main>
            <article class="blend-content">
                <div>
                    <h1>
                        {data.name}
                    </h1>
                    <span>
                        <time>
                            {['active', 'ended'].includes(data.status)
                                ? displayTime(
                                      data.start_time,
                                      data.end_time,
                                      now
                                  )
                                : displayStatus(data.status)}
                        </time>
                        <small>-</small>
                        {data.count.current} / {data.count.max || '∞'} blends left
                    </span>
                </div>
                {#if warnJobs >= 50}
                    <div class="banner">
                        <p>
                            There are {warnJobs} pending jobs, the blend results
                            may be delayed.
                        </p>
                    </div>
                {/if}
            </article>
            <section class="blend-results">
                {#if showClaims && claims}
                    <nefty-blend-slider items={claims} claims={true} />
                    <div
                        class="result-bg"
                        style="background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbDpzcGFjZT0icHJlc2VydmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQ9IjIiIGZpbGw9IiNmZmYiIGNsaXAtcnVsZT0iZXZlbm9kZCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij48cGF0aCBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xNSA0NGMtLjggMC0xLjUtLjMtMi4xLS45LS42LS42LS45LTEuMy0uOS0yLjF2LTJhOC44IDguOCAwIDAgMSA0LjQtNy42bC0yLTEwSDljLS44IDAtMS41LS4zLTIuMS0xLS42LS41LS45LTEuMi0uOS0yVjkuNWMwLS44LjMtMS41LjktMi4xLjYtLjYgMS4zLS45IDIuMS0uOWgyN2wtNC40IDI0LjljMS40IDEgMi41IDIgMy4zIDMuNEE3LjQgNy40IDAgMCAxIDM2IDM5djJjMCAuOC0uMyAxLjUtLjkgMi4xLS42LjYtMS4zLjktMi4xLjlIMTVabS0xLjItMjUuNkwxMiA5LjVIOXY4LjhsNC44LjFabTUuMyAxMS4xaDkuOGwzLjUtMjBIMTUuMWw0IDIwWk0xNSA0MWgxOHYtMmMwLTEuOC0uNy0zLjMtMi00LjZhNyA3IDAgMCAwLTUtMS45aC00Yy0yIDAtMy43LjctNSAyYTYuMiA2LjIgMCAwIDAtMiA0LjV2MloiLz48L3N2Zz4=');"
                    />
                {:else}
                    <nefty-blend-slider
                        items={data.results}
                        claims={false}
                        ended={data.status !== 'active'}
                        marketurl={localConfig.marketplace_url}
                    />
                    <img
                        class="result-bg"
                        src={data.backgroundImg || ''}
                        alt=""
                        loading="lazy"
                    />
                {/if}
            </section>
            <section class="blend-actions">
                {#if showClaims}
                    <div class="btn-group">
                        <button
                            disabled={loading}
                            class="btn btn--primary btn--blend"
                            on:click={reset}
                        >
                            {loading ? 'Loading' : 'Blend again'}
                        </button>
                        <a
                            href="{localConfig.profile_url}{user.actor}?collection_name={localConfig.collection}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="btn btn--primary btn--primary"
                        >
                            See my profile
                        </a>
                    </div>
                {:else}
                    <div class="btn-group">
                        <button
                            disabled={!allowBlend ||
                                loading ||
                                !user ||
                                data.status !== 'active'}
                            class="btn btn--primary {!loading &&
                            validateSelection(data.requirements, true)
                                ? 'btn--blend'
                                : ''}"
                            on:click={() => {
                                if (allowBlend) blend(data.requirements);
                            }}
                        >
                            {loading
                                ? 'Loading'
                                : user
                                ? data.status !== 'active'
                                    ? displayStatus(data.status)
                                    : data.secure
                                    ? 'Secure blend'
                                    : 'Blend'
                                : 'Not logged in'}
                        </button>

                        <button
                            class="btn btn--secondary btn-refresh"
                            on:click={() => updateRequirments()}
                        >
                            <svg
                                role="presentation"
                                focusable="false"
                                aria-hidden="true"
                            >
                                <use xlink:href="#refresh" />
                            </svg>
                        </button>
                    </div>
                {/if}
            </section>
            <section class="blend-selection">
                <h2>Ingredients</h2>
                <small>Ingredients will be consumed</small>
                <div class="selection-group" bind:this={selectionGroupElement}>
                    {#each data.items as item, key}
                        <div class="selection-item">
                            {#if !user}
                                <span class="no-user">
                                    <svg
                                        role="presentation"
                                        focusable="false"
                                        aria-hidden="true"
                                    >
                                        <use xlink:href="#ghost" />
                                    </svg>
                                    <small>
                                        Our friendly ghost is here to remind you
                                        to log in first
                                    </small>
                                </span>
                            {:else if selection}
                                <div
                                    class={matchAssetRequirements(
                                        selection[item.matcher],
                                        data.requirements[item.matcher],
                                        true
                                    )
                                        ? 'owned'
                                        : 'needed'}
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
                                                    loading="lazy"
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
                                        {#if matchAssetRequirements(selection[item.matcher], data.requirements[item.matcher], true)}
                                            <nefty-blend-selecter
                                                items={selection[item.matcher]}
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
                                                    item.matcher_type,
                                                    item.market_data,
                                                    localConfig.marketplace_url
                                                )}
                                                target="_blank"
                                                rel="noopener"
                                            >
                                                Get {data.requirements[
                                                    item.matcher
                                                ].amount -
                                                    (selected[item.matcher]
                                                        ?.length || 0)} asset{data
                                                    .requirements[item.matcher]
                                                    .amount === 1
                                                    ? ''
                                                    : 's'}
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
                                        <!-- svelte-ignore a11y-invalid-attribute -->
                                        <a
                                            class="btn"
                                            href="#"
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
        {#if data.description && !showClaims}
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
    </div>
{:else if data === null}
    <p class="error">
        <svg role="presentation" focusable="false" aria-hidden="true">
            <use xlink:href="#blender" />
        </svg>
        Whoops someone spilled the juice!
    </p>
{:else}
    <p class="loading">
        <svg role="presentation" focusable="false" aria-hidden="true">
            <use xlink:href="#blender" />
        </svg>
        loading blend...
    </p>
{/if}

<style lang="scss">
    @import '../style/global.scss';
    @import '../style/states.scss';
    @import '../style/markdown.scss';
    @import '../style/button.scss';

    .blend {
        display: grid;
        grid-template-columns: 1fr;
        gap: 48px 0;

        &.claims {
            grid-template-columns: 1fr 0fr;
            transition: grid;
            transition: 0.6s;

            .blend-text,
            .blend-selection {
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .selection-group {
                display: none;
            }

            .blend-results {
                height: 500px;
                transition: height 0.6s ease;
            }

            .result-bg {
                filter: blur(0px);
                background-position: 0% 0%;
                background-size: 70px;
                transform: scale(1.5);
                animation: bganimation 1s ease-in-out 5 forwards;
            }

            @keyframes bganimation {
                0%,
                100% {
                    opacity: 0.1;
                }
                50% {
                    opacity: 0.3;
                }
            }
        }

        & main {
            display: flex;
            flex-direction: column;
            gap: 12px 48px;
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
            width: 36px;
            height: 36px;
            transition: transform 0.15s ease;
            border: var(--nb-border-size) solid var(--nb-border);
            border-radius: 24px;
            padding: 6px;
        }
    }

    .blend-content {
        display: flex;

        h1 {
            font-size: var(--nb-font-size--title);
        }

        span {
            color: var(--nb-color-secondary);
        }

        small {
            padding: 0 10px;
        }

        time {
            text-transform: uppercase;
        }
    }

    .blend-text {
        background-color: var(--nb-bg-card);
        border-radius: var(--nb-radius);
        // border: var(--nb-border-size) solid var(--nb-border);
        padding: 12px;
        overflow: hidden auto;
    }

    .blend-actions {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 12px 0;
    }

    .btn-group {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .btn-refresh {
        svg {
            display: block;
            width: 18px;
            height: 18px;
            transition: transform 0.15s ease;
        }

        &:hover {
            svg {
                transform: rotate(60deg);
            }
        }
    }

    .blend-results {
        background-color: var(--nb-bg-card);
        border-radius: var(--nb-radius);
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
                height: 1px;
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
                left: calc(50% - 120px);
                top: 0;
                width: 240px;
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
        padding: 48px 0 0;
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
            height: 50%;
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
            height: 21px;
            padding: 0 6px;
            overflow: hidden;
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

    .banner {
        margin-left: auto;
        max-width: 300px;
        width: 100%;
        background-color: var(--nb-inactive);
        padding: 12px;
        border-radius: var(--nb-radius);

        p {
            color: var(--nb-color);
            font-size: var(--nb-font-size--small);
        }
    }

    @media all and (min-width: 768px) {
        .blend {
            grid-template-columns: 1fr 0.3fr;
            gap: 0 48px;

            &.no-text {
                grid-template-columns: 1fr;
                gap: 0px;
            }
        }

        .blend-text {
            margin-top: 70px;
            max-height: calc(100vh - var(--nb-markdown-offset));
        }

        .selection-item {
            .visual {
                height: 60%;
            }
        }
    }
</style>
