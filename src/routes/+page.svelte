<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import Auth from '$lib/components/Auth.svelte';
	import Analytics from '$lib/components/Analytics.svelte';
	import SummaryCards from '$lib/components/SummaryCards.svelte';
	import DailyTimeline from '$lib/components/DailyTimeline.svelte';
	import FabLog from '$lib/components/FabLog.svelte';
	import { getTokens } from '$lib/auth';
	import { fetchCigaretteLogs, type CigaretteLog } from '$lib/api';
	import { syncStatus } from '$lib/stores/sync';

	let authed = !!getTokens();
	let cigarettes: CigaretteLog[] = [];
	let loading = false;
	let error: string | null = null;
	let tab: 'today' | 'insights' = 'today';

	async function loadCigs() {
		loading = true;
		error = null;
		try {
			cigarettes = await fetchCigaretteLogs();
		} catch (e: any) {
			error = e?.message ?? String(e);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		if (authed) {
			loadCigs();
			// Setup online/offline monitoring
			const handleOnline = () => {
				syncStatus.setOnline(true);
			};
			const handleOffline = () => {
				syncStatus.setOffline();
			};
			window.addEventListener('online', handleOnline);
			window.addEventListener('offline', handleOffline);
			return () => {
				window.removeEventListener('online', handleOnline);
				window.removeEventListener('offline', handleOffline);
			};
		}
	});

	function onAuthed() {
		authed = true;
		loadCigs();
	}

	function onLogged() {
		loadCigs();
	}

	// Watch for sync completion and refetch cigarettes
	$: if ($syncStatus.lastSyncTime) {
		loadCigs();
	}
</script>

<Header on:logout={() => (authed = false)} />

{#if !authed}
	<main class="container mx-auto p-6">
		<h1 class="text-3xl font-bold">Welcome to Smoke Habits</h1>
		<p class="mt-2 text-gray-400">Track your cigarette use and understand cravings over time.</p>
		<Auth on:authed={onAuthed} />
	</main>
{:else}
	<main class="container mx-auto space-y-6 p-6">
		<section class="flex flex-col gap-2">
			<h2 class="text-2xl font-semibold text-white">Welcome back</h2>
			<p class="text-sm text-gray-300">Log quickly, then explore insights at your pace.</p>
			<SummaryCards {cigarettes} />
		</section>

		<section class="mt-2">
			<div class="flex items-center gap-2">
				<button class="rounded-full px-4 py-1.5 text-sm font-medium text-white bg-white/10 hover:bg-white/15"
					class:selected={tab === 'today'}
					on:click={() => (tab = 'today')}>Today</button>
				<button class="rounded-full px-4 py-1.5 text-sm font-medium text-white bg-white/10 hover:bg-white/15"
					class:selected={tab === 'insights'}
					on:click={() => (tab = 'insights')}>Insights</button>
			</div>

			<div class="mt-4">
				{#if loading}
					<div class="rounded bg-white/5 p-4">Loading...</div>
				{:else if error}
					<div class="rounded bg-red-500/10 p-4 text-red-300">{error}</div>
				{:else if tab === 'today'}
					<DailyTimeline {cigarettes} />
				{:else}
					<Analytics {cigarettes} />
				{/if}
			</div>
		</section>

		<FabLog on:logged={onLogged} />
	</main>
{/if}
