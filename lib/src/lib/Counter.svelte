<svelte:options tag="neftyblocks-counter" />

<script lang="ts">
    let count: number = 0;
    const increment = () => {
        count += 1;
    };
</script>

<button class="button" on:click={increment}>
    count is {count}
</button>

<style lang="scss">
    @import '../global.scss';
</style>
