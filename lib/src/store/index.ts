import { writable } from 'svelte/store';
import type { Settings } from '../types';

export const settings = writable<Settings>({
    account: null,
    blend: null,
    config: null,
    transactionId: null,
});

export const categories = writable<string[]>([]);
export const show_owner_filter = writable<boolean>(false);
export const requirments = writable<string>('');

export * from './blendActions';
export * from './blendsActions';
export * from './validationsActions';
export * from './securityActions';
