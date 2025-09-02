<script lang="ts">
	import { page } from '$app/stores';
	import { user } from '$lib/stores';
	import { tablesDB, storage, DATABASE_ID, CAPSULES_TABLE_ID, BUCKET_ID } from '$lib/appwrite';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { fade, scale, fly, slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import toast from 'svelte-french-toast';

	let capsule: any = null;
	let isLoading = true;
	let isUnlocking = false;
	let canUnlock = false;
	let unlockMessage = '';
	let unlockInstruction = ''; // Separate instruction for event-based capsules

	// Location-related variables
	let isCheckingLocation = false;
	let userLatitude: number | null = null;
	let userLongitude: number | null = null;
	let locationError = '';
	let showLocationChecker = false;
	let calculatedDistance: number | null = null;
	let requiredRadius: number | null = null;

	let mediaFiles: {
		id: string;
		url: string;
		type: string;
		isImage: boolean;
		isVideo: boolean;
		isAudio: boolean;
		originalName?: string;
	}[] = [];
	let loadingMedia = false;

	// Delete-related variables
	let isDeleting = false;
	let showDeleteConfirm = false;
	let showEventDetails = false;

	// Auto-focus action for modal
	function autoFocus(node: HTMLElement) {
		setTimeout(() => {
			node.focus();
		}, 50); // Small delay to ensure the element is fully rendered

		return {
			destroy() {
				// Cleanup if needed
			}
		};
	}

	const capsuleId = $page.params.id;

	async function loadCapsule() {
		if (!capsuleId) return;

		try {
			const response = await tablesDB.getRow({
				databaseId: DATABASE_ID,
				tableId: CAPSULES_TABLE_ID,
				rowId: capsuleId
			});

			capsule = response;
			checkUnlockStatus();

			// Load media files if capsule is unlocked
			if (capsule.isUnlocked || canUnlock) {
				await loadMediaFiles();
			}
		} catch (error) {
			console.error('Failed to load capsule:', error);
			toast.error('Failed to load capsule. Redirecting to dashboard...');
			goto('/dashboard');
		} finally {
			isLoading = false;
		}
	}

	function checkUnlockStatus() {
		if (!capsule) return;

		if (capsule.isUnlocked) {
			canUnlock = true;
			unlockMessage = 'This capsule is unlocked and ready to view!';
			return;
		}

		// Only the creator can unlock the capsule
		const isCreator = $user && capsule.createdBy === $user.$id;
		const now = new Date();

		switch (capsule.unlockType) {
			case 'date':
				const unlockDate = new Date(capsule.unlockDate);
				if (now >= unlockDate && isCreator) {
					canUnlock = true;
					unlockMessage = 'This capsule is ready to unlock!';
				} else if (now >= unlockDate && !isCreator) {
					canUnlock = false;
					unlockMessage = `This capsule unlocked on ${unlockDate.toLocaleDateString()}, but only the creator can unlock it.`;
				} else {
					canUnlock = false;
					unlockMessage = `This capsule will unlock on ${unlockDate.toLocaleDateString()}`;
				}
				break;
			case 'location':
				if (isCreator) {
					unlockMessage = 'This capsule unlocks at a specific location.';
					unlockInstruction = "Use the location checker below to see if you're in the right place.";
				} else {
					unlockMessage =
						'This capsule unlocks at a specific location. Only the creator can unlock it.';
					unlockInstruction = '';
				}
				canUnlock = false;
				break;
			case 'event':
				// Event-based capsules can always be unlocked manually by creator
				canUnlock = !!isCreator;
				if (capsule.eventType === 'manual') {
					if (isCreator) {
						unlockMessage = "This capsule can be unlocked manually when you're ready.";
						unlockInstruction = '';
					} else {
						unlockMessage = 'This capsule can be unlocked manually by the creator.';
						unlockInstruction = '';
					}
				} else {
					const eventInfo = formatEventDisplay(capsule.unlockEvent);
					unlockMessage = `Event: ${eventInfo.name}`;
					if (eventInfo.description) {
						unlockMessage += ` - ${eventInfo.description}`;
					}
					if (isCreator) {
						unlockInstruction = 'Click "I experienced this event" when it happens!';
					} else {
						unlockInstruction = 'Only the creator can unlock this capsule when the event happens.';
					}
				}
				break;
		}
	}

	async function unlockCapsule() {
		if (!capsule || !$user) return;

		// Only allow the creator to unlock the capsule
		if (capsule.createdBy !== $user.$id) {
			toast.error('Only the creator can unlock this capsule');
			return;
		}

		isUnlocking = true;
		try {
			// Update capsule as unlocked
			await tablesDB.updateRow({
				databaseId: DATABASE_ID,
				tableId: CAPSULES_TABLE_ID,
				rowId: capsule.$id,
				data: {
					isUnlocked: true
				}
			});

			capsule.isUnlocked = true;
			canUnlock = true;
			unlockMessage = 'Capsule unlocked successfully!';

			// Show success toast
			toast.success('🎉 Capsule unlocked successfully!');

			// Load media files after unlocking
			await loadMediaFiles();
		} catch (error) {
			console.error('Failed to unlock capsule:', error);
			toast.error('Failed to unlock capsule. Please try again.');
		} finally {
			isUnlocking = false;
		}
	}

	async function deleteCapsule() {
		if (!capsule || !$user || capsule.createdBy !== $user.$id) {
			toast.error('You can only delete your own capsules');
			return;
		}

		isDeleting = true;
		try {
			// Delete media files from storage first
			if (capsule.mediaFiles && capsule.mediaFiles.length > 0) {
				for (const fileId of capsule.mediaFiles) {
					try {
						await storage.deleteFile(BUCKET_ID, fileId);
					} catch (error) {
						console.error(`Failed to delete file ${fileId}:`, error);
						// Continue with other files even if one fails
					}
				}
			}

			// Delete the capsule document
			await tablesDB.deleteRow({
				databaseId: DATABASE_ID,
				tableId: CAPSULES_TABLE_ID,
				rowId: capsule.$id
			});

			toast.success('🗑️ Capsule deleted successfully!');
			// Small delay to ensure toast is visible before navigation
			setTimeout(() => {
				goto('/dashboard');
			}, 500);
		} catch (error) {
			console.error('Failed to delete capsule:', error);
			toast.error('Failed to delete capsule. Please try again.');
		} finally {
			isDeleting = false;
			showDeleteConfirm = false;
		}
	}

	function confirmDelete() {
		showDeleteConfirm = true;
	}

	function cancelDelete() {
		showDeleteConfirm = false;
	}

	// Location checking functions
	function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
		const R = 6371000; // Earth's radius in meters
		const φ1 = (lat1 * Math.PI) / 180;
		const φ2 = (lat2 * Math.PI) / 180;
		const Δφ = ((lat2 - lat1) * Math.PI) / 180;
		const Δλ = ((lon2 - lon1) * Math.PI) / 180;

		const a =
			Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
			Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
		const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

		return R * c; // Distance in meters
	}

	async function checkLocation() {
		if (!capsule || !capsule.unlockLocation) return;

		isCheckingLocation = true;
		locationError = '';

		try {
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				if (!navigator.geolocation) {
					reject(new Error('Geolocation is not supported by this browser'));
					return;
				}

				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 60000
				});
			});

			userLatitude = position.coords.latitude;
			userLongitude = position.coords.longitude;

			// Parse location data from JSON string
			const locationData = JSON.parse(capsule.unlockLocation);
			const targetLatitude = locationData.latitude;
			const targetLongitude = locationData.longitude;
			const radius = locationData.radius || 100;
			requiredRadius = radius;

			// Calculate distance from target location
			const distance = calculateDistance(
				userLatitude,
				userLongitude,
				targetLatitude,
				targetLongitude
			);

			calculatedDistance = distance;

			if (distance <= radius) {
				// User is within range, allow unlock
				canUnlock = true;
				unlockMessage = `You're within ${Math.round(distance)}m of the unlock location! You can now unlock this capsule.`;
				unlockInstruction = '';
			} else {
				unlockMessage = `You're ${Math.round(distance)}m away from the unlock location. You need to be within ${radius}m to unlock.`;
				unlockInstruction = 'Get closer to the target location and try again.';
			}
		} catch (error) {
			console.error('Failed to get location:', error);
			if (error instanceof Error) {
				locationError = error.message;
			} else {
				locationError =
					'Failed to get your location. Please enable location services and try again.';
			}
		} finally {
			isCheckingLocation = false;
		}
	}

	function toggleLocationChecker() {
		showLocationChecker = !showLocationChecker;
		if (showLocationChecker) {
			checkLocation();
		} else {
			// Reset location data when hiding the checker
			calculatedDistance = null;
			requiredRadius = null;
			userLatitude = null;
			userLongitude = null;
			locationError = '';
		}
	}

	async function loadMediaFiles() {
		if (!capsule || !capsule.mediaFiles || capsule.mediaFiles.length === 0) return;

		loadingMedia = true;
		mediaFiles = [];

		try {
			// Parse mediaMetadata from JSON string if it exists
			let parsedMetadata: any = {};
			if (capsule.mediaMetadata) {
				try {
					parsedMetadata = JSON.parse(capsule.mediaMetadata);
				} catch (error) {
					console.error('Failed to parse mediaMetadata:', error);
				}
			}

			for (const fileId of capsule.mediaFiles) {
				try {
					// Get file URL directly from storage using browser native APIs
					const fileUrl = storage.getFileView(BUCKET_ID, fileId);

					// Get metadata if available, otherwise derive from file
					const metadata = parsedMetadata[fileId];
					let originalName = metadata?.name || `file_${fileId}`;
					let originalType = metadata?.type || 'application/octet-stream';

					// If metadata is missing, try to get file info from storage
					if (!metadata) {
						try {
							const fileInfo = await storage.getFile(BUCKET_ID, fileId);
							originalName = fileInfo.name || originalName;
							originalType = fileInfo.mimeType || originalType;
						} catch (error) {
							console.log('Could not get file info, using defaults');
						}
					}

					// Determine file type for UI using browser native detection
					const isImage = originalType.startsWith('image/');
					const isVideo = originalType.startsWith('video/');
					const isAudio = originalType.startsWith('audio/');

					mediaFiles.push({
						id: fileId,
						url: fileUrl,
						type: originalType,
						isImage,
						isVideo,
						isAudio,
						originalName
					});
				} catch (error) {
					console.error(`Failed to load file ${fileId}:`, error);
				}
			}
		} catch (error) {
			console.error('Failed to load media files:', error);
		} finally {
			loadingMedia = false;
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
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

	onMount(() => {
		// Load capsule immediately regardless of user state
		loadCapsule();
	});

	// Also watch for user state changes to update unlock status
	$: if ($user !== undefined && capsule) {
		checkUnlockStatus();
	}

	onDestroy(() => {
		// Clean up blob URLs to prevent memory leaks (if any were created)
		mediaFiles.forEach((media) => {
			if (media.url && media.url.startsWith('blob:')) {
				URL.revokeObjectURL(media.url);
			}
		});
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
	<!-- Main Content -->
	<main class="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
		{#if isLoading}
			<div class="flex items-center justify-center py-12">
				<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-purple-500"></div>
			</div>
		{:else if capsule}
			<div class="space-y-6 sm:space-y-8">
				<!-- Capsule Header -->
				<div
					class="rounded-xl bg-white/10 p-4 backdrop-blur-sm sm:p-6"
					in:fade={{ duration: 400, delay: 100 }}
				>
					<div
						class="mb-4 flex flex-col space-y-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0"
					>
						<h1 class="pr-2 text-2xl font-bold text-white sm:text-3xl">{capsule.title}</h1>
						<div class="flex flex-shrink-0 items-center space-x-2 sm:space-x-3">
							<span
								class="rounded-full bg-purple-900/30 px-3 py-1 text-xs text-purple-300 sm:text-sm"
							>
								{capsule.unlockType}
							</span>
							<!-- Delete button - only show for creator -->
							{#if $user && capsule.createdBy === $user.$id}
								<button
									onclick={confirmDelete}
									class="cursor-pointer rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition-all duration-200 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none sm:text-sm"
									title="Delete this capsule"
								>
									Delete
								</button>
							{/if}
						</div>
					</div>

					<div class="grid grid-cols-1 gap-3 text-xs sm:gap-4 sm:text-sm md:grid-cols-2">
						<div class="space-y-2">
							<div class="flex justify-between">
								<span class="text-white/60">Created:</span>
								<span class="text-right text-purple-300">{formatDate(capsule.$createdAt)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-white/60">Visibility:</span>
								<span class="text-purple-300">{capsule.isPublic ? 'Public' : 'Private'}</span>
							</div>
						</div>

						<div class="space-y-2">
							<div class="flex justify-between">
								<span class="text-white/60">Status:</span>
								<span class="text-purple-300">{capsule.isUnlocked ? 'Unlocked' : 'Locked'}</span>
							</div>
							{#if capsule.unlockType === 'date' && capsule.unlockDate}
								<div class="flex justify-between">
									<span class="text-white/60">Unlock Date:</span>
									<span class="text-right text-purple-300">{formatDate(capsule.unlockDate)}</span>
								</div>
							{/if}
						</div>
					</div>

					{#if capsule.unlockType === 'event' && capsule.unlockEvent}
						{@const eventInfo = formatEventDisplay(capsule.unlockEvent)}
						<div
							class="my-5 rounded-xl bg-white/10 p-5 backdrop-blur-sm"
							in:fade={{ duration: 400, delay: 250 }}
						>
							<div class="mb-4 flex items-center justify-between">
								<h3 class="text-lg font-semibold text-white">Event Details</h3>
								<button
									onclick={() => (showEventDetails = !showEventDetails)}
									class="cursor-pointer rounded-lg border-2 border-gray-400 px-3 py-2 text-sm font-medium text-white duration-200 hover:border-gray-500"
								>
									{showEventDetails ? 'Hide Details' : 'Show Details'}
								</button>
							</div>

							<!-- Always show event name -->
							<div class="mb-3">
								<span class="text-sm text-white/60">Event:</span>
								<p class="font-medium text-purple-300">{eventInfo.name}</p>
							</div>

							<!-- Dropdown content -->
							{#if showEventDetails}
								<div
									class="space-y-3 border-t border-white/10 pt-3"
									in:slide={{ duration: 300 }}
									out:slide={{ duration: 250 }}
								>
									{#if eventInfo.description}
										<div>
											<span class="text-sm text-white/60">Description:</span>
											<p class="text-sm leading-relaxed text-purple-200">{eventInfo.description}</p>
										</div>
									{:else}
										<p class="text-sm text-white/40 italic">No additional description provided.</p>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Unlock Status -->
				{#if canUnlock && !capsule.isUnlocked}
					<div
						class="rounded-xl bg-white/10 p-6 backdrop-blur-sm transition-all duration-200"
						out:fade={{ duration: 400, delay: 200 }}
					>
						<div class="flex items-center justify-between">
							<h2 class="text-xl font-semibold text-white">Unlock Status</h2>
							<button
								onclick={unlockCapsule}
								disabled={isUnlocking}
								class="cursor-pointer rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-medium text-white transition-all duration-200 hover:scale-105 hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 focus:outline-none active:scale-95 disabled:opacity-50
								"
							>
								{#if isUnlocking}
									Unlocking...
								{:else if capsule.unlockType === 'event'}
									{capsule.eventType === 'manual' ? 'Unlock Now' : 'I Experienced This Event!'}
								{:else}
									Unlock Capsule
								{/if}
							</button>
						</div>
					</div>
				{/if}

				<!-- Location Checker for location-based capsules -->
				{#if capsule.unlockType === 'location' && $user && capsule.createdBy === $user.$id && !capsule.isUnlocked}
					<div
						class="rounded-xl bg-white/10 p-6 backdrop-blur-sm"
						in:fade={{ duration: 400, delay: 300 }}
					>
						<div class="mb-4 flex items-center justify-between">
							<h3 class="text-lg font-semibold text-white">Location Checker</h3>
							<button
								onclick={toggleLocationChecker}
								class="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none active:scale-95"
							>
								{showLocationChecker ? 'Hide Checker' : 'Check My Location'}
							</button>
						</div>

						{#if showLocationChecker}
							<div
								class="space-y-4"
								in:slide={{ duration: 300, easing: quintOut }}
								out:slide={{ duration: 250, easing: quintOut }}
							>
								<!-- Target Location Info -->
								{#if capsule.unlockLocation}
									{@const locationData = JSON.parse(capsule.unlockLocation)}
									<div class="rounded-lg border border-blue-600/30 bg-blue-900/20 p-4">
										<h4 class="mb-2 font-medium text-blue-200">Target Location:</h4>
										<div class="space-y-1 text-sm text-blue-100">
											<p>📍 Latitude: {locationData.latitude.toFixed(6)}</p>
											<p>📍 Longitude: {locationData.longitude.toFixed(6)}</p>
											<p>🎯 Required Range: {locationData.radius} meters</p>
										</div>
									</div>
								{/if}

								<!-- Location Check Status -->
								{#if isCheckingLocation}
									<div class="flex items-center justify-center py-4">
										<div class="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
										<span class="ml-3 text-blue-300">Getting your location...</span>
									</div>
								{:else if locationError}
									<div class="rounded-lg border border-red-600/30 bg-red-900/20 p-4">
										<p class="text-red-300">❌ {locationError}</p>
										<button
											onclick={checkLocation}
											class="mt-2 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
										>
											Try Again
										</button>
									</div>
								{:else if userLatitude !== null && userLongitude !== null}
									<div class="rounded-lg border border-green-600/30 bg-green-900/20 p-4">
										<h4 class="mb-2 font-medium text-green-200">Your Current Location:</h4>
										<div class="space-y-1 text-sm text-green-100">
											<p>📱 Latitude: {userLatitude.toFixed(6)}</p>
											<p>📱 Longitude: {userLongitude.toFixed(6)}</p>
										</div>
									</div>

									<!-- Distance Information -->
									{#if calculatedDistance !== null && requiredRadius !== null}
										<div class="rounded-lg border border-purple-600/30 bg-purple-900/20 p-4">
											<h4 class="mb-2 font-medium text-purple-200">Distance Analysis:</h4>
											<div class="space-y-2 text-sm">
												<div class="flex justify-between">
													<span class="text-purple-100">Current Distance:</span>
													<span class="font-medium text-purple-300"
														>{Math.round(calculatedDistance)}m</span
													>
												</div>
												<div class="flex justify-between">
													<span class="text-purple-100">Required Range:</span>
													<span class="font-medium text-purple-300">{requiredRadius}m</span>
												</div>
												<div class="flex justify-between">
													<span class="text-purple-100">Status:</span>
													{#if calculatedDistance <= requiredRadius}
														<span class="font-medium text-green-400">✅ In Range - Can Unlock!</span
														>
													{:else}
														<span class="font-medium text-orange-400"
															>🔒 Too Far - Need {Math.round(calculatedDistance - requiredRadius)}m
															closer</span
														>
													{/if}
												</div>
											</div>
										</div>
									{/if}
								{/if}

								<!-- Refresh Location Button -->
								<button
									onclick={checkLocation}
									disabled={isCheckingLocation}
									class="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-medium text-white transition-all duration-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
								>
									{isCheckingLocation ? 'Checking...' : 'Refresh My Location'}
								</button>
							</div>
						{/if}
					</div>
				{/if}

				{#if unlockInstruction}
					<p
						class="rounded-lg border border-yellow-600/30 bg-yellow-900/20 px-3 py-2 text-sm text-yellow-300"
					>
						💡 {unlockInstruction}
					</p>
				{/if}
				<!-- Capsule Content -->
				{#if canUnlock && capsule.isUnlocked}
					<div class="rounded-xl bg-white/10 p-6 backdrop-blur-sm">
						<h2 class="mb-4 text-xl font-semibold text-white">Capsule Contents</h2>

						<div class="prose prose-invert max-w-none rounded-lg bg-black/10 p-4">
							<div class="leading-relaxed whitespace-pre-wrap text-purple-100">
								{capsule.content}
							</div>
						</div>

						{#if capsule.mediaFiles && capsule.mediaFiles.length > 0}
							<div class="mt-6">
								<h3 class="mb-3 text-lg font-medium text-white">Media Files</h3>

								{#if loadingMedia}
									<div class="flex items-center justify-center py-8">
										<div
											class="h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500"
										></div>
										<span class="ml-2 text-purple-200">Loading media files...</span>
									</div>
								{:else}
									<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
										{#each mediaFiles as media}
											<div class="rounded-lg bg-white/5 p-4">
												{#if media.isImage && media.url}
													<div class="text-center">
														<div class="mb-2 overflow-hidden rounded-lg">
															<button
																type="button"
																onclick={() => window.open(media.url, '_blank')}
																class="block h-32 w-full"
															>
																<img
																	src={media.url}
																	alt="Capsule media"
																	class="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
																/>
															</button>
														</div>
														<p class="text-sm text-purple-300">Image</p>
														<p class="mt-1 text-xs text-white/60">{media.originalName}</p>
													</div>
												{:else if media.isVideo && media.url}
													<div class="text-center">
														<div class="mb-2 overflow-hidden rounded-lg">
															<video
																src={media.url}
																controls
																class="h-32 w-full rounded object-cover"
																preload="metadata"
															>
																<track kind="captions" />
															</video>
														</div>
														<p class="text-sm text-purple-300">Video</p>
														<p class="mt-1 text-xs text-white/60">{media.originalName}</p>
													</div>
												{:else if media.isAudio && media.url}
													<div class="text-center">
														<div
															class="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-lg bg-green-600"
														>
															<svg
																class="h-8 w-8 text-white"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2"
																	d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
																></path>
															</svg>
														</div>
														<audio controls class="w-full">
															<source src={media.url} type={media.type} />
															Your browser does not support the audio element.
														</audio>
														<p class="mt-2 text-sm text-purple-300">Audio</p>
														<p class="mt-1 text-xs text-white/60">{media.originalName}</p>
													</div>
												{:else}
													<div class="text-center">
														<div
															class="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-lg bg-purple-600"
														>
															<svg
																class="h-8 w-8 text-white"
																fill="none"
																stroke="currentColor"
																viewBox="0 0 24 24"
															>
																<path
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	stroke-width="2"
																	d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
																></path>
															</svg>
														</div>
														{#if media.url}
															<a
																href={media.url}
																download={media.originalName}
																class="text-sm text-purple-300 underline hover:text-purple-200"
															>
																Download File
															</a>
														{:else}
															<p class="text-sm text-purple-300">Decrypted File</p>
														{/if}
														<p class="mt-1 text-xs text-white/60">{media.originalName}</p>
													</div>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{:else}
					<div class="rounded-xl bg-white/10 p-6 text-center backdrop-blur-sm">
						<div
							class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-600/20"
						>
							<svg
								class="h-8 w-8 text-purple-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								></path>
							</svg>
						</div>
						<h3 class="mb-2 text-xl font-semibold text-white">Capsule Locked</h3>
						<p class="mb-3 text-purple-200">
							This capsule is not yet ready to be unlocked. Check back when the unlock conditions
							are met.
						</p>
						<div class="rounded-lg border border-blue-600/30 bg-blue-900/20 p-3">
							<p class="text-sm text-blue-200">
								💡 <strong>What you can see:</strong> Title, description, unlock conditions, and
								creation details are always visible.
								<br />
								<strong>What's hidden:</strong> The main content and any attached media files will only
								be revealed once unlocked.
							</p>
						</div>
					</div>
				{/if}
			</div>
		{/if}
	</main>

	<!-- Delete Confirmation Modal -->
	{#if showDeleteConfirm}
		<div
			use:autoFocus
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-labelledby="delete-modal-title"
			onkeydown={(e) => {
				if (e.key === 'Escape') {
					showDeleteConfirm = false;
					cancelDelete();
				}
			}}
			tabindex="-1"
		>
			<div class="mx-4 w-full max-w-md rounded-xl bg-slate-900 p-6 shadow-2xl">
				<div class="mb-4 text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-600/20"
					>
						<svg class="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							></path>
						</svg>
					</div>
					<h3 class="text-xl font-semibold text-white" id="delete-modal-title">Delete Capsule</h3>
					<p class="mt-2 text-sm text-red-300">
						Are you sure you want to delete "{capsule?.title}"? This action cannot be undone and all
						associated media files will be permanently deleted.
					</p>
				</div>

				<div class="flex space-x-3">
					<button
						onclick={cancelDelete}
						disabled={isDeleting}
						class="flex-1 rounded-lg border border-white/20 px-4 py-3 text-white transition-all duration-200 hover:bg-white/10 focus:ring-2 focus:ring-white/20 focus:outline-none disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						onclick={deleteCapsule}
						disabled={isDeleting}
						class="flex-1 rounded-lg bg-red-600 px-4 py-3 text-white transition-all duration-200 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none disabled:opacity-50"
					>
						{#if isDeleting}
							Deleting...
						{:else}
							Delete Forever
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
