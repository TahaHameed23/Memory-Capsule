import { Client, Account, Databases, Storage, Functions, TablesDB } from 'appwrite';
import { PUBLIC_APPWRITE_ENDPOINT, PUBLIC_APPWRITE_PROJECT_ID } from '$env/static/public';

export const client = new Client()
	.setEndpoint(PUBLIC_APPWRITE_ENDPOINT)
	.setProject(PUBLIC_APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const tablesDB = new TablesDB(client);
export const functions = new Functions(client);

// Database and Collection IDs
export const DATABASE_ID = 'memory-capsules-db';
export const CAPSULES_TABLE_ID = 'capsules';
export const BUCKET_ID = 'capsule-media';

export type UnlockType = 'date' | 'location' | 'event';

export interface Capsule {
	$id?: string;
	title: string;
	content: string;
	createdBy: string;
	unlockType: UnlockType;
	unlockDate?: string;
	unlockLocation?: string; // JSON string format: {"latitude": number, "longitude": number, "radius": number}
	unlockEvent?: string;
	eventType?: string; // Type of event: 'custom', 'birthday', 'holiday', 'milestone', 'manual'
	isPublic: boolean;
	mediaFiles?: string[]; // File IDs from storage
	mediaMetadata?: string; // JSON string format: { [fileId: string]: { name: string; type: string; size: number } }
	isUnlocked?: boolean;
	tags?: string[];
	collaborators?: string[];
	createdAt?: string;
	updatedAt?: string;
}
