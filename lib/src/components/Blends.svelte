<svelte:options tag="nefty-blend-group" />

<script lang="ts">
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { useCountDown } from '@mvdschee/use';
    import { getBlends, settings } from '../store';

    // COMPONENTS
    import Sprite from './Sprite.svelte';

    // PROPS
    export let blends = undefined;
    export let now = new Date().getTime();

    let show;

    // STORES
    settings.subscribe(async ({ atomic_url, collection }) => {
        blends = await getBlends({
            atomic_url,
            collection,
        });
    });

    // METHODS
    onMount(() => {
        const interval = setInterval(() => {
            now = new Date().getTime();
        }, 1000);

        return () => clearInterval(interval);
    });

    const displayTime = (time, now, end = false) => {
        const countdown = useCountDown(time, now);

        if (countdown === '0') {
            return end ? 'no end' : 'live';
        } else {
            return end ? `ending ${countdown}` : countdown;
        }
    };
</script>

<Sprite />

{#if blends}
    <div class="blends-group">
        {#each blends as blend, key}
            <div class="blends-item">
                {#if show === key}
                    <div
                        in:fade={{ delay: 100, duration: 100 }}
                        out:fade={{ duration: 100 }}
                        class="content"
                    >
                        <button
                            class="btn-clear btn-close"
                            on:click={() => (show = undefined)}
                        >
                            <svg>
                                <use href="#close" />
                            </svg>
                        </button>
                        <div class="requirments">
                            {#each blend.items as item}
                                <figure>
                                    <img src={item.image} alt={item.name} />
                                </figure>
                            {/each}
                        </div>
                    </div>
                {:else}
                    <div
                        in:fade={{ delay: 100, duration: 100 }}
                        out:fade={{ duration: 100 }}
                        class="content"
                    >
                        <header>
                            <figure>
                                <img
                                    class="shadow"
                                    src={blend.image}
                                    alt={blend.name}
                                />
                                <img src={blend.image} alt={blend.name} />
                            </figure>
                            <article>
                                <time>
                                    {displayTime(blend.start_time, now)} · {displayTime(
                                        blend.end_time,
                                        now,
                                        true
                                    )}
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
                                    {#if blend.secure}
                                        <div class="stat">
                                            <small>secure</small>
                                            <span>Yes</span>
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
                                <button
                                    class="btn-clear btn-requirments"
                                    on:click={() => (show = key)}
                                >
                                    details
                                    <svg>
                                        <use href="#chevron-right" />
                                    </svg>
                                </button>
                            </div>
                        </main>
                        <footer>
                            <button class={blend.secure ? 'secure' : ''}
                                >{blend.secure
                                    ? 'Secure blend'
                                    : 'Blend'}</button
                            >
                        </footer>
                    </div>
                {/if}
            </div>
        {/each}
    </div>
{:else if blends === null}
    <div>An error happend</div>
{:else}
    <div>loading...</div>
{/if}

<style lang="scss">
    @import '../global.scss';

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
        }

        figure {
            overflow: hidden;
            position: relative;
            border-radius: 3px;
            z-index: 0;
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
            padding: 6px 6px 12px;

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
            margin: auto 6px 0;
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

        .btn-requirments {
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
        .requirments {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
            gap: 5px;
            filter: grayscale(100%);
            opacity: 0.8;

            transition: filter 0.2s ease, opacity 0.2s ease;

            figure {
                width: 60px;
                height: 60px;
                padding: 2px;
                background-color: rgba(0, 0, 0, 0.2);
                border: var(--nb-border-size) dotted var(--nb-border-card);
            }
        }

        footer {
            background-color: var(--nb-bg-footer);
            border-radius: 0 0 var(--nb-radius) var(--nb-radius);

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

        &:hover {
            .requirments {
                filter: none;
                opacity: 1;
            }
        }
    }
</style>
