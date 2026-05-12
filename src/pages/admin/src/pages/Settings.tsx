import { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Truck, CreditCard, Bell, Shield, Globe, Save, Check } from 'lucide-react';

const tabs = [
  { id: 'general', label: 'General', icon: Store },
  { id: 'shipping', label: 'Shipping', icon: Truck },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-xl font-semibold text-white">Settings</h3>
        <p className="text-sm text-slate-500 mt-1">Manage your store preferences and configurations</p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 overflow-x-auto pb-2"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors border ${
                activeTab === tab.id
                  ? 'bg-accent/10 text-accent border-accent/30'
                  : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-slate-300'
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
        className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6"
      >
        {activeTab === 'general' && <GeneralSettings />}
        {activeTab === 'shipping' && <ShippingSettings />}
        {activeTab === 'payments' && <PaymentSettings />}
        {activeTab === 'notifications' && <NotificationSettings />}
        {activeTab === 'security' && <SecuritySettings />}

        <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-slate-950 font-semibold rounded-xl transition-colors text-sm"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function GeneralSettings() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="text-sm font-medium text-white mb-2 block">Store Name</label>
          <input
            type="text"
            defaultValue="Dwarika"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-white mb-2 block">Store Email</label>
          <input
            type="email"
            defaultValue="hello@dwarika.com"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-white mb-2 block">Store Description</label>
        <textarea
          rows={3}
          defaultValue="Premium curated products for the modern lifestyle."
          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all resize-none"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="text-sm font-medium text-white mb-2 block">Currency</label>
          <select className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all">
            <option>USD ($)</option>
            <option>EUR (€)</option>
            <option>GBP (£)</option>
            <option>JPY (¥)</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-white mb-2 block">Timezone</label>
          <select className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all">
            <option>America/New_York (EST)</option>
            <option>America/Los_Angeles (PST)</option>
            <option>Europe/London (GMT)</option>
            <option>Asia/Tokyo (JST)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function ShippingSettings() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="text-sm font-medium text-white mb-2 block">Free Shipping Threshold</label>
          <input
            type="text"
            defaultValue="50.00"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-white mb-2 block">Standard Shipping Rate</label>
          <input
            type="text"
            defaultValue="5.99"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="text-sm font-medium text-white mb-2 block">Express Shipping Rate</label>
          <input
            type="text"
            defaultValue="12.99"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-white mb-2 block">Processing Time (days)</label>
          <input
            type="number"
            defaultValue="1"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
        </div>
      </div>
    </div>
  );
}

function PaymentSettings() {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {['Credit / Debit Card', 'PayPal', 'Apple Pay', 'Google Pay'].map((method) => (
          <label key={method} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl cursor-pointer hover:bg-slate-800/50 transition-colors">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-white">{method}</span>
            </div>
            <input type="checkbox" defaultChecked className="w-4 h-4 accent-accent rounded" />
          </label>
        ))}
      </div>
    </div>
  );
}

function NotificationSettings() {
  const [toggles, setToggles] = useState({
    newOrders: true,
    lowStock: true,
    newReviews: false,
    customerSignups: true,
    dailyReport: true,
    marketingEmails: false,
  });

  const toggle = (key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-3">
      {Object.entries(toggles).map(([key, value]) => (
        <label key={key} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl cursor-pointer hover:bg-slate-800/50 transition-colors">
          <div>
            <p className="text-sm text-white capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {key === 'newOrders' && 'Get notified when a new order is placed'}
              {key === 'lowStock' && 'Alert when product inventory is low'}
              {key === 'newReviews' && 'Notification for new customer reviews'}
              {key === 'customerSignups' && 'Alert when a new customer registers'}
              {key === 'dailyReport' && 'Receive daily sales summary email'}
              {key === 'marketingEmails' && 'Receive promotional and marketing emails'}
            </p>
          </div>
          <button
            onClick={() => toggle(key as keyof typeof toggles)}
            className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-accent' : 'bg-slate-700'}`}
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

function SecuritySettings() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="text-sm font-medium text-white mb-2 block">Current Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="text-sm font-medium text-white mb-2 block">New Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-white mb-2 block">Confirm Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
        </div>
      </div>
      <div className="p-4 bg-slate-800/30 rounded-xl">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
            <p className="text-xs text-slate-500">Add an extra layer of security to your account</p>
          </div>
          <button className="ml-auto px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium rounded-lg transition-colors">
            Enable
          </button>
        </div>
      </div>
    </div>
  );
}
