import React from 'react';
import { X, Download, Loader } from 'lucide-react';

interface UpdateNotificationProps {
  version: string;
  isDownloading: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ version, isDownloading, onUpdate, onDismiss }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[100] w-full max-w-sm">
      <div className="bg-zinc-800 border-2 border-pink-500 rounded-2xl p-6 shadow-[0_0_40px_rgba(236,72,153,0.3)] animate-in slide-in-from-bottom-10 duration-500">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Download size={24} className="text-white" />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-bold text-white">New Update Available!</h3>
            <p className="text-sm text-gray-300 mt-1">
              Version {version} is ready to be installed.
            </p>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={onUpdate}
                disabled={isDownloading}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <>
                    <Loader size={18} className="animate-spin mr-2" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download size={18} className="mr-2" />
                    Update Now
                  </>
                )}
              </button>
              <button
                onClick={onDismiss}
                disabled={isDownloading}
                className="px-3 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Later
              </button>
            </div>
          </div>
          <div className="ml-3 flex-shrink-0">
            <button
              onClick={onDismiss}
              disabled={isDownloading}
              className="text-gray-500 hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;

