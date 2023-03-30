import { writable } from 'svelte/store';
import type { Settings } from '../types';

export const settings = writable<Settings>({
    config: null,
    account: null,
    blend: null,
    transactionId: null,
});

export * from './blendActions';
export * from './blendsActions';
export * from './validationsActions';
export * from './securityActions';
