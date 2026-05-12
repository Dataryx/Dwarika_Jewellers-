import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, Loader2, Check, Plus, Trash2, X, Pencil, Image as ImageIcon, Users, BookOpen, Heart,
} from 'lucide-react';
import { ImageUploadField } from '../../components/admin/ImageUploadField';
import { showNotification } from '../../components/Notification';

interface TeamMember { id: number; name: string; role: string; image: string; }
interface ValueItem { title: string; desc: string; }
interface AboutData {
  heroImage: string;
  heroSubtitle: string;
  heroTitle: string;
  storySubtitle: string;
  storyTitle: string;
  storyParagraphs: string[];
  storyImage: string;
  values: ValueItem[];
  team: TeamMember[];
}

type Tab = 'story' | 'values' | 'team';

const inputClass =
  'w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all';

export default function AdminAbout() {
  const [data, setData] = useState<AboutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<Tab>('story');

  const [teamForm, setTeamForm] = useState({ name: '', role: '', image: '' });
  const [editingMember, setEditingMember] = useState<number | null>(null);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [teamSaving, setTeamSaving] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/about');
      const json = await res.json();
      setData(json);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const saveContent = async () => {
    if (!data) return;
    setSaving(true);
    try {
      const { team, ...content } = data;
      const res = await fetch('/api/about', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      showNotification('About page saved');
    } catch {
      showNotification('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const openTeamAdd = () => {
    setEditingMember(null);
    setTeamForm({ name: '', role: '', image: '' });
    setShowTeamForm(true);
  };

  const openTeamEdit = (m: TeamMember) => {
    setEditingMember(m.id);
    setTeamForm({ name: m.name, role: m.role, image: m.image });
    setShowTeamForm(true);
  };

  const handleTeamSave = async () => {
    if (!teamForm.name.trim()) { showNotification('Name is required'); return; }
    setTeamSaving(true);
    try {
      if (editingMember !== null) {
        await fetch('/api/about?section=team-update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingMember, ...teamForm }),
        });
        showNotification('Team member updated');
      } else {
        await fetch('/api/about?section=team-add', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(teamForm),
        });
        showNotification('Team member added');
      }
      setShowTeamForm(false);
      await fetchData();
    } catch {
      showNotification('Failed to save');
    } finally {
      setTeamSaving(false);
    }
  };

  const handleTeamDelete = async (id: number) => {
    if (!confirm('Remove this team member?')) return;
    try {
      await fetch('/api/about?section=team-delete', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      showNotification('Team member removed');
      await fetchData();
    } catch {
      showNotification('Failed to delete');
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    );
  }

  const update = (key: string, value: any) => setData((prev) => prev ? { ...prev, [key]: value } : prev);

  const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
    { id: 'story', label: 'Hero & Story', icon: BookOpen },
    { id: 'values', label: 'Values', icon: Heart },
    { id: 'team', label: 'Meet Our Artisans', icon: Users },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">About Page</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your About page sections — story, values, and team</p>
        </div>
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
                tab === t.id
                  ? 'bg-gray-700 text-amber-500 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ──────── HERO & STORY TAB ──────── */}
      {tab === 'story' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Hero Section */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 space-y-5">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-500" /> Hero Banner
            </h2>
            <ImageUploadField
              label="Hero Background Image"
              value={data.heroImage}
              onChange={(v) => update('heroImage', v)}
              disabled={saving}
              allowUrl={false}
              hint="Full-width banner shown at the top of the About page"
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Subtitle</label>
                <input value={data.heroSubtitle} onChange={(e) => update('heroSubtitle', e.target.value)} className={inputClass} placeholder="e.g. Since 1985" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Title</label>
                <input value={data.heroTitle} onChange={(e) => update('heroTitle', e.target.value)} className={inputClass} placeholder="e.g. Our Story" />
              </div>
            </div>
          </div>

          {/* Story Section */}
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 space-y-5">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-500" /> Story Content
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Section Label</label>
                <input value={data.storySubtitle} onChange={(e) => update('storySubtitle', e.target.value)} className={inputClass} placeholder="e.g. The Beginning" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Section Title</label>
                <input value={data.storyTitle} onChange={(e) => update('storyTitle', e.target.value)} className={inputClass} placeholder="e.g. Crafting Dreams Since 1985" />
              </div>
            </div>

            <ImageUploadField
              label="Story Side Image"
              value={data.storyImage}
              onChange={(v) => update('storyImage', v)}
              disabled={saving}
              allowUrl={false}
              hint="Image displayed beside the story text"
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Paragraphs</label>
                <button
                  type="button"
                  onClick={() => update('storyParagraphs', [...data.storyParagraphs, ''])}
                  className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Paragraph
                </button>
              </div>
              {data.storyParagraphs.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <textarea
                    value={p}
                    onChange={(e) => {
                      const arr = [...data.storyParagraphs];
                      arr[i] = e.target.value;
                      update('storyParagraphs', arr);
                    }}
                    rows={3}
                    className={`${inputClass} resize-y flex-1`}
                    placeholder={`Paragraph ${i + 1}`}
                  />
                  {data.storyParagraphs.length > 1 && (
                    <button
                      onClick={() => update('storyParagraphs', data.storyParagraphs.filter((_, j) => j !== i))}
                      className="text-gray-600 hover:text-red-400 mt-1 self-start"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button onClick={saveContent} disabled={saving} className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-xl text-sm transition-colors disabled:opacity-50">
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </motion.div>
      )}

      {/* ──────── VALUES TAB ──────── */}
      {tab === 'values' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-amber-500" /> Our Values
              </h2>
              <button
                onClick={() => update('values', [...data.values, { title: '', desc: '' }])}
                className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Value
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {data.values.map((v, i) => (
                <div key={i} className="bg-gray-900/50 rounded-xl p-4 space-y-3 border border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Value {i + 1}</span>
                    {data.values.length > 1 && (
                      <button
                        onClick={() => update('values', data.values.filter((_, j) => j !== i))}
                        className="text-gray-600 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <input
                    value={v.title}
                    onChange={(e) => {
                      const arr = [...data.values]; arr[i] = { ...arr[i], title: e.target.value }; update('values', arr);
                    }}
                    className={inputClass}
                    placeholder="Title (e.g. Excellence)"
                  />
                  <input
                    value={v.desc}
                    onChange={(e) => {
                      const arr = [...data.values]; arr[i] = { ...arr[i], desc: e.target.value }; update('values', arr);
                    }}
                    className={inputClass}
                    placeholder="Short description"
                  />
                </div>
              ))}
            </div>
          </div>

          <button onClick={saveContent} disabled={saving} className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-xl text-sm transition-colors disabled:opacity-50">
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </button>
        </motion.div>
      )}

      {/* ──────── TEAM TAB ──────── */}
      {tab === 'team' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Add and manage your team members shown in "Meet Our Artisans"</p>
            <button
              onClick={openTeamAdd}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-xl text-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Member
            </button>
          </div>

          {/* Team Form */}
          <AnimatePresence>
            {showTeamForm && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gray-800 border border-gray-700 rounded-2xl p-6 space-y-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {editingMember !== null ? 'Edit Team Member' : 'New Team Member'}
                  </h3>
                  <button onClick={() => setShowTeamForm(false)} className="text-gray-500 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <ImageUploadField
                  label="Profile Photo"
                  value={teamForm.image}
                  onChange={(v) => setTeamForm({ ...teamForm, image: v })}
                  disabled={teamSaving}
                  allowUrl={false}
                  hint="Upload a photo from your computer"
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Name</label>
                    <input
                      value={teamForm.name}
                      onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                      className={inputClass}
                      placeholder="e.g. Laxmi Shrestha"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">Role / Description</label>
                    <input
                      value={teamForm.role}
                      onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })}
                      className={inputClass}
                      placeholder="e.g. Master Jeweler"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleTeamSave}
                    disabled={teamSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {teamSaving ? 'Saving...' : editingMember !== null ? 'Update' : 'Add'}
                  </button>
                  <button
                    onClick={() => setShowTeamForm(false)}
                    className="px-5 py-2.5 bg-gray-700 text-gray-300 rounded-xl text-sm hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Team Grid */}
          {data.team.length === 0 ? (
            <div className="text-center py-16 bg-gray-800/60 border border-gray-700 rounded-2xl">
              <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No team members yet. Click "Add Member" to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.team.map((member) => (
                <motion.div
                  key={member.id}
                  layout
                  className="bg-gray-800/60 border border-gray-700 rounded-2xl overflow-hidden hover:border-gray-600 transition-colors group"
                >
                  <div className="relative aspect-[4/5] bg-gray-900">
                    {member.image ? (
                      <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <Users className="w-10 h-10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-sm font-medium text-white">{member.name}</h3>
                      <p className="text-xs text-white/60 mt-0.5">{member.role}</p>
                    </div>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <button onClick={() => openTeamEdit(member)} className="text-xs text-amber-500 hover:text-amber-400 font-medium flex items-center gap-1">
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => handleTeamDelete(member.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
