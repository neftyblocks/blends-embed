<svelte:options tag="nefty-blend-selecter" />

<script lang="ts">
    import { get_current_component } from 'svelte/internal';
    import { dispatch } from '../utils';

    // COMPONENTS
    import './Slider.svelte';

    // GLOBALS
    const component = get_current_component();

    // STATES
    export let items = undefined;
    export let matchertype = undefined;
    export let selected = undefined;
    export let amount = 1;

    let show = false;

    // METHODS
    const toggleShow = () => {
        show = !show;
    };

    const isSelected = (item) => {
        return selected.some((select) => select.asset_id === item.asset_id);
    };

    const reset = () => {
        selected = items.slice(0, amount);

        items = items;
    };

    const selection = (item) => {
        if (isSelected(item)) {
            selected = selected.filter(
                (select) => select.asset_id !== item.asset_id
            );
        } else {
            selected = [...selected, item];

            if (selected.length > amount) {
                selected = selected.slice(1);
            }
        }

        // to update the list assign the same array
        items = items;

        dispatch('selected', selected, component, false);
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
        id="check"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></symbol
    >
    <symbol
        id="undo"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        ><path d="M3 7v6h6" /><path
            d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"
        /></symbol
    >
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
</svg>

{#if show}
    <button class="selecter-bg btn-clear" on:click={toggleShow} />
{/if}

<div class="selecter">
    <button class="btn-clear selecter-items" on:click={toggleShow}>
        {#if selected}
            {#if selected.length === 1}
                <span>#{selected[0].mint}</span>
            {:else}
                <span>{selected.length} items selected</span>
            {/if}

            <svg>
                <use href="#chevron_right" />
            </svg>
        {/if}
    </button>
    {#if show}
        <div class="selecter-list">
            <header>
                Select {amount} of {items.length}

                <button class="btn-clear" on:click={reset}>
                    <svg>
                        <use href="#undo" />
                    </svg>
                </button>
            </header>
            <div>
                {#each items as item}
                    <button
                        class="btn-clear {isSelected(item)
                            ? 'checked'
                            : ''} {matchertype}"
                        on:click={() => selection(item)}
                    >
                        {#if matchertype === 'collection' || matchertype === 'attributes' || matchertype === 'schema'}
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
                            {/if}
                        {/if}
                        <article>
                            {#if matchertype === 'balance'}
                                <p class="name">{item.name}: {item.value}</p>
                            {/if}
                            {#if matchertype === 'collection' || matchertype === 'attributes' || matchertype === 'schema'}
                                <p class="name">{item.name}</p>
                            {/if}
                            <p>#{item.mint}</p>
                            {#if item.backedByTokens}
                                <p class="badge">
                                    Backed by {item.backedByTokens}
                                </p>
                            {/if}
                        </article>

                        {#if isSelected(item)}
                            <svg>
                                <use href="#check" />
                            </svg>
                        {/if}
                    </button>
                {/each}
            </div>
        </div>
    {/if}
</div>

<!-- svelte-ignore css-unused-selector -->
<style lang="scss">
    @import '../style/global.scss';
    @import '../style/button.scss';

    .selecter-bg {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--nb-shadow);
    }

    .selecter {
        width: 100%;
        margin: 12px auto 0;
        padding: 0 12px;
        position: relative;
    }

    .selecter-items {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        width: 100%;
        max-height: 48px;
        overflow: hidden;
        padding: 6px 20px 6px 12px;
        align-items: center;
        border-radius: var(--nb-radius);
        border: var(--nb-border-size) solid var(--nb-border-card);
        background-color: var(--nb-bg);
        position: relative;
        cursor: pointer;

        span {
            line-height: 1;
            padding: 4px 6px;
            color: var(--nb-color);
            font-size: var(--nb-font-size--small);
            border-radius: var(--nb-radius);
            background-color: var(--nb-bg-selected);
            border: var(--nb-border-size) solid var(--nb-border);
        }

        svg {
            position: absolute;
            top: 50%;
            right: 2px;
            transform: translateY(-50%) rotate(90deg);
            width: 20px;
            height: 20px;
            color: var(--nb-color-secondary);
        }
    }

    .selecter-list {
        position: absolute;
        bottom: 44px;
        left: 50%;
        width: 360px;
        max-height: 280px;
        transform: translateX(-50%);
        border-radius: var(--nb-radius);
        background-color: var(--nb-bg-card);
        border: var(--nb-border-size) solid var(--nb-border-card);
        box-shadow: 0 0 26px 0 var(--nb-shadow);
        overflow: hidden auto;
        z-index: 1;

        header {
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            padding: 6px;
            height: 44px;
            color: var(--nb-color-secondary);
            font-size: var(--nb-font-size--small);
            border-bottom: var(--nb-border-size) solid var(--nb-border-card);

            button {
                display: flex;
                align-items: center;
                position: absolute;
                top: 9px;
                left: 6px;
                padding: 5px;
                color: var(--nb-color);
                font-size: var(--nb-font-size--small);
                border-radius: 14px;
                background-color: var(--nb-bg);
                border: var(--nb-border-size) solid var(--nb-border);

                svg {
                    width: 14px;
                    height: 14px;
                }
            }
        }

        > div {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;

            button {
                display: flex;
                align-items: center;
                color: var(--nb-color-secondary);
                text-align: left;
                padding: 12px 6px;
                border-bottom: var(--nb-border-size) solid var(--nb-border-card);

                img,
                video {
                    object-fit: contain;
                    width: 75px;
                    height: 75px;
                    margin-right: 6px;
                }

                svg {
                    width: 18px;
                    height: 18px;
                    margin-left: auto;
                    color: var(--nb-button-hover);
                }

                &.checked {
                    color: var(--nb-color);
                }

                &.collection,
                &.attributes,
                &.schema,
                &.balance {
                    .name {
                        color: var(--nb-color-secondary);
                        font-size: var(--nb-font-size--small);
                        margin-bottom: 6px;
                    }
                }

                &:hover {
                    background-color: rgba(#fff, 0.1);
                }

                &:last-child {
                    border-bottom: none;
                }
            }
        }
    }

    .badge {
        padding: 3px 6px;
        margin-top: 6px;
        border-radius: 6px;
        font-size: var(--nb-font-size--small);
        color: var(--nb-color);
        background-color: var(--nb-inactive);
    }
</style>
