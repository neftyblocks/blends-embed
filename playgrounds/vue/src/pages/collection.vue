<template>
    <main>
        <neftyblocks-blends
            ref="blendEl"
            :config="setup"
            :account="user"
            :transactionId="transactionId"
            @sign="signHandler"
        />
    </main>
</template>

<script setup lang="ts">
import { onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { user } from '../composables/states';

import '@neftyblocks/blends';

const { currentRoute } = useRouter();
const collection = currentRoute.value.params.collection as string;

const blendEl = ref<HTMLElement | null>(null);
const transactionId = ref<string | null>(null);
const setup = ref<any | null>(
    JSON.stringify({
        atomic_url: 'https://aa-testnet.neftyblocks.com',
        chain_url: 'https://waxtest.eu.eosamsterdam.net',
        marketplace_url: 'https://test.neftyblocks.com/marketplace/listing',
        chain: 'wax',
        collection: collection,
        profile_url: 'https://test.neftyblocks.com/profile/',
        back_btn: false,
    })
);

onUnmounted(() => {
    if (blendEl.value) {
        blendEl.value.remove();
    }
});

const signHandler = async ({ detail }: any) => {
    console.log('signHandler', detail);

    try {
        const result = await window.provider_user.signTransaction(
            { actions: detail },
            {
                broadcast: true,
                blocksBehind: 3,
                expireSeconds: 120,
            }
        );

        if (result) {
            transactionId.value = result.transaction_id;
        }
    } catch (error) {
        console.log('error', error);
    }
};
</script>
