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

	function goHome() {
		menuOpen = false;
		goto('/app');
	}

	function logout() {
		clearAuth();
		dispatch('logout');
	}
</script>

<!-- Modern Header matching landing page -->
<header
	class="sticky top-0 z-30 w-full border-b border-white/10 bg-gray-900/80 backdrop-blur-lg"
>
	<div class="container mx-auto flex items-center justify-between px-6 py-4">
		<!-- Logo and Brand -->
		<button on:click={goHome} class="flex items-center gap-2 transition-opacity hover:opacity-80">
			<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
				<span class="text-2xl">🚭</span>
			</div>
			<div class="hidden sm:block">
				<div class="text-xl font-bold text-white">Smoke Habits</div>
				<div class="text-xs text-gray-400">Track · Analyze · Improve</div>
			</div>
		</button>

		<!-- User Menu -->
		<div class="flex items-center gap-3">
			{#if $user}
				<div class="relative" transition:fade>
					<button
						class="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-100 transition-colors hover:bg-white/10"
						on:click={toggleMenu}
					>
						<div
							class="relative grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-green-500/20 to-emerald-600/20 text-sm font-semibold text-green-400"
						>
							{String(($user as any).email ?? 'U')
								.slice(0, 1)
								.toUpperCase()}
							<span
								class="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-gray-900 bg-green-500"
								title="Online"
							></span>
						</div>
						<span class="hidden max-w-40 truncate md:block">{$user.email ?? 'You'}</span>
						<svg
							class={`h-4 w-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>

					{#if menuOpen}
						<div
							class="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-gray-900/95 shadow-xl backdrop-blur-lg"
							transition:scale={{ duration: 120 }}
						>
							<div class="border-b border-white/10 px-4 py-3">
								<div class="text-xs text-gray-400">Signed in as</div>
								<div class="truncate text-sm font-medium text-white">{$user.email ?? 'User'}</div>
							</div>

							<div class="py-1">
								<button
									class="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
									on:click={goHome}
								>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4">
										<path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
									</svg>
									Dashboard
								</button>

								<button
									class="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
									on:click={goToContexts}
								>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" />
									</svg>
									Smoke Contexts
								</button>

								<button
									class="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
									on:click={goToSettings}
								>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
										<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
									Settings
								</button>
							</div>

							<div class="border-t border-white/10 py-1">
								<button
									class="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
									on:click={logout}
								>
									<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="h-4 w-4">
										<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
									</svg>
									Sign Out
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</header>
