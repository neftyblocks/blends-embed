import { Anchor } from '@nefty/ual-anchor';
import { WalletUAL, WalletUser } from '@nefty/use/wallet';

declare global {
    interface Window {
        global: any;
        wallet_anchor: Anchor;
        provider: WalletUAL;
        provider_user: WalletUser;
    }
}

export function useWallet({ chain_url, chain_id }: { chain_url: string; chain_id: string }) {
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
    const appName = 'NeftyBlocks';

    window.wallet_anchor = new Anchor([network], { appName });

    window.provider = new WalletUAL(callback, [network], appName, [window.wallet_anchor]);

    window.provider.init();
}

const callback = (users: WalletUser[]): void => {
    const [walletUser] = users;

    window.provider_user = walletUser;
    window.provider_user.requestPermission = walletUser.requestPermission || 'active';

    const anchorModal = document.querySelector('.anchor-link-active');
    if (anchorModal) anchorModal.classList.remove('anchor-link-active');
};
