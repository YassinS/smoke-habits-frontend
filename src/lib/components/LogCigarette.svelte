<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import ColorPicker from '$lib/components/ColorPicker.svelte';
	import {
		apiPost,
		fetchSmokeContexts,
		createSmokeContext,
		getPendingSyncCount,
		syncPendingLogs
	} from '$lib/api';
	import { isOnline } from '$lib/offline';
	import type { SmokeContext } from '$lib/api';
	import { validateContextLabel, validateHexColor, validateCravingLevel } from '$lib/validation';

	const dispatch = createEventDispatcher();
	const DEFAULT_COLOR = '#34d399';

	let craving: number | null = null;
	let cravingTouched = false;
	let loading = false;
	let error: string | null = null;
	let contexts: SmokeContext[] = [];
	let selectedContextId: string | '' = '';
	let showNewContext = false;
	let newContextName = '';
	let newContextColor = DEFAULT_COLOR;
	let savingContext = false;
	let online = true;
	let pendingCount = 0;
	let syncing = false;

	async function loadContexts() {
		try {
			const list = await fetchSmokeContexts();
			contexts = list;
			// Don't auto-select first context - keep "No Context" as default
		} catch (e) {
			console.error(e);
			contexts = [];
		}
	}

	function resetNewContext() {
		newContextName = '';
		newContextColor = DEFAULT_COLOR;
	}

	function toggleNewContext() {
		showNewContext = !showNewContext;
		if (showNewContext) {
			selectedContextId = '';
			resetNewContext();
		}
	}

	function selectContext(id: string | '') {
		selectedContextId = id;
		showNewContext = false;
	}

	$: if (!showNewContext && selectedContextId) {
		const exists = contexts.some((ctx) => ctx.id === selectedContextId);
		if (!exists) {
			selectedContextId = contexts[0]?.id ?? '';
		}
	}

	async function checkOnlineStatus() {
		online = isOnline();
		if (online) {
			pendingCount = await getPendingSyncCount();
		}
	}

	async function handleSync() {
		syncing = true;
		try {
			await syncPendingLogs();
			pendingCount = await getPendingSyncCount();
			dispatch('synced');
		} catch (err) {
			console.error('Sync failed:', err);
		} finally {
			syncing = false;
		}
	}

	onMount(() => {
		void loadContexts();
		checkOnlineStatus();

		// Monitor online/offline status
		const handleOnline = () => {
			online = true;
			checkOnlineStatus();
		};
		const handleOffline = () => {
			online = false;
		};

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		// Check pending logs periodically
		const interval = setInterval(async () => {
			if (online) {
				pendingCount = await getPendingSyncCount();
			}
		}, 3000);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
			clearInterval(interval);
		};
	});

	async function ensureContext() {
		if (!showNewContext) return selectedContextId || null;

		// Validate context label
		const labelValidation = validateContextLabel(newContextName);
		if (!labelValidation.valid) {
			throw new Error(labelValidation.error || 'Invalid context name');
		}

		// Validate hex color
		const colorValidation = validateHexColor(newContextColor);
		if (!colorValidation.valid) {
			throw new Error(colorValidation.error || 'Invalid color');
		}

		savingContext = true;
		try {
			const created = await createSmokeContext({
				context: labelValidation.sanitized || newContextName,
				colorUI: colorValidation.sanitized || newContextColor
			});
			contexts = [...contexts, created];
			selectedContextId = created.id;
			showNewContext = false;
			resetNewContext();
			error = null;
			return created.id;
		} finally {
			savingContext = false;
		}
	}

	async function logIt() {
		loading = true;
		error = null;
		try {
			// Require craving level to be selected
			if (!cravingTouched || craving === null) {
				throw new Error('Please select a craving level');
			}

			// Validate craving level
			const cravingValidation = validateCravingLevel(craving);
			if (!cravingValidation.valid) {
				throw new Error(cravingValidation.error || 'Invalid craving level');
			}

			const contextId = await ensureContext();
			await apiPost('/cigarettes/log', {
				cravingLevel: Number(cravingValidation.sanitized),
				smokeContext: contextId ?? undefined
			});

			// Reset form after successful log
			craving = null;
			cravingTouched = false;
			selectedContextId = '';
			error = null;

			dispatch('logged');
		} catch (e: any) {
			error = e?.message ?? String(e);
		} finally {
			loading = false;
		}
	}
</script>

<div class="space-y-4 rounded bg-white/5 p-4">
	<!-- Online/Offline & Pending Status -->
	{#if !online}
		<div
			class="flex items-center gap-2 rounded border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-amber-200"
		>
			<span class="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-500"></span>
			You're offline. Logs will queue locally and sync automatically when back online.
		</div>
	{:else if pendingCount > 0}
		<div
			class="flex items-center justify-between gap-2 rounded border border-blue-500/40 bg-blue-500/10 p-2"
		>
			<div class="flex items-center gap-2 text-xs">
				{#if syncing}
					<span class="inline-block h-2 w-2 animate-pulse rounded-full bg-blue-400"></span>
					<span class="text-blue-200"
						>Syncing {pendingCount} log{pendingCount === 1 ? '' : 's'}...</span
					>
				{:else}
					<span class="text-blue-200"
						>{pendingCount} log{pendingCount === 1 ? '' : 's'} waiting to sync</span
					>
					<button
						type="button"
						class="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
						on:click={handleSync}
						disabled={syncing || !online}
					>
						Sync now
					</button>
				{/if}
			</div>
		</div>
	{/if}

	<div class="flex items-center gap-3">
		<label class="text-sm" for="craveRange">Craving</label>
		<input
			id="craveRange"
			type="range"
			min="1"
			max="10"
			value={craving ?? 5}
			on:input={(e) => {
				cravingTouched = true;
				craving = Number(e.currentTarget.value);
			}}
		/>
		<div class="w-8 text-center">{cravingTouched ? craving : '–'}</div>
	</div>
	{#if !cravingTouched}
		<div class="text-xs text-amber-300">Please select a craving level using the slider above</div>
	{/if}

	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium text-gray-200">Context</span>
			<button
				type="button"
				class="rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1 text-xs tracking-wide text-emerald-100 uppercase transition hover:bg-emerald-500/30"
				on:click={toggleNewContext}
			>
				{showNewContext ? 'Close form' : 'New context'}
			</button>
		</div>

		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				class={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 ${selectedContextId === '' ? 'border-emerald-300/70 bg-emerald-500/20 text-emerald-100 shadow-inner' : 'border-white/15 bg-white/5 text-gray-200 hover:border-white/35'}`}
				on:click={() => selectContext('')}
			>
				<span class="h-2 w-2 rounded-full bg-white/60"></span>
				No context
			</button>
			{#each contexts as ctx}
				<button
					type="button"
					class={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 ${selectedContextId === ctx.id ? 'border-white/80 text-white ring-2 ring-emerald-400/70 ring-offset-2 ring-offset-neutral-900' : 'border-white/15 text-gray-100 hover:border-white/40'}`}
					style={`background:${ctx.colorUI}22;`}
					on:click={() => selectContext(ctx.id)}
				>
					<span class="h-2 w-2 rounded-full" style={`background:${ctx.colorUI}`}></span>
					{ctx.context}
				</button>
			{/each}
		</div>
		{#if !contexts.length}
			<div class="text-xs text-gray-400">No contexts yet. Create one to tag situations.</div>
		{/if}

		{#if showNewContext}
			<div class="space-y-2 rounded border border-emerald-400/20 bg-emerald-500/10 p-3">
				<div class="flex flex-col gap-1">
					<label class="text-xs tracking-wide text-emerald-200/80 uppercase" for="contextName"
						>Context name</label
					>
					<input
						id="contextName"
						class="rounded border border-emerald-400/30 bg-neutral-950 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
						placeholder="e.g. Morning coffee"
						bind:value={newContextName}
					/>
				</div>
				<div class="flex flex-col gap-1">
					<span class="text-xs tracking-wide text-emerald-200/80 uppercase" id="contextColor"
						>Accent color</span
					>
					<ColorPicker bind:value={newContextColor} labelledBy="contextColor" />
				</div>
				<button
					class="w-full rounded bg-emerald-500 px-3 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
					type="button"
					on:click={async () => {
						try {
							await ensureContext();
						} catch (err: any) {
							error = err?.message ?? 'Unable to save context';
						}
					}}
					disabled={savingContext}
				>
					{savingContext ? 'Saving…' : 'Save context'}
				</button>
			</div>
		{/if}
	</div>

	<button
		class="w-full rounded bg-green-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
		on:click={logIt}
		disabled={loading || savingContext || !cravingTouched}
	>
		{loading ? 'Logging…' : 'Log cigarette'}
	</button>

	{#if error}
		<div class="mt-2 rounded border border-red-500/40 bg-red-500/10 p-2 text-sm text-red-300">
			{error}
		</div>
	{/if}
</div>
