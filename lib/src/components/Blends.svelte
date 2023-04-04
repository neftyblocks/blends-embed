<svelte:options tag="nefty-blend-group" />

<script lang="ts">
    import { get_current_component, onMount } from 'svelte/internal';
    import SuggestifyEngine from '@suggestify/engine';
    import { useSWR } from '@nefty/use';
    import { getBlends, settings } from '../store';
    import { dispatch, displayStatus, displayTime } from '../utils';
    import type { GetBlendsResponse, GetBlendsResult } from '../types';

    // COMPONENTS

    // GLOBALS
    const component = get_current_component();

    // STATES
    let data = undefined;
    let indexedData = undefined;

    let show;
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
            data = Object.values(indexedData.content);
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
        // Avoid onDestroy this doesn't work to clean up the subscription
        unsubscribe();

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
            console.log('selectedMatch', selectedMatch);
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
        id="chevron_right"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <polyline points="9 18 15 12 9 6" />
    </symbol>
    <symbol
        id="close"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><circle cx="12" cy="12" r="10" /><line
            x1="15"
            y1="9"
            x2="9"
            y2="15"
        /><line x1="9" y1="9" x2="15" y2="15" /></symbol
    >
</svg>

<div class="blends-actions">
    <input
        type="search"
        bind:value={searchValue}
        placeholder="Search name"
        on:input={search}
    />
    <select bind:value={selectedMatch} name="" id="" on:input={selectMatch}>
        <option value="">Show all</option>
        <option value="all">Own all requirements</option>
        <option value="missing_x">Missing one requirement</option>
        <option value="any">Own atleast one requirment</option>
    </select>
</div>
{#if data}
    <div class="blends-group">
        {#each data as blend, key}
            <div class="blends-item">
                <!-- {#if show === key}
                    <div class="content">
                        <button
                            class="btn-clear btn-close"
                            on:click={() => (show = undefined)}
                        >
                            <svg>
                                <use href="#close" />
                            </svg>
                        </button>
                        <small>results</small>
                        <div class="results">
                            {#each blend.results as item}
                                <figure>
                                    {#if item.video}
                                        <video
                                            src={item.video}
                                            loop
                                            autoplay
                                            muted
                                            playsinline
                                        />
                                    {:else if item.image}
                                        <img src={item.image} alt={item.name} />
                                    {:else}
                                        <small>empty</small>
                                    {/if}
                                </figure>
                            {/each}
                        </div>
                        <small>requirements</small>
                        <div class="requirements">
                            {#each blend.items as item}
                                <figure>
                                    <img src={item.image} alt={item.name} />
                                </figure>
                            {/each}
                        </div>
                    </div>
                {:else} -->
                <div class="content">
                    <header>
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
                        </figure>
                        <article>
                            <time>
                                {['active', 'ended'].includes(blend.status)
                                    ? displayTime(
                                          blend.start_time,
                                          blend.end_time,
                                          now
                                      )
                                    : displayStatus(blend.status)}
                            </time>
                            <h3 data-title={blend.name}>{blend.name}</h3>
                            <div class="stats">
                                {#if blend.category}
                                    <div class="stat">
                                        <small>category</small>
                                        <span>
                                            {blend.category}
                                        </span>
                                    </div>
                                {/if}
                            </div>
                        </article>
                    </header>
                    <main>
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
                            <!-- <button
                                class="btn-clear btn-requirements"
                                on:click={() => (show = key)}
                            >
                                details
                                <svg>
                                    <use href="#chevron_right" />
                                </svg>
                            </button> -->
                        </div>
                    </main>
                    <footer class={blend.status}>
                        {#if blend.status === 'active'}
                            <button
                                class={blend.secure ? 'secure' : ''}
                                on:click={() => viewBlend(blend)}
                                >{blend.secure
                                    ? 'Secure blend'
                                    : 'Blend'}</button
                            >
                        {:else}
                            <button on:click={() => viewBlend(blend)}>
                                {displayStatus(blend.status)}
                            </button>
                        {/if}
                    </footer>
                </div>
                <!-- {/if} -->
            </div>
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
        margin-bottom: 12px;
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
        background-color: var(--nb-bg-card);
        border-radius: var(--nb-radius);
        border: var(--nb-border-size) solid var(--nb-border);
        overflow: hidden;
        max-height: 276px;

        .content {
            display: flex;
            flex-direction: column;
            height: 100%;
            padding: 6px;

            > small {
                color: var(--nb-color-secondary);
                font-size: var(--nb-font-size--small);
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
                    background-color: var(--nb-bg-card);
                    display: block;
                    filter: blur(3px);
                    transform: translate3d(0, 0, 0);
                    height: 100%;
                    left: calc(50% - 55px);
                    top: 0;
                    width: 110px;
                    z-index: -1;
                }
            }
        }

        .visual {
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
            border-radius: 3px;
            z-index: 0;

            small {
                color: var(--nb-color-secondary);
                font-size: var(--nb-font-size--small);
            }
        }

        img {
            width: 100%;
            height: 100%;
            object-fit: contain;

            &.shadow {
                position: absolute;
                top: 0;
                left: 0;
                z-index: -1;
                filter: blur(40px);
                transform: translate3d(0, 0, 0);
            }
        }

        h3 {
            margin: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            height: 2.4em;
            margin-bottom: 6px;
            transition: color 0.2s ease;

            &::before {
                content: attr(data-title);
                color: var(--nb-color);
                background-color: var(--nb-bg-card);
                position: absolute;
                width: 100%;
                opacity: 0;
                transition: opacity 0.2s ease;
            }

            &:hover {
                color: rgba(0, 0, 0, 0);

                &::before {
                    opacity: 1;
                }
            }
        }

        time {
            color: var(--nb-color-secondary);
            font-size: var(--nb-font-size--small);
        }

        header {
            display: flex;
            gap: 12px;
            padding-bottom: 12px;

            figure {
                flex: 0 0 100px;
                width: 100px;
                height: 140px;
                overflow: hidden;
            }

            article {
                display: block;
                width: 100%;
                position: relative;
            }

            .stats {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
        }

        main {
            padding: 12px 0;
            margin: auto 0 0;
            height: 61px;
            border-top: var(--nb-border-size) solid var(--nb-border);

            .stats {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 12px;
            }
        }

        .stat {
            display: flex;
            flex-direction: column;

            small {
                color: var(--nb-color-secondary);
                font-size: var(--nb-font-size--small);
            }

            span {
                display: flex;
                gap: 4px;
                align-items: center;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            svg {
                width: 16px;
                height: 16px;
                color: var(--nb-color-secondary);
            }
        }

        .btn-requirements {
            display: flex;
            align-items: center;
            color: var(--nb-color);
            font-size: var(--nb-font-size--small);

            svg {
                width: 16px;
                height: 16px;
            }
        }

        .btn-close {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            margin-left: auto;
            color: var(--nb-color);

            svg {
                width: 28px;
                height: 28px;
            }
        }
        .requirements,
        .results {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
            gap: 5px;
            margin: 6px 0;

            figure {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 60px;
                height: 60px;
                padding: 2px;
                background-color: rgba(0, 0, 0, 0.2);
                border: var(--nb-border-size) dashed var(--nb-border-card);

                small {
                    color: var(--nb-color-secondary);
                    font-size: var(--nb-font-size--small);
                }
            }
        }

        footer {
            margin: 0 -6px;
            min-height: 55px;
            background-color: var(--nb-bg-footer);
            border-radius: 0 0 var(--nb-radius) var(--nb-radius);

            &.ended,
            &.sold-out,
            &.max-reached {
                background-color: var(--nb-inactive);

                button {
                    &:hover {
                        background-color: rgba(0, 0, 0, 0);

                        &.secure {
                            background-color: rgba(0, 0, 0, 0);
                        }
                    }
                }
            }

            p {
                padding: 18px 6px;
                width: 100%;
                text-align: center;
            }

            button {
                padding: 18px 6px;
                width: 100%;
                border: none;
                background-color: rgba(0, 0, 0, 0);
                color: var(--nb-color-button);
                cursor: pointer;

                &:hover {
                    background-color: var(--nb-button-hover);

                    &.secure {
                        background-color: var(--nb-secure-hover);
                    }
                }
            }
        }
    }
</style>
