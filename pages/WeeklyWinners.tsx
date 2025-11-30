import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Trophy, Clock, ArrowRight, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';

const WeeklyWinners: React.FC = () => {
    const { weeklyWinners } = useStore();
    const [nextDraw, setNextDraw] = useState(new Date());
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateNextSunday = () => {
            const now = new Date();
            const nextSunday = new Date(now);
            nextSunday.setUTCDate(now.getUTCDate() + (7 - now.getUTCDay()));
            nextSunday.setUTCHours(8, 0, 0, 0); // 8 AM UTC
            if (nextSunday < now) {
                nextSunday.setUTCDate(nextSunday.getUTCDate() + 7);
            }
            setNextDraw(nextSunday);
        };

        calculateNextSunday();
        const interval = setInterval(calculateNextSunday, 60000); // Recalculate every minute
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const difference = nextDraw.getTime() - now.getTime();

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                setTimeLeft(`${days}d ${hours}h ${minutes}m`);
            } else {
                setTimeLeft('Drawing new winners...');
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [nextDraw]);

    return (
        <div className="max-w-4xl mx-auto py-8 space-y-12">
            <div className="text-center space-y-4">
                <div className="inline-block bg-gradient-to-br from-yellow-500 to-orange-500 p-5 rounded-full shadow-[0_0_30px_rgba(250,204,21,0.5)]">
                    <Trophy size={48} className="text-white" />
                </div>
                <h1 className="font-cherry text-5xl text-white">This Week's Winners!</h1>
                <p className="text-gray-300 text-lg">
                    Congratulations to the lucky members of our R19 Spoil Me Package!
                </p>
            </div>

            <div className="bg-zinc-900 border border-gray-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        <Clock size={20} className="text-cyan-400" />
                        Next Draw
                    </h3>
                    <p className="text-gray-400 text-sm">A new set of winners is drawn every Sunday at 08:00 AM.</p>
                </div>
                <div className="bg-black/50 p-4 rounded-xl border border-gray-700 text-center">
                    <div className="text-2xl font-bold text-white font-mono">{timeLeft}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Time Remaining</div>
                </div>
            </div>

            <div className="bg-purple-900/10 border border-purple-500/20 p-5 rounded-xl flex items-start gap-4">
                <Gift size={24} className="text-purple-400 shrink-0 mt-1" />
                <div>
                    <h3 className="font-bold text-purple-300">How to Claim Your Prize</h3>
                    <p className="text-sm text-gray-300/80 mt-1">
                        If you're a winner, a notification has been sent to your profile's inbox containing your unique voucher code. Simply apply it at checkout to claim your winnings!
                    </p>
                </div>
            </div>

            <div className="bg-zinc-900 rounded-2xl border border-gray-800 overflow-hidden">
                <div className="divide-y divide-gray-800">
                    {weeklyWinners.map(winner => (
                        <div key={winner.rank} className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                            winner.rank <= 3 ? 'bg-yellow-900/10' : ''
                        }`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${
                                    winner.rank === 1 ? 'bg-yellow-500 border-yellow-300 text-black shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 
                                    winner.rank === 2 ? 'bg-gray-400 border-gray-200 text-black' :
                                    winner.rank === 3 ? 'bg-orange-600 border-orange-400 text-white' :
                                    'bg-zinc-800 border-gray-700 text-gray-400'
                                }`}>
                                    #{winner.rank}
                                </div>
                                <span className="font-medium text-white">{winner.name}</span>
                            </div>
                            <div className="text-right">
                                <span className="font-bold text-lg text-green-400">R{winner.prize.toFixed(2)}</span>
                                <span className="text-xs text-gray-500 block">Voucher</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="mt-12 bg-gradient-to-r from-pink-600 to-purple-600 p-8 rounded-2xl text-center shadow-2xl">
                <h2 className="text-3xl font-bold text-white mb-2">Want to be on this list?</h2>
                <p className="text-pink-100 mb-6 max-w-lg mx-auto">
                    Join the Spoil Me Package for just R19/month for your chance to win weekly vouchers and get exclusive member perks!
                </p>
                <Link 
                    to="/membership"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all shadow-lg text-lg"
                >
                    Join Now <ArrowRight size={20} />
                </Link>
            </div>
        </div>
    );
};

export default WeeklyWinners;
