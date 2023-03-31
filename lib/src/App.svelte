<svelte:options tag="neftyblocks-blends" />

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
    $: {
        console.log(
            'All Types',
            typeof config,
            config,
            typeof account,
            account,
            typeof blend,
            blend,
            typeof transactionid,
            transactionid
        );

        if (config && config !== JSON.stringify($settings.config)) {
            console.log('Config', config);

            settings.update((s) => {
                s.config = JSON.parse(config);
                config = null;

                return s;
            });
        }

        if (account && account !== JSON.stringify($settings.account)) {
            console.log('Account', account);

            settings.update((s) => {
                s.account = JSON.parse(account);
                account = null;

                return s;
            });
        }

        if (transactionid && !$settings.transactionId) {
            console.log('Transaction', transactionid);

            settings.update((s) => {
                s.transactionId = transactionid;
                transactionid = null;

                return s;
            });
        }

        if (blend && !$settings.blend) {
            console.log('Blend', blend);

            settings.update((s) => {
                s.blend = JSON.parse(blend);
                blend = null;

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
