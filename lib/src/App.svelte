<svelte:options tag="neftyblocks-blends" />

<script lang="ts">
    import { settings } from './store';
    import { onMount } from 'svelte/internal';

    // COMPONENTS
    import './components/Blends.svelte';
    import './components/Blend.svelte';

    // GLOBALS

    // STATES
    export let account: string | null = null;
    export let blend: string | null = null;
    export let config: string | null = null;
    export let transactionid: string | null = null;

    // METHODES
    onMount(() => {
        // onDestroy clean up store
        return () => {
            $settings = {
                blend: null,
                account: null,
                config: null,
                transactionId: null,
            };

            account = null;
            blend = null;
            config = null;
            transactionid = null;
        };
    });

    $: {
        let detailView = !!blend;

        if (account && account !== JSON.stringify($settings.account)) {
            settings.update((s) => {
                s.account = account !== 'unset' ? JSON.parse(account) : null;
                account = null;

                return s;
            });
        }

        if (blend && !$settings.blend) {
            settings.update((s) => {
                s.blend = JSON.parse(blend);
                blend = null;

                return s;
            });
        }

        if (config && config !== JSON.stringify($settings.config)) {
            settings.update((s) => {
                // fix issue with triggering a config update
                const query = JSON.stringify(
                    detailView && s.config ? { query: s.config.query } : {}
                );

                s.config = {
                    ...JSON.parse(config),
                    ...JSON.parse(query),
                };
                config = null;

                return s;
            });
        }

        if (transactionid) {
            settings.update((s) => {
                s.transactionId = transactionid;
                transactionid = null;

                return s;
            });
        }
    }

    const handleBlend = (e: CustomEvent) => {
        blend = e.detail ? JSON.stringify(e.detail) : null;

        settings.update((s) => {
            s.blend = e.detail;
            return s;
        });
    };
</script>

<main>
    {#if blend || $settings.blend}
        <nefty-blend-item on:blend={handleBlend} />
    {:else}
        <nefty-blend-group on:blend={handleBlend} />
    {/if}
</main>
