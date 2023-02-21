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

    button {
        border-radius: 8px;
        border: 1px solid transparent;
        padding: 0.6em 1.2em;
        font-size: 1em;
        font-weight: 500;
        font-family: inherit;
        background-color: #fff;
        cursor: pointer;
        transition: border-color 0.25s;

        &:hover {
            border-color: #646cff;
        }

        &:focus,
        &:focus-visible {
            outline: 4px auto -webkit-focus-ring-color;
        }
    }
</style>
