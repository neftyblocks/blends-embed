<svelte:options tag="nefty-blend-slider" />

<script lang="ts">
    import { useTokenDisplay } from '@nefty/use';
    import { onMount } from 'svelte/internal';

    // COMPONENTS
    import Sprite from './Sprite.svelte';

    // GLOBALS

    // STATES
    export let items: any[] = undefined;
    export let claims = false;

    let active = 0;
    let gridView = false;

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
        {#if items.length > 1 && !gridView}
            <button class="btn-clear prev" on:click={prev}>
                <svg role="presentation" focusable="false" aria-hidden="true">
                    <use xlink:href="#arrow_left" />
                </svg>
            </button>
        {/if}
        <div class="slider-group {gridView ? 'slider-group--grid' : ''}">
            {#each items as item, key}
                <div
                    class="slider-item {item.rarity} {key === active
                        ? 'current'
                        : key > active
                        ? 'next'
                        : 'prev'} 
                        {key < active - 1 ? 'prev-depth' : ''} 
                        {key > active + 1 ? 'next-depth' : ''}
                        "
                >
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
                            <!-- <img class="shadow" src={item.image} alt="" /> -->
                            <img src={item.image} alt={item.name} />
                        {:else}
                            <small>No result</small>
                        {/if}
                    </figure>
                    <article>
                        <h3>{item.name}</h3>
                        {#if item.drop_rate}
                            <small>
                                {useTokenDisplay(item.drop_rate, 2)}% Drop rate
                            </small>
                        {/if}
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
        {#if items.length > 1 && !gridView}
            <button class="btn-clear next" on:click={next}>
                <svg role="presentation" focusable="false" aria-hidden="true">
                    <use xlink:href="#arrow_right" />
                </svg>
            </button>
        {/if}

        {#if items.length > 1}
            <button
                class="btn-clear grid"
                on:click={() => (gridView = !gridView)}
            >
                <svg role="presentation" focusable="false" aria-hidden="true">
                    <use xlink:href={gridView ? '#carousel' : '#grid'} />
                </svg>
            </button>
        {/if}
    </div>
{/if}

<!-- svelte-ignore css-unused-selector -->
<style lang="scss">
    @import '../style/global.scss';
    @import '../style/button.scss';

    .slider {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        gap: 72px;
        position: relative;
        overflow: hidden;
    }

    .btn-clear {
        width: 40px;
        height: 40px;
        color: var(--nb-color);
        z-index: 2;
        transition: transform 0.15s ease;

        &:hover {
            transform: scale(1.1);
        }

        &:active {
            transform: scale(0.9);
        }

        svg {
            width: 100%;
            height: 100%;
        }

        &.grid {
            position: absolute;
            top: 12px;
            right: 24px;
            z-index: 1;
            width: 28px;
            height: 28px;
        }
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
        border: var(--nb-border-size) solid;
        transition: transform 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
        box-shadow: 0 0 26px 0 var(--nb-shadow);

        &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: var(--nb-radius);
            z-index: -1;
            opacity: 0.1;
        }

        &.common {
            border-color: var(--nb-rarity-common);

            &::before {
                background-color: var(--nb-rarity-common);
            }

            small {
                color: var(--nb-color-secondary);
            }
        }

        &.uncommon {
            border-color: var(--nb-rarity-uncommon);

            &::before {
                background-color: var(--nb-rarity-uncommon);
            }

            small {
                color: var(--nb-rarity-uncommon);
            }
        }

        &.rare {
            border-color: var(--nb-rarity-rare);

            &::before {
                background-color: var(--nb-rarity-rare);
            }

            small {
                color: var(--nb-rarity-rare);
            }
        }

        &.epic {
            border-color: var(--nb-rarity-epic);

            &::before {
                background-color: var(--nb-rarity-epic);
            }

            small {
                color: var(--nb-rarity-epic);
            }
        }

        &.legendary {
            border-color: var(--nb-rarity-legendary);

            &::before {
                background-color: var(--nb-rarity-legendary);
            }

            small {
                color: var(--nb-rarity-legendary);
            }
        }

        figure {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 60%;
            padding: 12px;
            position: relative;
            overflow: hidden;

            small {
                color: var(--nb-color-secondary);
                font-size: var(--nb-font-size--small);
            }
        }

        img,
        video {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        article {
            text-align: center;

            h3 {
                margin-bottom: 12px;
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
                    box-shadow: none;
                }
            }
        }

        &.prev {
            z-index: 2;
            transform: translate3d(-30%, 0, 0) rotate(-5deg) scale(0.9);

            &.prev-depth {
                z-index: 1;
                transform: translate3d(-55%, 0, 0) rotate(-12deg) scale(0.8);

                & + & {
                    box-shadow: none;
                }
            }
        }
    }

    .slider-group {
        display: block;
        position: relative;
        height: 276px;
        width: 300px;
        padding: 24px 48px;

        &--grid {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            height: 100%;
            width: 100%;
            gap: var(--nb-gap);
            overflow: hidden auto;

            .slider-item {
                position: static;
                transform: translate3d(0, 0, 0) rotate(0) scale(1);
                width: clamp(180px, 30vw, 220px);
                height: 276px;
                z-index: 0;
                &.prev,
                &.next {
                    z-index: 0;
                    transform: translate3d(0, 0, 0) rotate(0) scale(1);
                }

                &.prev.prev-depth + .slider-item.prev.prev-depth {
                    box-shadow: 0 0 26px 0 var(--nb-shadow);
                }

                &.next.next-depth + .slider-item.next.next-depth {
                    box-shadow: 0 0 26px 0 var(--nb-shadow);
                }

                &:hover {
                    transform: translate3d(0, 0, 0) rotate(0) scale(1.1);
                }
            }
        }
    }
</style>
