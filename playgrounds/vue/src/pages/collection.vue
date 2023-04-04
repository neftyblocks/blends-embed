<template>
    <main>
        <neftyblocks-blends
            :config="setup"
            :account="account"
            :transactionId="transactionId"
            @sign="signHandler"
        />
    </main>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { user } from '../composables/states';

import '@neftyblocks/blends';

const { currentRoute } = useRouter();
const collection = ref(currentRoute.value.params.collection as string);

const transactionId = ref<string | null>(null);
const account = ref<string | null>(null);

const setup = ref<any | null>(
    JSON.stringify({
        atomic_url: 'https://aa-testnet.neftyblocks.com',
        chain_url: 'https://waxtest.eu.eosamsterdam.net',
        marketplace_url: 'https://test.neftyblocks.com/marketplace/listing',
        chain: 'wax',
        collection: collection.value,
        profile_url: 'https://test.neftyblocks.com/profile/',
        back_btn: false,
    })
);

watch(user, () => {
    if (user.value) account.value = user.value;
    else account.value = 'unset';
});

watch(currentRoute, (vnew, vold) => {
    if (vnew.params.collection === vold.params.collection) return;

    setup.value = JSON.stringify({
        atomic_url: 'https://aa-testnet.neftyblocks.com',
        chain_url: 'https://waxtest.eu.eosamsterdam.net',
        marketplace_url: 'https://test.neftyblocks.com/marketplace/listing',
        chain: 'wax',
        collection: vnew.params.collection,
        profile_url: 'https://test.neftyblocks.com/profile/',
        back_btn: false,
    });
});

const signHandler = async ({ detail }: any) => {
    console.log('signHandler', detail);

    try {
        const result: any = await window.provider_user.signTransaction(
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

        transactionId.value = 'unset';
    }
};
</script>
