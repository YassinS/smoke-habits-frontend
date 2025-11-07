// In development we prefer relative paths so Vite dev server proxy can avoid CORS.
// Set VITE_API_BASE to an absolute URL only for production builds or when you
// explicitly want to call the backend directly from the browser.
export const API_BASE = import.meta.env.VITE_API_BASE ?? '';

type RequestInitLike = RequestInit | undefined;

import { setTokens, clearAuth, getTokens } from '$lib/auth';
import {
	validateEmail,
	validatePassword,
	validateContextLabel,
	validateHexColor,
	validateCravingLevel,
	validateUUID,
	validateRefreshToken,
	validateConsent
} from '$lib/validation';
import {
	initOfflineDB,
	queuePendingLog,
	getPendingLogs,
	removePendingLog,
	updatePendingLogRetry,
	setCacheData,
	getCacheData,
	isOnline,
	isSyncInProgress,
	setSyncCallback,
	type PendingLog
} from '$lib/offline';
import { syncStatus } from '$lib/stores/sync';

export type SmokeContext = {
	id: string;
	context: string;
	colorUI: string;
};

export type SmokeContextPayload = {
	context: string;
	colorUI: string;
};

export type CigaretteLog = {
	id: number;
	timestamp: string;
	cravingLevel?: number | null;
	smokeContext?: SmokeContext | null;
};

export type ContextAnalytics = {
	context: string;
	cigaretteCount: number;
	avgCraving: number;
	colorUI?: string;
};

let refreshing: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
	const tokens = getTokens();
	if (!tokens?.refreshToken) return false;
	try {
		const res = await fetch(`${API_BASE}/auth/refresh`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refreshToken: tokens.refreshToken })
		});
		if (!res.ok) throw new Error('refresh failed');
		const body = await res.json();
		setTokens(body.accessToken, body.refreshToken);
		return true;
	} catch (err) {
		console.error('refresh error', err);
		clearAuth();
		return false;
	}
}

export async function fetchWithAuth(input: string, init?: RequestInitLike): Promise<Response> {
	const tokens = getTokens();
	const headers = new Headers(init?.headers || {});
	if (tokens?.accessToken) headers.set('Authorization', `Bearer ${tokens.accessToken}`);
	headers.set('Content-Type', headers.get('Content-Type') ?? 'application/json');

	let res = await fetch(`${API_BASE}${input}`, { ...(init || {}), headers });

	if (res.status === 401) {
		// single in-flight refresh: if another request already started a refresh we'll await it
		if (!refreshing) refreshing = doRefresh();
		const ok = await refreshing;
		refreshing = null;
		if (ok) {
			const newTokens = getTokens();
			const retryHeaders = new Headers(init?.headers || {});
			if (newTokens?.accessToken)
				retryHeaders.set('Authorization', `Bearer ${newTokens.accessToken}`);
			retryHeaders.set('Content-Type', retryHeaders.get('Content-Type') ?? 'application/json');
			res = await fetch(`${API_BASE}${input}`, { ...(init || {}), headers: retryHeaders });
		}
	}

	return res;
}

export async function login(email: string, password: string) {
	// Validate inputs
	const emailValidation = validateEmail(email);
	if (!emailValidation.valid) throw new Error(emailValidation.error);

	if (!password) throw new Error('Password is required');

	const res = await fetch(`${API_BASE}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email: emailValidation.sanitized, password })
	});
	if (!res.ok) throw new Error('Login failed');
	return res.json();
}

export async function register(email: string, password: string, consent: boolean) {
	// Validate inputs
	const emailValidation = validateEmail(email);
	if (!emailValidation.valid) throw new Error(emailValidation.error);

	const passwordValidation = validatePassword(password);
	if (!passwordValidation.valid) throw new Error(passwordValidation.error);

	const consentValidation = validateConsent(consent);
	if (!consentValidation.valid) throw new Error(consentValidation.error);

	const res = await fetch(`${API_BASE}/auth/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email: emailValidation.sanitized, password, consent })
	});
	if (!res.ok) throw new Error('Register failed');
	return res.json();
}

// high-level API helpers
export async function apiGet(path: string) {
	try {
		const res = await fetchWithAuth(path, { method: 'GET' });
		if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
		const data = await res.json();
		// Cache successful responses
		await setCacheData(path, data, 5 * 60 * 1000); // 5 min TTL
		return data;
	} catch (err) {
		// Try to serve from cache on error
		if (!isOnline()) {
			console.warn(`Offline: attempting to serve ${path} from cache`);
			const cached = await getCacheData(path);
			if (cached) {
				console.log(`Served ${path} from cache`);
				return cached;
			}
		}
		throw err;
	}
}

export async function apiPost(path: string, body: unknown) {
	try {
		// Validate body is not null/undefined
		if (body === null || body === undefined) {
			throw new Error('Request body cannot be empty');
		}

		// Validate it's a plain object
		if (typeof body !== 'object' || Array.isArray(body)) {
			throw new Error('Invalid request body');
		}

		const res = await fetchWithAuth(path, { method: 'POST', body: JSON.stringify(body) });
		if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
		return res.json();
	} catch (err) {
		// If this is a cigarette logging request and we're offline, queue it
		if (path === '/cigarettes/log' && !isOnline()) {
			console.warn('Offline: queueing cigarette log', body);
			await queuePendingLog(body as PendingLog['payload']);
			// Return optimistic response
			const bodyRecord = body as Record<string, unknown>;
			return {
				id: Math.floor(Math.random() * 1000000),
				timestamp: new Date().toISOString(),
				cravingLevel: bodyRecord.cravingLevel ?? null,
				smokeContext: null,
				_queued: true
			};
		}
		throw err;
	}
}

function normalizeContextId(
	value: unknown,
	fallback?: string | number | null,
	fallbackContext?: string
): string | null {
	const candidates: Array<unknown> = [];
	if (value !== undefined) candidates.push(value);
	if (typeof value === 'object' && value !== null) {
		const obj = value as Record<string, unknown>;
		candidates.push(obj.id, obj.uuid, obj.contextId, obj.contextID, obj.context_id);
	}
	if (fallback !== undefined && fallback !== null) candidates.push(fallback);
	if (fallbackContext) candidates.push(fallbackContext);
	for (const candidate of candidates) {
		if (typeof candidate === 'string' && candidate.trim().length) return candidate.trim();
		if (typeof candidate === 'number' && Number.isFinite(candidate)) return String(candidate);
	}
	return null;
}

function mapSmokeContext(entry: unknown, fallback?: string | number | null): SmokeContext | null {
	if (typeof entry !== 'object' || entry === null) return null;
	const record = entry as Record<string, unknown>;
	const contextRaw = record.context ?? record.label ?? record.name;
	const colorRaw = record.colorUI ?? record.color ?? record.hex;
	if (typeof contextRaw !== 'string') return null;
	const context = contextRaw.trim();
	if (!context) return null;
	const color =
		typeof colorRaw === 'string' && colorRaw.trim().length ? colorRaw.trim() : '#34d399';
	const id =
		normalizeContextId(record.id ?? record.uuid ?? record.contextId ?? record, fallback, context) ??
		context;
	return { id, context, colorUI: color };
}

export async function fetchSmokeContexts(): Promise<SmokeContext[]> {
	const list = await apiGet('/context');
	if (!Array.isArray(list)) return [];
	const dedup = new Map<string, SmokeContext>();
	list.forEach((item, index) => {
		const mapped = mapSmokeContext(item, index);
		if (mapped && !dedup.has(mapped.id)) dedup.set(mapped.id, mapped);
	});
	return Array.from(dedup.values());
}

export async function createSmokeContext(payload: SmokeContextPayload): Promise<SmokeContext> {
	// Validate inputs
	const labelValidation = validateContextLabel(payload.context);
	if (!labelValidation.valid) throw new Error(labelValidation.error);

	const colorValidation = validateHexColor(payload.colorUI);
	if (!colorValidation.valid) throw new Error(colorValidation.error);

	const validatedPayload: SmokeContextPayload = {
		context: labelValidation.sanitized || payload.context,
		colorUI: colorValidation.sanitized || payload.colorUI
	};

	const created = await apiPost('/context', validatedPayload);
	const mapped = mapSmokeContext(created, validatedPayload.context);
	if (!mapped) {
		throw new Error('Invalid smoke context response');
	}
	return mapped;
}

export async function updateSmokeContext(
	id: string,
	payload: SmokeContextPayload
): Promise<SmokeContext> {
	// Validate ID
	const idValidation = validateUUID(id);
	if (!idValidation.valid) throw new Error(idValidation.error);

	// Validate inputs
	const labelValidation = validateContextLabel(payload.context);
	if (!labelValidation.valid) throw new Error(labelValidation.error);

	const colorValidation = validateHexColor(payload.colorUI);
	if (!colorValidation.valid) throw new Error(colorValidation.error);

	const validatedPayload: SmokeContextPayload = {
		context: labelValidation.sanitized || payload.context,
		colorUI: colorValidation.sanitized || payload.colorUI
	};

	const updated = await apiPost(`/context/${idValidation.sanitized}/edit`, validatedPayload);
	const mapped = mapSmokeContext(updated, idValidation.sanitized);
	if (!mapped) {
		throw new Error('Invalid smoke context response');
	}
	return mapped;
}

export async function deleteSmokeContext(id: string): Promise<void> {
	// Validate ID
	const idValidation = validateUUID(id);
	if (!idValidation.valid) throw new Error(idValidation.error);

	const res = await fetchWithAuth(`/context/${idValidation.sanitized}`, { method: 'DELETE' });
	if (!res.ok) throw new Error(`DELETE /context/${idValidation.sanitized} failed: ${res.status}`);
}

function mapCigaretteLog(entry: unknown, index: number): CigaretteLog | null {
	if (typeof entry !== 'object' || entry === null) return null;
	const record = entry as Record<string, unknown>;
	const idCandidate =
		record.id ?? record.cigaretteId ?? record.cigaretteID ?? record.cigarette_id ?? index;
	const idNumber = Number(idCandidate);
	const id = Number.isFinite(idNumber) ? idNumber : index;
	const timestampRaw = record.timestamp ?? record.loggedAt ?? record.createdAt;
	if (typeof timestampRaw !== 'string') return null;
	const cravingRaw =
		record.cravingLevel ?? record.craving_level ?? record.craving ?? record.cravingScore;
	let cravingFinal: number | null = null;
	if (typeof cravingRaw === 'number' && Number.isFinite(cravingRaw)) {
		cravingFinal = cravingRaw;
	} else if (typeof cravingRaw === 'string') {
		const parsed = Number.parseFloat(cravingRaw);
		if (Number.isFinite(parsed)) cravingFinal = parsed;
	}
	const contextSource =
		record.contextResponse ??
		record.smokeContext ??
		record.context ??
		record.contextDto ??
		record.smokeContextResponse ??
		record.smokeContextDto ??
		null;
	const fallbackId =
		typeof idCandidate === 'string' || typeof idCandidate === 'number' ? idCandidate : index;
	const smokeContext = mapSmokeContext(contextSource, fallbackId);
	return {
		id,
		timestamp: timestampRaw,
		cravingLevel: cravingFinal,
		smokeContext
	};
}

export async function fetchCigaretteLogs(): Promise<CigaretteLog[]> {
	const list = await apiGet('/cigarettes');
	if (!Array.isArray(list)) return [];
	return list
		.map((item, index) => mapCigaretteLog(item, index))
		.filter((item): item is CigaretteLog => Boolean(item));
}

export async function fetchContextAnalytics(): Promise<ContextAnalytics[]> {
	const [analyticsData, contextsData] = await Promise.all([
		apiGet('/analytics/context'),
		fetchSmokeContexts()
	]);

	if (!Array.isArray(analyticsData)) return [];

	const contextColorMap = new Map(contextsData.map((ctx) => [ctx.context, ctx.colorUI]));

	return analyticsData
		.map((item): ContextAnalytics | null => {
			if (typeof item !== 'object' || item === null) return null;
			const record = item as Record<string, unknown>;
			const context = record.context;
			const cigaretteCount = record.cigaretteCount;
			const avgCraving = record.avgCraving;
			if (typeof context !== 'string') return null;
			const count = typeof cigaretteCount === 'number' ? cigaretteCount : 0;
			const craving = typeof avgCraving === 'number' ? avgCraving : 0;
			const colorUI = contextColorMap.get(context);
			return { context, cigaretteCount: count, avgCraving: craving, colorUI };
		})
		.filter((item): item is ContextAnalytics => item !== null);
}

export interface AllAnalyticsData {
	weekly: unknown[];
	monthly: unknown[];
	daily: unknown[];
	avgCraving: number | null;
	longestStreak: number | null;
	contextAnalytics: ContextAnalytics[];
}

/**
 * Fetch all analytics data at once
 * This should be called after logging a cigarette to refresh the UI
 */
export async function fetchAllAnalytics(): Promise<AllAnalyticsData> {
	try {
		const [weeklyData, monthlyData, dailyData, avgData, streakData, contextData] =
			await Promise.all([
				apiGet('/analytics/weekly'),
				apiGet('/analytics/monthly'),
				apiGet('/analytics/daily'),
				apiGet('/analytics/avg-craving'),
				apiGet('/analytics/longest-streak'),
				fetchContextAnalytics()
			]);

		return {
			weekly: Array.isArray(weeklyData) ? weeklyData : [],
			monthly: Array.isArray(monthlyData) ? monthlyData : [],
			daily: Array.isArray(dailyData) ? dailyData : [],
			avgCraving: typeof avgData === 'number' && Number.isFinite(avgData) ? avgData : null,
			longestStreak:
				typeof streakData === 'number' && Number.isFinite(streakData) ? streakData : null,
			contextAnalytics: Array.isArray(contextData) ? contextData : []
		};
	} catch (err) {
		console.error('Failed to fetch all analytics:', err);
		throw err;
	}
}

/**
 * Refetch weekly analytics
 */
export async function refetchWeeklyAnalytics(): Promise<unknown[]> {
	const data = await apiGet('/analytics/weekly');
	return Array.isArray(data) ? data : [];
}

/**
 * Refetch monthly analytics
 */
export async function refetchMonthlyAnalytics(): Promise<unknown[]> {
	const data = await apiGet('/analytics/monthly');
	return Array.isArray(data) ? data : [];
}

/**
 * Refetch daily analytics
 */
export async function refetchDailyAnalytics(): Promise<unknown[]> {
	const data = await apiGet('/analytics/daily');
	return Array.isArray(data) ? data : [];
}

/**
 * Refetch average craving
 */
export async function refetchAvgCraving(): Promise<number | null> {
	const data = await apiGet('/analytics/avg-craving');
	return typeof data === 'number' && Number.isFinite(data) ? data : null;
}

/**
 * Refetch longest streak
 */
export async function refetchLongestStreak(): Promise<number | null> {
	const data = await apiGet('/analytics/longest-streak');
	return typeof data === 'number' && Number.isFinite(data) ? data : null;
}

/**
 * Calculate exponential backoff delay (in ms)
 * After N retries: 1s, 2s, 4s, 8s, 16s, 30s (capped)
 */
function getBackoffDelay(retries: number): number {
	const maxDelay = 30000; // 30 seconds
	const baseDelay = 1000; // 1 second
	const delay = baseDelay * Math.pow(2, Math.min(retries, 4));
	return Math.min(delay, maxDelay);
}

/**
 * Check if a pending log should be retried based on retry count and time
 */
function shouldRetry(log: PendingLog): boolean {
	const maxRetries = 5;
	if (log.retries >= maxRetries) {
		console.warn(`Log ${log.id} reached max retries (${maxRetries})`);
		return false;
	}

	// Check if enough time has passed since last retry
	if (log.lastRetryTime) {
		const timeSinceLastRetry = Date.now() - log.lastRetryTime;
		const requiredDelay = getBackoffDelay(log.retries);
		if (timeSinceLastRetry < requiredDelay) {
			return false;
		}
	}

	return true;
}

let syncInProgress = false;
let connectionCheckInterval: ReturnType<typeof setInterval> | null = null;
let lastKnownOnlineState = typeof navigator !== 'undefined' ? navigator.onLine : true;

/**
 * Start periodic connection checks (every 10 seconds)
 */
function startConnectionPolling(): void {
	if (connectionCheckInterval) return; // Already running

	connectionCheckInterval = setInterval(() => {
		const isNowOnline = isOnline();

		if (!lastKnownOnlineState && isNowOnline) {
			console.log('Connection restored via polling, syncing...');
			syncStatus.setOnline(true);
			lastKnownOnlineState = true;
			void syncPendingLogs();
		} else if (lastKnownOnlineState && !isNowOnline) {
			console.log('Connection lost via polling');
			syncStatus.setOffline();
			lastKnownOnlineState = false;
		}
	}, 10000); // Check every 10 seconds
}

/**
 * Stop periodic connection checks
 */
function stopConnectionPolling(): void {
	if (connectionCheckInterval) {
		clearInterval(connectionCheckInterval);
		connectionCheckInterval = null;
	}
}
export async function initializeOfflineSupport(): Promise<void> {
	try {
		await initOfflineDB();
		console.log('Offline DB initialized');

		// Setup online/offline event listeners with debounce
		if (typeof window !== 'undefined') {
			let onlineTimeout: ReturnType<typeof setTimeout> | null = null;

			window.addEventListener('online', () => {
				console.log('Back online (via event), scheduling sync...');
				lastKnownOnlineState = true;
				// Debounce: wait 500ms for connection to stabilize
				if (onlineTimeout) clearTimeout(onlineTimeout);
				onlineTimeout = setTimeout(() => {
					console.log('Connection stable, syncing pending logs...');
					void syncPendingLogs();
					onlineTimeout = null;
				}, 500);
			});

			window.addEventListener('offline', () => {
				console.log('Lost connection (via event), will queue requests');
				lastKnownOnlineState = false;
				if (onlineTimeout) clearTimeout(onlineTimeout);
			});

			// Start periodic connection polling as fallback
			startConnectionPolling();
		}

		// If we're online, try to sync any pending logs on startup
		if (isOnline()) {
			const pending = await getPendingLogs();
			if (pending.length > 0) {
				console.log(`Found ${pending.length} pending logs from previous session, syncing...`);
				void syncPendingLogs();
			}
		}
	} catch (err) {
		console.error('Failed to initialize offline DB:', err);
	}
}

/**
 * Sync all pending logs with the server
 */
export async function syncPendingLogs(): Promise<number> {
	// Prevent concurrent sync attempts
	if (syncInProgress) {
		console.log('Sync already in progress, skipping...');
		return 0;
	}

	syncInProgress = true;
	syncStatus.setSyncing(true);

	try {
		const pending = await getPendingLogs();
		const logsToSync = pending.filter(shouldRetry);

		if (logsToSync.length === 0) {
			if (pending.length > 0) {
				console.log(`${pending.length} pending logs still waiting for retry window`);
			}
			return 0;
		}

		console.log(`Syncing ${logsToSync.length} pending logs (${pending.length} total queued)...`);
		let synced = 0;

		for (const log of logsToSync) {
			try {
				// Retry posting the log
				const res = await fetchWithAuth('/cigarettes/log', {
					method: 'POST',
					body: JSON.stringify(log.payload)
				});

				if (res.ok) {
					await removePendingLog(log.id);
					synced++;
					console.log(`✓ Synced pending log ${log.id}`);
				} else {
					await updatePendingLogRetry(log.id, `HTTP ${res.status}`);
					console.warn(`✗ Failed to sync log ${log.id}: HTTP ${res.status}`);
				}
			} catch (err) {
				await updatePendingLogRetry(log.id, String(err));
				console.warn(`✗ Error syncing log ${log.id}:`, err);
			}
		}

		const total = pending.length;
		const remaining = total - synced;
		console.log(
			`Sync complete: ${synced}/${logsToSync.length} succeeded. ${remaining} logs still queued.`
		);

		// Notify UI that sync completed
		if (synced > 0) {
			syncStatus.notifySyncComplete();
		}

		// Call callback if set (for UI updates)
		setSyncCallback(null);

		return synced;
	} catch (err) {
		console.error('Error during sync:', err);
		return 0;
	} finally {
		syncInProgress = false;
		syncStatus.setSyncing(false);
	}
}

/**
 * Get count of pending logs waiting to sync
 */
export async function getPendingSyncCount(): Promise<number> {
	try {
		const pending = await getPendingLogs();
		return pending.length;
	} catch {
		return 0;
	}
}
