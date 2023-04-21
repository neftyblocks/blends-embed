<svelte:options tag="nefty-blend-slider" />

<script lang="ts">
    import { useTokenDisplay } from '@nefty/use';
    import { onMount } from 'svelte/internal';

    // COMPONENTS

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

<svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="0"
    height="0"
    style="position: absolute"
>
    <symbol
        id="hash"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><line x1="4" y1="9" x2="20" y2="9" /><line
            x1="4"
            y1="15"
            x2="20"
            y2="15"
        /><line x1="10" y1="3" x2="8" y2="21" /><line
            x1="16"
            y1="3"
            x2="14"
            y2="21"
        />
    </symbol>
    <symbol
        id="grid"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><rect x="3" y="3" width="7" height="7" /><rect
            x="14"
            y="3"
            width="7"
            height="7"
        /><rect x="14" y="14" width="7" height="7" /><rect
            x="3"
            y="14"
            width="7"
            height="7"
        /></symbol
    >
    <symbol
        id="carousel"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
    >
        <path
            d="M7.556 4h8.888v16H7.556V4zm8.888 1.333H22v13.334h-5.556V5.333zM2 5.333h5.556v13.334H2V5.333z"
        />
    </symbol>
    <symbol
        id="arrow_right"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><line x1="5" y1="12" x2="19" y2="12" /><polyline
            points="12 5 19 12 12 19"
        /></symbol
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
</svg>

{#if items}
    <div class="slider {claims ? 'claims' : ''}">
        {#if items.length > 1 && !gridView}
            <button class="btn-clear prev" on:click={prev}>
                <svg role="presentation" focusable="false" aria-hidden="true">
                    <use xlink:href="#arrow_left" />
                </svg>
            </button>
        {/if}

        {#if items.length >= 1}
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
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    loading="lazy"
                                />
                            {:else}
                                <small>No result</small>
                            {/if}
                        </figure>
                        <article>
                            <h3>{item.name}</h3>
                            {#if item.drop_rate && !claims}
                                <small>
                                    {useTokenDisplay(item.drop_rate, 2)}% Drop
                                    rate
                                </small>
                            {/if}
                            {#if item.mint && !claims}
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
        {:else}
            <p>No result</p>
        {/if}
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
        gap: 24px;
        position: relative;
        overflow: hidden;

        &.claims {
            opacity: 0;
            animation: show 0.6s 5s ease forwards;

            @keyframes show {
                0% {
                    opacity: 0;
                }
                100% {
                    opacity: 1;
                }
            }
        }
    }

    .btn-clear {
        width: 40px;
        height: 40px;
        color: var(--nb-color);
        z-index: 4;
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
        left: 0;
        top: 0;
        background-color: var(--nb-bg-card);
        border-radius: var(--nb-radius);
        border: var(--nb-border-size) solid;
        transition: transform 0.5s cubic-bezier(0.165, 0.84, 0.44, 1),
            filter 0.1s linear;

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
            transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
        }

        &.next {
            z-index: 2;
            transform: translate3d(30%, 0, 0) rotate(5deg) scale(0.9);
            filter: brightness(0.8);

            &.next-depth {
                z-index: 1;
                transform: translate3d(55%, 0, 0) rotate(12deg) scale(0.8);
                filter: brightness(0.5);

                & + & {
                    z-index: 0;
                }
            }
        }

        &.prev {
            z-index: 2;
            transform: translate3d(-30%, 0, 0) rotate(-5deg) scale(0.9);
            filter: brightness(0.8);

            &.prev-depth {
                z-index: 1;
                transform: translate3d(-55%, 0, 0) rotate(-12deg) scale(0.8);
                filter: brightness(0.5);
            }
        }
    }

    .slider-group {
        display: block;
        position: relative;
        height: 276px;
        width: 220px;

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
                    filter: brightness(1);
                    transform: translate3d(0, 0, 0) rotate(0) scale(1);
                }

                &.prev.prev-depth + .slider-item.prev.prev-depth {
                    filter: brightness(1);
                }

                &.next.next-depth + .slider-item.next.next-depth {
                    filter: brightness(1);
                }

                &:hover {
                    transform: translate3d(0, 0, 0) rotate(0) scale(1.1);
                }
            }
        }
    }

    @media all and (min-width: 768px) {
        .slider {
            gap: 72px;
        }
    }
</style>
