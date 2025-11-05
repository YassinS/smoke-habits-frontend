/**
 * Offline persistence layer using IndexedDB
 * Handles queueing of pending requests and caching of API responses
 */

export interface PendingLog {
	id: string; // UUID, generated locally
	payload: {
		cravingLevel: number;
		smokeContext?: string;
		timestamp?: string;
	};
	timestamp: number; // When queued locally
	retries: number;
	lastError?: string;
	lastRetryTime?: number; // When last retry was attempted
}

export interface CacheEntry<T> {
	key: string;
	data: T;
	timestamp: number;
	ttl: number; // milliseconds
}

const DB_NAME = 'smoke-habits-offline';
const DB_VERSION = 1;
const PENDING_LOGS_STORE = 'pendingLogs';
const CACHE_STORE = 'cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes default

let db: IDBDatabase | null = null;
let isSyncing = false;
let syncCallback: ((success: boolean, synced: number) => void) | null = null;

/**
 * Initialize IndexedDB connection
 */
export async function initOfflineDB(): Promise<void> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			db = request.result;
			resolve();
		};

		request.onupgradeneeded = (event) => {
			const database = (event.target as IDBOpenDBRequest).result;

			// Create pendingLogs store
			if (!database.objectStoreNames.contains(PENDING_LOGS_STORE)) {
				const logsStore = database.createObjectStore(PENDING_LOGS_STORE, { keyPath: 'id' });
				logsStore.createIndex('timestamp', 'timestamp', { unique: false });
			}

			// Create cache store
			if (!database.objectStoreNames.contains(CACHE_STORE)) {
				const cacheStore = database.createObjectStore(CACHE_STORE, { keyPath: 'key' });
				cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
			}
		};
	});
}

/**
 * Add a log to the pending queue
 */
export async function queuePendingLog(payload: PendingLog['payload']): Promise<string> {
	if (!db) throw new Error('Offline DB not initialized');

	const id = crypto.randomUUID();
	const log: PendingLog = {
		id,
		payload,
		timestamp: Date.now(),
		retries: 0
	};

	return new Promise((resolve, reject) => {
		const transaction = db!.transaction([PENDING_LOGS_STORE], 'readwrite');
		const store = transaction.objectStore(PENDING_LOGS_STORE);
		const request = store.add(log);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(id);
	});
}

/**
 * Get all pending logs sorted by timestamp (oldest first)
 */
export async function getPendingLogs(): Promise<PendingLog[]> {
	if (!db) throw new Error('Offline DB not initialized');

	return new Promise((resolve, reject) => {
		const transaction = db!.transaction([PENDING_LOGS_STORE], 'readonly');
		const store = transaction.objectStore(PENDING_LOGS_STORE);
		const index = store.index('timestamp');
		const request = index.getAll();

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);
	});
}

/**
 * Remove a pending log after successful sync
 */
export async function removePendingLog(id: string): Promise<void> {
	if (!db) throw new Error('Offline DB not initialized');

	return new Promise((resolve, reject) => {
		const transaction = db!.transaction([PENDING_LOGS_STORE], 'readwrite');
		const store = transaction.objectStore(PENDING_LOGS_STORE);
		const request = store.delete(id);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve();
	});
}

/**
 * Update retry count and last error for a pending log
 */
export async function updatePendingLogRetry(id: string, error?: string): Promise<void> {
	if (!db) throw new Error('Offline DB not initialized');

	return new Promise((resolve, reject) => {
		const transaction = db!.transaction([PENDING_LOGS_STORE], 'readwrite');
		const store = transaction.objectStore(PENDING_LOGS_STORE);
		const getRequest = store.get(id);

		getRequest.onsuccess = () => {
			const log = getRequest.result as PendingLog;
			if (log) {
				log.retries += 1;
				log.lastRetryTime = Date.now();
				if (error) log.lastError = error;
				const updateRequest = store.put(log);
				updateRequest.onerror = () => reject(updateRequest.error);
				updateRequest.onsuccess = () => resolve();
			} else {
				reject(new Error(`Pending log ${id} not found`));
			}
		};
		getRequest.onerror = () => reject(getRequest.error);
	});
}

/**
 * Cache API response with TTL
 */
export async function setCacheData<T>(
	key: string,
	data: T,
	ttl: number = CACHE_TTL
): Promise<void> {
	if (!db) throw new Error('Offline DB not initialized');

	const entry: CacheEntry<T> = {
		key,
		data,
		timestamp: Date.now(),
		ttl
	};

	return new Promise((resolve, reject) => {
		const transaction = db!.transaction([CACHE_STORE], 'readwrite');
		const store = transaction.objectStore(CACHE_STORE);
		const request = store.put(entry);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve();
	});
}

/**
 * Get cached data if not expired
 */
export async function getCacheData<T>(key: string): Promise<T | null> {
	if (!db) throw new Error('Offline DB not initialized');

	return new Promise((resolve, reject) => {
		const transaction = db!.transaction([CACHE_STORE], 'readonly');
		const store = transaction.objectStore(CACHE_STORE);
		const request = store.get(key);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			const entry = request.result as CacheEntry<T> | undefined;
			if (!entry) {
				resolve(null);
				return;
			}

			// Check if expired
			const age = Date.now() - entry.timestamp;
			if (age > entry.ttl) {
				// Delete expired entry in a separate transaction
				deleteExpiredCache(key).catch(() => {
					// Ignore errors in cleanup
				});
				resolve(null);
			} else {
				resolve(entry.data);
			}
		};
	});
}

/**
 * Delete an expired cache entry
 */
async function deleteExpiredCache(key: string): Promise<void> {
	if (!db) return;

	return new Promise((resolve, reject) => {
		const transaction = db!.transaction([CACHE_STORE], 'readwrite');
		const store = transaction.objectStore(CACHE_STORE);
		const request = store.delete(key);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve();
	});
}

/**
 * Clear all cache entries
 */
export async function clearCache(): Promise<void> {
	if (!db) throw new Error('Offline DB not initialized');

	return new Promise((resolve, reject) => {
		const transaction = db!.transaction([CACHE_STORE], 'readwrite');
		const store = transaction.objectStore(CACHE_STORE);
		const request = store.clear();

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve();
	});
}

/**
 * Get count of pending logs
 */
export async function getPendingLogCount(): Promise<number> {
	if (!db) throw new Error('Offline DB not initialized');

	return new Promise((resolve, reject) => {
		const transaction = db!.transaction([PENDING_LOGS_STORE], 'readonly');
		const store = transaction.objectStore(PENDING_LOGS_STORE);
		const request = store.count();

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);
	});
}

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
	return typeof navigator !== 'undefined' && navigator.onLine;
}

/**
 * Check if sync is currently in progress
 */
export function isSyncInProgress(): boolean {
	return isSyncing;
}

/**
 * Set callback for sync completion (called by API layer)
 */
export function setSyncCallback(
	callback: ((success: boolean, synced: number) => void) | null
): void {
	syncCallback = callback;
}
