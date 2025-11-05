<script lang="ts">
	import { goto } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';
	import { getTokens, clearAuth } from '$lib/auth';

	let deleting = false;
	let error: string | null = null;
	let showConfirmation = false;

	async function deleteAccount() {
		deleting = true;
		error = null;

		try {
			const tokens = getTokens();
			if (!tokens?.accessToken) {
				throw new Error('Not authenticated');
			}

			const res = await fetch('/me/delete', {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${tokens.accessToken}`
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

<Header />

<main class="mx-auto max-w-2xl px-4 py-8">
	<h1 class="mb-6 text-3xl font-bold">Settings</h1>

	<div class="space-y-6">
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
						This will permanently delete your account and <strong>all your data</strong>. This action
						cannot be reversed.
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
