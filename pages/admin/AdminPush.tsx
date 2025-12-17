import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebaseConfig';
import { Bell, Send, Users, User, Globe } from 'lucide-react';

const AdminPush = () => {
  const [loading, setLoading] = useState(false);
  const [targetType, setTargetType] = useState<'individual' | 'tier' | 'all'>('all');
  const [targetValue, setTargetValue] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    imageUrl: '',
    link: '/vault' // Default to Vault
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to send this notification?")) return;

    setLoading(true);
    try {
      const sendFn = httpsCallable(functions, 'sendAdminPush');
      const result: any = await sendFn({
        targetType,
        targetValue: targetType === 'tier' ? targetValue : (targetType === 'individual' ? targetValue : null),
        ...formData
      });

      if (result.data.success) {
        alert(`✅ Success! Sent to ${result.data.sentCount} devices.`);
        setFormData({ ...formData, title: '', body: '' }); // Reset text
      } else {
        alert(`⚠️ ${result.data.message}`);
      }
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800 max-w-2xl mx-auto mt-10">
      <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
        <Bell className="text-yellow-500" size={24} />
        <h2 className="text-xl font-bold text-white">Push Notification Center</h2>
      </div>

      <form onSubmit={handleSend} className="space-y-6">
        {/* TARGET SELECTOR */}
        <div className="grid grid-cols-3 gap-4">
          <button type="button" onClick={() => setTargetType('all')}
            className={`p-4 rounded border flex flex-col items-center gap-2 ${targetType === 'all' ? 'border-yellow-500 bg-yellow-900/20 text-white' : 'border-zinc-700 text-gray-400'}`}>
            <Globe size={20} />
            <span className="text-sm font-bold">Everyone</span>
          </button>
          <button type="button" onClick={() => setTargetType('tier')}
            className={`p-4 rounded border flex flex-col items-center gap-2 ${targetType === 'tier' ? 'border-yellow-500 bg-yellow-900/20 text-white' : 'border-zinc-700 text-gray-400'}`}>
            <Users size={20} />
            <span className="text-sm font-bold">Membership Tier</span>
          </button>
          <button type="button" onClick={() => setTargetType('individual')}
            className={`p-4 rounded border flex flex-col items-center gap-2 ${targetType === 'individual' ? 'border-yellow-500 bg-yellow-900/20 text-white' : 'border-zinc-700 text-gray-400'}`}>
            <User size={20} />
            <span className="text-sm font-bold">Individual</span>
          </button>
        </div>

        {/* CONDITIONAL INPUTS */}
        {targetType === 'tier' && (
          <div>
            <label className="text-gray-400 text-sm">Select Membership Tier</label>
            <select
              className="w-full bg-black border border-zinc-700 text-white p-3 rounded mt-1"
              onChange={(e) => setTargetValue(e.target.value)}
              value={targetValue}
            >
              <option value="">Select a Tier...</option>
              <option value="spoil-me">Spoil Me (R19)</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="deluxe">Deluxe (Vault Access)</option>
            </select>
          </div>
        )}

        {targetType === 'individual' && (
          <div>
            <label className="text-gray-400 text-sm">User ID (UID)</label>
            <input
              type="text"
              placeholder="Paste User UID here..."
              className="w-full bg-black border border-zinc-700 text-white p-3 rounded mt-1"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
            />
          </div>
        )}

        {/* MESSAGE CONTENT */}
        <div>
          <label className="text-gray-400 text-sm">Notification Title</label>
          <input
            type="text"
            placeholder="e.g. 💎 The Vault is Open!"
            required
            className="w-full bg-black border border-zinc-700 text-white p-3 rounded mt-1 font-bold"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div>
          <label className="text-gray-400 text-sm">Message Body</label>
          <textarea
            placeholder="e.g. New vintage stock just added. Tap to shop now."
            required
            rows={3}
            className="w-full bg-black border border-zinc-700 text-white p-3 rounded mt-1"
            value={formData.body}
            onChange={(e) => setFormData({...formData, body: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-sm">Deep Link (Optional)</label>
            <input
              type="text"
              placeholder="e.g. /vault or /membership"
              className="w-full bg-black border border-zinc-700 text-white p-3 rounded mt-1"
              value={formData.link}
              onChange={(e) => setFormData({...formData, link: e.target.value})}
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm">Image URL (Optional)</label>
            <input
              type="text"
              placeholder="https://..."
              className="w-full bg-black border border-zinc-700 text-white p-3 rounded mt-1"
              value={formData.imageUrl}
              onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-4 rounded flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? 'Sending...' : <><Send size={20} /> SEND NOTIFICATION</>}
        </button>
      </form>
    </div>
  );
};

export default AdminPush;
