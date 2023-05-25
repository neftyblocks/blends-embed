<template>
    <main>
        <neftyblocks-blends
            :config="setup"
            :blend="blend"
            :account="account"
            :transactionId="transactionId"
            @sign="signHandler"
            @error="setError"
            @blend="setblendUrl"
        />
    </main>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { user } from '../composables/states';

import '@neftyblocks/blends';

const router = useRouter();
const { currentRoute } = useRouter();
const collection = ref(currentRoute.value.params.collection as string);
const contract = ref(currentRoute.value.params.contract as string);
const id = ref(currentRoute.value.params.id as string);
const blend = ref(
    id.value
        ? JSON.stringify({ blend_id: id.value, contract: contract.value })
        : null
);

const transactionId = ref<string | null>(null);
const account = ref<string | null>(null);
const setup = ref<any | null>(null);

const handlePopState = () => {
    router.go(0);
};

onMounted(() => {
    setup.value = JSON.stringify({
        atomic_url: 'https://aa.neftyblocks.com',
        chain_url: 'https://wax.neftyblocks.com',
        platform_url: 'https://neftyblocks.com',
        chain: 'wax',
        collection: collection.value,
        back_btn: false,
    });

    // fix issue with back button
    window.addEventListener('popstate', handlePopState, { passive: true });
});

onBeforeUnmount(() => {
    window.removeEventListener('popstate', handlePopState);
});

watch(currentRoute, (vnew, vold) => {
    if (vnew.params.collection === vold.params.collection) return;

    router.go(0);
});

watch(user, () => {
    if (user.value) account.value = user.value;
    else account.value = 'unset';
});

const setError = ({ detail }: any) => {
    console.error('error', detail);
};

const signHandler = async ({ detail }: any) => {
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
            transactionId.value = result.transaction.transaction_id;
        }
    } catch (error) {
        console.error('error', error);
        transactionId.value = 'unset';
    }
};

// silently update the url without reloading the page
const setblendUrl = ({ detail }: any) => {
    let url;

    if (detail) {
        const { blend_id, contract } = detail;
        url = `/${collection.value}/${contract}/${blend_id}`;
    } else {
        url = `/${collection.value}`;
    }

    history.pushState(history.state, '', url);
};
</script>
