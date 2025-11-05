<script lang="ts">
	import { user, clearAuth } from '$lib/auth';
	import { fade, scale } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';

	const dispatch = createEventDispatcher();
	let menuOpen = false;

	function toggleMenu() {
		menuOpen = !menuOpen;
	}

	function goToContexts() {
		menuOpen = false;
		goto('/contexts');
	}

	function goToSettings() {
		menuOpen = false;
		goto('/settings');
	}

	function logout() {
		clearAuth();
		dispatch('logout');
	}
</script>

<header
	class="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-neutral-950/70 p-4 text-white backdrop-blur"
>
	<div class="flex items-center gap-3">
		<div class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 font-bold">
			SH
		</div>
		<div>
			<div class="text-xl font-semibold">Smoke Habits</div>
			<div class="text-xs text-gray-300">Track · Analyze · Improve</div>
		</div>
	</div>

	<div class="flex items-center gap-3">
		{#if $user}
			<div class="relative" transition:fade>
				<button
					class="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm text-gray-100 hover:bg-white/15"
					on:click={toggleMenu}
				>
					<div class="relative grid h-8 w-8 place-items-center rounded-full bg-white/10 text-sm font-medium">
						{String(($user as any).email ?? 'U').slice(0, 1).toUpperCase()}
						<span class="absolute bottom-0 right-0 h-3 w-3 rounded-full border border-neutral-900 bg-emerald-500" title="Online"></span>
					</div>
					<span class="max-w-40 truncate">{$user.email ?? 'You'}</span>
					<svg class={`h-4 w-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clip-rule="evenodd" />
					</svg>
				</button>

				{#if menuOpen}
					<div class="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-white/10 bg-neutral-900/95 shadow-xl" transition:scale={{ duration: 120 }}>
						<button class="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-100 hover:bg-white/10" on:click={goToContexts}>
							<span class="inline-flex h-2 w-2 rounded-full" style="background: linear-gradient(135deg, #34d399, #22d3ee);"></span>
							Smoke contexts
						</button>
						<button class="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-100 hover:bg-white/10" on:click={goToSettings}>
							<svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="3"></circle>
								<path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m5.08-5.08l4.24-4.24"></path>
							</svg>
							Settings
						</button>
						<button class="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-200 hover:bg-red-500/20" on:click={logout}>
							Sign out
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</header>
