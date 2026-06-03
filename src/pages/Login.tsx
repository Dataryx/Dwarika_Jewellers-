import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  loginCustomer,
  registerCustomer,
  requestPasswordReset,
  resendVerificationEmail,
  CustomerAuthError,
} from '../lib/customerAuth';
import { PASSWORD_REQUIREMENTS_HINT, validatePasswordStrength } from '../lib/passwordPolicy';
import { validateEmailAddress } from '../lib/emailValidation';

const DWARIKA_LOGO = '/DWARIKA%20MAIN%20LOGO.png';

type AuthMode = 'login' | 'signup' | 'forgot-password';

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  fullName?: string;
  general?: string;
}

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState('');

  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const validateEmail = (value: string): string | undefined => {
    const check = validateEmailAddress(value);
    if (!check.ok) return check.error || 'Please enter a valid email address';
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (!value) return 'Password is required';
    if (mode === 'signup') {
      const check = validatePasswordStrength(value);
      if (!check.ok) return check.error || 'Password does not meet requirements';
    }
    return undefined;
  };

  const validateConfirmPassword = (confirm: string, pass: string): string | undefined => {
    if (mode !== 'signup') return undefined;
    if (!confirm) return 'Please confirm your password';
    if (confirm !== pass) return 'Passwords do not match';
    return undefined;
  };

  const validateFullName = (name: string): string | undefined => {
    if (mode !== 'signup') return undefined;
    if (!name.trim()) return 'Full name is required';
    if (name.trim().length < 2) return 'Name must be at least 2 characters';
    return undefined;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;
    if (mode !== 'forgot-password') {
      const passwordError = validatePassword(password);
      if (passwordError) newErrors.password = passwordError;
    }
    if (mode === 'signup') {
      const confirmError = validateConfirmPassword(confirmPassword, password);
      if (confirmError) newErrors.confirmPassword = confirmError;
      const nameError = validateFullName(fullName);
      if (nameError) newErrors.fullName = nameError;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');
    setPendingVerificationEmail('');
    if (!validateForm()) return;
    setLoading(true);

    try {
      if (mode === 'login') {
        await loginCustomer(email, password);
        await refreshUser();
        navigate(from, { replace: true });
      } else if (mode === 'signup') {
        const data = await registerCustomer({
          email: email.trim().toLowerCase(),
          password,
          name: fullName.trim(),
        });
        setSuccessMessage(
          data.message ||
            'Account created! Check your email and click the confirmation link before signing in.'
        );
        setPendingVerificationEmail(email.trim().toLowerCase());
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      } else if (mode === 'forgot-password') {
        const data = await requestPasswordReset(email.trim().toLowerCase());
        setSuccessMessage(data.message || 'If an account exists for that email, a reset link has been sent.');
      }
    } catch (err) {
      if (err instanceof CustomerAuthError && err.code === 'EMAIL_NOT_VERIFIED') {
        setPendingVerificationEmail(err.email || email.trim().toLowerCase());
      }
      setErrors({
        general: err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const target = pendingVerificationEmail || email.trim().toLowerCase();
    if (!target) {
      setErrors({ general: 'Enter your email address first.' });
      return;
    }
    setResending(true);
    setErrors({});
    try {
      const data = await resendVerificationEmail(target);
      setSuccessMessage(
        data.message || 'If an unverified account exists for that email, a new confirmation link has been sent.'
      );
      setPendingVerificationEmail(target);
    } catch (err) {
      setErrors({
        general: err instanceof Error ? err.message : 'Could not resend confirmation email.',
      });
    } finally {
      setResending(false);
    }
  };

  const clearFieldError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] sm:min-h-[calc(100dvh-5rem)] bg-[#faf9f7] flex">
      <div className="hidden lg:block lg:w-1/2 relative min-h-[inherit]">
        <img
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200"
          alt="Luxury Jewelry"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#faf9f7] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="text-3xl font-serif font-medium">Timeless Elegance</h2>
          <p className="mt-2 text-white/80">Discover handcrafted jewelry for life's precious moments.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-start min-h-[inherit] pt-1 sm:pt-2 pb-6 px-6 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center justify-center mb-3">
            <img
              src={DWARIKA_LOGO}
              alt="Dwarika"
              className="h-40 sm:h-44 lg:h-48 w-auto max-w-full object-contain"
            />
          </Link>

          <div className="text-center mb-5">
            <h1 className="text-2xl font-serif font-medium text-gray-900">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot-password' && 'Reset Password'}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {mode === 'login' && 'Sign in to your account'}
              {mode === 'signup' && 'Join us for exclusive access'}
              {mode === 'forgot-password' && "We'll email you a reset link"}
            </p>
          </div>

          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg space-y-3"
              >
                <p className="text-sm text-green-700">{successMessage}</p>
                {pendingVerificationEmail && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="text-sm font-medium text-[#c9a962] hover:text-[#a88b4a] disabled:opacity-50"
                  >
                    {resending ? 'Sending…' : 'Resend confirmation email'}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg space-y-3"
              >
                <p className="text-sm text-red-700">{errors.general}</p>
                {pendingVerificationEmail && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="text-sm font-medium text-[#c9a962] hover:text-[#a88b4a] disabled:opacity-50"
                  >
                    {resending ? 'Sending…' : 'Resend confirmation email'}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <label className="block text-xs font-medium tracking-[0.1em] uppercase text-gray-700">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        clearFieldError('fullName');
                      }}
                      placeholder="Enter your full name"
                      className={`w-full pl-12 pr-4 py-3 bg-white border ${
                        errors.fullName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#c9a962]'
                      } text-sm focus:outline-none transition-colors`}
                    />
                  </div>
                  {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              <label className="block text-xs font-medium tracking-[0.1em] uppercase text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                  }}
                  placeholder="Enter your email"
                  className={`w-full pl-12 pr-4 py-3 bg-white border ${
                    errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#c9a962]'
                  } text-sm focus:outline-none transition-colors`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <AnimatePresence>
              {mode !== 'forgot-password' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <label className="block text-xs font-medium tracking-[0.1em] uppercase text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        clearFieldError('password');
                      }}
                      placeholder="Enter your password"
                      className={`w-full pl-12 pr-12 py-3 bg-white border ${
                        errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#c9a962]'
                      } text-sm focus:outline-none transition-colors`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                  {mode === 'signup' && !errors.password && (
                    <p className="text-xs text-gray-400 mt-1">{PASSWORD_REQUIREMENTS_HINT}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1"
                >
                  <label className="block text-xs font-medium tracking-[0.1em] uppercase text-gray-700">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        clearFieldError('confirmPassword');
                      }}
                      placeholder="Confirm your password"
                      className={`w-full pl-12 pr-12 py-3 bg-white border ${
                        errors.confirmPassword ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#c9a962]'
                      } text-sm focus:outline-none transition-colors`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot-password');
                    setErrors({});
                    setSuccessMessage('');
                  }}
                  className="text-xs text-[#c9a962] hover:text-[#a88b4a] font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gray-900 text-white text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#c9a962] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot-password' && 'Send Reset Link'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            {mode === 'login' && (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrors({});
                    setSuccessMessage('');
                  }}
                  className="text-[#c9a962] hover:text-[#a88b4a] font-medium"
                >
                  Sign up
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrors({});
                    setSuccessMessage('');
                  }}
                  className="text-[#c9a962] hover:text-[#a88b4a] font-medium"
                >
                  Sign in
                </button>
              </>
            )}
            {mode === 'forgot-password' && (
              <>
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrors({});
                    setSuccessMessage('');
                  }}
                  className="text-[#c9a962] hover:text-[#a88b4a] font-medium"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
