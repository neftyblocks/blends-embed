<svelte:options tag="nefty-blend-item" />

<script lang="ts">
    import { get_current_component } from 'svelte/internal';
    import { getBlend, settings } from '../store';
    import { dispatch } from '../utils';

    // COMPONENTS

    // GLOBALS
    const component = get_current_component();

    // STATES
    let blend;

    // METHODS
    settings.subscribe(async ({ config, blend }) => {
        if (config && blend) {
            blend = await getBlend({
                atomic_url: config.atomic_url,
                blend_id: blend.blend_id,
                contract: blend.contract,
            });
        }
    });
</script>

{#if blend}
    <button on:click={() => dispatch('blend', null, component)}>close</button>
    <div class="blend">
        <h2>Blend</h2>
        <pre><code>{blend}</code></pre>
    </div>
    <button on:click={() => dispatch('sign', { test: 1 }, component)}>
        Click to sign
    </button>
{:else if blend === null}
    <div>An error happend</div>
{:else}
    <div>loading...</div>
{/if}

<style lang="scss">
    @import '../global.scss';
</style>
