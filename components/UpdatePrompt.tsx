import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UpdatePrompt: React.FC = () => {
  const { needRefresh, updateServiceWorker } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div style={{ bottom: 'env(safe-area-inset-bottom, 16px)' }} className="fixed left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-60 flex justify-center">
      <div className="max-w-xl w-full bg-zinc-900 border border-pink-500 text-white rounded-xl p-3 flex items-center justify-between gap-4 shadow-lg">
        <div className="text-sm">New version available!</div>
        <div className="flex gap-2">
          <button
            className="bg-pink-600 hover:bg-pink-500 text-white px-3 py-2 rounded-md text-sm font-semibold"
            onClick={() => updateServiceWorker(true)}
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePrompt;
