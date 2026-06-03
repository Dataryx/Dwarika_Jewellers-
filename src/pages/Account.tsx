import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Edit2, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateCustomerProfile } from '../lib/customerAuth';

export default function Account() {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  });

  useEffect(() => {
    if (!user) return;
    setFormData({
      fullName: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
    });
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateCustomerProfile({
        name: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
      });
      await refreshUser();
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-[#faf9f7]">
        <p className="text-gray-500">Please sign in to view your account.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-8 bg-[#faf9f7]">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <h1 className="text-3xl font-serif font-medium text-gray-900 mb-8">My Account</h1>

          {saved && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
            >
              <p className="text-sm text-green-700">Profile updated successfully!</p>
            </motion.div>
          )}

          <div className="bg-white p-5 sm:p-8 rounded-lg shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 bg-[#c9a962]/20 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-[#c9a962]" />
                </div>
                <div>
                  <h2 className="text-xl font-medium text-gray-900">
                    {formData.fullName || 'User'}
                  </h2>
                  <p className="text-sm text-gray-500">{formData.email}</p>
                </div>
              </div>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="p-2 text-gray-400 hover:text-[#c9a962] transition-colors"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium tracking-[0.1em] uppercase text-gray-500 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={!editing}
                    className={`w-full pl-12 pr-4 py-3 bg-[#faf9f7] border-0 text-sm focus:outline-none ${
                      editing ? 'focus:ring-1 focus:ring-[#c9a962]' : 'text-gray-600'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium tracking-[0.1em] uppercase text-gray-500 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-12 pr-4 py-3 bg-[#faf9f7] border-0 text-sm text-gray-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium tracking-[0.1em] uppercase text-gray-500 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Add phone number"
                    className={`w-full pl-12 pr-4 py-3 bg-[#faf9f7] border-0 text-sm focus:outline-none ${
                      editing ? 'focus:ring-1 focus:ring-[#c9a962]' : 'text-gray-600'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium tracking-[0.1em] uppercase text-gray-500 mb-2">
                  Address
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!editing}
                    placeholder="Add address"
                    className={`w-full pl-12 pr-4 py-3 bg-[#faf9f7] border-0 text-sm focus:outline-none ${
                      editing ? 'focus:ring-1 focus:ring-[#c9a962]' : 'text-gray-600'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium tracking-[0.1em] uppercase text-gray-500 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Add city"
                  className={`w-full px-4 py-3 bg-[#faf9f7] border-0 text-sm focus:outline-none ${
                    editing ? 'focus:ring-1 focus:ring-[#c9a962]' : 'text-gray-600'
                  }`}
                />
              </div>
            </div>

            {editing && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleSave}
                disabled={loading}
                className="mt-8 w-full py-4 bg-gray-900 text-white text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#c9a962] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

