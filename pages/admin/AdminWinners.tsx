import React from 'react';
import { useStore } from '../../context/StoreContext';
import { Trophy, Users, BarChart, AlertTriangle } from 'lucide-react';

const AdminWinners: React.FC = () => {
    const { weeklyWinners } = useStore();

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-[22px] font-bold text-white flex items-center gap-2">
                        <Trophy size={24} className="text-yellow-400" /> Weekly "Spoil Me" Winners
                    </h1>
                    <p className="text-gray-400 text-sm">Review and manage the simulated weekly prize draw.</p>
                </div>
            </div>

            <div className="bg-yellow-900/10 border border-yellow-500/20 p-5 rounded-xl flex items-start gap-4">
                <AlertTriangle size={24} className="text-yellow-500 shrink-0 mt-1" />
                <div>
                    <h3 className="font-bold text-yellow-400">Simulation Mode Active</h3>
                    <p className="text-sm text-yellow-200/80 mt-1">
                        This panel displays a <strong className="text-white">simulated list of winners</strong> for demonstration. In a live production environment, this page would be connected to your database to:
                    </p>
                    <ul className="list-disc pl-5 mt-3 text-xs text-yellow-200/70 space-y-1">
                        <li>Show a list of all users subscribed to the "Spoil Me Package".</li>
                        <li>Allow you to run the draw, which would randomly select <strong>real users</strong> from that list.</li>
                        <li>Automatically generate unique voucher codes and assign them to the winning user accounts.</li>
                        <li>Send a notification to the winners' in-app inbox.</li>
                    </ul>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900 p-6 rounded-xl border border-gray-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg bg-cyan-900/30 text-cyan-400 border border-cyan-500/20"><Users size={20} /></div>
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium">Total Winners This Week</h3>
                    <p className="text-[22px] font-bold text-white mt-1">{weeklyWinners.length}</p>
                </div>
                <div className="bg-zinc-900 p-6 rounded-xl border border-gray-800">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-lg bg-green-900/30 text-green-400 border border-green-500/20"><BarChart size={20} /></div>
                    </div>
                    <h3 className="text-gray-400 text-sm font-medium">Total Prize Value</h3>
                    <p className="text-[22px] font-bold text-white mt-1">R{weeklyWinners.reduce((sum, w) => sum + w.prize, 0).toFixed(2)}</p>
                </div>
            </div>

            <div className="bg-zinc-900 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-zinc-950 border-b border-gray-800 text-gray-400 font-medium">
                        <tr>
                            <th className="p-4 w-20">Rank</th>
                            <th className="p-4">Winner Name</th>
                            <th className="p-4 text-right">Prize Value</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {weeklyWinners.map(winner => (
                            <tr key={winner.rank} className={`group transition-colors ${winner.rank <= 3 ? 'bg-yellow-900/10' : 'hover:bg-zinc-800/50'}`}>
                                <td className="p-4">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border ${
                                        winner.rank === 1 ? 'bg-yellow-500 border-yellow-400 text-black' : 
                                        winner.rank === 2 ? 'bg-gray-400 border-gray-300 text-black' :
                                        winner.rank === 3 ? 'bg-orange-600 border-orange-500 text-white' :
                                        'bg-zinc-800 border-gray-700 text-gray-400'
                                    }`}>
                                        {winner.rank}
                                    </div>
                                </td>
                                <td className="p-4 font-medium text-gray-200">{winner.name}</td>
                                <td className="p-4 text-right font-bold text-lg text-green-400">R{winner.prize.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
};

export default AdminWinners;
