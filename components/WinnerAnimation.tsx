import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { Winner } from '../types';

interface WinnerAnimationProps {
  winners: Winner[];
}

const WinnerAnimation: React.FC<WinnerAnimationProps> = ({ winners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (winners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % winners.length);
    }, 3000); // 3 seconds

    return () => clearInterval(interval);
  }, [winners.length]);

  if (winners.length === 0) return null;

  const winner = winners[currentIndex];
  const prizeText = winner.currency === 'ZAR' ? `R${winner.prize}` : `$${winner.prize}`;

  return (
    <div className="flex items-center justify-center bg-yellow-400 p-2 rounded">
      <div className="flex items-center">
        <Trophy size={16} className="text-amber-700 mr-3 shrink-0" />
        <span className="text-sm text-black font-bold tracking-wide">{winner.name}</span>
        <span className="text-xs text-zinc-700 font-medium mx-2">won</span>
        <span className="text-sm font-extrabold text-black">{prizeText}!</span>
      </div>
    </div>
  );
};

export default WinnerAnimation;
