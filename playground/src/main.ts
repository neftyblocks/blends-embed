import './style.scss';
import 'neftyblocks-blend';

const el = document.querySelector('#neftyblocks-blend');

if (el) {
    const config = {
        atomic_url: 'https://aa.neftyblocks.com',
        chain_url: 'https://wax-public.neftyblocks.com',
    };

    const embed = `<neftyblocks-blend 
                        config=${JSON.stringify(config)} 
                        collection=alpacaworlds 
                        account=alpacaworlds 
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
