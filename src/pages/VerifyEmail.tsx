import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, Mail, ArrowRight } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { verifyEmailWithToken } from '../lib/customerAuth';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid confirmation link. Request a new one from the login page.');
      setLoading(false);
      return;
    }

    verifyEmailWithToken(token)
      .then(async (data) => {
        setMessage(data.message || 'Email confirmed! You are now signed in.');
        await refreshUser();
        setTimeout(() => navigate('/', { replace: true }), 2500);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not confirm your email.');
      })
      .finally(() => setLoading(false));
  }, [token, navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm text-center"
      >
        {loading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#c9a962]" />
            <p className="text-gray-500">Confirming your email…</p>
          </div>
        ) : error ? (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-serif font-medium text-gray-900">Confirmation failed</h1>
            <p className="mt-3 text-sm text-red-600">{error}</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 mt-8 text-sm text-[#c9a962] hover:text-[#a88b4a] font-medium"
            >
              Back to sign in <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-[#c9a962]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-[#c9a962]" />
            </div>
            <h1 className="text-2xl font-serif font-medium text-gray-900">Email confirmed</h1>
            <p className="mt-3 text-sm text-gray-500">{message}</p>
            <p className="mt-2 text-xs text-gray-400">Redirecting you to the store…</p>
          </>
        )}
      </motion.div>
    </div>
  );
}
