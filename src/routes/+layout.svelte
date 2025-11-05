<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { initializeOfflineSupport } from '$lib/api';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();

	onMount(() => {
		initializeOfflineSupport();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<div class="flex-1">
		{@render children()}
	</div>
	<Footer />
</div>
