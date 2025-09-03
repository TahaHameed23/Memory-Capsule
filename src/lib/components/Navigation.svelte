<script lang="ts">
	import { user } from '$lib/stores.js';
	import { logout } from '$lib/auth.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import favicon from '$lib/assets/favicon.svg';
	let isMenuOpen = false;

	async function handleLogout() {
		const result = await logout();
		if (result.success) {
			goto('/');
		}
	}

	function toggleMenu() {
		isMenuOpen = !isMenuOpen;
	}

	function closeMenu() {
		isMenuOpen = false;
	}

	// Close menu when clicking outside or on navigation
	function handleNavClick() {
		closeMenu();
	}

	$: currentPath = $page.url.pathname;
	$: showNavigation = currentPath !== '/';
</script>

{#if showNavigation}
	<nav class="border-b border-white/10 bg-slate-950 shadow-lg">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="flex h-16 items-center justify-between">
				<!-- Logo/Brand -->
				<div class="flex items-center">
					<a href={$user ? '/dashboard' : '/'} class="flex items-center space-x-2">
						<div class="flex h-8 w-8 items-center justify-center rounded-full">
							<img src={favicon} alt="Logo" class="h-15 w-15 rounded-full" />
						</div>
						<span class="text-xl font-bold text-white">Memory Capsule</span>
					</a>
				</div>

				<!-- Desktop Navigation -->
				<div class="hidden md:flex md:items-center md:space-x-6">
					{#if $user}
						<a
							href="/dashboard"
							class="px-3 py-2 text-sm font-medium transition-colors duration-200 {currentPath ===
							'/dashboard'
								? 'text-white underline decoration-2 underline-offset-4'
								: 'text-purple-200 hover:text-white'}"
							onclick={handleNavClick}
						>
							My Capsules
						</a>
						<a
							href="/capsule"
							class="px-3 py-2 text-sm font-medium transition-colors duration-200 {currentPath ===
							'/capsule'
								? 'text-white underline decoration-2 underline-offset-4'
								: 'text-purple-200 hover:text-white'}"
							onclick={handleNavClick}
						>
							Public Capsules
						</a>
						<a
							href="/create"
							class="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:from-purple-700 hover:to-pink-700"
							onclick={handleNavClick}
						>
							Create Capsule
						</a>
						<div class="flex items-center space-x-4">
							<span class="text-sm text-purple-200">
								{$user.name || 'Anonymous User'}
							</span>
							<button
								onclick={handleLogout}
								class="cursor-pointer rounded text-sm text-white/70 transition-colors duration-200 hover:text-white"
							>
								Logout
							</button>
						</div>
					{:else}
						<a
							href="/capsule"
							class="px-3 py-2 text-sm font-medium transition-colors duration-200 {currentPath ===
							'/capsule'
								? 'text-white'
								: 'text-purple-200 hover:text-white'}"
							onclick={handleNavClick}
						>
							Public Capsules
						</a>
						<a
							href="/"
							class="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:from-purple-700 hover:to-pink-700"
							onclick={handleNavClick}
						>
							Join Memory Capsule
						</a>
					{/if}
				</div>

				<!-- Mobile menu button -->
				<div class="md:hidden">
					<button
						onclick={toggleMenu}
						class="inline-flex items-center justify-center rounded-md p-2 text-purple-200 transition-all duration-200 hover:bg-white/10 hover:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
						aria-expanded={isMenuOpen}
					>
						<span class="sr-only">Open main menu</span>
						<div class="relative h-6 w-6">
							{#if !isMenuOpen}
								<!-- Hamburger icon -->
								<svg
									class="absolute inset-0 h-6 w-6 transition-all duration-300 ease-in-out"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									style="opacity: 1; transform: rotate(0deg)"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M4 6h16M4 12h16M4 18h16"
									></path>
								</svg>
							{:else}
								<!-- Close icon -->
								<svg
									class="absolute inset-0 h-6 w-6 transition-all duration-300 ease-in-out"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									style="opacity: 1; transform: rotate(180deg)"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									></path>
								</svg>
							{/if}
						</div>
					</button>
				</div>
			</div>
		</div>

		<!-- Mobile menu -->
		{#if isMenuOpen}
			<div class="md:hidden" transition:slide={{ duration: 300, easing: quintOut }}>
				<div class="border-t border-white/10 bg-black/30 px-2 pt-2 pb-3 shadow-xl backdrop-blur-sm">
					{#if $user}
						<div class="mb-3 border-b border-white/10 px-3 py-2">
							<span class="text-sm font-medium text-purple-200">
								{$user.name || 'Anonymous User'}
							</span>
						</div>
						<a
							href="/dashboard"
							class="block rounded-md px-3 py-2 text-base font-medium transition-all duration-200 {currentPath ===
							'/dashboard'
								? 'bg-white/20 text-white shadow-sm'
								: 'text-purple-200 hover:bg-white/10 hover:text-white'}"
							onclick={handleNavClick}
						>
							My Capsules
						</a>
						<a
							href="/capsule"
							class="block rounded-md px-3 py-2 text-base font-medium transition-all duration-200 {currentPath ===
							'/capsule'
								? 'bg-white/20 text-white shadow-sm'
								: 'text-purple-200 hover:bg-white/10 hover:text-white'}"
							onclick={handleNavClick}
						>
							Public Capsules
						</a>
						<a
							href="/create"
							class="block rounded-md px-3 py-2 text-base font-medium transition-all duration-200 {currentPath ===
							'/create'
								? 'bg-white/20 text-white shadow-sm'
								: 'text-purple-200 hover:bg-white/10 hover:text-white'}"
							onclick={handleNavClick}
						>
							Create Capsule
						</a>
						<button
							onclick={() => {
								handleLogout();
								closeMenu();
							}}
							class="mt-2 block w-full rounded-md border-t border-white/10 px-3 py-2 pt-4 text-left text-base font-medium text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
						>
							Logout
						</button>
					{:else}
						<a
							href="/capsule"
							class="block rounded-md px-3 py-2 text-base font-medium transition-all duration-200 {currentPath ===
							'/capsule'
								? 'bg-white/20 text-white shadow-sm'
								: 'text-purple-200 hover:bg-white/10 hover:text-white'}"
							onclick={handleNavClick}
						>
							Public Capsules
						</a>
						<a
							href="/"
							class="block rounded-md px-3 py-2 text-base font-medium text-purple-200 transition-all duration-200 hover:bg-white/10 hover:text-white"
							onclick={handleNavClick}
						>
							Join Memory Capsule
						</a>
					{/if}
				</div>
			</div>
		{/if}
	</nav>
{/if}
