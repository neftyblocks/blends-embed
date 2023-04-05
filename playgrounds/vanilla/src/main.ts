import './style.scss';
import '@neftyblocks/blends';
import { WalletUser } from '@nefty/use/dist/wallet';
import { useWallet } from './wallet';

const el = document.querySelector('#neftyblocks-blend');
const form = document.querySelector('#neftyblocks-form');
const login = document.querySelector('#wallet-login');
const logout = document.querySelector('#wallet-logout');

let account: { actor: string; permission: string } | null = null;
let collection = 'alpacaworlds';

const mountEl = () => {
    if (el) {
        el.innerHTML = '';

        const config = {
            atomic_url: 'https://aa-testnet.neftyblocks.com',
            chain_url: 'https://waxtest.eu.eosamsterdam.net',
            marketplace_url: 'https://test.neftyblocks.com/marketplace/listing',
            chain: 'wax',
            collection,
        };

        const embed = `<neftyblocks-blends 
                        config=${JSON.stringify(config)} 
                    />`;

        el.innerHTML = embed;

        // Listen for sign event
        const component = document.querySelector('neftyblocks-blend');

        if (component && window.provider_user) {
            component.addEventListener('sign', async ({ detail }: any) => {
                try {
                    const result = await window.provider_user.signTransaction(
                        { actions: detail },
                        {
                            broadcast: true,
                            blocksBehind: 3,
                            expireSeconds: 120,
                        },
                    );

                    component.setAttribute('transaction', result.transaction.transaction_id);
                } catch (e) {
                    console.error(e);

                    component.setAttribute('transaction', 'unset');
                }
            });
        }
    }
};

const callback = (users: WalletUser[]): void => {
    const component = document.querySelector('neftyblocks-blend');

    const [walletUser] = users;

    window.provider_user = walletUser;
    window.provider_user.requestPermission = walletUser.requestPermission || 'active';

    login?.classList.add('hidden');
    logout?.classList.remove('hidden');

    if (walletUser) {
        account = {
            actor: walletUser.accountName,
            permission: walletUser.requestPermission || 'active',
        };

        if (component) component.setAttribute('account', JSON.stringify(account));

        if (logout) logout.innerHTML = `Logout (${account.actor})`;

        logout?.addEventListener('click', () => {
            window.provider.logoutUser();
            account = null;

            login?.classList.remove('hidden');
            logout.classList.add('hidden');
            logout.innerHTML = '';

            if (component) component.setAttribute('account', 'unset');
        });
    }

    const anchorModal = document.querySelector('.anchor-link-active');
    if (anchorModal) anchorModal.classList.remove('anchor-link-active');
};

useWallet({
    chain_url: 'https://waxtest.eu.eosamsterdam.net',
    chain_id: 'f16b1833c747c43682f4386fca9cbb327929334a762755ebec17f6f23c9b8a12',
    callback,
});

form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(form as HTMLFormElement);
    const collectionData = formData.get('neftyblocks-collection');

    if (collectionData) {
        collection = collectionData as string;

        mountEl();

        if (account) {
            const component = document.querySelector('neftyblocks-blend');

            if (component) component.setAttribute('account', JSON.stringify(account));
        }
    }
});

login?.addEventListener('click', () => {
    window.provider.loginUser(window.wallet_anchor);
});

mountEl();
