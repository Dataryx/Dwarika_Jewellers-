import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle } from '../lib/googleAuth';

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
  const [successMessage, setSuccessMessage] = useState('');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const validateEmail = (email: string): string | undefined => {
    if (!email.trim()) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (mode === 'signup') {
      if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
      if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
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
    
    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;
    
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
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrors({ general: 'Invalid email or password. Please try again.' });
          } else if (error.message.includes('Email not confirmed')) {
            setErrors({ general: 'Please check your email and confirm your account.' });
          } else {
            setErrors({ general: error.message });
          }
          return;
        }
        navigate(from, { replace: true });
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });
        if (error) {
          if (error.message.includes('already registered')) {
            setErrors({ email: 'This email is already registered. Please log in.' });
          } else {
            setErrors({ general: error.message });
          }
          return;
        }
        setSuccessMessage('Account created! Please check your email to confirm your account.');
        setMode('login');
      } else if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) {
          setErrors({ general: error.message });
          return;
        }
        setSuccessMessage('Password reset link sent! Check your email.');
      }
    } catch (err) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signInWithGoogle('Dwarika');
  };

  const clearFieldError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] flex">
      {/* Left Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
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

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <svg className="w-8 h-8 text-[#c9a962]" viewBox="0 0 100 100">
              <polygon points="50,10 85,35 75,85 25,85 15,35" fill="currentColor" stroke="#a88b4a" strokeWidth="2"/>
              <polygon points="50,10 85,35 50,45 15,35" fill="#fbbf24" opacity="0.6"/>
            </svg>
            <span className="text-xl font-serif font-medium tracking-[0.2em] text-gray-900">DWARIKA</span>
          </Link>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-serif font-medium text-gray-900">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot-password' && 'Reset Password'}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {mode === 'login' && 'Sign in to your account'}
              {mode === 'signup' && 'Join us for exclusive access'}
              {mode === 'forgot-password' && 'We\'ll send you a reset link'}
            </p>
          </div>

          {/* Success Message */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <p className="text-sm text-green-700">{successMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* General Error */}
          <AnimatePresence>
            {errors.general && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-sm text-red-700">{errors.general}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name - Signup only */}
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
                      onChange={(e) => { setFullName(e.target.value); clearFieldError('fullName'); }}
                      placeholder="Enter your full name"
                      className={`w-full pl-12 pr-4 py-3 bg-white border ${
                        errors.fullName ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#c9a962]'
                      } text-sm focus:outline-none transition-colors`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-xs font-medium tracking-[0.1em] uppercase text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                  placeholder="Enter your email"
                  className={`w-full pl-12 pr-4 py-3 bg-white border ${
                    errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#c9a962]'
                  } text-sm focus:outline-none transition-colors`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
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
                      onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
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
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                  )}
                  {mode === 'signup' && !errors.password && (
                    <p className="text-xs text-gray-400 mt-1">
                      Must be 6+ characters with uppercase and number
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirm Password - Signup only */}
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
                      onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
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

            {/* Forgot Password Link */}
            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setMode('forgot-password'); setErrors({}); setSuccessMessage(''); }}
                  className="text-xs text-[#c9a962] hover:text-[#a88b4a] font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gray-900 text-white text-xs font-medium tracking-[0.15em] uppercase hover:bg-[#c9a962] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-[#faf9f7] text-gray-400 uppercase tracking-wider">or</span>
            </div>
          </div>

          {/* Mode Switch */}
          <p className="mt-8 text-center text-sm text-gray-500">
            {mode === 'login' && (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setErrors({}); setSuccessMessage(''); }}
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
                  onClick={() => { setMode('login'); setErrors({}); setSuccessMessage(''); }}
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
                  onClick={() => { setMode('login'); setErrors({}); setSuccessMessage(''); }}
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
