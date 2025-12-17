import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';

const WinnerCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = [
    "🏆 THIS WEEK'S WINNER: Anja P. from Pretoria just won a R500 Voucher!",
    "🏆 LAST WEEK'S WINNER: Sarah Jenkins from Texas just won a $30 Gift Box!",
    "🏆 PREVIOUS WINNER: Thandi M. from Joburg just won a R500 Voucher!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 3000); // 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center bg-yellow-400 p-2 rounded">
      <div className="flex items-center">
        <Trophy size={16} className="text-amber-700 mr-3 shrink-0" />
        <span className="text-sm text-black font-bold tracking-wide">{slides[currentIndex]}</span>
      </div>
    </div>
  );
};

export default WinnerCarousel;
