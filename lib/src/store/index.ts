import { writable } from 'svelte/store';
import type { Settings } from '../types';

export const settings = writable<Settings>({
    account: null,
    blend: null,
    config: null,
    transactionId: null,
});

export const categories = writable<string[]>([]);

export * from './blendActions';
export * from './blendsActions';
export * from './validationsActions';
export * from './securityActions';
