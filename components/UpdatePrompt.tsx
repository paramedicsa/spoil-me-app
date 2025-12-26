import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * UpdatePrompt
 * - Shows ONLY when `needRefresh` is true (a new version is available)
 * - Does NOT show on `offlineReady` (fresh install)
 */
const UpdatePrompt: React.FC = () => {
  const { needRefresh, updateServiceWorker, offlineReady } = useRegisterSW();
  const [visible, setVisible] = useState(false);

  // If the SW is ready for offline (fresh install), do not surface an update UI.
  useEffect(() => {
    if (offlineReady) {
      // Silent on fresh install — log for diagnostics only
      console.debug('[UpdatePrompt] Service worker offlineReady (fresh install)');
      // Ensure we don't show the update UI immediately after install
      setVisible(false);
      return;
    }

    if (needRefresh) {
      setVisible(true);
    }
  }, [needRefresh, offlineReady]);

  if (!visible) return null;

  return (
    <div style={{ bottom: 'env(safe-area-inset-bottom, 16px)' }} className="fixed left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-60 flex justify-center">
      <div className="max-w-xl w-full bg-zinc-900 border border-pink-500 text-white rounded-xl p-3 flex items-center justify-between gap-4 shadow-lg">
        <div className="text-sm">New version available!</div>
        <div className="flex gap-2">
          <button
            className="bg-pink-600 hover:bg-pink-500 text-white px-3 py-2 rounded-md text-sm font-semibold"
            onClick={async () => {
              try {
                await updateServiceWorker(true);
              } catch (e) {
                console.warn('[UpdatePrompt] updateServiceWorker failed', e);
              }
              // Hide prompt immediately (page may reload)
              setVisible(false);
            }}
          >
            Refresh
          </button>
          <button
            className="bg-transparent border border-white/10 text-white px-3 py-2 rounded-md text-sm"
            onClick={() => setVisible(false)}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePrompt;
