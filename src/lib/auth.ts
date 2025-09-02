import { account } from '$lib/appwrite';
import { user, isLoading } from '$lib/stores';
import { OAuthProvider } from 'appwrite';

export async function initAuth() {
	try {
		isLoading.set(true);
		const currentUser = await account.get();
		user.set(currentUser);
	} catch {
		user.set(null);
	} finally {
		isLoading.set(false);
	}
}

export async function loginAnonymously() {
	try {
		// Check if already logged in
		await account.createAnonymousSession();
		const currentUser = await account.get();
		user.set(currentUser);
		return { success: true, user: currentUser };
	} catch (error) {
		// Not logged in, create anonymous session
		console.warn('Anonymous login failed:', error);
		return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}

export async function loginWithOAuth(provider: OAuthProvider) {
	try {
		await account.createOAuth2Session(provider, window.location.origin, window.location.origin);
	} catch (error) {
		console.error('OAuth login failed:', error);
		return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}

export async function logout() {
	try {
		await account.deleteSession('current');
		user.set(null);
		return { success: true };
	} catch (error) {
		console.error('Logout failed:', error);
		return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}
