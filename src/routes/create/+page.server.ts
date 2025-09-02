import { functions } from '$lib/appwrite';
import { PRIVATE_APPWRITE_FUNCTION_ID } from '$env/static/private';
import type { Actions } from './$types';
import { ExecutionMethod } from 'appwrite';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
	enhanceContent: async ({ request }) => {
		try {
			const data = await request.formData();
			const text = data.get('text') as string;

			if (!text) {
				return fail(400, { error: 'Text is required' });
			}

			const execution = await functions.createExecution({
				functionId: PRIVATE_APPWRITE_FUNCTION_ID,
				body: JSON.stringify({ text }),
				async: false, // Wait for the function to complete
				method: ExecutionMethod.POST
			});

			// Parse the response
			const result = JSON.parse(execution.responseBody);

			if (result.error) {
				return fail(500, { error: result.error });
			}

			return execution.responseBody;
		} catch (error) {
			console.error('Enhancement error:', error);
			return fail(500, { error: 'Failed to enhance content' });
		}
	}
};
