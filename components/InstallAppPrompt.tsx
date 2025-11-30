import React, { useEffect, useState } from 'react';
import { registerPlugin } from '@capacitor/core';
import { downloadAndInstall } from '../src/updater';

// Capacitor plugin wrapper (will be defined natively)
const Updater = registerPlugin('UpdaterPlugin', { web: () => ({ openUrl: async () => { console.warn('UpdaterPlugin not available on web'); } }) });

interface Props {
  apkUrl?: string; // public HTTPS URL to hosted APK
  playStoreUrl?: string; // optional Play Store URL if you switch later
}

const DEFAULT_APK = 'https://spoilme-edee0.web.app/Spoil-Me-Vintage-0.1.apk';

const isMobile = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || '';
  return /Android|iPhone|iPad|iPod/i.test(ua);
};

export default function InstallAppPrompt({ apkUrl = DEFAULT_APK, playStoreUrl }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isMobile()) return;
    const dismissed = localStorage.getItem('appPromptDismissed');
    if (!dismissed) setShow(true);
  }, []);

  if (!show) return null;

  const onDismiss = () => {
    localStorage.setItem('appPromptDismissed', String(Date.now()));
    setShow(false);
  };

  const onDownload = () => {
    // Open APK URL in browser
    window.location.href = apkUrl;
  };

  const onInstallInApp = async () => {
    try {
      // @ts-ignore
      if ((window as any).Capacitor && (window as any).Capacitor.isNativePlatform && (window as any).Capacitor.isNativePlatform()) {
        await downloadAndInstall(apkUrl);
      } else {
        // Otherwise open in browser
        window.open(apkUrl, '_blank');
      }
    } catch (e) {
      console.error('Updater error', e);
      window.open(apkUrl, '_blank');
    }
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onDismiss} />
      <div className="relative bg-zinc-900 rounded-xl p-6 w-[92%] max-w-md text-gray-100">
        <h3 className="text-lg font-bold mb-2">Make your experience better — download the app</h3>
        <p className="text-sm text-gray-300 mb-4">Get faster checkout, push notifications, and a native experience.</p>
        <div className="flex gap-3">
          {playStoreUrl ? (
            <a className="px-4 py-2 bg-cyan-500 text-black rounded font-semibold" href={playStoreUrl}>Get it on Google Play</a>
          ) : (
            <button onClick={onDownload} className="px-4 py-2 bg-green-500 text-black rounded font-semibold">Download APK</button>
          )}

          <button onClick={onInstallInApp} className="px-4 py-2 bg-blue-600 text-white rounded font-semibold">Open installer</button>

          <button onClick={onDismiss} className="px-4 py-2 ring-1 ring-gray-700 rounded text-gray-300">Maybe later</button>
        </div>
      </div>
    </div>
  );
}
