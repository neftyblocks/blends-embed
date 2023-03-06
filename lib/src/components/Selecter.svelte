<svelte:options tag="nefty-blend-selecter" />

<script lang="ts">
    import { get_current_component } from 'svelte/internal';
    import { dispatch } from '../utils';

    // COMPONENTS
    import './Slider.svelte';
    import Sprite from './Sprite.svelte';

    // GLOBALS
    const component = get_current_component();

    // STATES
    export let items = undefined;
    export let matcher = undefined;
    export let selected = undefined;
    export let amount = 1;

    let show = false;

    // METHODS
    const toggleShow = () => {
        show = !show;
    };

    const isSelected = (item) => {
        return selected.some((select) => select.mint === item.mint);
    };

    const reset = () => {
        selected = items.slice(0, amount);

        items = items;
    };

    const selection = (item) => {
        if (isSelected(item)) {
            selected = selected.filter((select) => select.mint !== item.mint);
        } else {
            selected = [...selected, item];

            if (selected.length > amount) {
                selected = selected.slice(1);
            }
        }

        // to update the list assign the same array
        items = items;

        dispatch('selected', null, component, false);
    };
</script>

<Sprite />

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
                        class="btn-clear {isSelected(item) ? 'checked' : ''}"
                        on:click={() => selection(item)}
                    >
                        #{item.mint}
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
    @import '../global.scss';

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
        width: 180px;
        max-height: 180px;
        padding: 6px;
        transform: translateX(-50%);
        border-radius: var(--nb-radius);
        background-color: var(--nb-bg-card);
        border: var(--nb-border-size) solid var(--nb-border-card);
        box-shadow: 0 0 26px 0 var(--nb-shadow);
        overflow: hidden auto;

        header {
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            padding: 0 0 6px;
            height: 29px;
            color: var(--nb-color-secondary);
            font-size: var(--nb-font-size--small);
            border-bottom: var(--nb-border-size) solid var(--nb-border-card);

            button {
                display: flex;
                align-items: center;
                position: absolute;
                top: -2px;
                right: -2px;
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
                padding: 6px 0;
                border-bottom: var(--nb-border-size) solid var(--nb-border-card);

                svg {
                    width: 18px;
                    height: 18px;
                    margin-left: auto;
                    color: var(--nb-button-hover);
                }

                &.checked {
                    color: var(--nb-color);
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
</style>
