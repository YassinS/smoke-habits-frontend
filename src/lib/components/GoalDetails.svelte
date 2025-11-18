<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Modal from './Modal.svelte';
	import {
		fetchActiveGoal,
		fetchAllGoals,
		updateGoalStatus,
		type ReductionGoal,
		type ReductionGoalStatus
	} from '$lib/api';
	import { onMount } from 'svelte';

	export let open = false;

	const dispatch = createEventDispatcher<{ updated: void; close: void }>();

	let activeGoal: ReductionGoal | null = null;
	let allGoals: ReductionGoal[] = [];
	let loading = true;
	let updating = false;
	let error = '';
	let showHistory = false;

	onMount(() => {
		loadGoals();
	});

	
function parseErrorMessage(err: unknown): string {
	if (!err) return 'An error occurred';
	
	// If it's an Error object
	if (err instanceof Error) {
		try {
			// Try to parse the message as JSON
			const parsed = JSON.parse(err.message);
			if (parsed && typeof parsed.message === 'string') {
				return parsed.message;
			}
		} catch {
			// If not JSON, return the message as-is
			return err.message;
		}
	}
	
	// If it's a string, try to parse as JSON
	if (typeof err === 'string') {
		try {
			const parsed = JSON.parse(err);
			if (parsed && typeof parsed.message === 'string') {
				return parsed.message;
			}
		} catch {
			return err;
		}
	}
	
	return String(err);
}

	async function loadGoals() {
		loading = true;
		error = '';
		try {
			const [active, all] = await Promise.all([fetchActiveGoal(), fetchAllGoals()]);
			activeGoal = active;
			
			// If no active goal, check if there's a paused goal
			if (!activeGoal && all.length > 0) {
				const pausedGoal = all.find(g => g.status === 'PAUSED');
				if (pausedGoal) {
					activeGoal = pausedGoal;
				}
			}
			
			allGoals = all;
		} catch (err) {
			error = parseErrorMessage(err) || 'Failed to load goals';
		} finally {
			loading = false;
		}
	}

	async function handleStatusChange(goalId: string, status: ReductionGoalStatus) {
		updating = true;
		error = '';
		try {
			await updateGoalStatus(goalId, status);
			await loadGoals();
			dispatch('updated');
		} catch (err) {
			error = parseErrorMessage(err) || 'Failed to update goal status';
		} finally {
			updating = false;
		}
	}

	function close() {
		open = false;
		dispatch('close');
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function getStatusColor(status: ReductionGoalStatus): string {
		switch (status) {
			case 'ACTIVE':
				return 'bg-green-500/20 text-green-400';
			case 'COMPLETED':
				return 'bg-blue-500/20 text-blue-400';
			case 'PAUSED':
				return 'bg-yellow-500/20 text-yellow-400';
			case 'ABANDONED':
				return 'bg-red-500/20 text-red-400';
			default:
				return 'bg-gray-500/20 text-gray-400';
		}
	}

	function getStrategyIcon(strategy: string): string {
		switch (strategy) {
			case 'LINEAR':
				return '📉';
			case 'STEPPED':
				return '📊';
			case 'GRADUAL':
				return '📈';
			default:
				return '📋';
		}
	}
</script>

<Modal {open} on:close={close}>
	<div
		class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-linear-to-br from-gray-900 to-gray-800 p-6 shadow-2xl"
		on:click|stopPropagation
		role="none"
	>
		<div class="mb-6 flex items-start justify-between">
			<div>
				<h2 class="text-2xl font-bold text-white">Reduction Goals</h2>
				<p class="mt-1 text-sm text-gray-400">Track your progress and manage your goals</p>
			</div>
			<button
				on:click={close}
				class="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
				aria-label="Close"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="h-6 w-6"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		{#if loading}
			<div class="space-y-4">
				<div class="h-32 animate-pulse rounded-lg bg-white/5"></div>
				<div class="h-32 animate-pulse rounded-lg bg-white/5"></div>
			</div>
		{:else if error}
			<div class="rounded-lg bg-red-500/10 p-4 text-sm text-red-300">
				{error}
			</div>
		{:else}
			<!-- Active Goal -->
			{#if activeGoal}
				<div class="rounded-xl bg-linear-to-br from-blue-600/20 to-purple-600/20 p-6">
					<div class="mb-4 flex items-start justify-between">
						<div>
							<div class="flex items-center gap-2">
								<span class="text-2xl">{getStrategyIcon(activeGoal.strategy)}</span>
								<h3 class="text-xl font-bold text-white">Active Goal</h3>
							</div>
							<span
								class="mt-1 inline-block rounded-full {getStatusColor(
									activeGoal.status
								)} px-3 py-1 text-xs font-semibold"
							>
								{activeGoal.status}
							</span>
						</div>
					</div>

					<div class="space-y-4">
						<!-- Progress Bar -->
						<div>
							<div class="mb-2 flex items-center justify-between text-sm">
								<span class="text-white/80">Overall Progress</span>
								<span class="font-semibold text-white"
									>{Math.round(activeGoal.progressPercentage)}%</span
								>
							</div>
							<div class="h-3 overflow-hidden rounded-full bg-white/10">
								<div
									class="h-full bg-linear-to-r from-blue-500 to-purple-500 transition-all duration-500"
									style="width: {activeGoal.progressPercentage}%"
								></div>
							</div>
						</div>

						<!-- Stats Grid -->
						<div class="grid grid-cols-2 gap-4">
							<div class="rounded-lg bg-white/5 p-4">
								<div class="text-xs tracking-wide text-white/60 uppercase">Starting</div>
								<div class="mt-1 text-2xl font-bold text-white">
									{activeGoal.startingCigarettesPerDay}
								</div>
								<div class="text-xs text-white/60">per day</div>
							</div>
							<div class="rounded-lg bg-white/5 p-4">
								<div class="text-xs tracking-wide text-white/60 uppercase">Target</div>
								<div class="mt-1 text-2xl font-bold text-green-400">
									{activeGoal.targetCigarettesPerDay}
								</div>
								<div class="text-xs text-white/60">per day</div>
							</div>
							<div class="rounded-lg bg-white/5 p-4">
								<div class="text-xs tracking-wide text-white/60 uppercase">Today's Limit</div>
								<div class="mt-1 text-2xl font-bold text-blue-400">
									{activeGoal.currentDayLimit}
								</div>
								<div class="text-xs text-white/60">cigarettes</div>
							</div>
							<div class="rounded-lg bg-white/5 p-4">
								<div class="text-xs tracking-wide text-white/60 uppercase">Days Remaining</div>
								<div class="mt-1 text-2xl font-bold text-purple-400">
									{activeGoal.daysRemaining}
								</div>
								<div class="text-xs text-white/60">of {activeGoal.durationInDays}</div>
							</div>
						</div>

						<!-- Timeline -->
						<div class="rounded-lg bg-white/5 p-4">
							<div class="flex items-center justify-between text-sm">
								<div>
									<div class="text-white/60">Started</div>
									<div class="font-medium text-white">{formatDate(activeGoal.startDate)}</div>
								</div>
								<div class="text-white/40">→</div>
								<div class="text-right">
									<div class="text-white/60">Target Date</div>
									<div class="font-medium text-white">{formatDate(activeGoal.endDate)}</div>
								</div>
							</div>
						</div>

						<!-- Strategy Info -->
						<div class="rounded-lg bg-white/5 p-4">
							<div class="text-xs tracking-wide text-white/60 uppercase">Strategy</div>
							<div class="mt-1 font-semibold text-white">{activeGoal.strategy}</div>
							<div class="mt-1 text-sm text-white/60">
								Daily reduction rate: {activeGoal.dailyReductionRate.toFixed(2)} cigarettes/day
							</div>
						</div>

						<!-- Actions -->
						<div class="flex gap-2">
							{#if activeGoal && activeGoal.status === 'ACTIVE'}
								<button
									on:click={() => activeGoal && handleStatusChange(activeGoal.id, 'PAUSED')}
									disabled={updating}
									class="flex-1 rounded-lg bg-yellow-600/20 px-4 py-2 text-sm font-medium text-yellow-400 transition-colors hover:bg-yellow-600/30 disabled:opacity-50"
								>
									Pause Goal
								</button>
								<button
									on:click={() => activeGoal && handleStatusChange(activeGoal.id, 'ABANDONED')}
									disabled={updating}
									class="flex-1 rounded-lg bg-red-600/20 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/30 disabled:opacity-50"
								>
									Abandon Goal
								</button>
							{:else if activeGoal && activeGoal.status === 'PAUSED'}
								<button
									on:click={() => activeGoal && handleStatusChange(activeGoal.id, 'ACTIVE')}
									disabled={updating}
									class="flex-1 rounded-lg bg-green-600/20 px-4 py-2 text-sm font-medium text-green-400 transition-colors hover:bg-green-600/30 disabled:opacity-50"
								>
									Resume Goal
								</button>
							{/if}
						</div>
					</div>
				</div>
			{:else}
				<div class="rounded-lg bg-white/5 p-8 text-center">
					<div class="text-4xl">🎯</div>
					<div class="mt-3 text-lg font-semibold text-white">No Active Goal</div>
					<div class="mt-1 text-sm text-white/60">
						Create a goal to start tracking your progress
					</div>
				</div>
			{/if}

			<!-- Goal History -->
			{#if allGoals.length > 1}
				<div class="mt-6">
					<button
						on:click={() => (showHistory = !showHistory)}
						class="flex w-full items-center justify-between rounded-lg bg-white/5 p-4 text-left transition-colors hover:bg-white/10"
					>
						<span class="font-semibold text-white">Goal History ({allGoals.length - 1})</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="h-5 w-5 text-white/60 transition-transform"
							class:rotate-180={showHistory}
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M19.5 8.25l-7.5 7.5-7.5-7.5"
							/>
						</svg>
					</button>

					{#if showHistory}
						<div class="mt-3 space-y-3">
							{#each allGoals.filter((g) => g.id !== activeGoal?.id) as goal (goal.id)}
								<div class="rounded-lg bg-white/5 p-4">
									<div class="mb-2 flex items-start justify-between">
										<div class="flex items-center gap-2">
											<span class="text-lg">{getStrategyIcon(goal.strategy)}</span>
											<span class="font-medium text-white"
												>{goal.startingCigarettesPerDay} → {goal.targetCigarettesPerDay}/day</span
											>
										</div>
										<span
											class="rounded-full {getStatusColor(
												goal.status
											)} px-2 py-1 text-xs font-semibold"
										>
											{goal.status}
										</span>
									</div>
									<div class="grid grid-cols-3 gap-2 text-xs text-white/60">
										<div>
											<div>Started</div>
											<div class="text-white/80">{formatDate(goal.startDate)}</div>
										</div>
										<div>
											<div>Duration</div>
											<div class="text-white/80">{goal.durationInDays} days</div>
										</div>
										<div>
											<div>Progress</div>
											<div class="text-white/80">{Math.round(goal.progressPercentage)}%</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		{/if}
	</div>
</Modal>
