import type { Capsule } from '../appwrite';

export function formatDate(dateString: string) {
	return new Date(dateString).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

export function formatEventDisplay(unlockEvent: string): { name: string; description: string } {
	if (!unlockEvent) return { name: 'Unknown Event', description: '' };

	const colonIndex = unlockEvent.indexOf(': ');
	if (colonIndex !== -1) {
		return {
			name: unlockEvent.substring(0, colonIndex),
			description: unlockEvent.substring(colonIndex + 2)
		};
	}

	const dashIndex = unlockEvent.indexOf(' - ');
	if (dashIndex !== -1) {
		return {
			name: unlockEvent.substring(0, dashIndex),
			description: unlockEvent.substring(dashIndex + 3)
		};
	}

	return { name: unlockEvent, description: '' };
}

export function truncateText(text: string, maxLength: number): string {
	if (!text) return '';
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength) + '...';
}

export function getUnlockStatus(capsule: Capsule) {
	return capsule.isUnlocked ? 'Unlocked' : 'Locked';
}

export function getStatusColor(capsule: Capsule) {
	if (capsule.isUnlocked) return 'text-green-400';

	const now = new Date();
	if (capsule.unlockType === 'date' && capsule.unlockDate) {
		const unlockDate = new Date(capsule.unlockDate);
		return now >= unlockDate ? 'text-yellow-400' : 'text-blue-400';
	}

	return 'text-blue-400';
}
