import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Calendar, Plus, Pencil, Trash2, X, Shield, Loader2, User, KeyRound, Eye,
  Phone, MapPin, Briefcase,
} from 'lucide-react';
import { adminFetch } from '../../../lib/adminApi';
import { useAdminAuth } from '../../../lib/adminAuth';
import { showNotification } from '../../Notification';
import { PASSWORD_REQUIREMENTS_HINT, validatePasswordStrength } from '../../../lib/passwordPolicy';
import { validateEmailAddress } from '../../../lib/emailValidation';

export interface AdminUserRecord {
  email: string;
  name: string;
  role: 'master' | 'admin';
  phone?: string;
  address?: string;
  city?: string;
  job_title?: string;
  created_at?: string;
}

type AdminFormFields = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  job_title: string;
  password: string;
  passwordConfirm: string;
};

const emptyAdminForm = (): AdminFormFields => ({
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  job_title: '',
  password: '',
  passwordConfirm: '',
});

function adminToForm(admin: AdminUserRecord): Omit<AdminFormFields, 'password' | 'passwordConfirm' | 'email'> & { email: string } {
  return {
    name: admin.name || '',
    email: admin.email,
    phone: admin.phone || '',
    address: admin.address || '',
    city: admin.city || '',
    job_title: admin.job_title || '',
  };
}

const inputClass =
  'w-full px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50';

const editInputClass =
  'w-full px-4 py-2.5 bg-gray-950/80 border border-amber-500/20 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/40';

function formatDate(dateStr?: string) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AdminUsersList() {
  const [admins, setAdmins] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUserRecord | null>(null);
  const [viewingAdmin, setViewingAdmin] = useState<AdminUserRecord | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [createForm, setCreateForm] = useState<AdminFormFields>(emptyAdminForm);
  const [editForm, setEditForm] = useState({ ...emptyAdminForm(), email: '' });
  const [editPassword, setEditPassword] = useState('');
  const [editPasswordConfirm, setEditPasswordConfirm] = useState('');

  const setCreateField = (field: keyof AdminFormFields, value: string) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  };
  const setEditField = (field: keyof AdminFormFields, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };
  const { email: currentEmail, isMaster } = useAdminAuth();

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin-auth?list=true');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load admins');
      if (Array.isArray(data)) setAdmins(data);
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to load admin users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  useEffect(() => {
    if (!showCreate && !editingAdmin && !viewingAdmin) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewingAdmin) closeView();
        else if (editingAdmin) closeEdit();
        else if (showCreate) closeCreate();
      }
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [showCreate, editingAdmin, viewingAdmin]);

  const openView = (admin: AdminUserRecord) => {
    setShowCreate(false);
    setCreateError('');
    setEditingAdmin(null);
    setUpdateError('');
    setViewingAdmin(admin);
  };

  const closeView = () => setViewingAdmin(null);

  const openCreate = () => {
    setViewingAdmin(null);
    setEditingAdmin(null);
    setUpdateError('');
    setShowCreate(true);
    setCreateForm(emptyAdminForm());
    setCreateError('');
  };

  const closeCreate = () => {
    setShowCreate(false);
    setCreateError('');
  };

  const openEdit = (admin: AdminUserRecord) => {
    setViewingAdmin(null);
    setShowCreate(false);
    setCreateError('');
    setEditingAdmin(admin);
    setEditForm({ ...emptyAdminForm(), ...adminToForm(admin) });
    setEditPassword('');
    setEditPasswordConfirm('');
    setUpdateError('');
  };

  const closeEdit = () => {
    setEditingAdmin(null);
    setUpdateError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.phone.trim()) {
      setCreateError('Phone number is required');
      return;
    }
    const emailCheck = validateEmailAddress(createForm.email);
    if (!emailCheck.ok) {
      setCreateError(emailCheck.error || 'Please enter a valid email address');
      return;
    }
    if (createForm.password !== createForm.passwordConfirm) {
      setCreateError('Passwords do not match');
      return;
    }
    const createPasswordCheck = validatePasswordStrength(createForm.password);
    if (!createPasswordCheck.ok) {
      setCreateError(createPasswordCheck.error || 'Password does not meet requirements');
      return;
    }
    setCreateSubmitting(true);
    setCreateError('');
    try {
      const res = await adminFetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: createForm.name,
          email: emailCheck.normalized,
          phone: createForm.phone,
          address: createForm.address,
          city: createForm.city,
          job_title: createForm.job_title,
          password: createForm.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error ||
            (res.status === 401
              ? 'Session expired or invalid. Log out and sign in again as master admin.'
              : 'Failed to create admin')
        );
      }
      showNotification('Admin user created');
      closeCreate();
      await loadAdmins();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    if (editPassword && editPassword !== editPasswordConfirm) {
      setUpdateError('Passwords do not match');
      return;
    }
    if (editPassword) {
      const editPasswordCheck = validatePasswordStrength(editPassword);
      if (!editPasswordCheck.ok) {
        setUpdateError(editPasswordCheck.error || 'Password does not meet requirements');
        return;
      }
    }

    setUpdateSubmitting(true);
    setUpdateError('');
    try {
      const res = await adminFetch('/api/admin-auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          targetEmail: editingAdmin.email,
          name: editForm.name,
          phone: editForm.phone,
          address: editForm.address,
          city: editForm.city,
          job_title: editForm.job_title,
          ...(editPassword ? { password: editPassword } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update admin');
      showNotification('Admin user updated');
      closeEdit();
      await loadAdmins();
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setUpdateSubmitting(false);
    }
  };

  const handleDelete = async (admin: AdminUserRecord) => {
    if (!isMaster || admin.role === 'master') return;
    if (!confirm(`Remove admin access for ${admin.email}?`)) return;
    if (editingAdmin?.email === admin.email) closeEdit();

    try {
      const res = await adminFetch(`/api/admin-auth?targetEmail=${encodeURIComponent(admin.email)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete admin');
      showNotification('Admin user removed');
      await loadAdmins();
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to delete admin');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          {isMaster
            ? 'View any account, or use Update / Delete on non-master rows.'
            : 'You can add new admins and view accounts. Only the master admin can update or remove.'}
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Admin
        </button>
      </div>

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
            onClick={closeCreate}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-admin-heading"
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              onSubmit={handleCreate}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-gray-900 border border-violet-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Plus className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 id="create-admin-heading" className="text-base font-semibold text-white">
                      Create new admin
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">They can sign in to this dashboard immediately</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeCreate}
                  className="p-2 text-gray-500 hover:text-white shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {createError && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                  {createError}
                </p>
              )}

              <div className="rounded-xl border border-gray-700/80 bg-gray-900/40 p-4 space-y-4">
                <p className="text-xs font-medium uppercase tracking-wider text-violet-400/90">Personal</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Full name *</label>
                    <input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateField('name', e.target.value)}
                      required
                      placeholder="e.g. Priya Sharma"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Job title</label>
                    <input
                      type="text"
                      value={createForm.job_title}
                      onChange={(e) => setCreateField('job_title', e.target.value)}
                      placeholder="e.g. Store Manager"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-700/80 bg-gray-900/40 p-4 space-y-4">
                <p className="text-xs font-medium uppercase tracking-wider text-violet-400/90">Contact</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Email *</label>
                    <input
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateField('email', e.target.value)}
                      required
                      placeholder="admin@example.com"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Phone *</label>
                    <input
                      type="tel"
                      value={createForm.phone}
                      onChange={(e) => setCreateField('phone', e.target.value)}
                      required
                      placeholder="e.g. 98XXXXXXXX"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-700/80 bg-gray-900/40 p-4 space-y-4">
                <p className="text-xs font-medium uppercase tracking-wider text-violet-400/90">Location</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Address</label>
                    <input
                      type="text"
                      value={createForm.address}
                      onChange={(e) => setCreateField('address', e.target.value)}
                      placeholder="Street address"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">City</label>
                    <input
                      type="text"
                      value={createForm.city}
                      onChange={(e) => setCreateField('city', e.target.value)}
                      placeholder="e.g. Kathmandu"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-700/80 bg-gray-900/40 p-4 space-y-4">
                <p className="text-xs font-medium uppercase tracking-wider text-violet-400/90">Login credentials</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Password *</label>
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateField('password', e.target.value)}
                      required
                      placeholder="Strong password"
                      className={inputClass}
                    />
                    <p className="text-[11px] text-gray-500 mt-1">{PASSWORD_REQUIREMENTS_HINT}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-1.5">Confirm password *</label>
                    <input
                      type="password"
                      value={createForm.passwordConfirm}
                      onChange={(e) => setCreateField('passwordConfirm', e.target.value)}
                      required
                      minLength={6}
                      placeholder="Repeat password"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-1">
                <button
                  type="button"
                  onClick={closeCreate}
                  className="px-4 py-2.5 text-sm text-gray-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 disabled:opacity-50"
                >
                  {createSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create account
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update modal */}
      <AnimatePresence>
        {editingAdmin && isMaster && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
            onClick={closeEdit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="update-admin-heading"
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              onSubmit={handleUpdate}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-gray-900 border border-amber-500/30 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Pencil className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 id="update-admin-heading" className="text-base font-semibold text-white">
                      Update admin
                    </h3>
                    <p className="text-sm text-gray-400 truncate mt-0.5">{editingAdmin.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="p-2 text-gray-500 hover:text-white shrink-0"
                  aria-label="Close update"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {updateError && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                  {updateError}
                </p>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-xl border border-gray-700/80 bg-gray-900/40 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-amber-400/90">
                    <User className="w-3.5 h-3.5" />
                    Profile
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Display name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditField('name', e.target.value)}
                      required
                      className={editInputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Job title</label>
                    <input
                      type="text"
                      value={editForm.job_title}
                      onChange={(e) => setEditField('job_title', e.target.value)}
                      className={editInputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditField('phone', e.target.value)}
                      className={editInputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Address</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditField('address', e.target.value)}
                      className={editInputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">City</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditField('city', e.target.value)}
                      className={editInputClass}
                    />
                  </div>
                  <div className="pt-2 border-t border-gray-700/60 sm:col-span-2">
                    <p className="text-xs text-gray-500">Login email</p>
                    <p className="text-sm text-gray-300 mt-1 flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-gray-500" />
                      {editingAdmin.email}
                    </p>
                    <p className="text-[11px] text-gray-600 mt-1">Email cannot be changed after creation</p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-700/80 bg-gray-900/40 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-amber-400/90">
                    <KeyRound className="w-3.5 h-3.5" />
                    Reset password
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Leave both fields empty to keep the current password unchanged. {PASSWORD_REQUIREMENTS_HINT}
                  </p>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">New password</label>
                    <input
                      type="password"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Optional"
                      className={editInputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Confirm new password</label>
                    <input
                      type="password"
                      value={editPasswordConfirm}
                      onChange={(e) => setEditPasswordConfirm(e.target.value)}
                      minLength={6}
                      placeholder="Repeat if changing"
                      className={editInputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-1 border-t border-amber-500/10">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-4 py-2.5 text-sm text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateSubmitting}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/90 text-gray-900 text-sm font-semibold hover:bg-amber-400 disabled:opacity-50"
                >
                  {updateSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save updates
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View modal */}
      <AnimatePresence>
        {viewingAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
            onClick={closeView}
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-admin-heading"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-gray-900 border border-violet-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Eye className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 id="view-admin-heading" className="text-base font-semibold text-white">
                      Admin details
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Read-only account information</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeView}
                  className="p-2 text-gray-500 hover:text-white shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Name</p>
                  <p className="text-sm text-white font-medium">{viewingAdmin.name}</p>
                  {viewingAdmin.job_title && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3" />
                      {viewingAdmin.job_title}
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Email</p>
                  <p className="text-sm text-gray-300 flex items-center gap-2 break-all">
                    <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    {viewingAdmin.email}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Phone</p>
                  <p className="text-sm text-gray-300 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                    {viewingAdmin.phone || '-'}
                  </p>
                </div>
                {(viewingAdmin.address || viewingAdmin.city) && (
                  <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Location</p>
                    <p className="text-sm text-gray-300 flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
                      <span>
                        {viewingAdmin.address || '-'}
                        {viewingAdmin.city && (
                          <>
                            {viewingAdmin.address && <br />}
                            {viewingAdmin.city}
                          </>
                        )}
                      </span>
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Role</p>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        viewingAdmin.role === 'master'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-gray-700/50 text-gray-400 border-gray-600/30'
                      }`}
                    >
                      {viewingAdmin.role === 'master' && <Shield className="w-3 h-3" />}
                      {viewingAdmin.role === 'master' ? 'Master' : 'Admin'}
                    </span>
                  </div>
                  <div className="rounded-xl border border-gray-700/80 bg-gray-800/50 p-4">
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Added</p>
                    <p className="text-sm text-gray-300 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      {formatDate(viewingAdmin.created_at)}
                    </p>
                  </div>
                </div>
                {currentEmail === viewingAdmin.email && (
                  <p className="text-xs text-violet-400/90 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2">
                    This is your signed-in account.
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end mt-6 pt-4 border-t border-gray-700/60">
                {isMaster && viewingAdmin.role !== 'master' && (
                  <button
                    type="button"
                    onClick={() => {
                      closeView();
                      openEdit(viewingAdmin);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-colors sm:mr-auto"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit account
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeView}
                  className="px-4 py-2.5 text-sm text-gray-400 hover:text-white rounded-xl"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/60 border border-gray-700 rounded-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-gray-700">
          <h3 className="text-base font-semibold text-white">All admin accounts</h3>
          <span className="text-xs text-gray-500 shrink-0">{admins.length} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 sm:px-6 py-3 w-14">SN</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 sm:px-6 py-3">Name</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 sm:px-6 py-3">Email</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 sm:px-6 py-3">Role</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 sm:px-6 py-3">Added</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 sm:px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Loading admin users…
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No admin users found
                  </td>
                </tr>
              ) : (
                admins.map((admin, i) => {
                  const sn = i + 1;
                  const isCurrent = currentEmail === admin.email;
                  const isMasterRow = admin.role === 'master';
                  const canManage = isMaster && !isMasterRow;

                  return (
                    <motion.tr
                      key={admin.email}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-400">{sn}</td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{admin.name}</p>
                          {isCurrent && (
                            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-300 min-w-0">
                          <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          <span className="truncate">{admin.email}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            isMasterRow
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-gray-700/50 text-gray-400 border-gray-600/30'
                          }`}
                        >
                          {isMasterRow && <Shield className="w-3 h-3" />}
                          {isMasterRow ? 'Master' : 'Admin'}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          {formatDate(admin.created_at)}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openView(admin)}
                            title="View"
                            className="p-2 rounded-lg text-gray-400 hover:text-violet-400 hover:bg-violet-500/10 transition-colors"
                            aria-label={`View ${admin.name}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {isMaster && canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEdit(admin)}
                                title="Update"
                                className="p-2 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                                aria-label={`Update ${admin.name}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(admin)}
                                title="Delete"
                                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                aria-label={`Delete ${admin.name}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {isMaster && isMasterRow && (
                            <span className="text-xs text-gray-600 px-1">Protected</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
