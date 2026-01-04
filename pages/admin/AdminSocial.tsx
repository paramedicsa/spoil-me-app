
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Facebook, Instagram, Twitter, Share2, Check, RefreshCw, AlertCircle, Image as ImageIcon, Loader2, Smartphone, Settings, X, Save, Link as LinkIcon, Sparkles, Zap, Play, Pause, Server, Activity, Terminal } from 'lucide-react';
// Do not import server-side Gemini service in client code. Use the Edge Function proxy instead.
import { SocialPlatform, Product } from '../../types';

const INITIAL_PLATFORMS: SocialPlatform[] = [
    { id: 'fb', name: 'Facebook', icon: 'facebook', isConnected: false, accountName: '', urlTemplate: 'https://www.facebook.com/sharer/sharer.php?u={url}&quote={text}' },
    { id: 'ig', name: 'Instagram', icon: 'instagram', isConnected: false, accountName: '', urlTemplate: '' }, 
    { id: 'tk', name: 'TikTok', icon: 'video', isConnected: false, accountName: '', urlTemplate: '' },
    { id: 'x', name: 'X (Twitter)', icon: 'twitter', isConnected: false, accountName: '', urlTemplate: 'https://twitter.com/intent/tweet?text={text}&url={url}' },
];

// Helper for platform specific instructions
const PLATFORM_INSTRUCTIONS: Record<string, string[]> = {
    'fb': [
        "Log in to your Facebook Brand Page in your browser or app.",
        "Enter your Page Name below for the AI context.",
        "When you click 'Post Now', we will open the Facebook Sharer tool.",
        "Paste the caption we generate for you."
    ],
    'ig': [
        "Ensure the Instagram App is installed on this device.",
        "Enter your Instagram Handle (@name) below.",
        "When you click 'Post Now', we will copy the caption to your clipboard.",
        "We will then open Instagram. Create a new post and select the downloaded photo.",
        "Long press in the caption box and select 'Paste'."
    ],
    'tk': [
        "Ensure the TikTok App is installed.",
        "Enter your Handle below.",
        "We will copy the text and hashtags to your clipboard.",
        "When TikTok opens, upload the video/photo and paste the caption."
    ],
    'x': [
        "Log in to X (Twitter).",
        "Enter your handle below.",
        "We will automatically open a 'Compose Tweet' window with your text and link pre-filled."
    ]
};

const AdminSocial: React.FC = () => {
    const { products } = useStore();
    const [platforms, setPlatforms] = useState<SocialPlatform[]>(INITIAL_PLATFORMS);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Configuration State
    const [editingPlatform, setEditingPlatform] = useState<SocialPlatform | null>(null);
    const [editHandle, setEditHandle] = useState('');
    
    // Daily Post State
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [generatedCaptions, setGeneratedCaptions] = useState<Record<string, string>>({});
    const [copiedState, setCopiedState] = useState<string | null>(null);

    // --- AUTO PILOT STATE ---
    const [autoPilotEnabled, setAutoPilotEnabled] = useState(false);
    const [serverLogs, setServerLogs] = useState<{time: string, msg: string, type: 'info' | 'success' | 'process'}[]>([]);
    const [stats, setStats] = useState({ posts: 0, errors: 0 });

    // Load saved configs
    useEffect(() => {
        const saved = localStorage.getItem('spv_social_config');
        if (saved) {
            setPlatforms(JSON.parse(saved));
        }
    }, []);

    // --- AUTO PILOT SIMULATION EFFECT ---
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        
        if (autoPilotEnabled) {
            interval = setInterval(() => {
                if (products.length === 0) return;

                // 1. Pick Random Product & Platform
                const randomProd = products[Math.floor(Math.random() * products.length)];
                const activePlatforms = platforms.filter(p => p.isConnected);
                const targetPlatform = activePlatforms.length > 0 
                    ? activePlatforms[Math.floor(Math.random() * activePlatforms.length)] 
                    : platforms[Math.floor(Math.random() * platforms.length)]; // Fallback for demo visual even if disconnected

                const timeStart = new Date().toLocaleTimeString();

                // 2. Add "Processing" Log
                setServerLogs(prev => [{
                    time: timeStart, 
                    msg: `AI Worker: Analyzing "${randomProd.name}" trends & hashtags...`, 
                    type: 'process' as const
                }, ...prev].slice(0, 6));

                // 3. Simulate "Success" after delay
                setTimeout(() => {
                    const timeEnd = new Date().toLocaleTimeString();
                    setServerLogs(prev => [{
                        time: timeEnd, 
                        msg: `Server: Successfully scheduled post to ${targetPlatform.name} (Simulated)`, 
                        type: 'success' as const
                    }, ...prev].slice(0, 6));
                    
                    setStats(prev => ({ ...prev, posts: prev.posts + 1 }));
                }, 2000);

            }, 5000); // Run every 5 seconds for demo
        }

        return () => clearInterval(interval);
    }, [autoPilotEnabled, products, platforms]);


    const openConfig = (platform: SocialPlatform) => {
        setEditingPlatform(platform);
        setEditHandle(platform.accountName || '');
    };

    const saveConfig = () => {
        if (!editingPlatform) return;
        
        const updated = platforms.map(p => {
            if (p.id === editingPlatform.id) {
                return { 
                    ...p, 
                    isConnected: true, // Auto connect when saving settings
                    accountName: editHandle 
                };
            }
            return p;
        });
        
        setPlatforms(updated);
        localStorage.setItem('spv_social_config', JSON.stringify(updated));
        setEditingPlatform(null);
    };

    const disconnectPlatform = (id: string) => {
        const updated = platforms.map(p => {
            if (p.id === id) {
                return { ...p, isConnected: false, accountName: '' };
            }
            return p;
        });
        setPlatforms(updated);
        localStorage.setItem('spv_social_config', JSON.stringify(updated));
    };

    const generateDailyStrategy = async () => {
        if (products.length === 0) return;
        setIsGenerating(true);

        // Pick a random product
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        setSelectedProduct(randomProduct);

        const captions: Record<string, string> = {};
        
        const activePlatforms = platforms.filter(p => p.isConnected);
        if (activePlatforms.length === 0) {
            alert("Please connect at least one platform first.");
            setIsGenerating(false);
            return;
        }

        for (const platform of activePlatforms) {
            // Pass the account name to the AI so it knows the context
            const contextName = platform.accountName ? `(Account: @${platform.accountName})` : '';
            // Call server-side proxy to generate social caption
            const proxyUrl = (import.meta as any).env?.VITE_GEMINI_PROXY_URL || '/api/gemini-proxy';
            const resp = await fetch(`${proxyUrl}/generate-social`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productName: randomProduct.name, platform: `${platform.name} ${contextName}`, price: randomProduct.price }) });
            const json = await resp.json().catch(() => ({}));
            captions[platform.id] = json?.text || `Check out this amazing product: ${randomProduct.name} for R${randomProduct.price}!`;
        }

        setGeneratedCaptions(captions);
        setIsGenerating(false);
    };

    const handleShare = (platform: SocialPlatform) => {
        const text = generatedCaptions[platform.id];
        if (!text || !selectedProduct) return;

        const productUrl = `${window.location.origin}/#/product/${selectedProduct.id}`;

        // Copy text to clipboard automatically
        navigator.clipboard.writeText(`${text} ${productUrl}`).then(() => {
            setCopiedState(platform.id);
            setTimeout(() => setCopiedState(null), 2000);
        });

        // Platform specific logic
        if (platform.id === 'fb' || platform.id === 'x') {
            const finalUrl = platform.urlTemplate
                .replace('{url}', encodeURIComponent(productUrl))
                .replace('{text}', encodeURIComponent(text));
            window.open(finalUrl, '_blank', 'width=600,height=400');
        } else {
            // For IG/TikTok which don't have web share intents for text
            alert("Caption copied! Opening platform...");
            if (platform.id === 'ig') window.open('https://instagram.com', '_blank');
            if (platform.id === 'tk') window.open('https://tiktok.com', '_blank');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 relative">
            
            {/* CONFIGURATION MODAL */}
            {editingPlatform && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setEditingPlatform(null)} />
                    <div className="bg-zinc-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full relative z-10 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-4">
                             <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                {editingPlatform.id === 'fb' && <Facebook size={24} className="text-blue-500" />}
                                {editingPlatform.id === 'ig' && <Instagram size={24} className="text-pink-500" />}
                                {editingPlatform.id === 'x' && <Twitter size={24} className="text-white" />}
                                {editingPlatform.id === 'tk' && <Smartphone size={24} className="text-cyan-400" />}
                                Connect {editingPlatform.name}
                             </h3>
                             <button onClick={() => setEditingPlatform(null)} className="text-gray-500 hover:text-white"><X size={20}/></button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs text-gray-400 uppercase mb-1">Account Handle / Name</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">@</span>
                                    <input 
                                        type="text" 
                                        className="w-full bg-black border border-gray-700 rounded-lg p-3 pl-8 text-white focus:border-pink-500 outline-none"
                                        value={editHandle}
                                        onChange={(e) => setEditHandle(e.target.value)}
                                        placeholder="spoilmevintage"
                                    />
                                </div>
                            </div>

                            <div className="bg-black/30 p-4 rounded-lg border border-gray-800">
                                <h4 className="text-sm font-bold text-gray-300 mb-2 flex items-center gap-2"><LinkIcon size={14}/> How to connect:</h4>
                                <ul className="space-y-2">
                                    {PLATFORM_INSTRUCTIONS[editingPlatform.id]?.map((step, i) => (
                                        <li key={i} className="text-xs text-gray-400 flex gap-2">
                                            <span className="bg-gray-800 w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5">{i+1}</span>
                                            {step}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button 
                                onClick={saveConfig}
                                className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                            >
                                <Save size={18} /> Save & Connect
                            </button>
                        </div>
                    </div>
                </div>
            )}


            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-[22px] font-bold text-white">Social Media Studio</h1>
                    <p className="text-gray-400 text-sm">Manage accounts and automate daily content sharing.</p>
                </div>
            </div>

            {/* Connection Manager */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {platforms.map(p => (
                    <div key={p.id} className={`p-4 rounded-xl border transition-all relative group ${p.isConnected ? 'bg-zinc-900 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'bg-black border-gray-800 opacity-75'}`}>
                        
                        {/* Config Button */}
                        <button 
                            onClick={() => openConfig(p)}
                            className="absolute top-2 right-2 p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <Settings size={16} />
                        </button>

                        <div className="flex flex-col items-center text-center pt-4 pb-2 cursor-pointer" onClick={() => openConfig(p)}>
                            <div className={`p-3 rounded-full mb-3 transition-colors ${p.isConnected ? 'bg-white text-black' : 'bg-gray-800 text-gray-500'}`}>
                                {p.id === 'fb' && <Facebook size={24} />}
                                {p.id === 'ig' && <Instagram size={24} />}
                                {p.id === 'x' && <Twitter size={24} />}
                                {p.id === 'tk' && <Smartphone size={24} />}
                            </div>
                            
                            <h3 className="font-bold text-white text-sm">{p.name}</h3>
                            
                            {p.isConnected ? (
                                <div className="flex items-center gap-1 mt-1">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    <p className="text-xs text-green-400 font-medium">@{p.accountName}</p>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500 mt-1">Not Connected</p>
                            )}
                        </div>

                        {p.isConnected && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); disconnectPlatform(p.id); }}
                                className="w-full mt-3 py-1 text-[10px] text-red-400 hover:text-red-300 border border-red-900/30 hover:bg-red-900/20 rounded"
                            >
                                Disconnect
                            </button>
                        )}
                        
                        {!p.isConnected && (
                             <button 
                                onClick={() => openConfig(p)}
                                className="w-full mt-3 py-1 text-[10px] text-cyan-400 hover:text-cyan-300 border border-cyan-900/30 hover:bg-cyan-900/20 rounded"
                             >
                                Configure
                             </button>
                        )}
                    </div>
                ))}
            </div>

            {/* --- AUTO PILOT SIMULATOR (NEW) --- */}
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-purple-500/30 rounded-2xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <Zap size={120} className="text-purple-500" />
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                    <div>
                         <div className="flex items-center gap-2 mb-2">
                            <div className={`p-2 rounded-lg ${autoPilotEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-500'}`}>
                                <Server size={24} />
                            </div>
                            <h2 className="text-xl font-bold text-white">Background Auto-Pilot (Demo)</h2>
                         </div>
                         <p className="text-sm text-gray-400 max-w-lg">
                             Enable this to simulate the server-side process that automatically picks products, writes captions, and schedules them to your connected accounts while you sleep.
                         </p>
                         {autoPilotEnabled && (
                             <div className="flex items-center gap-2 mt-4 text-xs text-green-400 font-mono bg-green-900/20 border border-green-500/30 px-3 py-1.5 rounded-lg w-fit animate-pulse">
                                 <Activity size={14} /> Service Running...
                             </div>
                         )}
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                             <div className="text-2xl font-bold text-white font-mono">{stats.posts}</div>
                             <div className="text-[10px] text-gray-500 uppercase">Posts Queued</div>
                        </div>
                        <button 
                            onClick={() => setAutoPilotEnabled(!autoPilotEnabled)}
                            className={`px-6 py-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${
                                autoPilotEnabled 
                                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20' 
                                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/20'
                            }`}
                        >
                            {autoPilotEnabled ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                            {autoPilotEnabled ? 'Stop Simulation' : 'Start Auto-Pilot'}
                        </button>
                    </div>
                </div>

                {/* Console Output */}
                <div className="mt-8 bg-black rounded-xl border border-gray-800 font-mono text-xs p-4 h-48 overflow-y-auto shadow-inner relative">
                    <div className="absolute top-2 right-2 text-gray-700 flex items-center gap-1 pointer-events-none">
                        <Terminal size={14} /> Console
                    </div>
                    {serverLogs.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-gray-600 italic">
                            System Idle. Press Start to begin simulation.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {serverLogs.map((log, i) => (
                                <div key={i} className="flex gap-3 animate-in slide-in-from-left-2 fade-in duration-300">
                                    <span className="text-gray-600 shrink-0">[{log.time}]</span>
                                    <span className={`break-all ${
                                        log.type === 'success' ? 'text-green-400' : 
                                        log.type === 'process' ? 'text-yellow-400' : 'text-gray-300'
                                    }`}>
                                        {log.type === 'success' && <Check size={12} className="inline mr-1" />}
                                        {log.type === 'process' && <Loader2 size={12} className="inline mr-1 animate-spin" />}
                                        {log.msg}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>


            {/* Daily Generator (Manual) */}
            <div className="bg-zinc-900 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-xl">
                 <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                     <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                           <Sparkles className="text-pink-500" /> Manual Content Generator
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                           One click to pick a product and write tailored captions for all your active platforms.
                        </p>
                     </div>
                     <button 
                        onClick={generateDailyStrategy}
                        disabled={isGenerating}
                        className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all"
                     >
                        {isGenerating ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                        {isGenerating ? 'Creating Strategy...' : 'Generate Today\'s Posts'}
                     </button>
                 </div>

                 {selectedProduct && (
                    <div className="animate-in slide-in-from-bottom-4 fade-in">
                        <div className="flex items-center gap-4 mb-6 bg-black p-4 rounded-xl border border-gray-800">
                            <img src={selectedProduct.images[0]} alt="" className="w-16 h-16 rounded-lg object-cover border border-gray-700" />
                            <div>
                                <div className="text-xs text-pink-500 uppercase font-bold">Today's Pick</div>
                                <h3 className="text-white font-bold">{selectedProduct.name}</h3>
                                <p className="text-gray-400 text-xs">R{selectedProduct.price}</p>
                            </div>
                            <div className="ml-auto hidden md:block">
                                <a href={selectedProduct.images[0]} download target="_blank" rel="noreferrer" className="text-xs text-cyan-400 flex items-center gap-1 hover:underline">
                                   <ImageIcon size={14} /> Download High-Res
                                </a>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {platforms.filter(p => p.isConnected).map(platform => (
                                <div key={platform.id} className="bg-black border border-gray-800 p-4 rounded-xl space-y-3">
                                     <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                         <div className="flex items-center gap-2 text-sm font-bold text-gray-300">
                                            {platform.id === 'fb' && <Facebook size={16} className="text-blue-500" />}
                                            {platform.id === 'ig' && <Instagram size={16} className="text-pink-500" />}
                                            {platform.id === 'x' && <Twitter size={16} className="text-white" />}
                                            {platform.id === 'tk' && <Smartphone size={16} className="text-cyan-400" />}
                                            {platform.name} Draft
                                         </div>
                                         <button 
                                            onClick={() => handleShare(platform)}
                                            className="text-xs bg-zinc-800 hover:bg-pink-600 text-white px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                                         >
                                             {copiedState === platform.id ? <Check size={12} /> : <Share2 size={12} />}
                                             {copiedState === platform.id ? 'Copied!' : 'Post Now'}
                                         </button>
                                     </div>
                                     <textarea 
                                        className="w-full h-32 bg-transparent text-sm text-gray-300 resize-none focus:outline-none"
                                        value={generatedCaptions[platform.id] || 'Generating...'}
                                        readOnly
                                     />
                                </div>
                            ))}
                        </div>
                    </div>
                 )}

                 {!selectedProduct && !isGenerating && (
                     <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl">
                         <p className="text-gray-500">Click "Generate" to start your daily social media workflow.</p>
                     </div>
                 )}
            </div>

            {/* Capabilities Info Box */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-6">
                <h3 className="text-blue-400 font-bold flex items-center gap-2 mb-3">
                    <AlertCircle size={20} /> System Capabilities Explained
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-gray-300">
                    <div>
                        <h4 className="font-bold text-white mb-2">What this system CAN do:</h4>
                        <ul className="list-disc pl-5 space-y-1 text-gray-400">
                            <li>Use AI to generate unique, platform-specific captions for your products instantly.</li>
                            <li>Organize your daily posting workflow into a single dashboard.</li>
                            <li>Use "Web Intents" to open your social apps with text pre-filled (semi-automated).</li>
                            <li><strong>Demo Simulation:</strong> As seen above, we can simulate how a server-side bot would process your queue.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-white mb-2">What requires Server Upgrades:</h4>
                        <ul className="list-disc pl-5 space-y-1 text-gray-400">
                            <li><strong>Fully Automated Background Posting:</strong> To enable the "Auto-Pilot" feature for real (posting while you sleep), a dedicated backend server (e.g., Firebase Cloud Functions) is required to run timers (Cron jobs).</li>
                            <li><strong>Direct API Integration:</strong> Posting directly without opening the app requires expensive API approvals and secure server-side token storage which cannot run safely in a browser-only admin panel.</li>
                        </ul>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AdminSocial;
