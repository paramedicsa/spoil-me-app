// Simple wrapper to call the native UpdaterPlugin if available
export async function downloadAndInstall(apkUrl: string): Promise<void> {
  // Capacitor v3+ exposes global Capacitor object at runtime
  // Use (window as any).Capacitor.Plugins if available
  try {
    const cap = (globalThis as any).Capacitor || (window as any).Capacitor;
    const plugin = cap && cap.Plugins && cap.Plugins.UpdaterPlugin;
    if (plugin && plugin.downloadAndInstall) {
      await plugin.downloadAndInstall({ url: apkUrl });
      return;
    }
  } catch (e) {
    // ignore and fallback
  }
  throw new Error('UpdaterPlugin not available');
}

export default { downloadAndInstall };
