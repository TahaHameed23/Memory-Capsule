<script lang="ts">
	import { user, capsules, isLoading } from '$lib/stores.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { DATABASE_ID, CAPSULES_TABLE_ID, tablesDB } from '$lib/appwrite.js';
	import { Query } from 'appwrite';
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import toast from 'svelte-french-toast';

	let loadingCapsules = true;

	async function loadCapsules() {
		if (!$user) return;

		try {
			const response = await tablesDB.listRows({
				databaseId: DATABASE_ID,
				tableId: CAPSULES_TABLE_ID,
				queries: [
					Query.equal('createdBy', $user.$id),
					Query.orderDesc('$createdAt'),
					Query.limit(10)
				]
			});

			// Use content directly without decryption
			capsules.set(response.rows as any);
		} catch (error) {
			console.error('Failed to load capsules:', error);
		} finally {
			loadingCapsules = false;
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatEventDisplay(unlockEvent: string): { name: string; description: string } {
		if (!unlockEvent) return { name: 'Unknown Event', description: '' };

		// Check if it's in the format "Name: Description"
		const colonIndex = unlockEvent.indexOf(': ');
		if (colonIndex !== -1) {
			return {
				name: unlockEvent.substring(0, colonIndex),
				description: unlockEvent.substring(colonIndex + 2)
			};
		}

		// Check if it's in the format "Name - Description"
		const dashIndex = unlockEvent.indexOf(' - ');
		if (dashIndex !== -1) {
			return {
				name: unlockEvent.substring(0, dashIndex),
				description: unlockEvent.substring(dashIndex + 3)
			};
		}

		// If no separator found, treat the whole thing as name
		return { name: unlockEvent, description: '' };
	}

	function truncateText(text: string, maxLength: number): string {
		if (text.length <= maxLength) return text;
		return text.substring(0, maxLength) + '...';
	}

	function getUnlockStatus(capsule: any) {
		return capsule.isUnlocked ? 'Unlocked' : 'Locked';
	}

	onMount(() => {
		if ($user) {
			loadCapsules();
		}
	});

	$: if ($user && !$isLoading) {
		loadCapsules();
	}

	// Redirect to home if user is not authenticated (only after auth loading is complete)
	$: if ($user === null && !$isLoading) {
		toast.error('Login required to access dashboard');
		goto('/');
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
	<!-- Main Content -->
	<main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
		<div class="mb-6 sm:mb-8" in:fade={{ duration: 400, delay: 100 }}>
			<h2 class="mb-2 text-2xl font-bold text-white sm:text-3xl">Your Time Capsules</h2>
			<p class="text-sm text-purple-200 sm:text-base">Memories preserved across time and space</p>
		</div>

		{#if loadingCapsules}
			<div class="flex items-center justify-center py-12">
				<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-500"></div>
			</div>
		{:else if $capsules.length === 0}
			<div class="py-12 text-center" in:fade={{ duration: 500, delay: 200 }}>
				<div
					class="mx-auto max-w-md rounded-2xl bg-white/5 p-8 backdrop-blur-sm"
					in:scale={{ duration: 400, delay: 300, easing: quintOut }}
				>
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600"
					>
						<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							></path>
						</svg>
					</div>
					<h3 class="mb-2 text-xl font-semibold text-white">No capsules yet</h3>
					<p class="mb-6 text-purple-200">
						Create your first time capsule to preserve a memory for the future
					</p>
					<a
						href="/create"
						class="inline-block rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:from-purple-700 hover:to-pink-700"
					>
						Create Your First Capsule
					</a>
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
				{#each $capsules as capsule, i}
					<a
						href="/capsule/{capsule.$id}"
						class="block cursor-pointer rounded-xl bg-white/10 p-4 backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white/15 sm:p-6"
						in:scale={{ duration: 300, delay: 200 + i * 50, easing: quintOut }}
					>
						<div class="mb-3 flex items-start justify-between sm:mb-4">
							<h3 class="mr-2 truncate text-base font-semibold text-white sm:text-lg">
								{capsule.title}
							</h3>
							<span
								class="rounded bg-purple-900/30 px-2 py-1 text-xs whitespace-nowrap text-purple-300"
							>
								{capsule.unlockType}
							</span>
						</div>

						<p class="mb-3 line-clamp-3 text-xs text-purple-200 sm:mb-4 sm:text-sm">
							{capsule.isUnlocked
								? capsule.content.length > 80
									? capsule.content.substring(0, 80) + '...'
									: capsule.content
								: ''}
						</p>

						<div class="space-y-1 sm:space-y-2">
							<div class="flex items-center justify-between text-xs sm:text-sm">
								<span class="text-white/60">Status:</span>
								<span class="text-purple-300">
									{getUnlockStatus(capsule)}
								</span>
							</div>

							<div class="flex items-center justify-between text-xs sm:text-sm">
								<span class="text-white/60">Created:</span>
								<span class="text-right text-purple-300">
									{formatDate((capsule as any).$createdAt)}
								</span>
							</div>

							<div class="flex items-center justify-between text-xs sm:text-sm">
								<span class="text-white/60">Visibility:</span>
								<span class="text-green-300">{capsule.isPublic ? 'Public' : 'Private'}</span>
							</div>
						</div>

						<div class="mt-3 border-t border-white/10 pt-3 sm:mt-4 sm:pt-4">
							<span
								class="text-xs font-medium text-purple-300 transition-colors duration-200 hover:text-purple-200 sm:text-sm"
							>
								View Details →
							</span>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</main>
</div>
