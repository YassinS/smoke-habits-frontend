// In development we prefer relative paths so Vite dev server proxy can avoid CORS.
// Set VITE_API_BASE to an absolute URL only for production builds or when you
// explicitly want to call the backend directly from the browser.
export const API_BASE = import.meta.env.VITE_API_BASE ?? '';

type RequestInitLike = RequestInit | undefined;

import { setTokens, clearAuth, getTokens } from '$lib/auth';

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
