<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { apiPost } from '$lib/api';

	const dispatch = createEventDispatcher();

	let craving = 3;
	let loading = false;
	let error: string | null = null;

	async function logIt() {
		loading = true;
		error = null;
		try {
			await apiPost('/cigarettes/log', { cravingLevel: Number(craving) });
			dispatch('logged');
		} catch (e: any) {
			error = e?.message ?? String(e);
		} finally {
			loading = false;
		}
	}
</script>

<div class="rounded bg-white/5 p-4">
	<div class="flex items-center gap-3">
		<label class="text-sm" for="craveRange">Craving</label>
		<input id="craveRange" type="range" min="1" max="10" bind:value={craving} />
		<div class="w-8 text-center">{craving}</div>
		<button class="ml-auto rounded bg-green-600 px-3 py-1" on:click={logIt} disabled={loading}
			>{loading ? '...' : 'Log'}</button
		>
	</div>
	{#if error}
		<div class="mt-2 text-red-400">{error}</div>
	{/if}
</div>
