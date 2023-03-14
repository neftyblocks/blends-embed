import './style.scss';
import '@neftyblocks/blends';
import { useWallet } from './wallet';

const el = document.querySelector('#neftyblocks-blend');
const form = document.querySelector('#neftyblocks-form');

const mountEl = ({ collection = 'alpacaworlds', account = 'alpacaworlds' }) => {
    if (el) {
        el.innerHTML = '';

        const config = {
            atomic_url: 'https://aa.neftyblocks.com',
            chain_url: 'https://wax.neftyblocks.com',
            marketplace_url: 'https://neftyblocks.com/marketplace/listing',
            chain: 'wax',
        };

        const embed = `<neftyblocks-blend 
                        config=${JSON.stringify(config)} 
                        collection=${collection} 
                        account=${null} 
                    />`;

        el.innerHTML = embed;

        // Listen for sign event
        const component = document.querySelector('neftyblocks-blend');

        if (component) {
            component.addEventListener('sign', ({ detail }: any) => {
                console.log('sign', detail);
            });
        }
    }
};

mountEl({});

form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(form as HTMLFormElement);
    const collection = formData.get('neftyblocks-collection');
    const account = formData.get('neftyblocks-account');

    if (collection && account) {
        mountEl({
            collection: collection as string,
            account: account as string,
        });
    }
});

useWallet({
    chain_url: 'https://wax.neftyblocks.com',
    chain_id: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
});
