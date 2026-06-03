import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { adminFetch } from '../../lib/adminApi';
import { PASSWORD_REQUIREMENTS_HINT, validatePasswordStrength } from '../../lib/passwordPolicy';

const inputClass =
  'w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all';

export default function AdminResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Invalid reset link. Request a new password reset from the admin login page.');
      return;
    }

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.ok) {
      setError(passwordCheck.error || 'Password does not meet requirements');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await adminFetch('/api/admin-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not reset password');
      setSuccess(data.message || 'Password updated. You can sign in now.');
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-gray-900/60 border border-gray-800 p-8 rounded-lg"
      >
        <h1 className="text-2xl font-serif font-medium text-white text-center">Set New Admin Password</h1>
        <p className="mt-2 text-sm text-gray-500 text-center">Choose a new password for your admin account.</p>

        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-sm text-red-400">{error}</div>
        )}
        {success && (
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-lg text-sm text-emerald-400">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-xs font-medium tracking-[0.1em] uppercase text-gray-400 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Enter new password"
              />
            </div>
            {!error && <p className="text-xs text-gray-500 mt-1">{PASSWORD_REQUIREMENTS_HINT}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium tracking-[0.1em] uppercase text-gray-400 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-violet-500 text-white text-xs font-medium tracking-[0.15em] uppercase hover:bg-violet-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Update Password <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="text-violet-500 hover:text-violet-400 font-medium">
            Back to admin sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
