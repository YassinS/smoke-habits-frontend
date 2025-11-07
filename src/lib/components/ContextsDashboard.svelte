<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/Card.svelte';
	import ColorPicker from '$lib/components/ColorPicker.svelte';
	import type { SmokeContext, SmokeContextPayload } from '$lib/api';
	import {
		fetchSmokeContexts,
		createSmokeContext,
		updateSmokeContext,
		deleteSmokeContext
	} from '$lib/api';

	let contexts: SmokeContext[] = [];
	let loading = true;
	let error: string | null = null;
	let editingId: string | null = null;
	let form: SmokeContextPayload = { context: '', colorUI: '#34d399' };
	let saving = false;
	let deletingId: string | null = null;
	let showDeleteConfirm: string | null = null;

	async function load() {
		loading = true;
		error = null;
		try {
			contexts = await fetchSmokeContexts();
		} catch (err: any) {
			error = err?.message ?? 'Failed to load contexts';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function startEdit(ctx: SmokeContext) {
		editingId = ctx.id;
		form = { context: ctx.context, colorUI: ctx.colorUI };
	}

	function startCreate() {
		editingId = null;
		form = { context: '', colorUI: '#34d399' };
	}

	async function submit() {
		if (!form.context.trim()) {
			error = 'Context label required';
			return;
		}
		saving = true;
		error = null;
		try {
			if (editingId) {
				const updated = await updateSmokeContext(editingId, form);
				contexts = contexts.map((ctx) => (ctx.id === editingId ? updated : ctx));
			} else {
				const created = await createSmokeContext(form);
				contexts = [...contexts, created];
			}
			startCreate();
		} catch (err: any) {
			error = err?.message ?? 'Unable to save context';
		} finally {
			saving = false;
		}
	}

	async function deleteContext(id: string) {
		deletingId = id;
		error = null;
		try {
			await deleteSmokeContext(id);
			contexts = contexts.filter((ctx) => ctx.id !== id);
			showDeleteConfirm = null;
		} catch (err: any) {
			error = err?.message ?? 'Unable to delete context';
		} finally {
			deletingId = null;
		}
	}
</script>

<div class="space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-semibold text-white">Smoke contexts</h1>
			<p class="text-sm text-gray-300">Categorize moments to understand patterns.</p>
		</div>
	</div>

	<Card className="p-4">
		<div class="grid gap-3 md:grid-cols-[2fr_1fr_auto] md:items-end">
			<div class="flex flex-col gap-1">
				<label class="text-xs tracking-wide text-gray-300 uppercase" for="contextLabel">Label</label
				>
				<input
					id="contextLabel"
					class="rounded border border-white/10 bg-neutral-900 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none"
					bind:value={form.context}
					placeholder="ie. Morning coffee"
				/>
			</div>
			<div class="flex flex-col gap-1">
				<span class="text-xs tracking-wide text-gray-300 uppercase" id="contextColorLabel"
					>Accent color</span
				>
				<ColorPicker bind:value={form.colorUI} labelledBy="contextColorLabel" />
			</div>
			<button
				class="self-stretch rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
				on:click={submit}
				disabled={saving}
			>
				{saving ? 'Saving…' : editingId ? 'Update context' : 'Create context'}
			</button>
		</div>
		{#if error}
			<div class="mt-3 rounded border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-300">
				{error}
			</div>
		{/if}
	</Card>

	{#if loading}
		<Card className="p-6 text-center text-sm text-gray-300">Loading contexts…</Card>
	{:else if !contexts.length}
		<Card className="p-6 text-center text-sm text-gray-300"
			>No contexts yet. Create one above to begin marking moments.</Card
		>
	{:else}
		<div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
			{#each contexts as ctx}
				<Card className="flex items-center justify-between gap-4 p-4">
					<div class="flex items-center gap-3">
						<span
							class="h-10 w-10 rounded-full border border-white/10"
							style={`background:${ctx.colorUI};`}
						></span>
						<div>
							<div class="font-medium text-white">{ctx.context}</div>
							<div class="text-xs text-gray-400">{ctx.id}</div>
						</div>
					</div>
					<div class="flex gap-2">
						<button
							class="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs tracking-wide text-white uppercase hover:bg-white/15"
							on:click={() => startEdit(ctx)}
						>
							Edit
						</button>
						<button
							class="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs tracking-wide text-red-300 uppercase hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
							on:click={() => (showDeleteConfirm = ctx.id)}
							disabled={deletingId === ctx.id}
						>
							Delete
						</button>
					</div>
				</Card>

				{#if showDeleteConfirm === ctx.id}
					<Card className="border border-red-500/30 bg-red-500/10 p-4">
						<p class="mb-3 text-sm text-red-200">
							Are you sure you want to delete "{ctx.context}"?
						</p>
						<div class="flex gap-2">
							<button
								class="flex-1 rounded bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
								on:click={() => deleteContext(ctx.id)}
								disabled={deletingId === ctx.id}
							>
								{deletingId === ctx.id ? 'Deleting...' : 'Delete'}
							</button>
							<button
								class="flex-1 rounded border border-gray-600 bg-gray-900 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
								on:click={() => (showDeleteConfirm = null)}
								disabled={deletingId === ctx.id}
							>
								Cancel
							</button>
						</div>
					</Card>
				{/if}
			{/each}
		</div>
	{/if}
</div>
