<script lang="ts">
	import { user, isLoading } from '$lib/stores.js';
	import { goto } from '$app/navigation';
	import { fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	import type { PageProps } from './$types';

	import {
		formatDate,
		formatEventDisplay,
		truncateText,
		getUnlockStatus,
		getStatusColor
	} from '$lib/utils/capsule';

	// Data from +page.ts
	let { data }: PageProps = $props();

	let publicCapsules = data.publicCapsules;
	let searchQuery = $state('');
	let selectedUnlockType = $state('all');
	let loadingCapsules = false;
	let filteredCapsules: any[] = $state([]);

	function handleLogin() {
		goto('/');
	}

	// Reactive filtering
	$effect(() => {
		filteredCapsules = publicCapsules.filter((capsule) => {
			const matchesSearch =
				searchQuery.trim() === '' ||
				capsule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(capsule.content && capsule.content.toLowerCase().includes(searchQuery.toLowerCase()));

			const matchesType = selectedUnlockType === 'all' || capsule.unlockType === selectedUnlockType;

			return matchesSearch && matchesType;
		});
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
	<!-- Main Content -->
	<main class="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
		<!-- Header -->
		<div class="mb-6 text-center sm:mb-8" in:fade={{ duration: 500, delay: 100 }}>
			<h2 class="mb-3 text-3xl font-bold text-white sm:mb-4 sm:text-4xl">Discover Time Capsules</h2>
			<p class="mx-auto max-w-2xl text-lg text-purple-200 sm:text-xl">
				Explore memories shared by the community. Each capsule contains stories, moments, and
				treasures from the past, waiting to be unlocked.
			</p>
		</div>

		<!-- Search and Filters -->
		<div
			class="mb-6 rounded-xl bg-white/10 p-4 backdrop-blur-sm sm:mb-8 sm:p-6"
			in:fade={{ duration: 400, delay: 200 }}
		>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
				<!-- Search -->
				<div class="md:col-span-2">
					<label for="search" class="mb-2 block text-sm font-medium text-white">
						Search Capsules
					</label>
					<input
						id="search"
						type="text"
						bind:value={searchQuery}
						placeholder="Search by title or content..."
						class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
					/>
				</div>

				<!-- Filter by unlock type -->
				<div>
					<label for="unlockType" class="mb-2 block text-sm font-medium text-white">
						Filter by Type
					</label>
					<select
						id="unlockType"
						bind:value={selectedUnlockType}
						class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
					>
						<option class="bg-black/70" value="all">All Types</option>
						<option class="bg-black/70" value="date">Date-based</option>
						<option class="bg-black/70" value="location">Location-based</option>
						<option class="bg-black/70" value="event">Event-based</option>
					</select>
				</div>
			</div>
		</div>

		<!-- Results Summary -->
		{#if !loadingCapsules}
			<div class="mb-6">
				<p class="text-purple-200">
					{#if searchQuery || selectedUnlockType !== 'all'}
						Showing {filteredCapsules.length} of {publicCapsules.length} capsules
					{:else}
						{publicCapsules.length} public capsules found
					{/if}
				</p>
			</div>
		{/if}

		<!-- Capsules Grid -->
		{#if loadingCapsules}
			<div class="flex items-center justify-center py-12">
				<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-500"></div>
			</div>
		{:else if filteredCapsules.length === 0}
			<div class="py-12 text-center">
				<div class="mx-auto max-w-md rounded-2xl bg-white/5 p-8 backdrop-blur-sm">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600"
					>
						<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
							></path>
						</svg>
					</div>
					<h3 class="mb-2 text-xl font-semibold text-white">No capsules found</h3>
					<p class="mb-6 text-purple-200">
						{#if searchQuery || selectedUnlockType !== 'all'}
							Try adjusting your search or filters
						{:else}
							No public capsules have been created yet
						{/if}
					</p>
					{#if !$user && !$isLoading}
						<button
							onclick={handleLogin}
							class="inline-block rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:from-purple-700 hover:to-pink-700"
						>
							Create the First Capsule
						</button>
					{/if}
				</div>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each filteredCapsules as capsule, i}
					<a
						href="/capsule/{capsule.$id}"
						data-sveltekit-preload-data="false"
						class="block transform cursor-pointer rounded-xl bg-white/10 p-6 backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white/15"
						in:scale={{ duration: 300, delay: 300 + i * 50, easing: quintOut }}
					>
						<div class="mb-4 flex items-start justify-between">
							<h3 class="mr-2 truncate text-lg font-semibold text-white">
								{capsule.title}
							</h3>
							<div class="flex flex-col items-end space-y-1">
								<span class="rounded bg-purple-900/30 px-2 py-1 text-xs text-purple-300">
									{capsule.unlockType}
								</span>
								<span class="text-xs {getStatusColor(capsule)}"> ● </span>
							</div>
						</div>

						<p class="mb-4 line-clamp-3 text-sm text-purple-200">
							{#if capsule.isUnlocked}
								{capsule.content.length > 150
									? capsule.content.substring(0, 150) + '...'
									: capsule.content}
							{:else}
								🔒 This capsule is locked. Click to see if you can unlock it!
							{/if}
						</p>

						<div class="space-y-2">
							<div class="flex items-center justify-between text-sm">
								<span class="text-white/60">Status:</span>
								<span class={getStatusColor(capsule)}>
									{getUnlockStatus(capsule)}
								</span>
							</div>

							{#if capsule.unlockType === 'event' && capsule.unlockEvent && capsule.eventType !== 'manual'}
								{@const eventInfo = formatEventDisplay(capsule.unlockEvent)}
								<div class="space-y-2 rounded-lg bg-white/5 p-3">
									<div class="flex items-start justify-between text-sm">
										<span class="flex-shrink-0 text-white/60">Event:</span>
										<span class="text-right font-medium text-purple-300">
											{truncateText(eventInfo.name, 25)}
										</span>
									</div>
									{#if eventInfo.description}
										<div class="text-xs text-purple-400" title={eventInfo.description}>
											<span class="text-white/40">Description:</span>
											<div class="mt-1 leading-relaxed">
												{truncateText(eventInfo.description, 80)}
											</div>
										</div>
									{/if}
								</div>
							{/if}

							<div class="flex items-center justify-between text-sm">
								<span class="text-white/60">Created:</span>
								<span class="text-purple-300">
									{formatDate(capsule.$createdAt)}
								</span>
							</div>

							{#if capsule.mediaFiles && capsule.mediaFiles.length > 0}
								<div class="flex items-center justify-between text-sm">
									<span class="text-white/60">Media:</span>
									<span class="text-purple-300">
										{capsule.mediaFiles.length} file{capsule.mediaFiles.length !== 1 ? 's' : ''}
									</span>
								</div>
							{/if}
						</div>

						<div class="mt-4 border-t border-white/10 pt-4">
							<span
								class="text-sm font-medium text-purple-300 transition-colors duration-200 hover:text-purple-200"
							>
								{capsule.isUnlocked ? 'View Contents' : 'Try to Unlock'} →
							</span>
						</div>
					</a>
				{/each}
			</div>
		{/if}

		<!-- Call to Action -->
		{#if !$user && !$isLoading && publicCapsules.length > 0}
			<div class="mt-12 text-center">
				<div
					class="rounded-2xl bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-8 backdrop-blur-sm"
				>
					<h3 class="mb-4 text-2xl font-bold text-white">Create Your Own Time Capsule</h3>
					<p class="mx-auto mb-6 max-w-2xl text-purple-200">
						Join the community and preserve your own memories for the future. Create capsules that
						unlock based on dates, locations, or special events.
					</p>
					<button
						onclick={handleLogin}
						class="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-lg font-medium text-white transition-all duration-200 hover:from-purple-700 hover:to-pink-700"
					>
						Start Creating Capsules
					</button>
				</div>
			</div>
		{/if}
	</main>
</div>
