<svelte:options tag="nefty-blend-group" />

<script lang="ts">
    import { useCountDown } from '@mvdschee/use';
    import { onMount } from 'svelte';
    import { getBlends, settings } from '../store';

    // COMPONENTS
    import Sprite from './Sprite.svelte';

    // PROPS
    export let blends = undefined;
    export let now = new Date().getTime();

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
        {#each blends as blend}
            <div class="blends-item">
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
                    </div>
                    <!-- <div class="requirments">
                        {#each blend.items as item}
                            <figure>
                                <img src={item.image} alt={item.name} />
                            </figure>
                        {/each}
                    </div> -->
                </main>
                <footer>
                    <button>{blend.secure ? 'Secure blend' : 'Blend'}</button>
                </footer>
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
        display: flex;
        flex-direction: column;
        background-color: var(--nb-bg-card);
        border-radius: var(--nb-radius);
        border: var(--nb-border-size) solid var(--nb-border);

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

        time {
            color: var(--nb-color-secondary);
            font-size: var(--nb-font-size--small);
        }

        button {
            width: 100%;
            padding: 6px;
            border: none;
            border-radius: var(--nb-radius);
            background-color: var(--nb-bg-button);
            color: var(--nb-color-button);
            cursor: pointer;
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
                width: 100%;
            }

            .stats {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
        }

        h3 {
            margin-bottom: 6px;
        }

        main {
            padding: 12px 0;
            margin: 6px 6px;
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
            padding: 12px 6px;
            margin-top: auto;
            background-color: var(--nb-bg-footer);
            border-radius: 0 0 var(--nb-radius) var(--nb-radius);
        }

        &:hover {
            .requirments {
                filter: none;
                opacity: 1;
            }
        }
    }
</style>
