<script lang="ts">
	import { user, clearAuth } from '$lib/auth';
	import { fade } from 'svelte/transition';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

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
			<div class="relative flex items-center gap-2" transition:fade>
				<div class="relative grid h-8 w-8 place-items-center rounded-full bg-white/10 text-sm font-medium">
					{String(($user as any).email ?? 'U').slice(0, 1).toUpperCase()}
					<span class="absolute bottom-0 right-0 h-3 w-3 rounded-full border border-neutral-900 bg-emerald-500" title="Online"></span>
				</div>
				<div class="text-sm text-gray-200 max-w-48 truncate">{$user.email ?? 'You'}</div>
			</div>
			<button class="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm hover:bg-white/15" on:click={logout}>
				Sign out
			</button>
		{/if}
	</div>
</header>
