import React, { useEffect, useState } from 'react';
import { ensureFcmTokenRegistered } from '../utils/pushNotifications';

const isIos = () => /iP(ad|hone|od)/.test(navigator.userAgent) && !('standalone' in navigator && (navigator as any).standalone);

export default function InstallManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState(false);
  const [dismissed, setDismissed] = useState<boolean>(() => !!localStorage.getItem('spv_install_dismissed'));

  useEffect(() => {
    const checkStandalone = () => {
      const m = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator as any).standalone === true;
      setIsStandalone(Boolean(m));
      if (m) {
        try { const uid = (window as any).__SPV_USER_ID; if (uid) ensureFcmTokenRegistered({ userId: uid }); } catch (e) {}
      }
    };

    checkStandalone();
    window.addEventListener('appinstalled', () => setIsStandalone(true));

    const beforeHandler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', beforeHandler as any);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeHandler as any);
      window.removeEventListener('appinstalled', () => setIsStandalone(true));
    };
  }, []);

  if (isStandalone) return null;
  if (dismissed) return null; // user dismissed the big install modal

  const onInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice && choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowGuide(true);
    }
  };

  const onDismiss = () => {
    try {
      localStorage.setItem('spv_install_dismissed', '1');
      setDismissed(true);
      setShowGuide(false);
    } catch (e) {
      setDismissed(true);
    }
  };

  const onRequestNotifications = async () => {
    try {
      const uid = (window as any).__SPV_USER_ID;
      if (uid) await ensureFcmTokenRegistered({ userId: uid });
      else {
        Notification.requestPermission();
      }
    } catch (err) {
      console.warn('request notification permission failed', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white text-black rounded-lg max-w-md w-full p-6">
        <h2 className="text-lg font-bold mb-4">Install Spoil Me</h2>
        <p className="mb-4">For the best experience please install the app to your device.</p>
        <div className="flex gap-2">
          <button className="btn btn-primary flex-1" onClick={onInstallClick}>Download App</button>
          <button className="btn" onClick={() => { setShowGuide(true); }}>How to install</button>
          <button className="btn-ghost" onClick={onDismiss}>Dismiss</button>
        </div>

        <div className="mt-4">
          <button className="text-sm text-gray-600" onClick={onRequestNotifications}>Enable Notifications</button>
        </div>

        {showGuide && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            {isIos() ? (
              <div>
                <p className="font-medium">iOS Install Instructions</p>
                <ol className="list-decimal list-inside mt-2">
                  <li>Tap the <strong>Share</strong> button (the square with an arrow).</li>
                  <li>Select <strong>Add to Home Screen</strong>.</li>
                </ol>
              </div>
            ) : (
              <div>
                <p className="font-medium">Install</p>
                <p className="mt-2">If the system install card is available, press <strong>Download App</strong> above.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
