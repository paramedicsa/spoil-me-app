import React, { useState } from 'react';
import { callServerFunction, supabase } from '../../utils/supabaseClient';
import { Bell, Send, User, Globe, Users } from 'lucide-react';

type TargetGroup = 'all' | 'affiliates' | 'artists' | 'non_members' | 'south_africa' | 'international' | 'individual';

const AdminPush = () => {
  const [loading, setLoading] = useState(false);
  const [targetGroup, setTargetGroup] = useState<TargetGroup>('all');
  const [targetId, setTargetId] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    imageUrl: '',
    link: '/#/vault' // Default to Vault
  });
  const [testUserId, setTestUserId] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to send this notification?")) return;

    setLoading(true);
    try {
      const result: any = await callServerFunction('send-push', {
        title: formData.title,
        body: formData.body,
        targetGroup,
        targetId: targetGroup === 'individual' ? targetId : null,
        image: formData.imageUrl || null,
        url: formData.link || '/'
      });

      if (result?.success || result?.data?.success) {
        const sentCount = result.sentCount || result.data?.sentCount || 0;
        alert(`✅ Success! Sent to ${sentCount} devices.`);
        setFormData({ ...formData, title: '', body: '' }); // Reset text
      } else {
        const msg = result?.message || result?.data?.message || 'Unknown error';
        alert(`⚠️ ${msg}`);
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

      {/* SEND TEST NOTIFICATION TO SPECIFIC USER */}
      <div className="mt-6 p-4 border-t border-zinc-800">
        <label className="text-gray-400 text-sm">Test Notification (send to specific User ID)</label>
        <div className="mt-2 flex gap-2">
          <input type="text" placeholder="Paste User UID here..." className="flex-1 bg-black border border-zinc-700 text-white p-3 rounded" value={testUserId} onChange={(e) => setTestUserId(e.target.value)} />
          <button onClick={async () => {
            if (!testUserId) { alert('Please enter a User ID'); return; }
            if (!confirm(`Send test notification to ${testUserId}?`)) return;
            try {
              const payload = { user_id: testUserId, type: 'general', title: formData.title || 'Test Notification', message: formData.body || 'This is a test notification sent from Admin panel', link: formData.link || '/' };
              const { error } = await supabase.from('notifications').insert([payload]);
              if (error) { console.error('Insert notification failed:', error); alert('Failed to enqueue notification. See console.'); return; }
              alert('Test notification enqueued (server webhook will send it)');
            } catch (err: any) {
              console.error('Send test notification error:', err);
              alert('Failed to send test notification. See console for details.');
            }
          }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded">Send Test Notification</button>
        </div>
      </div>

      <form onSubmit={handleSend} className="space-y-6">
        {/* TARGET SELECTOR */}
        <div>
          <label className="text-gray-400 text-sm">Target Group</label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {(
              [
                { key: 'all', label: 'Everyone', icon: <Globe size={18} /> },
                { key: 'south_africa', label: 'South Africa', icon: <Users size={18} /> },
                { key: 'international', label: 'International', icon: <Users size={18} /> },
                { key: 'non_members', label: 'Non-Members', icon: <Users size={18} /> },
                { key: 'affiliates', label: 'Affiliates', icon: <Users size={18} /> },
                { key: 'artists', label: 'Artists', icon: <Users size={18} /> },
                { key: 'individual', label: 'Individual', icon: <User size={18} /> }
              ] as Array<{ key: TargetGroup; label: string; icon: React.ReactNode }>
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setTargetGroup(opt.key)}
                className={`p-3 rounded border flex items-center gap-2 ${targetGroup === opt.key ? 'border-yellow-500 bg-yellow-900/20 text-white' : 'border-zinc-700 text-gray-400'}`}
              >
                {opt.icon}
                <span className="text-sm font-bold">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* CONDITIONAL INPUTS */}
        {targetGroup === 'individual' && (
          <div>
            <label className="text-gray-400 text-sm">User ID (UID)</label>
            <input
              type="text"
              placeholder="Paste User UID here..."
              className="w-full bg-black border border-zinc-700 text-white p-3 rounded mt-1"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
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
              placeholder="e.g. /#/vault or /#/membership"
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
