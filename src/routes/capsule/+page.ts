export const prerender = false;
export const ssr = true;

// +page.ts
import type { PageLoad } from './$types';
import { DATABASE_ID, CAPSULES_TABLE_ID, tablesDB } from '$lib/appwrite';
import { Query } from 'appwrite';

export const load: PageLoad = async () => {
	try {
		const response = await tablesDB.listRows({
			databaseId: DATABASE_ID,
			tableId: CAPSULES_TABLE_ID,
			queries: [Query.equal('isPublic', true), Query.orderDesc('$createdAt'), Query.limit(50)]
		});

		return {
			publicCapsules: response.rows
		};
	} catch (error) {
		console.error('Failed to load public capsules:', error);
		return {
			publicCapsules: []
		};
	}
};
