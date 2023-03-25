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

    let error = null;

    // METHODES
    if (!config) {
        error = 'No config provided';
    }

    settings.set({
        config: config ? JSON.parse(config) : null,
        account: account ? JSON.parse(account) : null,
        blend: blend ? JSON.parse(blend) : null,
        transactionId: transactionid ? transactionid : null,
    });

    $: {
        if (config) {
            settings.update((s) => {
                s.config = JSON.parse(config);
                return s;
            });
        }

        if (account) {
            settings.update((s) => {
                s.account = JSON.parse(account);
                return s;
            });
        }

        if (transactionid) {
            settings.update((s) => {
                s.transactionId = transactionid;
                return s;
            });

            transactionid = null;
        }

        if (blend) {
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

<svg
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    width="0"
    height="0"
    style="position: absolute"
>
    <symbol
        id="blender"
        xml:space="preserve"
        fill-rule="evenodd"
        fill="currentColor"
        stroke-linejoin="round"
        stroke-miterlimit="2"
        clip-rule="evenodd"
        viewBox="0 0 48 48"
        ><path
            fill-rule="nonzero"
            d="M15 44c-.8 0-1.5-.3-2.1-.9-.6-.6-.9-1.3-.9-2.1v-2a8.8 8.8 0 0 1 4.4-7.6l-2-10H9c-.8 0-1.5-.3-2.1-1-.6-.5-.9-1.2-.9-2V9.5c0-.8.3-1.5.9-2.1.6-.6 1.3-.9 2.1-.9h27l-4.4 24.9c1.4 1 2.5 2 3.3 3.4A7.4 7.4 0 0 1 36 39v2c0 .8-.3 1.5-.9 2.1-.6.6-1.3.9-2.1.9H15Zm-1.2-25.6L12 9.5H9v8.8l4.8.1Zm5.3 11.1h9.8l3.5-20H15.1l4 20ZM15 41h18v-2c0-1.8-.7-3.3-2-4.6a7 7 0 0 0-5-1.9h-4c-2 0-3.7.7-5 2a6.2 6.2 0 0 0-2 4.5v2Z"
        /></symbol
    >
</svg>

<main>
    {#if error}
        <p class="error">
            <svg role="presentation" focusable="false" aria-hidden="true">
                <use xlink:href="#blender" />
            </svg>
            {error}
        </p>
    {:else if blend}
        <nefty-blend-item on:blend={handleBlend} />
    {:else}
        <nefty-blend-group on:blend={handleBlend} />
    {/if}
</main>

<style lang="scss">
    @import './style/global.scss';
    @import './style/states.scss';
</style>
