<svelte:options tag="neftyblocks-blend" />

<script lang="ts">
    import { settings } from './store';

    // COMPONENTS
    import './components/Blends.svelte';
    import './components/Blend.svelte';

    // GLOBALS

    // STATES
    export let config: string | null = null;
    export let account: string | null = null;
    export let blend: string | null = null;
    export let transactionid: string | null = null;

    // METHODES
    settings.set({
        config: config ? JSON.parse(config) : null,
        account: account ? JSON.parse(account) : null,
        blend: blend ? JSON.parse(blend) : null,
        transactionId: transactionid ? transactionid : null,
    });

    $: {
        if (config && !$settings.config) {
            settings.update((s) => {
                s.config = JSON.parse(config);
                return s;
            });
        }

        if (account && !$settings.account) {
            settings.update((s) => {
                s.account = JSON.parse(account);
                return s;
            });
        }

        if (transactionid && !$settings.transactionId) {
            settings.update((s) => {
                s.transactionId = transactionid;
                return s;
            });

            transactionid = null;
        }

        if (blend && !$settings.blend) {
            settings.update((s) => {
                s.blend = JSON.parse(blend);
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
    {#if blend}
        <nefty-blend-item on:blend={handleBlend} />
    {:else}
        <nefty-blend-group on:blend={handleBlend} />
    {/if}
</main>
