// In development we prefer relative paths so Vite dev server proxy can avoid CORS.
// Set VITE_API_BASE to an absolute URL only for production builds or when you
// explicitly want to call the backend directly from the browser.
export const API_BASE = import.meta.env.VITE_API_BASE ?? '';

type RequestInitLike = RequestInit | undefined;

import { setTokens, clearAuth, getTokens } from '$lib/auth';

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
	const res = await fetch(`${API_BASE}/auth/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password })
	});
	if (!res.ok) throw new Error('Login failed');
	return res.json();
}

export async function register(email: string, password: string) {
	const res = await fetch(`${API_BASE}/auth/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password })
	});
	if (!res.ok) throw new Error('Register failed');
	return res.json();
}

// high-level API helpers
export async function apiGet(path: string) {
	const res = await fetchWithAuth(path, { method: 'GET' });
	if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
	return res.json();
}

export async function apiPost(path: string, body: unknown) {
	const res = await fetchWithAuth(path, { method: 'POST', body: JSON.stringify(body) });
	if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
	return res.json();
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
	const created = await apiPost('/context', payload);
	const mapped = mapSmokeContext(created, payload.context);
	if (!mapped) {
		throw new Error('Invalid smoke context response');
	}
	return mapped;
}

export async function updateSmokeContext(
	id: string,
	payload: SmokeContextPayload
): Promise<SmokeContext> {
	const updated = await apiPost(`/context/${id}/edit`, payload);
	const mapped = mapSmokeContext(updated, id);
	if (!mapped) {
		throw new Error('Invalid smoke context response');
	}
	return mapped;
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
