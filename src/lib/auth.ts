import { login as apiLogin, register as apiRegister, fetchWithAuth, ensureValidToken } from './api';
import { getTokens, setTokens as setTokensCore, clearAuth as clearAuthCore, user } from './tokens';

export { user, getTokens } from './tokens';

export function setTokens(accessToken: string, refreshToken: string) {
	setTokensCore(accessToken, refreshToken);
	// when tokens change, try to populate the user profile
	// fire-and-forget: keep token setting synchronous but load user in background
	void fetchMe();
}

export function clearAuth() {
	clearAuthCore();
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

export async function register(email: string, password: string, consent: boolean) {
	const body = await apiRegister(email, password, consent);
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
		// Use fetchWithAuth to benefit from automatic token refresh
		const res = await fetchWithAuth('/me', { method: 'GET' });
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
		// Ensure token is valid before fetching user profile
		void ensureValidToken().then((valid) => {
			if (valid) {
				void fetchMe();
			} else {
				console.warn('Failed to refresh expired token on app load');
				clearAuth();
			}
		});
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
