import type { RequestEvent } from '@sveltejs/kit';
import { Client, Account, Databases, Storage } from 'node-appwrite';
import { PUBLIC_APPWRITE_ENDPOINT, PUBLIC_APPWRITE_PROJECT_ID } from '$env/static/public';

export const SESSION_COOKIE = 'memory-capsule-session';

export function createSessionClient(event: RequestEvent) {
	const client = new Client()
		.setEndpoint(PUBLIC_APPWRITE_ENDPOINT)
		.setProject(PUBLIC_APPWRITE_PROJECT_ID);

	const session = event.cookies.get(SESSION_COOKIE);
	if (!session) {
		throw new Error('No session');
	}

	client.setSession(session);

	return {
		get account() {
			return new Account(client);
		},
		get databases() {
			return new Databases(client);
		},
		get storage() {
			return new Storage(client);
		}
	};
}

export function createAnonymousClient() {
	const client = new Client()
		.setEndpoint(PUBLIC_APPWRITE_ENDPOINT)
		.setProject(PUBLIC_APPWRITE_PROJECT_ID);

	return {
		get account() {
			return new Account(client);
		},
		get databases() {
			return new Databases(client);
		},
		get storage() {
			return new Storage(client);
		}
	};
}
