<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { initializeOfflineSupport } from '$lib/api';

	let { children } = $props();

	onMount(() => {
		initializeOfflineSupport();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
