<svelte:options tag="nefty-blend-item" />

<script lang="ts">
    import { onDestroy } from 'svelte';
    import { get_current_component } from 'svelte/internal';
    import { getBlend, settings } from '../store';
    import { dispatch } from '../utils';

    // COMPONENTS

    // GLOBALS
    const component = get_current_component();

    // STATES
    export let data = undefined;

    // METHODS
    const unsubscribe = settings.subscribe(async ({ config, blend }) => {
        if (config && blend) {
            data = await getBlend({
                atomic_url: config.atomic_url,
                blend_id: blend.blend_id,
                contract: blend.contract,
            });
        }
    });

    onDestroy(() => {
        unsubscribe();
    });
</script>

{#if data}
    <button on:click={() => dispatch('blend', null, component)}>close</button>
    <div class="blend">
        <h2>Blend</h2>
        <pre><code>{data}</code></pre>
    </div>
    <button on:click={() => dispatch('sign', { test: 1 }, component)}>
        Click to sign
    </button>
{:else if data === null}
    <div>An error happend</div>
{:else}
    <div>loading blend...</div>
{/if}

<style lang="scss">
    @import '../global.scss';
</style>
