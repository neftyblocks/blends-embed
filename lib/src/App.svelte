<svelte:options tag="neftyblocks-blend" />

<script lang="ts">
    import './lib/Counter.svelte';
</script>

<main>
    <h1>Blend</h1>

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
