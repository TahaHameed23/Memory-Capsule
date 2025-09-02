import { client } from '$lib/appwrite';
import type { RealtimeResponseEvent } from 'appwrite';

export interface AIEnhancementResult {
	originalText: string;
	enhancedText: string;
}

export interface AIEnhancementProgress {
	status: 'processing' | 'completed' | 'failed';
	message: string;
	result?: AIEnhancementResult;
	error?: string;
}

export class AIEnhancementService {
	private static instance: AIEnhancementService;

	static getInstance(): AIEnhancementService {
		if (!AIEnhancementService.instance) {
			AIEnhancementService.instance = new AIEnhancementService();
		}
		return AIEnhancementService.instance;
	}

	async enhanceText(
		text: string,
		onProgress?: (progress: AIEnhancementProgress) => void
	): Promise<AIEnhancementResult> {
		try {
			// Call server action to start enhancement
			const response = await fetch('?/enhanceContent', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				body: new URLSearchParams({
					text: text.trim()
				})
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.json();
			const res = JSON.parse(result.data)[0];
			const parsedResponse = JSON.parse(res);

			if (parsedResponse.enhancedText.startsWith('analysisWe')) {
				onProgress?.({
					status: 'failed',
					message: 'Enhancement failed - unexpected response format'
				});
			}

			// Handle the direct function response format
			if (parsedResponse.enhancedText && parsedResponse.originalText) {
				// Direct function response format from server action
				const enhancementResult: AIEnhancementResult = {
					originalText: parsedResponse.originalText,
					enhancedText: parsedResponse.enhancedText
				};

				onProgress?.({
					status: 'completed',
					message: 'Enhancement completed successfully!',
					result: enhancementResult
				});

				return enhancementResult;
			} else if (result.error) {
				// Handle error response
				const errorMessage = result.error;

				onProgress?.({
					status: 'failed',
					message: errorMessage,
					error: errorMessage
				});

				throw new Error(errorMessage);
			} else {
				// Fallback error
				const errorMessage = 'Enhancement failed - unexpected response format';

				onProgress?.({
					status: 'failed',
					message: errorMessage,
					error: errorMessage
				});

				throw new Error(errorMessage);
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Failed to enhance content';

			onProgress?.({
				status: 'failed',
				message: errorMessage,
				error: errorMessage
			});

			throw error;
		}
	}

	async enhanceTextWithRealtime(
		text: string,
		executionId: string,
		onProgress?: (progress: AIEnhancementProgress) => void
	): Promise<AIEnhancementResult> {
		return new Promise((resolve, reject) => {
			let unsubscribe: (() => void) | null = null;
			let timeoutId: number;

			const cleanup = () => {
				if (unsubscribe) {
					unsubscribe();
					unsubscribe = null;
				}
				if (timeoutId) {
					clearTimeout(timeoutId);
				}
			};

			try {
				// Subscribe to execution updates using realtime
				unsubscribe = client.subscribe(
					`executions.${executionId}`,
					(response: RealtimeResponseEvent<Record<string, unknown>>) => {
						const executionData = response.payload;

						switch (executionData.status) {
							case 'processing': {
								onProgress?.({
									status: 'processing',
									message: 'AI is working on your content...'
								});
								break;
							}

							case 'completed': {
								try {
									const result = JSON.parse(executionData.responseBody as string);
									if (result.error) {
										onProgress?.({
											status: 'failed',
											message: result.error,
											error: result.error
										});
										reject(new Error(result.error));
									} else {
										const enhancementResult: AIEnhancementResult = {
											originalText: result.originalText,
											enhancedText: result.enhancedText
										};

										onProgress?.({
											status: 'completed',
											message: 'Enhancement completed successfully!',
											result: enhancementResult
										});

										resolve(enhancementResult);
									}
								} catch {
									const errorMessage = 'Failed to parse enhancement result';
									onProgress?.({
										status: 'failed',
										message: errorMessage,
										error: errorMessage
									});
									reject(new Error(errorMessage));
								}
								cleanup();
								break;
							}

							case 'failed': {
								const errorMessage = 'AI enhancement failed. Please try again.';
								onProgress?.({
									status: 'failed',
									message: errorMessage,
									error: errorMessage
								});
								reject(new Error(errorMessage));
								cleanup();
								break;
							}
						}
					}
				);

				// Set a timeout in case the realtime doesn't work
				timeoutId = setTimeout(() => {
					cleanup();
					const errorMessage = 'Enhancement timed out. Please try again.';
					onProgress?.({
						status: 'failed',
						message: errorMessage,
						error: errorMessage
					});
					reject(new Error(errorMessage));
				}, 30000); // 30 second timeout
			} catch (error) {
				cleanup();
				const errorMessage = 'Failed to start AI enhancement';
				onProgress?.({
					status: 'failed',
					message: errorMessage,
					error: errorMessage
				});
				reject(error);
			}
		});
	}
}

export const aiEnhancementService = AIEnhancementService.getInstance();
