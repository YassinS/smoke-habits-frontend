<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	export let open = false;
	export let title: string | null = null;
	const dispatch = createEventDispatcher();

	function close() {
		dispatch('close');
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}

	onMount(() => {
		window.addEventListener('keydown', onKey);
	});
	onDestroy(() => {
		window.removeEventListener('keydown', onKey);
	});
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
		transition:fade
	>
		<div
			class="absolute inset-0 bg-black/50"
			role="button"
			tabindex="0"
			on:click={close}
			on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && close()}
		></div>
		<div
			class="relative z-10 my-8 w-full max-w-md rounded-xl border border-white/10 bg-neutral-900 p-4 text-white shadow-lg"
			role="dialog"
			aria-modal="true"
			transition:scale={{ start: 0.95, duration: 120 }}
		>
			{#if title}
				<div class="mb-2 text-lg font-semibold">{title}</div>
			{/if}
			<slot />
		</div>
	</div>
{/if}
