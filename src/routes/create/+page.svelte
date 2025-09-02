<script lang="ts">
	import { user } from '$lib/stores';
	import { storage, DATABASE_ID, CAPSULES_TABLE_ID, BUCKET_ID, tablesDB } from '$lib/appwrite';
	import type { Capsule, UnlockType } from '$lib/appwrite';
	import { ID, Permission, Role } from 'appwrite';
	import { goto } from '$app/navigation';
	import { fade, slide, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import toast from 'svelte-french-toast';
	import AIEnhancer from '$lib/components/AIEnhancer.svelte';

	let title = '';
	let content = '';
	let unlockType: UnlockType = 'date';
	let unlockDate = '';
	let unlockEvent = '';
	let eventType = 'custom'; // 'birthday', 'holiday', 'milestone', 'custom'
	let predefinedEvent = '';
	let customEventName = ''; // For custom event names when predefined options have "custom" selected
	let unlockLatitude = '';
	let unlockLongitude = '';
	let unlockRadius = '5';
	let isPublic = false;
	let isCreating = false;
	let selectedFiles: File[] = [];

	// Location-related variables
	let isGettingLocation = false;
	let locationError = '';

	// Calculate metadata size for validation
	$: metadataSize = (() => {
		if (selectedFiles.length === 0) return 0;
		const metadata: { [key: string]: { name: string; type: string; size: number } } = {};
		selectedFiles.forEach((file, index) => {
			metadata[`file_${index}`] = {
				name: file.name,
				type: file.type,
				size: file.size
			};
		});
		return JSON.stringify(metadata).length;
	})();

	// Clear custom event name when changing event types or predefined events
	$: if (eventType !== 'custom' && predefinedEvent !== 'custom') {
		customEventName = '';
	}

	function handleAIEnhancement(event: CustomEvent<{ originalText: string; enhancedText: string }>) {
		const { enhancedText } = event.detail;
		content = enhancedText;
	}

	function handleTitleAIEnhancement(
		event: CustomEvent<{ originalText: string; enhancedText: string }>
	) {
		const { enhancedText } = event.detail;
		title = enhancedText;
		toast.success('Title updated with AI enhancement!');
	}

	async function handleSubmit() {
		if (!$user || !title.trim() || !content.trim()) {
			toast.error('Please fill in all required fields');
			return;
		}

		// Check metadata size before proceeding
		if (metadataSize > 2000) {
			toast.error(
				`Media metadata too large (${metadataSize} chars). Maximum allowed is 2000 characters. Try reducing filename lengths or number of files.`
			);
			return;
		}

		isCreating = true;

		try {
			// Prepare capsule data
			const capsuleData: Partial<Capsule> = {
				title: title.trim(),
				content: content.trim(), // Store content directly without encryption
				createdBy: $user.$id,
				unlockType,
				isPublic,
				isUnlocked: false,
				mediaFiles: []
			};

			// Set unlock conditions based on type
			switch (unlockType) {
				case 'date':
					if (!unlockDate) {
						toast.error('Please select an unlock date');
						isCreating = false;
						return;
					}
					capsuleData.unlockDate = unlockDate;
					break;
				case 'location':
					if (!unlockLatitude || !unlockLongitude) {
						toast.error('Please enter location coordinates');
						isCreating = false;
						return;
					}
					// Store as JSON string for Appwrite compatibility
					const radius = parseInt(unlockRadius) || 5;
					if (radius < 1 || radius > 100) {
						toast.error('Unlock radius must be between 1 and 100 meters');
						isCreating = false;
						return;
					}
					capsuleData.unlockLocation = JSON.stringify({
						latitude: parseFloat(unlockLatitude),
						longitude: parseFloat(unlockLongitude),
						radius: radius
					});
					break;
				case 'event':
					if (eventType === 'custom') {
						if (!customEventName.trim() || !unlockEvent.trim()) {
							toast.error('Please enter both event name and description');
							isCreating = false;
							return;
						}
						capsuleData.unlockEvent = `${customEventName.trim()}: ${unlockEvent.trim()}`;
					} else if (eventType === 'manual') {
						capsuleData.unlockEvent = 'Manual unlock only';
					} else {
						if (!predefinedEvent) {
							toast.error('Please select an event from the dropdown');
							isCreating = false;
							return;
						}

						// Handle custom options in predefined categories
						if (predefinedEvent === 'custom') {
							if (!customEventName.trim()) {
								toast.error('Please enter a custom event name');
								isCreating = false;
								return;
							}
							const eventDescription = unlockEvent.trim()
								? `${customEventName.trim()}: ${unlockEvent.trim()}`
								: customEventName.trim();
							capsuleData.unlockEvent = eventDescription;
						} else {
							const eventDescription =
								predefinedEvent + (unlockEvent.trim() ? ` - ${unlockEvent.trim()}` : '');
							capsuleData.unlockEvent = eventDescription;
						}
					}
					capsuleData.eventType = eventType;
					break;
			}

			// Upload files if any
			const mediaFileIds: string[] = [];
			const mediaMetadata: { [fileId: string]: { name: string; type: string; size: number } } = {};
			if (selectedFiles && selectedFiles.length > 0) {
				for (const file of selectedFiles) {
					try {
						const fileId = ID.unique();
						// Store metadata
						mediaMetadata[fileId] = {
							name: file.name,
							type: file.type,
							size: file.size
						};

						// Upload file directly without encryption
						await storage.createFile(BUCKET_ID, fileId, file);
						mediaFileIds.push(fileId);
					} catch (error) {
						console.error('Failed to upload file:', error);
					}
				}
			}
			capsuleData.mediaFiles = mediaFileIds;
			capsuleData.mediaMetadata = JSON.stringify(mediaMetadata);

			// Check if mediaMetadata exceeds the size limit
			if (capsuleData.mediaMetadata && capsuleData.mediaMetadata.length > 2000) {
				toast.error(
					`Media metadata too large (${capsuleData.mediaMetadata.length} chars). Maximum allowed is 2000 characters. Try reducing filename lengths or number of files.`
				);
				isCreating = false;
				return;
			}

			// Create capsule document
			const permissions = [
				Permission.read(Role.user($user.$id)),
				Permission.update(Role.user($user.$id)),
				Permission.delete(Role.user($user.$id))
			];

			if (isPublic) {
				permissions.push(Permission.read(Role.any()));
			}

			await tablesDB.createRow({
				databaseId: DATABASE_ID,
				tableId: CAPSULES_TABLE_ID,
				rowId: ID.unique(),
				data: capsuleData,
				permissions: permissions
			});

			toast.success('🎉 Capsule created successfully!');
			// Small delay to ensure toast is visible before navigation
			setTimeout(() => {
				goto('/dashboard');
			}, 500);
		} catch (error) {
			console.error('Failed to create capsule:', error);
			toast.error('Failed to create capsule. Please try again.');
		} finally {
			isCreating = false;
		}
	}

	function getCurrentDateTime() {
		const now = new Date();
		now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
		return now.toISOString().slice(0, 16);
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files) {
			// Add new files to existing selection instead of replacing
			const newFiles = Array.from(target.files);
			selectedFiles = [...selectedFiles, ...newFiles];
			// Clear the input so the same file can be selected again if needed
			target.value = '';
		}
	}

	function removeFile(index: number) {
		selectedFiles = selectedFiles.filter((_, i) => i !== index);
	}

	function clearAllFiles() {
		selectedFiles = [];
	}

	async function getCurrentLocation() {
		if (!navigator.geolocation) {
			locationError = 'Geolocation is not supported by this browser';
			return;
		}

		isGettingLocation = true;
		locationError = '';

		try {
			const position = await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 10000,
					maximumAge: 60000
				});
			});

			unlockLatitude = position.coords.latitude.toString();
			unlockLongitude = position.coords.longitude.toString();
			locationError = '';
		} catch (error) {
			console.error('Failed to get location:', error);
			if (error instanceof GeolocationPositionError) {
				switch (error.code) {
					case error.PERMISSION_DENIED:
						locationError = 'Location access denied. Please enable location permissions.';
						break;
					case error.POSITION_UNAVAILABLE:
						locationError = 'Location information is unavailable.';
						break;
					case error.TIMEOUT:
						locationError = 'Location request timed out.';
						break;
					default:
						locationError = 'An unknown error occurred while getting location.';
						break;
				}
			} else {
				locationError = 'Failed to get your location. Please try again.';
			}
		} finally {
			isGettingLocation = false;
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
	<!-- Main Content -->
	<main class="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
		<div class="mb-6 sm:mb-8" in:fade={{ duration: 400, delay: 100 }}>
			<h1 class="mb-2 text-2xl font-bold text-white sm:text-3xl">Create Time Capsule</h1>
			<p class="text-sm text-purple-200 sm:text-base">Preserve a memory for the future</p>
		</div>

		<form onsubmit={handleSubmit} class="space-y-4 sm:space-y-6">
			<div
				class="space-y-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm sm:space-y-6 sm:p-6"
				in:slide={{ duration: 500, delay: 200, easing: quintOut }}
			>
				<!-- Title -->
				<div>
					<div class="mb-2 flex items-center justify-between">
						<label for="title" class="block text-sm font-medium text-white"> Title * </label>
					</div>
					<input
						id="title"
						type="text"
						bind:value={title}
						placeholder="Give your capsule a memorable title"
						class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
						required
					/>
				</div>
				<!-- Content -->
				<div>
					<div class="mb-2 flex items-center justify-between">
						<label for="content" class="block text-sm font-medium text-white"> Content * </label>
						<div class="flex items-center gap-2">
							<AIEnhancer text={title} disabled={isCreating} on:enhanced={handleAIEnhancement} />
							<!-- Info icon with tooltip -->
							<div class="group relative">
								<div
									class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-300 transition-colors hover:bg-blue-500/30"
								>
									<svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
											clip-rule="evenodd"
										></path>
									</svg>
								</div>
								<!-- Tooltip -->
								<div
									class="absolute top-8 right-0 z-10 hidden w-64 rounded-lg bg-gray-900 p-3 text-xs text-white shadow-lg group-hover:block"
								>
									<p class="text-gray-300">
										Enter a title above, then click "Generate with AI" to automatically create
										content based on your title. The AI will expand your title into a full memory or
										story.
									</p>
								</div>
							</div>
						</div>
					</div>
					<textarea
						id="content"
						bind:value={content}
						placeholder="Write your message, memory, story or generate it with AI"
						rows="6"
						class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
						required
					></textarea>
				</div>

				<!-- Media Upload -->
				<div>
					<label for="media" class="mb-2 block text-sm font-medium text-white">
						Media Files (Optional)
					</label>
					<input
						id="media"
						type="file"
						multiple
						accept="image/*,video/*,audio/*"
						onchange={handleFileSelect}
						class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white file:mr-4 file:rounded-full file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"
					/>
					{#if selectedFiles && selectedFiles.length > 0}
						<div class="mt-3 space-y-2">
							<div class="flex items-center justify-between">
								<p class="text-sm text-purple-300">
									{selectedFiles.length} file(s) selected
								</p>
								<button
									type="button"
									onclick={clearAllFiles}
									class="text-xs text-red-400 transition-colors hover:text-red-300"
								>
									Clear all
								</button>
							</div>
							<!-- Metadata size indicator -->
							<div
								class="text-xs {metadataSize > 2000
									? 'text-red-400'
									: metadataSize > 1600
										? 'text-yellow-400'
										: 'text-gray-400'}"
							>
								Metadata size: {metadataSize}/2000 characters
								{#if metadataSize > 2000}
									<span class="font-semibold text-red-400">⚠️ Too large!</span>
								{:else if metadataSize > 1600}
									<span class="text-yellow-400">⚠️ Getting close</span>
								{/if}
							</div>
							<div class="max-h-32 space-y-1 overflow-y-auto">
								{#each selectedFiles as file, index}
									<div class="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
										<div class="min-w-0 flex-1">
											<p class="truncate text-sm text-white">{file.name}</p>
											<p class="text-xs text-purple-300">
												{file.type} • {(file.size / 1024 / 1024).toFixed(2)} MB
											</p>
										</div>
										<button
											type="button"
											onclick={() => removeFile(index)}
											class="ml-2 text-red-400 transition-colors hover:text-red-300"
											title="Remove file"
											aria-label="Remove file"
										>
											<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M6 18L18 6M6 6l12 12"
												></path>
											</svg>
										</button>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>

				<!-- Unlock Type -->
				<fieldset>
					<legend class="mb-3 block text-sm font-medium text-white"> Unlock Condition * </legend>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
						<label class="flex cursor-pointer items-center space-x-3">
							<input
								type="radio"
								bind:group={unlockType}
								value="date"
								class="text-purple-600 focus:ring-purple-500"
							/>
							<span class="text-white">Date</span>
						</label>
						<label class="flex cursor-pointer items-center space-x-3">
							<input
								type="radio"
								bind:group={unlockType}
								value="location"
								class="text-purple-600 focus:ring-purple-500"
							/>
							<span class="text-white">Location</span>
						</label>
						<label class="flex cursor-pointer items-center space-x-3">
							<input
								type="radio"
								bind:group={unlockType}
								value="event"
								class="text-purple-600 focus:ring-purple-500"
							/>
							<span class="text-white">Event</span>
						</label>
					</div>
				</fieldset>

				<!-- Unlock Conditions -->
				{#if unlockType === 'date'}
					<div in:slide={{ duration: 300, easing: quintOut }}>
						<label for="unlockDate" class="mb-2 block text-sm font-medium text-white">
							Unlock Date & Time *
						</label>
						<input
							id="unlockDate"
							type="datetime-local"
							bind:value={unlockDate}
							min={getCurrentDateTime()}
							class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
							required
						/>
					</div>
				{:else if unlockType === 'location'}
					<div class="space-y-4" in:slide={{ duration: 300, easing: quintOut }}>
						<div class="flex items-center justify-between">
							<h3 class="text-sm font-medium text-white">Location Coordinates</h3>
							<button
								type="button"
								onclick={getCurrentLocation}
								disabled={isGettingLocation}
								class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50"
							>
								{#if isGettingLocation}
									Getting Location...
								{:else}
									📍 Use Current Location
								{/if}
							</button>
						</div>

						{#if locationError}
							<div
								class="rounded-lg border border-red-600/30 bg-red-900/20 p-3"
								in:slide={{ duration: 200 }}
								out:slide={{ duration: 150 }}
							>
								<p class="text-sm text-red-300">❌ {locationError}</p>
							</div>
						{/if}

						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label for="latitude" class="mb-2 block text-sm font-medium text-white">
									Latitude *
								</label>
								<input
									id="latitude"
									type="number"
									step="any"
									bind:value={unlockLatitude}
									placeholder="e.g., 40.7128"
									class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
									required
								/>
							</div>
							<div>
								<label for="longitude" class="mb-2 block text-sm font-medium text-white">
									Longitude *
								</label>
								<input
									id="longitude"
									type="number"
									step="any"
									bind:value={unlockLongitude}
									placeholder="e.g., -74.0060"
									class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
									required
								/>
							</div>
						</div>
						<div>
							<label for="radius" class="mb-2 block text-sm font-medium text-white">
								Unlock Radius (meters) *
							</label>
							<input
								id="radius"
								type="number"
								min="1"
								max="100"
								bind:value={unlockRadius}
								class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
								required
							/>
							<p class="mt-1 text-xs text-purple-300">
								Must be between 1 and 100 meters for precise location unlocking
							</p>
						</div>
					</div>
				{:else if unlockType === 'event'}
					<div class="space-y-4" in:slide={{ duration: 300, easing: quintOut }}>
						<div>
							<label for="eventType" class="mb-2 block text-sm font-medium text-white">
								Event Type *
							</label>
							<select
								id="eventType"
								bind:value={eventType}
								class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
							>
								<option class="bg-black/70" value="custom">Custom Event</option>
								<option class="bg-black/70" value="birthday">Birthday/Anniversary</option>
								<option class="bg-black/70" value="holiday">Holiday/Celebration</option>
								<option class="bg-black/70" value="milestone">Personal Milestone</option>
								<option class="bg-black/70" value="manual">Manual Unlock Only</option>
							</select>
						</div>

						{#if eventType === 'birthday'}
							<div>
								<label for="predefinedEvent" class="mb-2 block text-sm font-medium text-white">
									Select Birthday/Anniversary *
								</label>
								<select
									id="predefinedEvent"
									bind:value={predefinedEvent}
									class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
								>
									<option class="bg-black/70" value="">Choose an occasion...</option>
									<option class="bg-black/70" value="my-birthday">My Birthday</option>
									<option class="bg-black/70" value="wedding-anniversary"
										>Wedding Anniversary</option
									>
									<option class="bg-black/70" value="relationship-anniversary"
										>Relationship Anniversary</option
									>
									<option class="bg-black/70" value="graduation-anniversary"
										>Graduation Anniversary</option
									>
									<option class="bg-black/70" value="custom">Custom Birthday/Anniversary</option>
								</select>
							</div>
							{#if predefinedEvent === 'custom'}
								<div>
									<label for="customEventName" class="mb-2 block text-sm font-medium text-white">
										Custom Event Name *
									</label>
									<input
										id="customEventName"
										type="text"
										bind:value={customEventName}
										placeholder="e.g., Sister's Birthday, Work Anniversary, etc."
										class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
										required
									/>
								</div>
							{/if}
						{:else if eventType === 'holiday'}
							<div>
								<label for="predefinedEvent" class="mb-2 block text-sm font-medium text-white">
									Select Holiday *
								</label>
								<select
									id="predefinedEvent"
									bind:value={predefinedEvent}
									class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
								>
									<option class="bg-black/70" value="">Choose a holiday...</option>
									<option class="bg-black/70" value="new-year">New Year's Day</option>
									<option class="bg-black/70" value="valentines">Valentine's Day</option>
									<option class="bg-black/70" value="christmas">Christmas</option>
									<option class="bg-black/70" value="thanksgiving">Thanksgiving</option>
									<option class="bg-black/70" value="halloween">Halloween</option>
									<option class="bg-black/70" value="independence-day">Independence Day</option>
									<option class="bg-black/70" value="custom">Custom Holiday</option>
								</select>
							</div>
							{#if predefinedEvent === 'custom'}
								<div>
									<label for="customEventName" class="mb-2 block text-sm font-medium text-white">
										Custom Holiday Name *
									</label>
									<input
										id="customEventName"
										type="text"
										bind:value={customEventName}
										placeholder="e.g., Diwali, Eid, Local Festival, etc."
										class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
										required
									/>
								</div>
							{/if}
						{:else if eventType === 'milestone'}
							<div>
								<label for="predefinedEvent" class="mb-2 block text-sm font-medium text-white">
									Select Milestone *
								</label>
								<select
									id="predefinedEvent"
									bind:value={predefinedEvent}
									class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
								>
									<option class="bg-black/70" value="">Choose a milestone...</option>
									<option class="bg-black/70" value="job-promotion">Job Promotion</option>
									<option class="bg-black/70" value="house-purchase">Bought a House</option>
									<option class="bg-black/70" value="graduation">Graduation</option>
									<option class="bg-black/70" value="retirement">Retirement</option>
									<option class="bg-black/70" value="first-child">First Child Born</option>
									<option class="bg-black/70" value="custom">Custom Milestone</option>
								</select>
							</div>
							{#if predefinedEvent === 'custom'}
								<div>
									<label for="customEventName" class="mb-2 block text-sm font-medium text-white">
										Custom Milestone Name *
									</label>
									<input
										id="customEventName"
										type="text"
										bind:value={customEventName}
										placeholder="e.g., Started Business, Ran Marathon, etc."
										class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
										required
									/>
								</div>
							{/if}
						{:else if eventType === 'manual'}
							<div class="rounded-lg border border-yellow-600/30 bg-yellow-900/20 p-4">
								<p class="text-sm text-yellow-200">
									🔐 This capsule will remain locked until you manually unlock it. Perfect for
									special moments you want to control precisely.
								</p>
							</div>
						{/if}

						{#if eventType !== 'manual'}
							{#if eventType === 'custom'}
								<div>
									<label for="customEventName" class="mb-2 block text-sm font-medium text-white">
										Event Name *
									</label>
									<input
										id="customEventName"
										type="text"
										bind:value={customEventName}
										placeholder="e.g., Solar Eclipse 2024, Company IPO, Book Launch"
										class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
										required
									/>
								</div>
							{/if}
							<div>
								<label for="unlockEvent" class="mb-2 block text-sm font-medium text-white">
									{eventType === 'custom' ? 'Event Description *' : 'Additional Notes (Optional)'}
								</label>
								<input
									id="unlockEvent"
									type="text"
									bind:value={unlockEvent}
									placeholder={eventType === 'custom'
										? 'Describe what makes this event special or when it will happen'
										: 'Add any specific details...'}
									class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-transparent focus:ring-2 focus:ring-purple-500 focus:outline-none"
									required={eventType === 'custom'}
								/>
							</div>
						{/if}

						<div class="rounded-lg border border-blue-600/30 bg-blue-900/20 p-4">
							<p class="text-sm text-blue-200">
								💡 <strong>How it works:</strong> Event-based capsules require manual unlocking. When
								the event occurs, you or others can unlock the capsule by clicking "I experienced this
								event" on the capsule page.
							</p>
						</div>
					</div>
				{/if}

				<!-- Privacy -->
				<div>
					<label class="flex cursor-pointer items-center space-x-3">
						<input
							type="checkbox"
							bind:checked={isPublic}
							class="rounded border-white/20 bg-white/10 text-purple-600 focus:ring-purple-500 focus:ring-offset-0"
						/>
						<span class="text-white">Make this capsule public</span>
					</label>
					<p class="mt-1 text-sm text-purple-300">
						Public capsules can be discovered by other users
					</p>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex justify-end space-x-4" in:fade={{ duration: 400, delay: 300 }}>
				<a
					href="/dashboard"
					class="rounded-lg border border-white/20 px-6 py-3 text-white transition-all duration-200 hover:scale-105 hover:bg-white/10 active:scale-95"
				>
					Cancel
				</a>
				<button
					type="submit"
					disabled={isCreating || metadataSize > 2000}
					class="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-white transition-all duration-200 hover:scale-105 hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 focus:outline-none active:scale-95 disabled:opacity-50"
					title={metadataSize > 2000 ? 'Cannot create capsule: metadata too large' : ''}
				>
					{#if isCreating}
						Creating Capsule...
					{:else}
						Create Capsule
					{/if}
				</button>
			</div>
		</form>
	</main>
</div>
