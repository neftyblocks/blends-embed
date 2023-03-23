<svelte:options tag="neftyblocks-blend" />

<script lang="ts">
    import { settings } from './store';

    // COMPONENTS
    import './components/Blends.svelte';
    import './components/Blend.svelte';

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
</script>

<main>
    {#if blend}
        <nefty-blend-item on:blend={handleBlend} />
    {:else}
        <nefty-blend-group on:blend={handleBlend} />
    {/if}
</main>
