import React, { useEffect, useState } from 'react';
import { registerPlugin } from '@capacitor/core';
import { downloadAndInstall } from '../src/updater';

// Capacitor plugin wrapper (will be defined natively)
const Updater = registerPlugin('UpdaterPlugin', { web: () => ({ openUrl: async () => { console.warn('UpdaterPlugin not available on web'); } }) });

interface Props {
  apkUrl?: string; // public HTTPS URL to hosted APK
  playStoreUrl?: string; // optional Play Store URL if you switch later
}

const VERSION_URL = 'https://spoilme-edee0.web.app/version.json';

const isMobile = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || '';
  return /Android|iPhone|iPad|iPod/i.test(ua);
};

export default function InstallAppPrompt({ apkUrl = '', playStoreUrl }: Props) {
  const [show, setShow] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [latestApkUrl, setLatestApkUrl] = useState(apkUrl);

  useEffect(() => {
    if (!isMobile()) return;
    const isNative = (window as any).Capacitor?.isNativePlatform?.();
    setIsUpdate(isNative);

    const checkForUpdate = async () => {
      try {
        console.log('Checking for update...');
        const response = await fetch(VERSION_URL);
        const data = await response.json();
        console.log('Fetched data:', data);
        const latestVersion = data.version;
        const storedVersion = localStorage.getItem('appVersion') || '0.1';
        console.log('Latest version:', latestVersion, 'Stored version:', storedVersion);
        if (latestVersion !== storedVersion) {
          console.log('New version detected, showing update banner');
          setLatestApkUrl(data.apkUrl);
          setShow(true);
          localStorage.setItem('appVersion', latestVersion);
        } else {
          console.log('No new version');
          const dismissed = isNative ? localStorage.getItem('updatePromptDismissed') : localStorage.getItem('installPromptDismissed');
          if (!dismissed) setShow(true);
        }
      } catch (error) {
        console.error('Failed to check for update:', error);
        // Fallback to default behavior
        const dismissed = isNative ? localStorage.getItem('updatePromptDismissed') : localStorage.getItem('installPromptDismissed');
        if (!dismissed) setShow(true);
      }
    };

    checkForUpdate();
  }, []);

  if (!show) return null;

  const onDismiss = () => {
    const key = isUpdate ? 'updatePromptDismissed' : 'installPromptDismissed';
    localStorage.setItem(key, String(Date.now()));
    setShow(false);
  };

  const onDownload = () => {
    // Open APK URL in browser
    window.location.href = latestApkUrl;
    if (!isUpdate) onDismiss();
  };

  const onInstallInApp = async () => {
    try {
      // @ts-ignore
      if ((window as any).Capacitor && (window as any).Capacitor.isNativePlatform && (window as any).Capacitor.isNativePlatform()) {
        await downloadAndInstall(latestApkUrl);
      } else {
        // Otherwise open in browser
        window.open(latestApkUrl, '_blank');
      }
    } catch (e) {
      console.error('Updater error', e);
      window.open(latestApkUrl, '_blank');
    }
    if (!isUpdate) onDismiss();
  };

  return (
    <div className="fixed bottom-0 left-0 w-full bg-zinc-900 border-t border-gray-800 p-3 z-40 animate-in slide-in-from-bottom-5 duration-300">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <div className="p-2 bg-cyan-900/20 text-cyan-500 rounded-full border border-cyan-500/30">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">
            Update available - Get the latest features!
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onInstallInApp} className="px-4 py-2 bg-green-500 text-black rounded font-semibold text-sm">
            Install Update
          </button>
          <button onClick={onDismiss} className="px-4 py-2 ring-1 ring-gray-700 rounded text-gray-300 text-sm">
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
