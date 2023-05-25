import { Anchor } from '@nefty/ual-anchor';
import { Wax } from '@nefty/ual-wax';
import { WalletUAL, WalletUser } from '@nefty/use/dist/wallet';

declare global {
    interface Window {
        global: any;
        wallet_anchor: Anchor;
        wallet_wax: Wax;
        provider: WalletUAL;
        provider_user: WalletUser;
    }
}

export function useWallet({
    chain_url,
    chain_id,
    callback,
}: { chain_url: string; chain_id: string; callback: (users: WalletUser[]) => void }) {
    window.global = window;
    const rpcEndpoints = [`${chain_url}:443`];

    const endpoints = rpcEndpoints.map((endpoint: string) => {
        const [protocol, hostWithPort] = endpoint.split('://');
        const [host, port] = hostWithPort.split(':');

        return {
            protocol,
            host,
            port: +port,
        };
    });

    const network = {
        chainId: chain_id,
        rpcEndpoints: endpoints,
    };
    const appName = 'neftyblocks';

    window.wallet_anchor = new Anchor([network], { appName });
    window.wallet_wax = new Wax([network], { appName });

    window.provider = new WalletUAL(callback, [network], appName, [window.wallet_anchor, window.wallet_wax]);

    window.provider.init();
}
