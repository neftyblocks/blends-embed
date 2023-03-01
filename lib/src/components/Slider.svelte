<svelte:options tag="nefty-blend-slider" />

<script lang="ts">
    import { useTokenDisplay } from '@nefty/use';
    import { onMount } from 'svelte';

    // COMPONENTS
    import Sprite from './Sprite.svelte';

    // GLOBALS

    // STATES
    export let items: any[] = undefined;
    export let active = 0;

    // METHODS
    onMount(() => {
        if (items.length) {
            // middle item
            const middle = Math.floor(items.length / 2);
            active = middle;
        }
    });

    const prev = () => {
        if (active > 0) {
            active--;
        } else {
            active = items.length - 1;
        }
    };

    const next = () => {
        if (active < items.length - 1) {
            active++;
        } else {
            active = 0;
        }
    };
</script>

<Sprite />

{#if items}
    <div class="slider">
        {#if items.length > 1}
            <button class="btn-clear prev" on:click={prev}>
                <svg role="presentation" focusable="false" aria-hidden="true">
                    <use xlink:href="#arrow_left" />
                </svg>
            </button>
        {/if}
        <div class="slider-group">
            {#each items as item, key}
                <div
                    class="slider-item {key === active
                        ? 'current'
                        : key > active
                        ? 'next'
                        : 'prev'} 
                        {key < active - 1 ? 'prev-depth' : ''} 
                        {key > active + 1 ? 'next-depth' : ''}"
                >
                    <figure>
                        {#if item.image}
                            <img src={item.image} alt={item.name} />
                        {:else}
                            <small>No result</small>
                        {/if}
                    </figure>
                    <article>
                        <h3>{item.name}</h3>
                        <small>
                            {useTokenDisplay(item.drop_rate, 2)}% Drop rate
                        </small>
                        {#if item.mint}
                            <p>
                                <svg
                                    role="presentation"
                                    focusable="false"
                                    aria-hidden="true"
                                >
                                    <use xlink:href="#hash" />
                                </svg>
                                {`${item.mint.amount} / ${item.mint.supply}`}
                            </p>
                        {/if}
                    </article>
                </div>
            {/each}
        </div>
        {#if items.length > 1}
            <button class="btn-clear next" on:click={next}>
                <svg role="presentation" focusable="false" aria-hidden="true">
                    <use xlink:href="#arrow_right" />
                </svg>
            </button>
        {/if}
    </div>
{/if}

<style lang="scss">
    @import '../global.scss';

    .slider {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        gap: 72px;
    }

    .btn-clear {
        width: 40px;
        height: 40px;
        color: var(--nb-color);
        z-index: 2;
        transition: transform 0.3s ease-in-out;

        &:hover {
            transform: scale(1.1);
        }

        svg {
            width: 100%;
            height: 100%;
        }
    }

    .slider-group {
        display: block;
        position: relative;
        height: 276px;
        width: 300px;
    }

    .slider-item {
        position: absolute;
        height: 100%;
        width: 220px;
        // item width - group width / 2
        left: 40px;
        top: 0;
        background-color: var(--nb-bg-card);
        border-radius: var(--nb-radius);
        border: var(--nb-border-size) solid var(--nb-border);
        transition: transform 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
        box-shadow: 0 0 26px 0 var(--nb-shadow);

        figure {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 60%;
            height: 60%;
            margin: 0 auto;

            small {
                color: var(--nb-color-secondary);
                font-size: var(--nb-font-size--small);
            }
        }

        img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        article {
            text-align: center;

            h3 {
                margin-bottom: 12px;
            }

            small {
                color: var(--nb-color-secondary);
            }

            p {
                display: flex;
                width: fit-content;
                gap: 8px;
                margin: 12px auto 0;
                padding: 6px 12px 6px 6px;
                align-items: center;
                border-radius: var(--nb-radius);
                border: var(--nb-border-size) solid var(--nb-border-card);
                background-color: var(--nb-bg);
            }

            svg {
                width: 16px;
                height: 16px;
            }
        }

        &.current {
            z-index: 3;
        }

        &.next {
            z-index: 2;
            transform: translate3d(30%, 0, 0) rotate(5deg) scale(0.9);

            &.next-depth {
                z-index: 1;
                transform: translate3d(55%, 0, 0) rotate(12deg) scale(0.8);

                & + & {
                    z-index: 0;
                }
            }
        }

        &.prev {
            z-index: 2;
            transform: translate3d(-30%, 0, 0) rotate(-5deg) scale(0.9);

            &.prev-depth {
                z-index: 1;
                transform: translate3d(-55%, 0, 0) rotate(-12deg) scale(0.8);
            }
        }
    }
</style>
