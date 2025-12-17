import React, { useState, useEffect } from 'react';
import { CheckCircle, X, Crown, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

// --- GLOBAL NOTIFICATIONS DATASET ---

const WINNER_NOTIFICATIONS = [
  // South African winners
  "Anja P. from Pretoria just won R500!",
  "Thandi M. from Sandton just won R500!",
  "Bianca S. from Cape Town just won R500!",
  "Lerato K. from Soweto just won R500!",
  // International winners
  "Sarah J. from Texas just won $30!",
  "Emily R. from New York just won $30!",
  "Sophie C. from London just won $30!",
  "Jessica H. from Florida just won $30!"
];

const VAULT_NOTIFICATIONS = [
  // South African vault access
  "Lerato in Sandton just unlocked The Secret Vault.",
  "Thandi in Durban just unlocked The Secret Vault.",
  "Johan in Cape Town just unlocked The Secret Vault.",
  "Bianca in Pretoria just unlocked The Secret Vault.",
  // International vault access
  "Jessica in New York just unlocked The Secret Vault.",
  "Emily in Texas just unlocked The Secret Vault.",
  "Ashley in California just unlocked The Secret Vault.",
  "Sarah in Florida just unlocked The Secret Vault.",
  "Sophie in London just unlocked The Secret Vault.",
  "Emma in Manchester just unlocked The Secret Vault."
];

const SocialProofPopup: React.FC = () => {
  const { weeklyWinners, currency } = useStore();
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'winner' | 'vault'>('winner');

  useEffect(() => {
      let timeoutId: ReturnType<typeof setTimeout>;

      const triggerPopup = () => {
          // 60% chance for winner notifications, 40% for vault notifications
          const isWinnerMessage = Math.random() < 0.6;

          if (isWinnerMessage && weeklyWinners.length > 0) {
              // Show winner notification
              const randomWinner = weeklyWinners[Math.floor(Math.random() * weeklyWinners.length)];
              const prizeText = randomWinner.currency === 'ZAR' ? `R${randomWinner.prize}` : `$${randomWinner.prize}`;
              const message = `${randomWinner.name} just won ${prizeText} in the Weekly Draw!`;
              setCurrentMessage(message);
              setMessageType('winner');
          } else {
              // Show vault access notification
              const vaultMessage = VAULT_NOTIFICATIONS[Math.floor(Math.random() * VAULT_NOTIFICATIONS.length)];
              setCurrentMessage(vaultMessage);
              setMessageType('vault');
          }

          setIsVisible(true);

          // Hide after 6 seconds
          setTimeout(() => {
              setIsVisible(false);
          }, 6000);

          // Re-trigger after random interval (20s - 40s)
          const nextInterval = Math.floor(Math.random() * (40000 - 20000 + 1) + 20000);
          timeoutId = setTimeout(triggerPopup, nextInterval);
      };

      // Initial trigger delay
      const initialDelay = 5000; 
      timeoutId = setTimeout(triggerPopup, initialDelay);

      return () => clearTimeout(timeoutId);
  }, [weeklyWinners, currency]);

  if (!currentMessage) return null;

  return (
    <div 
        className={`fixed bottom-4 left-4 z-50 max-w-xs w-full transition-all duration-700 transform ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
    >
        <div className="bg-zinc-900/95 backdrop-blur-md border border-gray-800 p-3 rounded-xl shadow-2xl flex items-center gap-3 relative overflow-hidden group">
            {/* Close Button */}
            <button 
                onClick={() => setIsVisible(false)}
                className="absolute top-1 right-1 text-gray-500 hover:text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X size={12} />
            </button>

            {/* Icon */}
            <div className={`w-8 h-8 shrink-0 rounded-full border flex items-center justify-center ${
                messageType === 'winner'
                    ? 'border-yellow-500/30 bg-yellow-900/20'
                    : 'border-purple-500/30 bg-purple-900/20'
            }`}>
                {messageType === 'winner' ? (
                    <Trophy size={16} className="text-yellow-400" />
                ) : (
                    <Crown size={16} className="text-purple-400" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-200 leading-tight">
                    {currentMessage}
                </div>
                <div className="text-[9px] text-gray-500 mt-1">
                    Just now
                </div>
            </div>
        </div>
    </div>
  );
};

export default SocialProofPopup;
