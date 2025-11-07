<script lang="ts">
	import { onMount } from 'svelte';
	import Card from '$lib/components/Card.svelte';
	import ColorPicker from '$lib/components/ColorPicker.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { SmokeContext, SmokeContextPayload } from '$lib/api';
	import {
		fetchSmokeContexts,
		createSmokeContext,
		updateSmokeContext,
		deleteSmokeContext
	} from '$lib/api';
	import { validateContextLabel, validateHexColor } from '$lib/validation';

	let contexts: SmokeContext[] = [];
	let loading = true;
	let error: string | null = null;
	let editingId: string | null = null;
	let form: SmokeContextPayload = { context: '', colorUI: '#34d399' };
	let saving = false;
	let deletingId: string | null = null;
	let deleteModalOpen = false;
	let contextToDelete: SmokeContext | null = null;

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
		// Validate context label
		const labelValidation = validateContextLabel(form.context);
		if (!labelValidation.valid) {
			error = labelValidation.error || 'Invalid context label';
			return;
		}

		// Validate hex color
		const colorValidation = validateHexColor(form.colorUI);
		if (!colorValidation.valid) {
			error = colorValidation.error || 'Invalid color';
			return;
		}

		saving = true;
		error = null;
		try {
			const sanitizedPayload: SmokeContextPayload = {
				context: labelValidation.sanitized || form.context,
				colorUI: colorValidation.sanitized || form.colorUI
			};

			if (editingId) {
				const updated = await updateSmokeContext(editingId, sanitizedPayload);
				contexts = contexts.map((ctx) => (ctx.id === editingId ? updated : ctx));
			} else {
				const created = await createSmokeContext(sanitizedPayload);
				contexts = [...contexts, created];
			}
			startCreate();
		} catch (err: any) {
			error = err?.message ?? 'Unable to save context';
		} finally {
			saving = false;
		}
	}

	function openDeleteModal(ctx: SmokeContext) {
		contextToDelete = ctx;
		deleteModalOpen = true;
	}

	function closeDeleteModal() {
		deleteModalOpen = false;
		contextToDelete = null;
	}

	async function confirmDelete() {
		if (!contextToDelete) return;
		deletingId = contextToDelete.id;
		error = null;
		try {
			await deleteSmokeContext(contextToDelete.id);
			contexts = contexts.filter((ctx) => ctx.id !== contextToDelete!.id);
			closeDeleteModal();
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
				<Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
					<div class="flex min-w-0 items-center gap-3">
						<span
							class="h-10 w-10 flex-shrink-0 rounded-full border border-white/10"
							style={`background:${ctx.colorUI};`}
						></span>
						<div class="min-w-0 flex-1">
							<div class="truncate font-medium text-white">{ctx.context}</div>
							<div class="truncate text-xs text-gray-400">{ctx.id}</div>
						</div>
					</div>
					<div class="flex flex-shrink-0 gap-2">
						<button
							class="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs tracking-wide whitespace-nowrap text-white uppercase hover:bg-white/15"
							on:click={() => startEdit(ctx)}
						>
							Edit
						</button>
						<button
							class="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs tracking-wide whitespace-nowrap text-red-300 uppercase hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
							on:click={() => openDeleteModal(ctx)}
							disabled={deletingId === ctx.id}
						>
							Delete
						</button>
					</div>
				</Card>
			{/each}
		</div>
	{/if}
</div>

<Modal open={deleteModalOpen} on:close={closeDeleteModal}>
	<div class="space-y-4">
		<div>
			<p class="text-sm text-gray-300">
				Are you sure you want to delete "<span class="font-semibold text-white"
					>{contextToDelete?.context}</span
				>"?
			</p>
			<p class="mt-2 text-xs text-gray-400">This action cannot be undone.</p>
		</div>
		<div class="flex gap-2">
			<button
				class="flex-1 rounded bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
				on:click={confirmDelete}
				disabled={deletingId !== null}
			>
				{deletingId ? 'Deleting...' : 'Delete'}
			</button>
			<button
				class="flex-1 rounded border border-gray-600 bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
				on:click={closeDeleteModal}
				disabled={deletingId !== null}
			>
				Cancel
			</button>
		</div>
	</div>
</Modal>
