<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	import toast from 'svelte-french-toast';
	import { aiEnhancementService, type AIEnhancementResult } from '$lib/services/aiEnhancement';

	export let text: string = '';
	export let disabled: boolean = false;

	let isEnhancing = false;
	let enhancementProgress = 'Initializing...';

	const dispatch = createEventDispatcher<{
		enhanced: AIEnhancementResult;
	}>();

	async function enhanceWithAI() {
		if (!text.trim()) {
			toast.error('Please enter some text to enhance');
			return;
		}

		isEnhancing = true;
		enhancementProgress = 'Generating...';

		try {
			const result = await aiEnhancementService.enhanceText(text.trim(), (progress) => {
				enhancementProgress = progress.message;

				if (progress.status === 'completed' && progress.result) {
					dispatch('enhanced', progress.result);
					toast('Content generated successfully!', { icon: '✨' });
				} else if (progress.status === 'failed') {
					toast.error(progress.error || 'Generation failed');
				}
			});
		} catch (error) {
			console.error('Generation error:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to generate content';
			toast.error(errorMessage);
		} finally {
			isEnhancing = false;
		}
	}
</script>

<button
	type="button"
	onclick={enhanceWithAI}
	disabled={disabled || isEnhancing}
	class="inline-flex items-center gap-4 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:from-amber-600 hover:to-orange-600 focus:ring-2 focus:ring-amber-500 focus:outline-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
	title="Generate content with AI"
>
	{#if isEnhancing}
		<div class="h-4 w-4 animate-spin" in:scale={{ duration: 200 }}>
			<svg class="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
				></path>
			</svg>
		</div>
	{:else}
		<div class="h-4 w-4" in:scale={{ duration: 200 }}>
			<!-- Sparkle/AI icon -->
			<svg class="mx-auto h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
				<path d="M12 2l1.35 4.05L18 7.35 13.95 8.7 12 12.75 10.05 8.7 6 7.35l4.05-1.35L12 2z" />
			</svg>
		</div>
	{/if}

	{#if isEnhancing}
		<span class="text-sm" in:fade={{ duration: 200 }}>
			{enhancementProgress}
		</span>
	{:else}
		<span>Generate with AI</span>
	{/if}
</button>
