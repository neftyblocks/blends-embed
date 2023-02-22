<svelte:options tag="neftyblocks-blend" />

<script lang="ts">
    import { get_current_component } from 'svelte/internal';
    import { settings } from './store';

    // COMPONENTS
    import './components/Blends.svelte';

    // PROPS
    export let config: string;
    export let collection: string;
    export let account: string | null;

    // STORES
    settings.set({ ...JSON.parse(config), collection, account });

    // METHODES
    const thisComponent = get_current_component();

    const dispatch = (name: string, detail: any) => {
        thisComponent.dispatchEvent(
            new CustomEvent(name, {
                detail,
                composed: true, // propagate across the shadow DOM
            })
        );
    };
</script>

<main>
    <nefty-blend-group />
    <button on:click={() => dispatch('sign', { test: 1 })}>
        Click to sign
    </button>
</main>

<style lang="scss">
    @import './global.scss';

    button {
        border-radius: 8px;
        border: 1px solid transparent;
        padding: 0.6em 1.2em;
        font-size: 1em;
        font-weight: 500;
        font-family: inherit;
        background-color: #fff;
        color: #000;
        cursor: pointer;
        transition: border-color 0.25s;

        &:hover {
            border-color: #646cff;
        }

        &:focus,
        &:focus-visible {
            outline: 4px auto -webkit-focus-ring-color;
        }
    }
</style>
