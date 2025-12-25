import React, { useEffect, useState } from 'react';

const isIos = () => /iP(ad|hone|od)/.test(navigator.userAgent) && !('standalone' in navigator && (navigator as any).standalone);

const IosInstallBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = !!localStorage.getItem('spv_install_dismissed');
      const bannerDismissed = !!localStorage.getItem('spv_install_banner_dismissed');
      const standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator as any).standalone === true;
      if (isIos() && dismissed && !bannerDismissed && !standalone) {
        setVisible(true);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  if (!visible) return null;

  const onClose = () => {
    try { localStorage.setItem('spv_install_banner_dismissed', '1'); } catch (e) {}
    setVisible(false);
  };

  return (
    <div className="fixed left-4 right-4 bottom-4 z-50 flex items-center justify-between bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl p-3 gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/8 rounded flex items-center justify-center">📱</div>
        <div>
          <div className="text-sm font-semibold">Install app for the best experience</div>
          <div className="text-xs text-gray-300">Tap Share → Add to Home Screen</div>
        </div>
      </div>
      <div>
        <button onClick={onClose} className="text-sm text-gray-200 px-2 py-1 rounded">X</button>
      </div>
    </div>
  );
};

export default IosInstallBanner;
