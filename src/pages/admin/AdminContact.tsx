import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Save, Loader2, Check, MapPin, Phone, Mail, Clock, Globe, MessageSquare, Trash2, Eye,
} from 'lucide-react';
import { showNotification } from '../../components/Notification';

interface ContactInfo {
  heroSubtitle: string;
  heroTitle: string;
  heroDescription: string;
  storeHeading: string;
  storeDescription: string;
  address: string;
  phone: string;
  email: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  openingHours: string;
  mapEmbedUrl: string;
}

interface Message {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
}

type Tab = 'info' | 'messages';

const inputClass =
  'w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all';

export default function AdminContact() {
  const [info, setInfo] = useState<ContactInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<Tab>('info');
  const [expandedMsg, setExpandedMsg] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/contact-info').then((r) => r.json()),
      fetch('/api/contact').then((r) => r.json()),
    ])
      .then(([infoData, msgData]) => {
        setInfo(infoData);
        setMessages(Array.isArray(msgData) ? msgData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (key: keyof ContactInfo, value: string) =>
    setInfo((prev) => (prev ? { ...prev, [key]: value } : prev));

  const handleSave = async () => {
    if (!info) return;
    setSaving(true);
    try {
      const res = await fetch('/api/contact-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      showNotification('Contact info saved');
    } catch {
      showNotification('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMsg = async (id: number) => {
    if (!confirm('Delete this message?')) return;
    try {
      await fetch('/api/contact', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setMessages((prev) => prev.filter((m) => m.id !== id));
      showNotification('Message deleted');
    } catch {
      showNotification('Failed to delete');
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  if (loading || !info) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof MapPin; count?: number }[] = [
    { id: 'info', label: 'Contact Info', icon: MapPin },
    { id: 'messages', label: 'Messages', icon: MessageSquare, count: messages.length },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">Contact Page</h1>
        <p className="text-gray-400 text-sm mt-1">Edit contact details and view customer messages</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800 rounded-xl p-1 w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t.id ? 'bg-gray-700 text-amber-500 shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-500 text-[10px] font-bold rounded-full">{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ──────── CONTACT INFO TAB ──────── */}
      {tab === 'info' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Hero Section */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-500" /> Page Header
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Subtitle</label>
                <input value={info.heroSubtitle} onChange={(e) => update('heroSubtitle', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Title</label>
                <input value={info.heroTitle} onChange={(e) => update('heroTitle', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Description</label>
              <textarea value={info.heroDescription} onChange={(e) => update('heroDescription', e.target.value)} rows={2} className={`${inputClass} resize-y`} />
            </div>
          </div>

          {/* Store Info */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" /> Store Details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Section Heading</label>
                <input value={info.storeHeading} onChange={(e) => update('storeHeading', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Section Description</label>
                <input value={info.storeDescription} onChange={(e) => update('storeDescription', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Address</label>
                <textarea value={info.address} onChange={(e) => update('address', e.target.value)} rows={2} className={`${inputClass} resize-y`} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Opening Hours</label>
                <textarea value={info.openingHours} onChange={(e) => update('openingHours', e.target.value)} rows={2} className={`${inputClass} resize-y`} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Phone</label>
                <input value={info.phone} onChange={(e) => update('phone', e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> Email</label>
                <input value={info.email} onChange={(e) => update('email', e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Facebook URL</label>
                <input value={info.facebook} onChange={(e) => update('facebook', e.target.value)} className={inputClass} placeholder="https://facebook.com/yourpage" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Instagram URL</label>
                <input value={info.instagram} onChange={(e) => update('instagram', e.target.value)} className={inputClass} placeholder="https://instagram.com/yourhandle" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">TikTok URL</label>
                <input value={info.tiktok} onChange={(e) => update('tiktok', e.target.value)} className={inputClass} placeholder="https://tiktok.com/@yourhandle" />
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-500" /> Google Maps Embed
            </h2>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Map Embed URL</label>
              <input value={info.mapEmbedUrl} onChange={(e) => update('mapEmbedUrl', e.target.value)} className={inputClass} placeholder="Paste Google Maps embed URL" />
              <p className="text-xs text-gray-500 mt-1">Go to Google Maps → Share → Embed a map → Copy the src URL</p>
            </div>
            {info.mapEmbedUrl && (
              <div className="aspect-[16/6] rounded-lg overflow-hidden border border-gray-700">
                <iframe src={info.mapEmbedUrl} className="w-full h-full border-0" loading="lazy" title="Map preview" />
              </div>
            )}
          </div>

          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-xl text-sm transition-colors disabled:opacity-50">
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </motion.div>
      )}

      {/* ──────── MESSAGES TAB ──────── */}
      {tab === 'messages' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-16 bg-gray-800/60 border border-gray-700 rounded-2xl">
              <MessageSquare className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No messages yet. Messages from the contact form will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors"
                >
                  <div
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                    onClick={() => setExpandedMsg(expandedMsg === msg.id ? null : msg.id)}
                  >
                    <div className="w-9 h-9 bg-amber-500/10 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-amber-500 text-sm font-bold">{msg.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{msg.name}</span>
                        <span className="text-xs text-gray-500">{msg.email}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{msg.subject || msg.message}</p>
                    </div>
                    <span className="text-xs text-gray-600 shrink-0">{timeAgo(msg.created_at)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteMsg(msg.id); }}
                      className="text-gray-600 hover:text-red-400 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {expandedMsg === msg.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="px-5 pb-4 border-t border-gray-700/50"
                    >
                      <div className="pt-4 space-y-3">
                        <div className="grid sm:grid-cols-3 gap-3 text-xs">
                          <div><span className="text-gray-500">Name:</span> <span className="text-white ml-1">{msg.name}</span></div>
                          <div><span className="text-gray-500">Email:</span> <span className="text-white ml-1">{msg.email}</span></div>
                          <div><span className="text-gray-500">Phone:</span> <span className="text-white ml-1">{msg.phone || '—'}</span></div>
                        </div>
                        {msg.subject && (
                          <div className="text-xs"><span className="text-gray-500">Subject:</span> <span className="text-amber-500 ml-1 font-medium">{msg.subject}</span></div>
                        )}
                        <div className="bg-gray-900/50 rounded-lg p-4">
                          <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        </div>
                        <p className="text-[10px] text-gray-600">{new Date(msg.created_at).toLocaleString()}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
