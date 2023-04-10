<svelte:options tag="nefty-blend-group" />

<script lang="ts">
    import { get_current_component, onMount } from 'svelte/internal';
    import SuggestifyEngine from '@suggestify/engine';
    import { useSWR } from '@nefty/use';
    import { getBlends, settings } from '../store';
    import { dispatch, displayStatus, displayTime, sortBlends } from '../utils';
    import type { GetBlendsResponse, GetBlendsResult } from '../types';

    // COMPONENTS

    // GLOBALS
    const component = get_current_component();

    // STATES
    let data = undefined;
    let indexedData = undefined;

    let now = new Date().getTime();
    let timeout: ReturnType<typeof setTimeout> = setTimeout(() => '', 250);
    let suggestifyEngine: SuggestifyEngine;
    let searchValue;
    let selectedMatch;
    let owner;

    // METHODS
    const asyncData = async (config) => {
        indexedData = await useSWR<GetBlendsResponse>(
            `blends-${config.collection}-${selectedMatch}`,
            () =>
                getBlends({
                    atomic_url: config.atomic_url,
                    collection: config.collection,
                    ingredient_match: selectedMatch,
                    ingredient_owner: owner,
                })
        );

        if (indexedData) {
            data = sortBlends(Object.values(indexedData.content));
            searchValue = undefined;

            suggestifyEngine = new SuggestifyEngine({
                defaultItems: Object.keys(indexedData.search),
                options: {
                    MIN_DISTANCE: 3,
                    ITEM_CAP: 50,
                },
            });
        }
    };

    const unsubscribe = settings.subscribe(
        async ({ config, blend, account }) => {
            if (config && !blend) {
                await asyncData(config);
            }

            if (account) {
                owner = account.actor;
            } else {
                owner = undefined;
            }
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

    const viewBlend = (blend: GetBlendsResult) => {
        dispatch(
            'blend',
            {
                blend_id: blend.blend_id,
                contract: blend.contract,
            },
            component
        );
    };

    const search = () => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            let temp = [];
            if (searchValue.length > 0) {
                const results = suggestifyEngine.getResults(searchValue);

                if (results) {
                    for (let i = 0; i < results.length; i++) {
                        const id = indexedData.search[results[i]];
                        temp.push(indexedData.content[id]);
                    }
                    data = undefined;
                }
            } else {
                temp = Object.values(indexedData.content);
            }

            setTimeout(() => {
                data = temp;
            }, 100);
        }, 250);
    };

    const selectMatch = () => {
        data = undefined;

        setTimeout(() => {
            asyncData($settings.config);
        }, 100);
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
    <symbol
        id="clock"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </symbol>
    <symbol
        id="hat"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <path
            d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"
        />
        <line x1="6" y1="17" x2="18" y2="17" />
    </symbol>
    <symbol
        id="star"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><polygon
            points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
        />
    </symbol>
    <symbol
        id="lock"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path
            d="M7 11V7a5 5 0 0 1 10 0v4"
        /></symbol
    >
</svg>

<div class="blends-actions">
    <input
        type="search"
        bind:value={searchValue}
        placeholder="Search name"
        on:input={search}
    />
    <select bind:value={selectedMatch} on:input={selectMatch}>
        <option value="">Show all</option>
        <option value="all">Own all requirements</option>
        <option value="missing_x">Missing one requirement</option>
        <option value="any">Own at least one requirment</option>
    </select>
</div>
{#if data}
    <div class="blends-group">
        {#each data as blend}
            <button
                class={`btn-clear blends-item ${blend.secure ? 'secure' : ''}`}
                on:click={() => viewBlend(blend)}
            >
                <time class={displayStatus(blend.status)}>
                    {#if !['ended', 'live'].includes(displayTime(blend.start_time, blend.end_time, now))}
                        <svg>
                            <use href="#clock" />
                        </svg>
                    {/if}
                    {['active', 'ended'].includes(blend.status)
                        ? displayTime(blend.start_time, blend.end_time, now)
                        : displayStatus(blend.status)}
                </time>
                <figure class="visual">
                    {#if blend.video}
                        <video
                            src={blend.video}
                            loop
                            autoplay
                            muted
                            playsinline
                        />
                    {:else if blend.image}
                        <img
                            class="shadow"
                            src={blend.image}
                            alt={blend.name}
                        />
                        <img src={blend.image} alt={blend.name} />
                    {:else}
                        <small>empty</small>
                    {/if}
                    <div class="stats">
                        <div class="stat">
                            <small>ingredients</small>
                            <span>
                                <svg>
                                    <use href="#hat" />
                                </svg>
                                {blend.ingredients_count}
                            </span>
                        </div>
                        <div class="stat">
                            <small>results</small>
                            <span>
                                <svg>
                                    <use href="#star" />
                                </svg>
                                {blend.result_count}
                            </span>
                        </div>
                    </div>
                </figure>

                <h3>
                    {#if blend.secure}
                        <svg>
                            <use href="#lock" />
                        </svg>
                    {/if}

                    {blend.name}
                </h3>
            </button>
        {/each}
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
        loading blends...
    </p>
{/if}

<!-- svelte-ignore css-unused-selector -->
<style lang="scss">
    @import '../style/global.scss';
    @import '../style/states.scss';
    @import '../style/button.scss';
    @import '../style/input.scss';

    .blends-actions {
        display: flex;
        align-items: center;
        gap: 24px;
        margin-bottom: 24px;
    }

    .blends-group {
        display: grid;
        grid-template-columns: repeat(
            auto-fill,
            minmax(var(--nb-card-size-min), var(--nb-card-size-max))
        );
        gap: var(--nb-gap);
    }

    .blends-item {
        position: relative;
        background-color: var(--nb-bg-card);
        border-radius: var(--nb-radius);
        border: var(--nb-border-size) solid var(--nb-border-card);
        overflow: hidden;
        padding: 12px;
        transition: transform 0.3s;

        .visual {
            height: 230px;
            border-radius: 6px;
            position: relative;
            z-index: 0;
            overflow: hidden;

            > small {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: var(--nb-color);
            }
        }

        img {
            width: 100%;
            height: 100%;
            object-fit: contain;

            &.shadow {
                position: absolute;
                top: -10%;
                left: -10%;
                width: 120%;
                height: 120%;
                z-index: -1;
                filter: blur(60px);
                transform: translate3d(0, 0, 0);
            }
        }

        .stats {
            display: flex;
            align-items: flex-end;
            justify-content: flex-start;
            gap: 12px;
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 100%;
            padding: 12px;
            background: linear-gradient(
                rgba(0, 0, 0, 0) 0%,
                rgba(0, 0, 0, 0.8) 100%
            );
            opacity: 0;
            transition: opacity 0.3s;
        }

        time {
            display: inline-block;
            padding: 4px 12px;
            text-transform: uppercase;
            color: var(--nb-color);
            transform: translateY(-6px);
            font-size: var(--nb-font-size--small);
            background-color: var(--nb-shadow);
            border-radius: var(--nb-radius);

            &.ended,
            &.sold-out,
            &.max-reached {
                background-color: var(--nb-inactive);
            }

            svg {
                display: inline-block;
                width: 13px;
                height: 13px;
                transform: translate(-4px, 1.5px);
            }
        }

        .stat {
            display: flex;
            flex-direction: column;
            text-align: left;

            small {
                color: var(--nb-color);
                font-size: var(--nb-font-size--small);
            }

            span {
                display: flex;
                gap: 4px;
                align-items: center;
                overflow: hidden;
                text-overflow: ellipsis;
                color: var(--nb-color-secondary);
            }

            svg {
                width: 16px;
                height: 16px;
                color: var(--nb-color-secondary);
            }
        }

        button {
            width: 100%;

            &:hover {
                background-color: var(--nb-button);

                &.secure {
                    background-color: var(--nb-secure);
                }
            }

            &.ended,
            &.sold-out,
            &.max-reached {
                background-color: var(--nb-inactive);
                &:hover {
                    background-color: var(--nb-inactive);

                    &.secure {
                        background-color: var(--nb-inactive);
                    }
                }
            }
        }

        h3 {
            color: var(--nb-color);
            height: 55px;
            text-align: left;
            padding-top: 12px;

            svg {
                margin-right: 6px;
                width: 16px;
                height: 16px;
                color: var(--nb-secure);
                transform: translateY(1px);
            }
        }

        &.secure {
            border-color: var(--nb-secure);
        }

        &:hover {
            transform: scale(1.05);

            .stats {
                opacity: 1;
            }
        }
    }
</style>
