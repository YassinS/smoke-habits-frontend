<script lang="ts">
	import { syncStatus } from '$lib/stores/sync';
</script>

{#if !$syncStatus.online}
	<div class="flex items-center gap-2 px-3 py-2 text-xs text-amber-400">
		<span class="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse"></span>
		<span>Offline</span>
	</div>
{:else if $syncStatus.pendingCount > 0}
	<div class="flex items-center gap-2 px-3 py-2 text-xs text-blue-400">
		<span class="inline-block h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
		<span>{$syncStatus.pendingCount} pending</span>
	</div>
{/if}
