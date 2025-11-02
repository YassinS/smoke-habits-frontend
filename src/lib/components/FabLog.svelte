<script lang="ts">
  import Modal from '$lib/components/Modal.svelte';
  import LogCigarette from '$lib/components/LogCigarette.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
  let open = false;

  function onLogged() {
    open = false;
    dispatch('logged');
  }
</script>

<!-- Floating Action Button -->
<button
  class="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white shadow-xl transition hover:bg-green-500 focus:outline-none focus:ring-4 focus:ring-green-400/40 animate-fab"
  aria-label="Log a cigarette"
  on:click={() => (open = true)}
>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-7 w-7">
    <path fill-rule="evenodd" d="M12 4.5a1 1 0 0 1 1 1v5.5h5.5a1 1 0 1 1 0 2H13v5.5a1 1 0 1 1-2 0V13H5.5a1 1 0 1 1 0-2H11V5.5a1 1 0 0 1 1-1Z" clip-rule="evenodd" />
  </svg>
</button>

<Modal bind:open title="Quick log" on:close={() => (open = false)}>
  <LogCigarette on:logged={onLogged} />
</Modal>

<style>
  @keyframes bob {
    0%, 100% { transform: translateY(0); box-shadow: 0 10px 20px rgba(0,0,0,0.25); }
    50% { transform: translateY(-2px); box-shadow: 0 14px 24px rgba(0,0,0,0.28); }
  }
  .animate-fab {
    animation: bob 3s ease-in-out infinite;
  }
</style>
