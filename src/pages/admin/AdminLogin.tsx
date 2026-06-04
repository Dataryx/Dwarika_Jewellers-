import { motion, AnimatePresence } from 'framer-motion';

import { useState, useEffect } from 'react';

import { Link, Navigate, useNavigate } from 'react-router-dom';

import { Lock, Mail, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

import { adminFetch } from '../../lib/adminApi';

import { setAdminSession } from '../../lib/adminAuth';

import { adminUrl } from '../../lib/adminUrl';

import { validateEmailAddress } from '../../lib/emailValidation';



const LOGIN_IMAGE =

  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200';



const DWARIKA_LOGO = '/DWARIKA%20MAIN%20LOGO.png';



const inputClass =

  'w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all';



type AuthMode = 'login' | 'forgot-password';



export default function AdminLogin() {

  const [mode, setMode] = useState<AuthMode>('login');

  const [email, setEmail] = useState('');

  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');

  const [successMessage, setSuccessMessage] = useState('');

  const [loading, setLoading] = useState(false);

  const [storeName, setStoreName] = useState('Dwarika');

  const navigate = useNavigate();



  useEffect(() => {

    adminFetch('/api/settings')

      .then((r) => r.json())

      .then((data) => { if (data?.storeName) setStoreName(data.storeName); })

      .catch(() => {});

  }, []);



  if (typeof window !== 'undefined' && localStorage.getItem('adminAuth') === 'true') {

    return <Navigate to="/" replace />;

  }



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    setError('');

    setSuccessMessage('');



    const emailCheck = validateEmailAddress(email);

    if (!emailCheck.ok) {

      setError(emailCheck.error || 'Please enter a valid email address');

      return;

    }



    if (mode === 'login' && !password) {

      setError('Password is required');

      return;

    }



    setLoading(true);



    try {

      if (mode === 'login') {

        const res = await adminFetch('/api/admin-auth', {

          method: 'POST',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify({ email: emailCheck.normalized, password }),

        });

        const data = await res.json();

        if (!res.ok) {

          setError(data.error || 'Invalid credentials');

        } else {
          const token = String(data.token || '');
          if (!token) {
            setError('Login succeeded but no session token was returned.');
            return;
          }
          setAdminSession(String(data.email || email).trim().toLowerCase(), token);
          navigate('/');
        }

      } else {

        const res = await adminFetch('/api/admin-auth', {

          method: 'POST',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify({

            action: 'forgot-password',

            email: emailCheck.normalized,

            origin: typeof window !== 'undefined' ? window.location.origin : adminUrl(),

          }),

        });

        const data = await res.json();

        if (!res.ok) {

          setError(data.error || 'Could not send reset email');

        } else {

          setSuccessMessage(data.message || 'A password reset link has been sent to your admin email.');

        }

      }

    } catch {

      setError('Server unreachable. Please try again.');

    }

    setLoading(false);

  };



  const switchMode = (next: AuthMode) => {

    setMode(next);

    setError('');

    setSuccessMessage('');

    if (next === 'forgot-password') setPassword('');

  };



  return (

    <div className="min-h-screen bg-gray-950 flex">

      <div className="hidden lg:block lg:w-1/2 relative">

        <img

          src={LOGIN_IMAGE}

          alt="Luxury jewellery"

          className="absolute inset-0 w-full h-full object-cover"

        />

        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-transparent to-transparent" />

        <div className="absolute inset-0 bg-black/20" />

        <div className="absolute bottom-12 left-12 right-12 text-white">

          <h2 className="text-3xl font-serif font-medium">Admin Portal</h2>

          <p className="mt-2 text-white/80">

            Manage products, orders, and your {storeName} storefront.

          </p>

        </div>

      </div>



      <div className="w-full lg:w-1/2 flex items-start justify-center pt-4 sm:pt-6 lg:pt-8 pb-8 px-8">

        <motion.div

          initial={{ opacity: 0, y: 20 }}

          animate={{ opacity: 1, y: 0 }}

          className="w-full max-w-md"

        >

          <Link to="/" className="flex items-center justify-center mb-4">

            <img

              src={DWARIKA_LOGO}

              alt={storeName}

              className="h-80 w-auto max-w-full object-contain"

            />

          </Link>



          <div className="text-center mb-8">

            <h1 className="text-2xl font-serif font-medium text-white">

              {mode === 'login' ? 'Welcome Back' : 'Reset Password'}

            </h1>

            <p className="mt-2 text-sm text-gray-500">

              {mode === 'login'

                ? 'Sign in to the admin panel'

                : 'Enter your registered admin email for a reset link'}

            </p>

          </div>



          <AnimatePresence>

            {successMessage && (

              <motion.div

                initial={{ opacity: 0, height: 0 }}

                animate={{ opacity: 1, height: 'auto' }}

                exit={{ opacity: 0, height: 0 }}

                className="mb-6 overflow-hidden"

              >

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/50 rounded-lg">

                  <p className="text-sm text-emerald-400">{successMessage}</p>

                </div>

              </motion.div>

            )}

          </AnimatePresence>



          <AnimatePresence>

            {error && (

              <motion.div

                initial={{ opacity: 0, height: 0 }}

                animate={{ opacity: 1, height: 'auto' }}

                exit={{ opacity: 0, height: 0 }}

                className="mb-6 overflow-hidden"

              >

                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">

                  <p className="text-sm text-red-400">{error}</p>

                </div>

              </motion.div>

            )}

          </AnimatePresence>



          <form onSubmit={handleSubmit} className="space-y-5">

            <div className="space-y-1">

              <label htmlFor="admin-email" className="block text-xs font-medium tracking-[0.1em] uppercase text-gray-400">

                Email Address

              </label>

              <div className="relative">

                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />

                <input

                  id="admin-email"

                  type="email"

                  value={email}

                  onChange={(e) => setEmail(e.target.value)}

                  placeholder="Enter your admin email"

                  required

                  autoComplete="email"

                  className={inputClass}

                />

              </div>

            </div>



            {mode === 'login' && (

              <div className="space-y-1">

                <label htmlFor="admin-password" className="block text-xs font-medium tracking-[0.1em] uppercase text-gray-400">

                  Password

                </label>

                <div className="relative">

                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />

                  <input

                    id="admin-password"

                    type={showPassword ? 'text' : 'password'}

                    value={password}

                    onChange={(e) => setPassword(e.target.value)}

                    placeholder="Enter your password"

                    required

                    autoComplete="current-password"

                    className={`${inputClass} pr-12`}

                  />

                  <button

                    type="button"

                    onClick={() => setShowPassword(!showPassword)}

                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"

                    aria-label={showPassword ? 'Hide password' : 'Show password'}

                  >

                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}

                  </button>

                </div>

              </div>

            )}



            {mode === 'login' && (

              <div className="flex justify-end">

                <button

                  type="button"

                  onClick={() => switchMode('forgot-password')}

                  className="text-xs text-violet-400 hover:text-violet-300 font-medium"

                >

                  Forgot password?

                </button>

              </div>

            )}



            <button

              type="submit"

              disabled={loading}

              className="w-full py-4 bg-violet-500 text-white text-xs font-medium tracking-[0.15em] uppercase hover:bg-violet-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"

            >

              {loading ? (

                <Loader2 className="w-5 h-5 animate-spin" />

              ) : (

                <>

                  {mode === 'login' ? 'Sign In' : 'Send Reset Link'}

                  <ArrowRight className="w-4 h-4" />

                </>

              )}

            </button>

          </form>



          <p className="mt-6 text-center text-sm text-gray-500">

            {mode === 'login' ? (

              <>

                Forgot your password?{' '}

                <button

                  type="button"

                  onClick={() => switchMode('forgot-password')}

                  className="text-violet-500 hover:text-violet-400 font-medium"

                >

                  Reset it here

                </button>

              </>

            ) : (

              <>

                Remember your password?{' '}

                <button

                  type="button"

                  onClick={() => switchMode('login')}

                  className="text-violet-500 hover:text-violet-400 font-medium"

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


