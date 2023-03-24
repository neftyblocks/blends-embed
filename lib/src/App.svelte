<svelte:options tag="neftyblocks-blend" />

<script lang="ts">
    import { settings } from './store';

    // COMPONENTS
    import './components/Blends.svelte';
    import './components/Blend.svelte';
    import { onDestroy } from 'svelte/internal';

    // GLOBALS

    // STATES
    export let config: string;
    export let account: string | null = null;
    export let blend: string | null = null;
    export let transactionid: string | null = null;

    // METHODES
    settings.set({
        config: config ? JSON.parse(config) : null,
        account: account ? JSON.parse(account) : null,
        blend: blend ? JSON.parse(blend) : null,
        transactionId: transactionid,
    });

    $: console.log('update', config, account, blend, transactionid);

    $: if (transactionid || account) {
        settings.update((s) => {
            s.transactionId = transactionid !== 'null' ? transactionid : null;
            s.account = account ? JSON.parse(account) : null;
            return s;
        });

        if (transactionid) transactionid = null;
    }

    const handleBlend = (e: CustomEvent) => {
        blend = e.detail ? JSON.stringify(e.detail) : null;

        settings.update((s) => {
            s.blend = e.detail;
            return s;
        });
    };

    onDestroy(() => {
        settings.update((s) => {
            s.blend = null;
            s.transactionId = null;
            s.account = null;
            s.config = null;
            return s;
        });

        blend = null;
        transactionid = null;
        account = null;
        config = null;

        console.log('destroyed');
    });
</script>

<main>
    {#if blend}
        <nefty-blend-item on:blend={handleBlend} />
    {:else}
        <nefty-blend-group on:blend={handleBlend} />
    {/if}
</main>
