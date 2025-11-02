import { writable, type Writable } from 'svelte/store';
import { login as apiLogin, register as apiRegister } from './api';

const STORAGE_KEY = 'smoke_auth_tokens_v1';

type Tokens = { accessToken: string; refreshToken: string } | null;

export const user: Writable<Record<string, unknown> | null> = writable(null);
let tokens: Tokens = null;

function persist(t: Tokens) {
	tokens = t;
	if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
	if (t) {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
	} else {
		window.localStorage.removeItem(STORAGE_KEY);
	}
}

export function getTokens(): Tokens {
	if (tokens) return tokens;
	if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return null;
	const raw = window.localStorage.getItem(STORAGE_KEY);
	if (!raw) return null;
	try {
		tokens = JSON.parse(raw);
		return tokens;
	} catch {
		return null;
	}
}

export function setTokens(accessToken: string, refreshToken: string) {
	persist({ accessToken, refreshToken });
	// when tokens change, try to populate the user profile
	// fire-and-forget: keep token setting synchronous but load user in background
	void fetchMe();
}

export function clearAuth() {
	tokens = null;
	if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined')
		window.localStorage.removeItem(STORAGE_KEY);
	user.set(null);
}

export async function login(email: string, password: string) {
	const body = await apiLogin(email, password);
	setTokens(body.accessToken, body.refreshToken);
	// populate user immediately
	try {
		await fetchMe();
	} catch (err) {
		// non-fatal
		console.warn('fetchMe after login failed', err);
	}
	return body;
}

export async function register(email: string, password: string) {
	const body = await apiRegister(email, password);
	setTokens(body.accessToken, body.refreshToken);
	try {
		await fetchMe();
	} catch (err) {
		console.warn('fetchMe after register failed', err);
	}
	return body;
}

// fetch the current user's profile from the backend and populate `user` store
export async function fetchMe(): Promise<void> {
	const t = getTokens();
	if (!t?.accessToken) {
		user.set(null);
		return;
	}
	try {
		const res = await fetch(`/me`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${t.accessToken}`
			}
		});
		if (!res.ok) {
			// if unauthorized, clear user
			if (res.status === 401) user.set(null);
			return;
		}
		const body = await res.json();
		user.set(body);
	} catch (err) {
		console.error('fetchMe error', err);
		user.set(null);
	}
}

export function getAuth() {
	return { user, tokens: getTokens() } as const;
}

// initialize from storage on module load
if (typeof window !== 'undefined') {
	const t = getTokens();
	if (t) {
		// populate user profile on startup if tokens exist
		void fetchMe();
	}
}

export default {
	user,
	getTokens,
	setTokens,
	clearAuth,
	login,
	register,
	getAuth
};
