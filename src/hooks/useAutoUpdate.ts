import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export const useAutoUpdate = () => {
  useEffect(() => {
    const runUpdateFlow = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          // Import plugins only when needed
          const { CapacitorUpdater } = await import('@capgo/capacitor-updater');
          const { Filesystem, Directory } = await import('@capacitor/filesystem');
          const { FileOpener } = await import('@capacitor-community/file-opener');
          const appModule = await import('@capacitor/app');
          const CapApp = appModule.App;

          try {
            CapacitorUpdater.notifyAppReady();
            const check = await CapacitorUpdater.checkForUpdate();
            if (check.available) {
              console.log('Updater plugin found update — downloading via plugin...');
              await CapacitorUpdater.downloadUpdate();
              await CapacitorUpdater.setUpdate();
              return; // plugin handled it
            }
          } catch (e) {
            console.warn('CapacitorUpdater plugin check failed:', e);
          }

          // Fallback to manual download
          const versionRes = await fetch('https://spoilme-edee0.web.app/version.json', { cache: 'no-store' });
          if (!versionRes.ok) throw new Error('Failed to fetch version.json');
          const data = await versionRes.json();

          let installedVersion = localStorage.getItem('appVersion') || '0.0.0';
          try {
            const info = await CapApp.getInfo();
            if (info && info.version) installedVersion = info.version;
          } catch {}

          if (data.version && data.version !== installedVersion) {
            localStorage.setItem('appVersion', data.version);

            const apkRes = await fetch(data.apkUrl);
            if (!apkRes.ok) throw new Error('Failed to download APK');

            const arrayBuffer = await apkRes.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            const chunk = 0x8000;
            for (let i = 0; i < bytes.length; i += chunk) {
              binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
            }
            const base64Data = btoa(binary);

            const fileName = `Spoil-Me-Vintage-${data.version}.apk`;

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
              contentType: 'application/vnd.android/package-archive',
            });
          }
        } else {
          // Web: check for update and reload
          const versionRes = await fetch('/version.json', { cache: 'no-store' });
          if (versionRes.ok) {
            const data = await versionRes.json();
            const currentVersion = localStorage.getItem('webVersion') || '0.0.0';
            if (data.version && data.version !== currentVersion) {
              localStorage.setItem('webVersion', data.version);
              window.location.reload();
            }
          }
        }
      } catch (err) {
        console.error('Auto-update flow failed:', err);
      }
    };

    runUpdateFlow();
  }, []);
};
