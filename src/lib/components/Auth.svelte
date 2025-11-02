<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { login as authLogin, register as authRegister } from '$lib/auth';

	const dispatch = createEventDispatcher();

	let mode: 'login' | 'register' = 'login';
	let email = '';
	let password = '';
	let loading = false;
	let error: string | null = null;

	async function submit() {
		loading = true;
		error = null;
		try {
			if (mode === 'login') {
				await authLogin(email, password);
			} else {
				await authRegister(email, password);
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
		<input class="w-full rounded p-2" placeholder="Email" bind:value={email} type="email" />
		<input
			class="w-full rounded p-2"
			placeholder="Password"
			bind:value={password}
			type="password"
		/>
		{#if error}
			<div class="text-red-400">{error}</div>
		{/if}
		<div class="flex gap-2">
			<button class="rounded bg-indigo-600 px-4 py-2" on:click={submit} disabled={loading}
				>{loading ? '...' : mode === 'login' ? 'Sign in' : 'Register'}</button
			>
			<button
				class="text-sm underline"
				on:click={() => (mode = mode === 'login' ? 'register' : 'login')}
				>{mode === 'login' ? 'Create account' : 'Have an account? Sign in'}</button
			>
		</div>
	</div>
</div>
