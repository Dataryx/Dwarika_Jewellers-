import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Save, Check, Loader2, Send } from 'lucide-react';
import { adminFetch } from '../../lib/adminApi';
import { AdminPage, settingsFormGridClass, useAdminSidebarOpen } from '../../lib/adminPageLayout';
import { showAdminNotification } from '../../components/Notification';

type SmtpSecurity = 'auto' | 'tls' | 'ssl' | 'none';

interface SmtpConfig {
  enabled: boolean;
  host: string;
  port: number;
  security: SmtpSecurity;
  username: string;
  password: string;
  passwordSet: boolean;
  fromEmail: string;
  fromName: string;
  replyTo: string;
}

const DEFAULTS: SmtpConfig = {
  enabled: false,
  host: 'smtp.gmail.com',
  port: 587,
  security: 'auto',
  username: '',
  password: '',
  passwordSet: false,
  fromEmail: '',
  fromName: 'Dwarika',
  replyTo: '',
};

const inputClass =
  'w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20';

export default function AdminSmtp() {
  const sidebarOpen = useAdminSidebarOpen();
  const [form, setForm] = useState<SmtpConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [error, setError] = useState('');
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    adminFetch('/api/smtp')
      .then((r) => r.json())
      .then((data) => {
        setForm({ ...DEFAULTS, ...data });
        if (data.fromEmail) setTestEmail(data.fromEmail);
        else if (data.username) setTestEmail(data.username);
      })
      .catch(() => setError('Could not load SMTP settings'))
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof SmtpConfig>(key: K, value: SmtpConfig[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setTestSuccess(false);
    setSaved(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testSuccess) {
      showAdminNotification('Run a successful test before saving SMTP settings.', 'error');
      return;
    }
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const payload: Record<string, unknown> = { ...form };
      delete payload.passwordSet;
      if (!form.password) delete payload.password;

      const res = await adminFetch('/api/smtp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save SMTP settings');
      }
      const data = await res.json();
      setForm({ ...DEFAULTS, ...data });
      setSaved(true);
      setTestSuccess(false);
      showAdminNotification('SMTP settings saved successfully.');
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail.trim()) {
      showAdminNotification('Enter a test recipient email.', 'error');
      return;
    }
    if (!form.password.trim()) {
      showAdminNotification('Enter the SMTP app password before testing.', 'error');
      return;
    }
    setTesting(true);
    setError('');
    setTestSuccess(false);
    try {
      const config: Record<string, unknown> = {
        enabled: true,
        host: form.host,
        port: form.port,
        security: form.security,
        username: form.username,
        fromEmail: form.fromEmail,
        fromName: form.fromName,
        replyTo: form.replyTo,
        password: form.password,
      };

      const res = await adminFetch('/api/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', toEmail: testEmail.trim(), config }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Test email failed');

      const msg = data.message || 'Test successful! Save your SMTP settings to apply them.';
      setTestSuccess(true);
      showAdminNotification(msg, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Test email failed';
      setError(msg);
      showAdminNotification(msg, 'error');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <AdminPage>
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading SMTP settings…
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <Mail className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-900">SMTP Configuration</h3>
            <p className="text-sm text-slate-500 mt-1">
              Send order receipt emails to customers after checkout
            </p>
          </div>
        </div>
      </motion.div>

      {testSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-500/20 text-emerald-600 text-sm"
        >
          <Check className="w-4 h-4 shrink-0" />
          <span>
            <strong className="font-medium">Test successful!</strong> A configuration test was sent to{' '}
            {testEmail.trim()}. Customer order emails will still go to each buyer’s address. Save below to apply.
          </span>
        </motion.div>
      )}

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-500/20 text-emerald-600 text-sm"
        >
          <Check className="w-4 h-4" /> Settings saved
        </motion.div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-500/20 text-red-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5"
        >
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => update('enabled', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-violet-500 focus:ring-violet-500/30"
            />
            <span className="text-sm text-slate-900 font-medium">Enable receipt emails on new orders</span>
          </label>

          <div className={settingsFormGridClass(sidebarOpen)}>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">SMTP Server</label>
              <input
                type="text"
                value={form.host}
                onChange={(e) => update('host', e.target.value)}
                placeholder="smtp.gmail.com"
                className={inputClass}
              />
              <p className="text-[11px] text-slate-600 mt-1">Gmail: smtp.gmail.com · Port 587</p>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Port</label>
              <input
                type="number"
                value={form.port}
                onChange={(e) => update('port', Number(e.target.value) || 587)}
                className={inputClass}
              />
              <p className="text-[11px] text-slate-600 mt-1">Common: 587 (TLS), 465 (SSL), 25</p>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Security</label>
              <select
                value={form.security}
                onChange={(e) => update('security', e.target.value as SmtpSecurity)}
                className={inputClass}
              >
                <option value="auto">Auto</option>
                <option value="tls">TLS (STARTTLS)</option>
                <option value="ssl">SSL</option>
                <option value="none">None</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Username</label>
              <input
                type="email"
                value={form.username}
                onChange={(e) => update('username', e.target.value)}
                placeholder="your@gmail.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">App password</label>
              <input
                type="text"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="16-character Gmail app password"
                className={inputClass}
                autoComplete="off"
                spellCheck={false}
              />
              <p className="text-[11px] text-slate-600 mt-1">
                For Gmail, use an App Password - not your login password.
              </p>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">From email address</label>
              <input
                type="email"
                value={form.fromEmail}
                onChange={(e) => update('fromEmail', e.target.value)}
                placeholder="store@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">From name</label>
              <input
                type="text"
                value={form.fromName}
                onChange={(e) => update('fromName', e.target.value)}
                placeholder="Dwarika"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Reply-to email (optional)</label>
              <input
                type="email"
                value={form.replyTo}
                onChange={(e) => update('replyTo', e.target.value)}
                placeholder="Same as from email"
                className={inputClass}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4"
        >
          <h4 className="text-sm font-medium text-slate-900">Test configuration</h4>
          <p className="text-xs text-slate-500">
            Sends a one-time connection test to the address below (not a real order).
            After checkout, confirmation emails always go to the customer’s email — never this test address.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => {
                setTestEmail(e.target.value);
                setTestSuccess(false);
              }}
              placeholder="Test recipient email"
              className={`${inputClass} sm:flex-1`}
            />
            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 hover:bg-slate-100 disabled:opacity-50 shrink-0"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Test it
            </button>
          </div>
        </motion.div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {!testSuccess && (
            <p className="text-xs text-slate-500">Test your configuration before saving.</p>
          )}
          <button
            type="submit"
            disabled={saving || !testSuccess}
            className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 sm:ml-auto ${
              testSuccess
                ? 'bg-emerald-600 hover:bg-emerald-500 ring-2 ring-emerald-400/30'
                : 'bg-violet-600 hover:bg-violet-500'
            }`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            Save SMTP settings
          </button>
        </div>
      </form>
    </AdminPage>
  );
}
