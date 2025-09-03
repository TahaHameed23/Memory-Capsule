<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import binaryIcon from '$lib/assets/binary-svgrepo-com.svg';
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

<!-- Built with badge -->
<div class="fixed right-4 bottom-4 z-50">
	<a
		href="https://github.com/TahaHameed23"
		target="_blank"
		rel="noopener noreferrer"
		class="group flex items-center gap-2 rounded-full bg-black/20 px-3 py-2 text-xs text-white/70 backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-black/30 hover:text-white/90"
	>
		<span class="text-xs font-medium">built with</span>
		<!-- Binary SVG from assets -->
		<img
			src={binaryIcon}
			alt="Binary"
			class="h-6 w-6 brightness-0 invert transition-transform duration-200 group-hover:scale-105"
		/>
		<span class="text-xs">by</span>
		<span class="text-xs font-semibold text-blue-300">@TahaHameed23</span>
	</a>
</div>

<Toaster
	toastOptions={{
		style:
			'background: rgba(17, 24, 39, 0.95); color: #f9fafb; border: 1px solid rgba(75, 85, 99, 0.3); backdrop-filter: blur(10px);',
		duration: 3000,
		position: 'bottom-center'
	}}
/>
