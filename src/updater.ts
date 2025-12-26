// Simple wrapper to call the native UpdaterPlugin if available
export async function downloadAndInstall(apkUrl: string): Promise<void> {
  // Capacitor v3+ exposes global Capacitor object at runtime
  // Use (window as any).Capacitor.Plugins if available
  try {
    const cap = (globalThis as any).Capacitor || (window as any).Capacitor;

    // 1) Try legacy UpdaterPlugin with downloadAndInstall
    const updaterPlugin = cap && cap.Plugins && cap.Plugins.UpdaterPlugin;
    if (updaterPlugin && typeof updaterPlugin.downloadAndInstall === 'function') {
      // some plugin implementations accept { url } param
      try {
        await updaterPlugin.downloadAndInstall({ url: apkUrl });
      } catch (e) {
        // fallback: try without params
        await updaterPlugin.downloadAndInstall();
      }
      return;
    }

    // 2) Try @capgo/capacitor-updater (CapacitorUpdater) plugin
    const capUpdater = cap && cap.Plugins && cap.Plugins.CapacitorUpdater;
    if (capUpdater) {
      // Preferred flow: plugin provides downloadUpdate() and setUpdate()
      if (typeof capUpdater.downloadUpdate === 'function') {
        // try to pass URL if supported, otherwise call no-arg
        try {
          await capUpdater.downloadUpdate({ url: apkUrl });
        } catch (err) {
          try {
            await capUpdater.downloadUpdate();
          } catch (err2) {
            // if downloadUpdate isn't supported, try the older API names
            throw err2;
          }
        }

        if (typeof capUpdater.setUpdate === 'function') {
          await capUpdater.setUpdate();
        }
        return;
      }

      // Some implementations expose a single method to download+install
      if (typeof capUpdater.downloadAndInstall === 'function') {
        try {
          await capUpdater.downloadAndInstall({ url: apkUrl });
        } catch (e) {
          await capUpdater.downloadAndInstall();
        }
        return;
      }
    }
  } catch (e) {
    // ignore and fallback
  }
  // Final fallback: try to open the APK URL (will download via browser)
  try {
    if (typeof window !== 'undefined' && apkUrl) {
      window.open(apkUrl, '_blank');
      return;
    }
  } catch (e) {
    // ignore
  }

  throw new Error('Updater plugin not available and could not open APK URL');
}

export default { downloadAndInstall };
