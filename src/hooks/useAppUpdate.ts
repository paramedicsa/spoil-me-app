import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';

interface VersionData {
  version: string;
  apkUrl: string;
}

export const useAppUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState<VersionData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const checkForUpdate = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      // Use capgo updater first
      CapacitorUpdater.notifyAppReady();
      const check = await CapacitorUpdater.checkForUpdate();
      if (check.available) {
        setUpdateAvailable({ version: check.bundle.version, apkUrl: '' }); // apkUrl is not needed for capgo
        return;
      }
    } catch (e) {
      console.warn('CapacitorUpdater plugin check failed, falling back to manual check:', e);
    }

    // Fallback to manual check
    try {
      const versionRes = await fetch('https://spoilme-edee0.web.app/version.json', { cache: 'no-store' });
      if (!versionRes.ok) throw new Error('Failed to fetch version.json');
      const data: VersionData = await versionRes.json();

      const info = await CapApp.getInfo();
      const installedVersion = info.version;

      if (data.version && data.version !== installedVersion) {
        setUpdateAvailable(data);
      }
    } catch (error) {
      console.error('Error checking for app update:', error);
    }
  }, []);

  const performUpdate = useCallback(async () => {
    if (!updateAvailable) return;

    setIsDownloading(true);

    try {
        // If capgo detected the update, it will handle it.
        if (updateAvailable.apkUrl === '') {
            await CapacitorUpdater.downloadUpdate();
            await CapacitorUpdater.setUpdate();
            // The app will restart automatically.
            return;
        }

        // Manual update
        const fileName = `Spoil-Me-Vintage-${updateAvailable.version}.apk`;

        const apkRes = await fetch(updateAvailable.apkUrl);
        if (!apkRes.ok) throw new Error('Failed to download APK');

        const arrayBuffer = await apkRes.arrayBuffer();
        const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(new Blob([arrayBuffer]));
        });


        await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.External,
        });

        const uriResult = await Filesystem.getUri({
            directory: Directory.External,
            path: fileName,
        });

        await FileOpener.open({
            filePath: uriResult.uri,
            contentType: 'application/vnd.android.package-archive',
        });

    } catch (error) {
      console.error('Error performing app update:', error);
    } finally {
      setIsDownloading(false);
      setUpdateAvailable(null);
    }
  }, [updateAvailable]);

  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  return {
    updateAvailable,
    isDownloading,
    performUpdate,
    dismissUpdate: () => setUpdateAvailable(null),
  };
};

