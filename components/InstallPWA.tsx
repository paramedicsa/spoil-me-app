
import React, { useEffect, useState } from 'react';
import { X, Download, Share, Smartphone } from 'lucide-react';

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if already in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    
    if (isStandalone) return;

    // Chrome/Android event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after a short delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    // Custom event to trigger prompt manually from footer/settings
    const manualTriggerHandler = () => {
        setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('open-install-prompt', manualTriggerHandler);

    // Show iOS prompt after a delay if not installed
    if (isIosDevice) {
        setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => {
        window.removeEventListener('beforeinstallprompt', handler);
        window.removeEventListener('open-install-prompt', manualTriggerHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPrompt(false)} />
      <div className="bg-zinc-900 border border-pink-500 rounded-2xl p-6 shadow-[0_0_50px_rgba(236,72,153,0.4)] relative max-w-sm w-full animate-in zoom-in-95 duration-300 text-center">
        <button 
            onClick={() => setShowPrompt(false)} 
            className="absolute top-3 right-3 p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
            <X size={20} />
        </button>

        <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl mx-auto mb-6 rotate-3 border-2 border-white/10">
           <span className="font-cherry text-white text-3xl drop-shadow-md">SV</span>
        </div>

        <h3 className="text-xl font-bold text-white mb-2">Install App</h3>
        <p className="text-sm text-gray-300 leading-relaxed mb-6">
            Get the best experience! Install Spoil Me Vintage for faster access, exclusive notifications, and offline browsing.
        </p>
        
        {isIOS ? (
            <div className="text-xs text-left text-gray-400 bg-black/40 p-4 rounded-xl border border-gray-700">
                <p className="mb-3 font-bold text-white flex items-center gap-2"><Smartphone size={14} /> iOS Installation:</p>
                <ol className="list-decimal pl-4 space-y-2">
                    <li>Tap the <strong className="text-cyan-400">Share</strong> button <Share size={12} className="inline align-middle"/> in your browser bar.</li>
                    <li>Scroll down and select <strong className="text-white">Add to Home Screen</strong>.</li>
                </ol>
            </div>
        ) : (
            <button 
                onClick={handleInstall}
                className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg hover:shadow-pink-500/25 hover:scale-[1.02]"
            >
                <Download size={18} /> Install Now
            </button>
        )}
      </div>
    </div>
  );
};

export default InstallPWA;
