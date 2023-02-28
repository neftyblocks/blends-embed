<svelte:options tag="nefty-blend-item" />

<script lang="ts">
    import { useMarkdown } from '@nefty/use';
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

            console.log(data);
        }
    });

    onDestroy(() => {
        unsubscribe();
    });
</script>

{#if data}
    <button on:click={() => dispatch('blend', null, component)}>back</button>
    <div class="blend">
        <main>
            <section class="blend-results">
                {#each data.results as item}
                    <figure>
                        <img src={item.image} alt={item.name} />
                    </figure>
                {/each}
                <img
                    class="result-bg"
                    src={data.results[0].image}
                    alt=""
                    loading="lazy"
                />
            </section>
            <section class="blend-selection">
                <h2>Selection</h2>
            </section>
        </main>
        <aside class="blend-text">
            <article class="markdown">
                {@html useMarkdown(data.description)}

                <template>
                    <h1 />
                    <h2 />
                    <h3 />
                    <h4 />
                    <h5 />
                    <strong />
                    <p />
                    <ul />
                    <li />
                    <a />
                    <img />
                    <table>
                        <th />
                        <td />
                    </table>
                </template>
            </article>
        </aside>
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

    .blend {
        display: grid;
        grid-template-columns: 1fr 0.3fr;
        gap: 48px;

        & main {
            display: flex;
            flex-direction: column;
            gap: 48px;
        }
    }

    .blend-text {
        background-color: var(--nb-bg-card);
        border-radius: var(--nb-radius);
        border: var(--nb-border-size) solid var(--nb-border);
        padding: 12px;
    }

    .blend-results {
        background-color: var(--nb-bg-card);
        border-radius: var(--nb-radius);
        border: var(--nb-border-size) solid var(--nb-border);
        padding: 12px;
        min-height: 40vh;
        position: relative;
        overflow: hidden;
        z-index: 0;

        figure {
        }
    }

    .result-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: blur(120px);
        opacity: 0.3;
        z-index: -1;
    }

    .blend-selection {
        h2 {
            color: var(--nb-color-secondary);
            font-size: var(--nb-font-size--large);
            position: relative;
            z-index: 0;
            text-align: center;

            &::before {
                content: '';
                position: absolute;
                top: calc(50% + 1px);
                left: 0;
                transform: translateY(-50%);
                width: 100%;
                height: 2px;
                z-index: -1;
                background-color: var(--nb-border);
            }

            &::after {
                content: '';
                position: absolute;
                background-color: var(--nb-bg);
                display: block;
                filter: blur(3px);
                height: 100%;
                left: calc(50% - 85px);
                top: 0;
                width: 170px;
                z-index: -1;
            }
        }
    }
</style>
