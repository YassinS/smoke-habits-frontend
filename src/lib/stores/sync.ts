import { writable } from 'svelte/store';
import { getPendingLogCount } from '$lib/offline';

export interface SyncStatus {
	online: boolean;
	pendingCount: number;
	syncing: boolean;
	lastSyncTime?: number; // Timestamp of last successful sync
}

function createSyncStore() {
	const { subscribe, update } = writable<SyncStatus>({
		online: true,
		pendingCount: 0,
		syncing: false
	});

	async function checkStatus() {
		const count = await getPendingLogCount();
		update((state) => ({
			...state,
			pendingCount: count
		}));
	}

	return {
		subscribe,
		setOnline: (value: boolean) => {
			update((state) => ({ ...state, online: value }));
			if (value) checkStatus();
		},
		setOffline: () => {
			update((state) => ({ ...state, online: false }));
		},
		setSyncing: (value: boolean) => {
			update((state) => ({ ...state, syncing: value }));
		},
		updatePendingCount: (count: number) => {
			update((state) => ({ ...state, pendingCount: count }));
		},
		notifySyncComplete: () => {
			update((state) => ({
				...state,
				pendingCount: 0,
				syncing: false,
				lastSyncTime: Date.now()
			}));
		},
		checkStatus
	};
}

export const syncStatus = createSyncStore();
