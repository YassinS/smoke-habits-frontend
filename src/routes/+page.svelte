<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';
	import Auth from '$lib/components/Auth.svelte';
	import Analytics from '$lib/components/Analytics.svelte';
	import SummaryCards from '$lib/components/SummaryCards.svelte';
	import DailyTimeline from '$lib/components/DailyTimeline.svelte';
	import FabLog from '$lib/components/FabLog.svelte';
	import ReductionProgress from '$lib/components/ReductionProgress.svelte';
	import CreateGoalModal from '$lib/components/CreateGoalModal.svelte';
	import GoalDetails from '$lib/components/GoalDetails.svelte';
	import { getTokens } from '$lib/auth';
	import { fetchCigaretteLogs, type CigaretteLog } from '$lib/api';
	import { syncStatus } from '$lib/stores/sync';

	let authed = !!getTokens();
	let cigarettes: CigaretteLog[] = [];
	let loading = false;
	let error: string | null = null;
	let tab: 'today' | 'goals' | 'insights' = 'today';
	let analyticsComponent: Analytics | undefined;
	let reductionProgressComponent: ReductionProgress | undefined;
	let showCreateGoalModal = false;
	let showGoalDetails = false;

	async function loadCigs() {
		loading = true;
		error = null;
		try {
			cigarettes = await fetchCigaretteLogs();
		} catch (e: unknown) {
			const errorMessage = e instanceof Error ? e.message : String(e);
			error = errorMessage ?? 'Failed to load cigarettes';
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
		// Trigger analytics refetch after logging
		if (analyticsComponent) {
			void analyticsComponent.refetchAnalytics();
		}
		// Refresh reduction progress
		if (reductionProgressComponent) {
			void reductionProgressComponent.refresh();
		}
	}

	function handleGoalCreated() {
		showCreateGoalModal = false;
		if (reductionProgressComponent) {
			void reductionProgressComponent.refresh();
		}
	}

	function handleGoalUpdated() {
		if (reductionProgressComponent) {
			void reductionProgressComponent.refresh();
		}
	}

	// Watch for sync completion and refetch cigarettes
	$: if ($syncStatus.lastSyncTime) {
		void loadCigs();
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

		<!-- Reduction Progress -->
		<section>
			<div class="mb-3 flex items-center justify-between">
				<h3 class="text-lg font-semibold text-white">Reduction Goal</h3>
				<button
					on:click={() => (showGoalDetails = true)}
					class="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/15"
				>
					View Details
				</button>
			</div>
			<ReductionProgress
				bind:this={reductionProgressComponent}
				onCreateGoal={() => (showCreateGoalModal = true)}
			/>
		</section>

		<section class="mt-2">
			<div class="flex items-center gap-2">
				<button
					class="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/15"
					class:selected={tab === 'today'}
					on:click={() => (tab = 'today')}>Today</button
				>
				<button
					class="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/15"
					class:selected={tab === 'goals'}
					on:click={() => (tab = 'goals')}>Goals</button
				>
				<button
					class="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white hover:bg-white/15"
					class:selected={tab === 'insights'}
					on:click={() => (tab = 'insights')}>Insights</button
				>
			</div>

			<div class="mt-4">
				{#if loading}
					<div class="rounded bg-white/5 p-4">Loading...</div>
				{:else if error}
					<div class="rounded bg-red-500/10 p-4 text-red-300">{error}</div>
				{:else if tab === 'today'}
					<DailyTimeline {cigarettes} />
				{:else if tab === 'goals'}
					<div class="space-y-4">
						<ReductionProgress
							bind:this={reductionProgressComponent}
							onCreateGoal={() => (showCreateGoalModal = true)}
						/>
						<button
							on:click={() => (showGoalDetails = true)}
							class="w-full rounded-lg bg-white/10 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/15"
						>
							View Goal Details & History
						</button>
					</div>
				{:else}
					<Analytics bind:this={analyticsComponent} {cigarettes} />
				{/if}
			</div>
		</section>

		<FabLog on:logged={onLogged} />
	</main>

	<!-- Modals -->
	<CreateGoalModal bind:open={showCreateGoalModal} on:created={handleGoalCreated} />
	<GoalDetails bind:open={showGoalDetails} on:updated={handleGoalUpdated} />
{/if}

<style>
	.selected {
		background-color: rgb(255 255 255 / 0.2);
	}
</style>
