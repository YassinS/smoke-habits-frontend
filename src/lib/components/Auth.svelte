<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { login as authLogin, register as authRegister } from '$lib/auth';
	import {
		validateEmail,
		validatePassword,
		validateConsent,
		sanitizeString
	} from '$lib/validation';

	const dispatch = createEventDispatcher();

	let mode: 'login' | 'register' = 'login';
	let email = '';
	let password = '';
	let privacyConsent = false;
	let termsConsent = false;
	let loading = false;
	let error: string | null = null;
	let emailError: string | null = null;
	let passwordError: string | null = null;

	function canSubmit(): boolean {
		if (mode === 'login') {
			return email.trim() !== '' && password.trim() !== '' && !emailError && !passwordError;
		}
		// Register mode requires both consents
		return (
			email.trim() !== '' &&
			password.trim() !== '' &&
			privacyConsent &&
			termsConsent &&
			!emailError &&
			!passwordError
		);
	}

	function validateEmail_() {
		emailError = null;
		if (!email.trim()) {
			emailError = 'Email is required';
			return false;
		}
		const validation = validateEmail(email);
		if (!validation.valid) {
			emailError = validation.error || 'Invalid email';
			return false;
		}
		return true;
	}

	function validatePassword_() {
		passwordError = null;
		if (!password) {
			passwordError = 'Password is required';
			return false;
		}
		if (mode === 'register') {
			const validation = validatePassword(password);
			if (!validation.valid) {
				passwordError = validation.error || 'Invalid password';
				return false;
			}
		}
		return true;
	}

	async function submit() {
		// Validate inputs
		const emailValid = validateEmail_();
		const passwordValid = validatePassword_();

		if (!emailValid || !passwordValid) {
			return;
		}

		if (mode === 'register') {
			const consentValid = validateConsent(privacyConsent && termsConsent);
			if (!consentValid.valid) {
				error = consentValid.error || 'You must accept the terms to continue';
				return;
			}
		}

		loading = true;
		error = null;
		try {
			const sanitizedEmail = sanitizeString(email);
			if (mode === 'login') {
				await authLogin(sanitizedEmail, password);
			} else {
				await authRegister(sanitizedEmail, password, privacyConsent && termsConsent);
			}
			dispatch('authed');
		} catch (e: any) {
			error = e?.message ?? String(e);
		} finally {
			loading = false;
		}
	}
</script>

<div class="mx-auto mt-8 max-w-md rounded bg-white/5 p-6 backdrop-blur">
	<h2 class="mb-4 text-2xl">{mode === 'login' ? 'Sign in' : 'Create account'}</h2>
	<div class="space-y-3">
		<div>
			<input
				class="w-full rounded p-2 {emailError ? 'border-2 border-red-500' : ''}"
				placeholder="Email"
				bind:value={email}
				on:blur={validateEmail_}
				on:input={() => (emailError = null)}
				type="email"
			/>
			{#if emailError}
				<p class="mt-1 text-xs text-red-400">{emailError}</p>
			{/if}
		</div>
		<div>
			<input
				class="w-full rounded p-2 {passwordError ? 'border-2 border-red-500' : ''}"
				placeholder="Password"
				bind:value={password}
				on:blur={validatePassword_}
				on:input={() => (passwordError = null)}
				type="password"
			/>
			{#if passwordError}
				<p class="mt-1 text-xs text-red-400">{passwordError}</p>
			{/if}
			{#if mode === 'register'}
				<p class="mt-1 text-xs text-gray-400">
					At least 8 characters, 1 uppercase, 1 lowercase, 1 number
				</p>
			{/if}
		</div>

		{#if mode === 'register'}
			<div class="space-y-2 rounded border border-emerald-400/20 bg-emerald-500/10 p-3">
				<label class="flex items-start gap-2">
					<input type="checkbox" bind:checked={privacyConsent} class="mt-1" />
					<span class="text-sm text-gray-200">
						I agree to the
						<a href="/privacy-policy" target="_blank" class="text-emerald-400 hover:underline">
							Privacy Policy
						</a>
					</span>
				</label>
				<label class="flex items-start gap-2">
					<input type="checkbox" bind:checked={termsConsent} class="mt-1" />
					<span class="text-sm text-gray-200">
						I agree to the
						<a href="/user-agreement" target="_blank" class="text-emerald-400 hover:underline">
							User Agreement
						</a>
					</span>
				</label>
			</div>
		{/if}

		{#if error}
			<div class="text-red-400">{error}</div>
		{/if}
		<div class="flex gap-2">
			<button
				class="rounded bg-indigo-600 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50"
				on:click={submit}
				disabled={loading || !canSubmit()}
			>
				{loading ? '...' : mode === 'login' ? 'Sign in' : 'Register'}
			</button>
			<button
				class="text-sm underline"
				on:click={() => (mode = mode === 'login' ? 'register' : 'login')}
				>{mode === 'login' ? 'Create account' : 'Have an account? Sign in'}</button
			>
		</div>
	</div>
</div>
