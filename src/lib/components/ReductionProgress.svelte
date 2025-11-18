<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchReductionProgress, type ReductionProgress } from '$lib/api';

	export let onCreateGoal: (() => void) | undefined = undefined;

	let progress: ReductionProgress | null = null;
	let loading = true;

	export async function refresh() {
		loading = true;
		try {
			progress = await fetchReductionProgress();
		} catch (err) {
			console.error('Failed to load reduction progress:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		refresh();
	});

	$: hasGoal = progress?.hasActiveGoal ?? false;
	$: remaining = progress?.cigarettesRemaining ?? 0;
	$: allowed = progress?.allowedCigarettesToday ?? 0;
	$: logged = progress?.cigarettesLoggedToday ?? 0;
	$: limitExceeded = progress?.limitExceeded ?? false;
	$: progressPercent = allowed > 0 ? Math.min((logged / allowed) * 100, 100) : 0;
</script>

{#if loading}
	<div class="rounded-xl bg-linear-to-br from-blue-600/20 to-purple-600/20 p-6">
		<div class="animate-pulse">
			<div class="h-6 w-32 rounded bg-white/10"></div>
			<div class="mt-2 h-10 w-20 rounded bg-white/10"></div>
		</div>
	</div>
{:else if hasGoal}
	<div
		class="rounded-xl p-6 shadow-lg {limitExceeded
			? 'bg-linear-to-br from-red-600/20 to-orange-600/20'
			: 'bg-linear-to-br from-green-600/20 to-emerald-600/20'}"
	>
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<h3 class="text-sm font-medium tracking-wide text-white/60 uppercase">Today's Progress</h3>
				<div class="mt-2 flex items-baseline gap-2">
					<span class="text-5xl font-bold {limitExceeded ? 'text-red-400' : 'text-green-400'}">
						{logged}
					</span>
					<span class="text-lg text-white/60">/ {allowed}</span>
				</div>
				<p class="mt-1 text-sm text-white/80">
					{#if limitExceeded}
						<span class="font-semibold text-red-300">Over limit by {Math.abs(remaining)}</span>
					{:else}
						<span class="font-semibold text-green-300">{remaining} remaining</span>
					{/if}
				</p>
				<p class="mt-1 text-xs text-white/60">{progress?.message ?? ''}</p>
			</div>

			<!-- Circular progress indicator -->
			<div class="relative h-16 w-16">
				<svg class="h-16 w-16 -rotate-90 transform">
					<circle
						cx="32"
						cy="32"
						r="28"
						stroke="currentColor"
						stroke-width="4"
						fill="none"
						class="text-white/10"
					/>
					<circle
						cx="32"
						cy="32"
						r="28"
						stroke="currentColor"
						stroke-width="4"
						fill="none"
						stroke-dasharray={`${2 * Math.PI * 28}`}
						stroke-dashoffset={`${2 * Math.PI * 28 * (1 - progressPercent / 100)}`}
						class="transition-all duration-500 {limitExceeded ? 'text-red-400' : 'text-green-400'}"
						stroke-linecap="round"
					/>
				</svg>
				<div class="absolute inset-0 flex items-center justify-center">
					<span class="text-xs font-bold text-white">{Math.round(progressPercent)}%</span>
				</div>
			</div>
		</div>

		<!-- Progress bar -->
		<div class="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
			<div
				class="h-full transition-all duration-500 {limitExceeded ? 'bg-red-400' : 'bg-green-400'}"
				style="width: {progressPercent}%"
			></div>
		</div>

		<!-- Goal info -->
		{#if progress?.activeGoal}
			<div class="mt-4 flex items-center justify-between text-xs text-white/60">
				<span
					>Goal: {progress.activeGoal.startingCigarettesPerDay} → {progress.activeGoal
						.targetCigarettesPerDay}/day</span
				>
				<span
					>{progress.activeGoal.daysElapsed}/{progress.activeGoal.durationInDays} days ({Math.round(
						progress.activeGoal.progressPercentage
					)}%)</span
				>
			</div>
		{/if}
	</div>
{:else}
	<!-- No active goal - prompt to create one -->
	<div class="rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-6">
		<div class="text-center">
			<div class="mx-auto h-12 w-12 rounded-full bg-blue-500/20 p-3">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="text-blue-400"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
					/>
				</svg>
			</div>
			<h3 class="mt-3 text-lg font-semibold text-white">Create a Reduction Goal</h3>
			<p class="mt-1 text-sm text-white/60">
				Set a target and gradually reduce your cigarette consumption
			</p>
			{#if onCreateGoal}
				<button
					on:click={onCreateGoal}
					class="mt-4 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
				>
					Get Started
				</button>
			{/if}
		</div>
	</div>
{/if}
