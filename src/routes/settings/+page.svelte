<script lang="ts">
	import { goto } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import { getTokens, clearAuth } from '$lib/auth';

	let deleting = false;
	let error: string | null = null;
	let showConfirmation = false;
	let authed = !!getTokens();

	import { onMount } from 'svelte';

	onMount(() => {
		if (!authed) goto('/');
	});

	async function deleteAccount() {
		deleting = true;
		error = null;

		try {
			const tokens = getTokens();
			if (!tokens?.accessToken) {
				throw new Error('Not authenticated');
			}

			const res = await fetch('/me', {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${tokens.accessToken}`
				}
			});

			if (!res.ok) {
				throw new Error(`Delete failed with status ${res.status}`);
			}

			// Clear auth and redirect to home
			clearAuth();
			await goto('/');
		} catch (err: any) {
			error = err?.message ?? String(err);
		} finally {
			deleting = false;
		}
	}
</script>

<Header on:logout={() => goto('/')} />

<main class="container mx-auto space-y-6 p-6 text-white">
	<button
		type="button"
		class="inline-flex items-center gap-2 text-sm text-gray-300 transition hover:text-white"
		on:click={() => goto('/')}
	>
		<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
			<path
				fill-rule="evenodd"
				d="M12.78 4.22a.75.75 0 010 1.06L8.56 9.5H16a.75.75 0 010 1.5H8.56l4.22 4.22a.75.75 0 01-1.06 1.06l-5.5-5.5a.75.75 0 010-1.06l5.5-5.5a.75.75 0 011.06 0z"
				clip-rule="evenodd"
			/>
		</svg>
		<span>Back to dashboard</span>
	</button>

	<h1 class="text-3xl font-bold">Settings</h1>
	<div class="mx-auto max-w-2xl space-y-6">
		<!-- Account Deletion Section -->
		<div class="rounded border border-red-500/20 bg-red-500/10 p-6">
			<h2 class="mb-2 text-lg font-semibold text-red-300">Danger Zone</h2>
			<p class="mb-4 text-sm text-gray-300">
				Permanently delete your account and all associated data. This action cannot be undone.
			</p>

			{#if error}
				<div class="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
					{error}
				</div>
			{/if}

			{#if !showConfirmation}
				<button
					type="button"
					class="rounded bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
					on:click={() => (showConfirmation = true)}
					disabled={deleting}
				>
					Delete Account
				</button>
			{:else}
				<div class="space-y-3 rounded border border-red-500/40 bg-red-950/30 p-4">
					<p class="font-semibold text-red-200">Are you absolutely sure?</p>
					<p class="text-sm text-gray-300">
						This will permanently delete your account and <strong>all your data</strong>. This
						action cannot be reversed.
					</p>
					<div class="flex gap-2">
						<button
							type="button"
							class="flex-1 rounded bg-red-600 px-3 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
							on:click={deleteAccount}
							disabled={deleting}
						>
							{deleting ? 'Deleting...' : 'Yes, delete everything'}
						</button>
						<button
							type="button"
							class="flex-1 rounded border border-gray-600 bg-gray-900 px-3 py-2 font-semibold text-gray-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
							on:click={() => (showConfirmation = false)}
							disabled={deleting}
						>
							Cancel
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Other Settings (placeholder for future) -->
		<div class="space-y-3 rounded border border-gray-700 bg-gray-900/20 p-6">
			<h2 class="text-lg font-semibold">Preferences</h2>
			<p class="text-sm text-gray-400">Additional settings coming soon...</p>
		</div>
	</div>
</main>
