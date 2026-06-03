import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPasswordWithToken } from '../lib/customerAuth';
import { PASSWORD_REQUIREMENTS_HINT, validatePasswordStrength } from '../lib/passwordPolicy';

export default function ResetPassword() {
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
      setError('Invalid reset link. Request a new password reset from the login page.');
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
      const data = await resetPasswordWithToken(token, password);
      setSuccess(data.message || 'Password updated. You can sign in now.');
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm"
      >
        <h1 className="text-2xl font-serif font-medium text-gray-900 text-center">Set New Password</h1>
        <p className="mt-2 text-sm text-gray-500 text-center">Choose a new password for your account.</p>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}
        {success && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="block text-xs font-medium tracking-[0.1em] uppercase text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#faf9f7] border border-gray-200 text-sm focus:outline-none focus:border-[#c9a962]"
                placeholder="Enter new password"
              />
            </div>
            {!error && (
              <p className="text-xs text-gray-400 mt-1">{PASSWORD_REQUIREMENTS_HINT}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium tracking-[0.1em] uppercase text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#faf9f7] border border-gray-200 text-sm focus:outline-none focus:border-[#c9a962]"
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gray-900 text-white text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#c9a962] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Update Password <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          <Link to="/login" className="text-[#c9a962] hover:text-[#a88b4a] font-medium">
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
