import { writable } from 'svelte/store';
import type { Models } from 'appwrite';
import type { Capsule } from './appwrite';

export const user = writable<Models.User<Models.Preferences> | null>(null);
export const isLoading = writable(true);
export const capsules = writable<Capsule[]>([]);
export const selectedCapsule = writable<Capsule | null>(null);
