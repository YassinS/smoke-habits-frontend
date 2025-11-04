<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import ColorPicker from '$lib/components/ColorPicker.svelte';
	import { apiPost, fetchSmokeContexts, createSmokeContext } from '$lib/api';
	import type { SmokeContext } from '$lib/api';

	const dispatch = createEventDispatcher();
	const DEFAULT_COLOR = '#34d399';

	let craving = 3;
	let loading = false;
	let error: string | null = null;
	let contexts: SmokeContext[] = [];
	let selectedContextId: string | '' = '';
	let showNewContext = false;
	let newContextName = '';
	let newContextColor = DEFAULT_COLOR;
	let savingContext = false;

	async function loadContexts() {
		try {
			const list = await fetchSmokeContexts();
			contexts = list;
			if (!showNewContext && !selectedContextId && contexts.length) {
				selectedContextId = contexts[0].id;
			}
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

	onMount(() => {
		void loadContexts();
	});

	async function ensureContext() {
		if (!showNewContext) return selectedContextId || null;
		if (!newContextName.trim()) {
			throw new Error('Context name is required');
		}
		savingContext = true;
		try {
			const created = await createSmokeContext({
				context: newContextName.trim(),
				colorUI: newContextColor
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
			const contextId = await ensureContext();
			await apiPost('/cigarettes/log', {
				cravingLevel: Number(craving),
				smokeContext: contextId ?? undefined
			});
			dispatch('logged');
		} catch (e: any) {
			error = e?.message ?? String(e);
		} finally {
			loading = false;
		}
	}
</script>

<div class="space-y-4 rounded bg-white/5 p-4">
	<div class="flex items-center gap-3">
		<label class="text-sm" for="craveRange">Craving</label>
		<input id="craveRange" type="range" min="1" max="10" bind:value={craving} />
		<div class="w-8 text-center">{craving}</div>
	</div>

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
		disabled={loading || savingContext}
	>
		{loading ? 'Logging…' : 'Log cigarette'}
	</button>

	{#if error}
		<div class="mt-2 rounded border border-red-500/40 bg-red-500/10 p-2 text-sm text-red-300">
			{error}
		</div>
	{/if}
</div>
