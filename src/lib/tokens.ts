import { writable, type Writable } from 'svelte/store';

const STORAGE_KEY = 'smoke_auth_tokens_v1';

export type Tokens = { accessToken: string; refreshToken: string } | null;

export const user: Writable<Record<string, unknown> | null> = writable(null);

let tokens: Tokens = null;

/**
 * Persist tokens to memory and localStorage
 */
function persist(t: Tokens) {
	tokens = t;
	if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
	if (t) {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
	} else {
		window.localStorage.removeItem(STORAGE_KEY);
	}
}

/**
 * Get current tokens from memory or localStorage
 */
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

/**
 * Set new tokens and persist them
 */
export function setTokens(accessToken: string, refreshToken: string) {
	persist({ accessToken, refreshToken });
}

/**
 * Clear authentication tokens and user data
 */
export function clearAuth() {
	tokens = null;
	if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
		window.localStorage.removeItem(STORAGE_KEY);
	}
	user.set(null);
}

/**
 * Decode JWT payload without verification (client-side only)
 */
export function decodeJWT(token: string): Record<string, unknown> | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;

		const payload = parts[1];
		// Replace URL-safe characters and add padding if needed
		const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
		const padding = '='.repeat((4 - (base64.length % 4)) % 4);
		const decoded = atob(base64 + padding);

		return JSON.parse(decoded);
	} catch (err) {
		console.error('Failed to decode JWT:', err);
		return null;
	}
}

/**
 * Get JWT expiration time in milliseconds (Unix timestamp)
 * Returns null if token is invalid or has no exp claim
 */
export function getJWTExpiration(token: string): number | null {
	const payload = decodeJWT(token);
	if (!payload || typeof payload.exp !== 'number') return null;

	// JWT exp is in seconds, convert to milliseconds
	return payload.exp * 1000;
}

/**
 * Check if JWT is expired or will expire within the given threshold
 * @param token - JWT access token
 * @param thresholdMs - Milliseconds before expiration to consider token as expired (default: 2 minutes)
 * @returns true if token is expired or will expire soon
 */
export function isTokenExpired(token: string, thresholdMs: number = 2 * 60 * 1000): boolean {
	const exp = getJWTExpiration(token);
	if (!exp) return true; // Treat invalid tokens as expired

	const now = Date.now();
	return now >= (exp - thresholdMs);
}

/**
 * Check if current access token needs refresh
 * @returns true if token is missing, invalid, or will expire soon
 */
export function needsTokenRefresh(): boolean {
	const currentTokens = getTokens();
	if (!currentTokens?.accessToken) return false; // No token to refresh
	if (!currentTokens?.refreshToken) return false; // Can't refresh without refresh token

	return isTokenExpired(currentTokens.accessToken);
}
