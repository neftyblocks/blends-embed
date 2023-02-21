<svelte:options tag="neftyblocks-blend" />

<script lang="ts">
    import { get_current_component } from 'svelte/internal';
    import './lib/Counter.svelte';

    const thisComponent = get_current_component();

    export let config;
    export let collection;
    export let account;

    const dispatch = (name, detail) => {
        thisComponent.dispatchEvent(
            new CustomEvent(name, {
                detail,
                composed: true, // propagate across the shadow DOM
            })
        );
    };
</script>

<main>
    <h1>Blend</h1>

    <p>Config: {config}</p>
    <p>Collection: {collection}</p>
    <p>Account: {account}</p>

    <button on:click={() => dispatch('sign', { test: 1 })}>
        Click to sign
    </button>

    <neftyblocks-counter />
</main>

<style lang="scss">
    @import './global.scss';

    :host {
        display: block;
        color: var(--nefty-color, #fcfcfd);
    }

    :host h1 {
        font-size: 34px;
    }
</style>
