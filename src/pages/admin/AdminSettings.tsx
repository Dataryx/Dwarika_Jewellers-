import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, CreditCard, Bell, Shield, Save, Check, Loader2, Gem } from 'lucide-react';
import { invalidateSettingsCache } from '../../lib/useStoreSettings';
import { AdminPage, settingsFormGridClass, useAdminSidebarOpen } from '../../lib/adminPageLayout';
import { adminFetch, setAdminToken } from '../../lib/adminApi';
import { useAdminAuth } from '../../lib/adminAuth';
import { PASSWORD_REQUIREMENTS_HINT, validatePasswordStrength } from '../../lib/passwordPolicy';

const tabs = [
  { id: 'pricing', label: 'Pricing', icon: Gem },
  { id: 'shipping', label: 'Shipping & Tax', icon: Truck },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
] as const;

type TabId = (typeof tabs)[number]['id'];

interface StoreSettings {
  taxRate: number;
  baseGoldRatePerGram: number;
  goldRatePerGram: number;
  silverRatePerGram: number;
  diamondRatePerCarat: number;
  goldMakingChargeRate: number;
  gramsPerTola: number;
  freeShippingThreshold: number;
  standardShippingRate: number;
  expressShippingRate: number;
  processingDays: number;
  paymentMethods: Record<string, boolean>;
  notifications: Record<string, boolean>;
}

const DEFAULTS: StoreSettings = {
  taxRate: 13,
  baseGoldRatePerGram: 16358,
  goldRatePerGram: 16358,
  silverRatePerGram: 434,
  diamondRatePerCarat: 28000,
  goldMakingChargeRate: 0.4,
  gramsPerTola: 11.664,
  freeShippingThreshold: 5000,
  standardShippingRate: 150,
  expressShippingRate: 350,
  processingDays: 2,
  paymentMethods: {
    'Cash on Delivery': true,
    eSewa: true,
    Khalti: true,
    'Bank Transfer': false,
    'Credit / Debit Card': false,
  },
  notifications: {
    newOrders: true,
    lowStock: true,
    newReviews: false,
    customerSignups: true,
    dailyReport: true,
    marketingEmails: false,
  },
};

export default function AdminSettings() {
  const sidebarOpen = useAdminSidebarOpen();
  const [activeTab, setActiveTab] = useState<TabId>('pricing');
  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminFetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        const merged = { ...DEFAULTS, ...data };
        if (!merged.paymentMethods || typeof merged.paymentMethods !== 'object') {
          merged.paymentMethods = DEFAULTS.paymentMethods;
        }
        setSettings(merged);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await adminFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      invalidateSettingsCache();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminPage>
        <div className="flex items-center justify-center py-20 text-gray-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading settings…
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h3 className="text-xl font-semibold text-white">Settings</h3>
        <p className="text-sm text-gray-500 mt-1">Manage shipping, payments, and notifications</p>
      </motion.div>

      {saved && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2"
        >
          <Check className="w-4 h-4 text-emerald-400" />
          <p className="text-emerald-400 text-sm">Settings saved successfully!</p>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
        >
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2 pb-1"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors border ${
                activeTab === tab.id
                  ? 'bg-violet-500/10 text-violet-500 border-violet-500/30'
                  : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-gray-800/60 border border-gray-700 rounded-2xl p-6 space-y-6"
      >
        {activeTab === 'pricing' && <PricingSettings settings={settings} update={update} sidebarOpen={sidebarOpen} />}
        {activeTab === 'shipping' && <ShippingSettings settings={settings} update={update} sidebarOpen={sidebarOpen} />}
        {activeTab === 'payments' && <PaymentSettings settings={settings} update={update} />}
        {activeTab === 'notifications' && <NotificationSettings settings={settings} update={update} />}
        {activeTab === 'security' && <SecuritySettings sidebarOpen={sidebarOpen} />}

        {activeTab !== 'security' && (
          <div className="flex items-center gap-3 pt-4 border-t border-gray-700">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl transition-colors text-sm disabled:opacity-50"
            >
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        )}
      </motion.div>
    </AdminPage>
  );
}

const inputClass =
  'w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all';
const labelClass = 'text-sm font-medium text-white mb-2 block';

type SettingsProps = {
  settings: StoreSettings;
  update: <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => void;
  sidebarOpen?: boolean;
};

function PricingSettings({ settings, update, sidebarOpen = true }: SettingsProps) {
  const [pricingTab, setPricingTab] = useState<'gold' | 'diamond'>('gold');
  const gridClass = settingsFormGridClass(sidebarOpen);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2 pb-1">
        <button
          onClick={() => setPricingTab('gold')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
            pricingTab === 'gold'
              ? 'bg-violet-500/10 text-violet-500 border-violet-500/30'
              : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:text-gray-300'
          }`}
        >
          Gold
        </button>
        <button
          onClick={() => setPricingTab('diamond')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
            pricingTab === 'diamond'
              ? 'bg-violet-500/10 text-violet-500 border-violet-500/30'
              : 'bg-gray-800/50 text-gray-400 border-gray-700 hover:text-gray-300'
          }`}
        >
          Diamond
        </button>
      </div>

      {pricingTab === 'gold' && (
        <div className={gridClass}>
          <div>
            <label className={labelClass}>Master Gold Rate - 24k fine (रु / gram)</label>
            <input
              type="number"
              step="0.01"
              value={settings.goldRatePerGram}
              onChange={(e) => update('goldRatePerGram', Number(e.target.value))}
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1">
              Per tola: रु {Math.round(settings.goldRatePerGram * settings.gramsPerTola).toLocaleString('en-IN')} - homepage ticker & product pricing
            </p>
          </div>
          <div>
            <label className={labelClass}>Master Silver Rate (रु / gram)</label>
            <input
              type="number"
              step="0.01"
              value={settings.silverRatePerGram}
              onChange={(e) => update('silverRatePerGram', Number(e.target.value))}
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1">
              Per tola: रु {Math.round(settings.silverRatePerGram * settings.gramsPerTola).toLocaleString('en-IN')}
            </p>
          </div>
          <div>
            <label className={labelClass}>Grams Per Tola</label>
            <input
              type="number"
              step="0.001"
              value={settings.gramsPerTola}
              onChange={(e) => update('gramsPerTola', Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Gold Making Charge Rate</label>
            <input
              type="number"
              step="0.01"
              value={settings.goldMakingChargeRate}
              onChange={(e) => update('goldMakingChargeRate', Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {pricingTab === 'diamond' && (
        <div className={gridClass}>
          <div>
            <label className={labelClass}>Master Diamond Rate (रु / carat)</label>
            <input
              type="number"
              step="0.01"
              value={settings.diamondRatePerCarat}
              onChange={(e) => update('diamondRatePerCarat', Number(e.target.value))}
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-1">Used for dynamic diamond pricing across storefront</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ShippingSettings({ settings, update, sidebarOpen = true }: SettingsProps) {
  const gridClass = settingsFormGridClass(sidebarOpen);

  return (
    <div className="space-y-5">
      <div className={gridClass}>
        <div>
          <label className={labelClass}>Free Shipping Threshold (रु)</label>
          <input
            type="number"
            value={settings.freeShippingThreshold}
            onChange={(e) => update('freeShippingThreshold', Number(e.target.value))}
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">Orders above this amount get free shipping</p>
        </div>
        <div>
          <label className={labelClass}>Standard Shipping Rate (रु)</label>
          <input
            type="number"
            step="1"
            value={settings.standardShippingRate}
            onChange={(e) => update('standardShippingRate', Number(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>
      <div className={gridClass}>
        <div>
          <label className={labelClass}>Express Shipping Rate (रु)</label>
          <input
            type="number"
            step="1"
            value={settings.expressShippingRate}
            onChange={(e) => update('expressShippingRate', Number(e.target.value))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Processing Time (days)</label>
          <input
            type="number"
            value={settings.processingDays}
            onChange={(e) => update('processingDays', Number(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>
      <div className={gridClass}>
        <div>
          <label className={labelClass}>Tax Rate (%)</label>
          <input
            type="number"
            step="0.1"
            value={settings.taxRate}
            onChange={(e) => update('taxRate', Number(e.target.value))}
            className={inputClass}
          />
          <p className="text-xs text-gray-500 mt-1">Applied to all orders at checkout</p>
        </div>
      </div>
    </div>
  );
}

function PaymentSettings({ settings, update }: SettingsProps) {
  const [newMethod, setNewMethod] = useState('');

  const toggle = (method: string) => {
    update('paymentMethods', {
      ...settings.paymentMethods,
      [method]: !settings.paymentMethods[method],
    });
  };

  const addMethod = () => {
    const name = newMethod.trim();
    if (!name || settings.paymentMethods[name] !== undefined) return;
    update('paymentMethods', { ...settings.paymentMethods, [name]: true });
    setNewMethod('');
  };

  const removeMethod = (method: string) => {
    const copy = { ...settings.paymentMethods };
    delete copy[method];
    update('paymentMethods', copy);
  };

  const descriptions: Record<string, string> = {
    'Cash on Delivery': 'Customer pays when the order arrives',
    eSewa: 'Pay via eSewa digital wallet',
    Khalti: 'Pay via Khalti digital wallet',
    'Bank Transfer': 'Direct bank transfer / NEFT',
    'Credit / Debit Card': 'Visa, Mastercard, etc.',
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Toggle payment methods on or off. Only enabled methods appear on checkout. Currently only{' '}
        <span className="text-gray-300">Cash on Delivery</span> can complete an order - other methods are shown as coming soon.
      </p>

      {/* Add new method */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newMethod}
          onChange={(e) => setNewMethod(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMethod())}
          placeholder="Add new payment method…"
          className={inputClass}
        />
        <button
          type="button"
          onClick={addMethod}
          disabled={!newMethod.trim()}
          className="px-4 py-2.5 bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-40 shrink-0"
        >
          + Add
        </button>
      </div>

      {/* Existing methods */}
      {Object.entries(settings.paymentMethods).map(([method, enabled]) => (
        <div
          key={method}
          className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-gray-400" />
            <div>
              <span className="text-sm text-white">{method}</span>
              {descriptions[method] && (
                <p className="text-xs text-gray-500 mt-0.5">{descriptions[method]}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium ${enabled ? 'text-emerald-400' : 'text-gray-500'}`}>
              {enabled ? 'Visible' : 'Hidden'}
            </span>
            <button
              type="button"
              onClick={() => toggle(method)}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${enabled ? 'bg-violet-500' : 'bg-gray-700'}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'left-6' : 'left-1'}`}
              />
            </button>
            <button
              type="button"
              onClick={() => removeMethod(method)}
              className="text-gray-600 hover:text-red-400 transition-colors ml-1"
              title="Remove method"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationSettings({ settings, update }: SettingsProps) {
  const toggle = (key: string) => {
    update('notifications', {
      ...settings.notifications,
      [key]: !settings.notifications[key],
    });
  };

  const descriptions: Record<string, string> = {
    newOrders: 'Get notified when a new order is placed',
    lowStock: 'Alert when product inventory is running low',
    newReviews: 'Notification for new customer reviews',
    customerSignups: 'Alert when a new customer registers',
    dailyReport: 'Receive daily sales summary email',
    marketingEmails: 'Receive promotional and marketing emails',
  };

  return (
    <div className="space-y-3">
      {Object.entries(settings.notifications).map(([key, value]) => (
        <label
          key={key}
          className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl cursor-pointer hover:bg-gray-800/50 transition-colors"
        >
          <div>
            <p className="text-sm text-white capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{descriptions[key]}</p>
          </div>
          <button
            type="button"
            onClick={() => toggle(key)}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${value ? 'bg-violet-500' : 'bg-gray-700'}`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${value ? 'left-6' : 'left-1'}`}
            />
          </button>
        </label>
      ))}
    </div>
  );
}

function SecuritySettings({ sidebarOpen = true }: { sidebarOpen?: boolean }) {
  const { email } = useAdminAuth();
  const gridClass = settingsFormGridClass(sidebarOpen);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handlePasswordChange = async () => {
    setMsg(null);
    if (!currentPw || !newPw) {
      setMsg({ type: 'err', text: 'Please fill in all password fields.' });
      return;
    }
    if (newPw !== confirmPw) {
      setMsg({ type: 'err', text: 'New passwords do not match.' });
      return;
    }
    const passwordCheck = validatePasswordStrength(newPw);
    if (!passwordCheck.ok) {
      setMsg({ type: 'err', text: passwordCheck.error || 'Password does not meet requirements.' });
      return;
    }
    setSaving(true);
    try {
      if (!email) throw new Error('Not signed in');
      const res = await adminFetch('/api/admin-auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      if (data.token) setAdminToken(data.token);
      setMsg({ type: 'ok', text: 'Password changed successfully!' });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err: unknown) {
      setMsg({ type: 'err', text: err instanceof Error ? err.message : 'Failed to change password.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {msg && (
        <div
          className={`p-3 rounded-lg text-sm ${
            msg.type === 'ok'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {msg.text}
        </div>
      )}
      <div className={gridClass}>
        <div>
          <label className={labelClass}>Current Password</label>
          <input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="••••••••"
            className={`${inputClass} placeholder-gray-500`}
          />
        </div>
        <div>
          <label className={labelClass}>New Password</label>
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="••••••••"
            className={`${inputClass} placeholder-gray-500`}
          />
          <p className="text-xs text-gray-500 mt-1">{PASSWORD_REQUIREMENTS_HINT}</p>
        </div>
        <div>
          <label className={labelClass}>Confirm Password</label>
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="••••••••"
            className={`${inputClass} placeholder-gray-500`}
          />
        </div>
      </div>
      <div className="flex items-center gap-3 pt-4 border-t border-gray-700">
        <button
          onClick={handlePasswordChange}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-500 hover:bg-violet-400 text-white font-semibold rounded-xl transition-colors text-sm disabled:opacity-50"
        >
          <Shield className="w-4 h-4" />
          {saving ? 'Updating...' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}
