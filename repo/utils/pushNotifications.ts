// Re-export a safe no-op implementation to avoid circular imports in dev
export const initializePushNotifications = async (_userId?: string) => {
	try {
		console.debug('repo/utils.initializePushNotifications: no-op (push not configured)');
		return;
	} catch (err) {
		console.warn('repo/utils.initializePushNotifications failed:', err);
	}
};
