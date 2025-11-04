<script lang="ts">
  import Header from '$lib/components/Header.svelte';
  import ContextsDashboard from '$lib/components/ContextsDashboard.svelte';
  import { getTokens } from '$lib/auth';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let authed = !!getTokens();

  onMount(() => {
    if (!authed) goto('/');
  });
</script>

<Header on:logout={() => goto('/')} />

<main class="container mx-auto space-y-6 p-6 text-white">
  <button
    type="button"
    class="inline-flex items-center gap-2 text-sm text-gray-300 transition hover:text-white"
    on:click={() => goto('/')}
  >
    <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fill-rule="evenodd"
        d="M12.78 4.22a.75.75 0 010 1.06L8.56 9.5H16a.75.75 0 010 1.5H8.56l4.22 4.22a.75.75 0 01-1.06 1.06l-5.5-5.5a.75.75 0 010-1.06l5.5-5.5a.75.75 0 011.06 0z"
        clip-rule="evenodd"
      />
    </svg>
    <span>Back to dashboard</span>
  </button>
  <ContextsDashboard />
</main>
