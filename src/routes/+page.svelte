<script lang="ts">
	import { loginAnonymously, loginWithOAuth } from '$lib/auth';
	import { user, isLoading } from '$lib/stores.js';
	import { OAuthProvider } from 'appwrite';
	import { goto } from '$app/navigation';
	import toast from 'svelte-french-toast';

	let isAuthenticating = false;

	async function handleAnonymousLogin() {
		isAuthenticating = true;

		const result = await loginAnonymously();

		if (result !== undefined && result.success) {
			goto('/dashboard');
		} else {
			toast.error('Login failed: ' + result.error);
		}
		isAuthenticating = false;
	}

	async function handleGitHubLogin() {
		isAuthenticating = true;
		const result = await loginWithOAuth(OAuthProvider.Github);
		// Don't redirect here - OAuth will handle the redirect to /dashboard
		if (result !== undefined && !result.success) {
			toast.error('GitHub login failed: ' + result.error);
		}
		isAuthenticating = false;
	}

	$: if ($user && !$isLoading) {
		goto('/dashboard');
	}
	// Redirect if already logged in
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4"
>
	<div class="w-full max-w-md space-y-6 sm:space-y-8">
		<div class="text-center">
			<h1 class="mb-2 text-3xl font-bold text-white sm:text-4xl">Memory Capsule</h1>
			<p class="mb-6 text-lg text-purple-200 sm:mb-8 sm:text-xl">
				Preserve memories across time and space
			</p>
		</div>

		<div class="rounded-2xl bg-white/10 p-6 shadow-2xl backdrop-blur-lg sm:p-8">
			<h2 class="mb-4 text-center text-xl font-semibold text-white sm:mb-6 sm:text-2xl">
				Enter the Time Capsule
			</h2>

			<div class="space-y-4">
				<button
					onclick={handleAnonymousLogin}
					disabled={isAuthenticating || $isLoading}
					class="w-full transform rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 font-semibold text-white transition-all duration-200 hover:scale-105 hover:from-purple-700 hover:to-pink-700 focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-50"
				>
					{#if isAuthenticating}
						Creating Anonymous Session...
					{:else}
						Start Anonymously
					{/if}
				</button>

				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-white/20"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="bg-transparent px-2 text-white/60">or</span>
					</div>
				</div>

				<button
					onclick={handleGitHubLogin}
					disabled={isAuthenticating || $isLoading}
					class="flex w-full items-center justify-center space-x-2 rounded-lg bg-gray-800 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:outline-none disabled:opacity-50"
				>
					<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
							clip-rule="evenodd"
						/>
					</svg>
					<span>Continue with GitHub</span>
				</button>
			</div>

			<p class="mt-4 text-center text-xs text-white/60 sm:mt-6 sm:text-sm">
				Create time capsules that unlock based on dates, locations, or special events
			</p>

			<div class="mt-3 text-center sm:mt-4">
				<a
					href="/capsule"
					class="text-xs text-purple-300 underline transition-colors duration-200 hover:text-purple-200 sm:text-sm"
				>
					Or explore public capsules from the community →
				</a>
			</div>
		</div>

		<div class="text-center">
			<p class="text-xs text-white/40 sm:text-sm">Part of the Appwrite Sites Hackathon 2025</p>
		</div>
	</div>
</div>
