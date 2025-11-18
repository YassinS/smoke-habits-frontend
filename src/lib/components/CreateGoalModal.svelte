<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Modal from './Modal.svelte';
	import {
		createReductionGoal,
		type CreateReductionGoalRequest,
		type ReductionStrategy
	} from '$lib/api';
	import { onMount } from 'svelte';

	export let open = false;

	const dispatch = createEventDispatcher<{ created: void; close: void }>();

	let targetCigarettesPerDay = 5;
	let durationInDays = 30;
	let strategy: ReductionStrategy = 'LINEAR';

	let loading = false;
	let error = '';
	let loadingStrategies = true;

	const strategyDescriptions: Record<ReductionStrategy, string> = {
		LINEAR: 'Steady daily reduction - consistent and predictable progress',
		STEPPED: 'Weekly plateaus - easier to adjust to each new level',
		GRADUAL: 'Slow start, faster finish - builds momentum over time'
	};

	onMount(async () => {
		loadingStrategies = false;
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

	async function handleSubmit() {
		error = '';
		loading = true;

		try {
			const request: CreateReductionGoalRequest = {
				targetCigarettesPerDay,
				durationInDays,
				strategy
			};

			await createReductionGoal(request);
			dispatch('created');
			close();
		} catch (err) {
			error = parseErrorMessage(err) || 'Failed to create reduction goal';
		} finally {
			loading = false;
		}
	}

	function close() {
		open = false;
		dispatch('close');
	}
</script>

<Modal {open} on:close={close}>
	<div
		class="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-linear-to-br from-gray-900 to-gray-800 p-6 shadow-2xl"
		on:click|stopPropagation
		role="none"
	>
		<h2 class="text-2xl font-bold text-white">Create Reduction Goal</h2>
		<p class="mt-2 text-sm text-gray-400">
			Your starting point will be calculated from your recent smoking habits (last 14 days)
		</p>

		<form on:submit|preventDefault={handleSubmit} class="mt-6 space-y-6">
			<!-- Target Cigarettes -->
			<div>
				<label for="target" class="block text-sm font-medium text-white">
					Target Cigarettes per Day
				</label>
				<div class="mt-2 flex items-center gap-3">
					<input
						id="target"
						type="range"
						min="0"
						max="30"
						bind:value={targetCigarettesPerDay}
						class="flex-1"
						disabled={loading}
					/>
					<span
						class="flex h-12 w-16 items-center justify-center rounded-lg bg-blue-600 text-xl font-bold text-white"
					>
						{targetCigarettesPerDay}
					</span>
				</div>
				<p class="mt-1 text-xs text-gray-400">Your goal: reduce to this amount per day</p>
			</div>

			<!-- Duration -->
			<div>
				<label for="duration" class="block text-sm font-medium text-white"> Duration (days) </label>
				<div class="mt-2 flex items-center gap-3">
					<input
						id="duration"
						type="range"
						min="7"
						max="365"
						step="7"
						bind:value={durationInDays}
						class="flex-1"
						disabled={loading}
					/>
					<span
						class="flex h-12 w-16 items-center justify-center rounded-lg bg-purple-600 text-xl font-bold text-white"
					>
						{durationInDays}
					</span>
				</div>
				<p class="mt-1 text-xs text-gray-400">
					~{Math.round(durationInDays / 7)} weeks | ~{Math.round(durationInDays / 30)} months
				</p>
			</div>

			<!-- Strategy Selection -->
			<div>
				<span class="block text-sm font-medium text-white">Reduction Strategy</span>
				{#if loadingStrategies}
					<div class="mt-2 animate-pulse rounded-lg bg-white/5 p-4">Loading strategies...</div>
				{:else}
					<div class="mt-3 space-y-2">
						{#each Object.entries(strategyDescriptions) as [strategyKey, description] (strategyKey)}
							<label
								class="flex cursor-pointer items-start gap-3 rounded-lg border-2 p-4 transition-all {strategy ===
								strategyKey
									? 'border-blue-500 bg-blue-500/10'
									: 'border-white/10 bg-white/5 hover:border-white/20'}"
							>
								<input
									type="radio"
									name="strategy"
									value={strategyKey}
									bind:group={strategy}
									class="mt-1"
									disabled={loading}
								/>
								<div class="flex-1">
									<div class="font-semibold text-white">{strategyKey}</div>
									<div class="mt-1 text-sm text-gray-400">{description}</div>
								</div>
							</label>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Info Card -->
			<div class="rounded-lg bg-blue-500/10 p-4">
				<div class="flex items-start gap-3">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="h-5 w-5 shrink-0 text-blue-400"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
						/>
					</svg>
					<div class="text-sm text-blue-200">
						<strong>How it works:</strong> We'll analyze your last 14 days of logged cigarettes to calculate
						your starting point automatically. Make sure you've logged for at least 3 days.
					</div>
				</div>
			</div>

			{#if error}
				<div class="rounded-lg bg-red-500/10 p-4 text-sm text-red-300">
					{error}
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex gap-3">
				<button
					type="button"
					on:click={close}
					disabled={loading}
					class="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-3 font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
				>
					Cancel
				</button>
				<button
					type="submit"
					disabled={loading || loadingStrategies}
					class="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
				>
					{loading ? 'Creating...' : 'Create Goal'}
				</button>
			</div>
		</form>
	</div>
</Modal>

<style>
	input[type='range'] {
		-webkit-appearance: none;
		appearance: none;
		height: 6px;
		border-radius: 3px;
		background: linear-gradient(to right, #3b82f6 0%, #8b5cf6 100%);
		outline: none;
	}

	input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	input[type='range']::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: white;
		cursor: pointer;
		border: none;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	input[type='radio'] {
		accent-color: #3b82f6;
	}
</style>
