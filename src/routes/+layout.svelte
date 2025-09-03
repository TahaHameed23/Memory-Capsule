<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { initAuth } from '$lib/auth';
	import { onMount } from 'svelte';
	import { Toaster } from 'svelte-french-toast';
	import Navigation from '$lib/components/Navigation.svelte';

	let { children } = $props();

	onMount(() => {
		initAuth();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Memory Capsule - Preserve Memories Across Time</title>
	<meta
		name="description"
		content="Create digital time capsules that unlock based on date, location, or special events. Preserve and share memories for the future."
	/>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta
		name="keywords"
		content="time capsule, digital memories, memory preservation, future messages, event-based unlocking, location-based unlocking"
	/>
</svelte:head>

<Navigation />

{@render children?.()}

<Toaster
	toastOptions={{
		style:
			'background: rgba(17, 24, 39, 0.95); color: #f9fafb; border: 1px solid rgba(75, 85, 99, 0.3); backdrop-filter: blur(10px);',
		duration: 3000,
		position: 'bottom-center'
	}}
/>
