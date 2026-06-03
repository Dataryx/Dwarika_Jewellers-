import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import type { CustomerUser } from '../lib/customerAuth';
import { fetchCurrentCustomer, logoutCustomer } from '../lib/customerAuth';
import { resetSession } from '../lib/session';
import { useStore } from '../lib/store';
import { showNotification } from '../components/Notification';

interface AuthContextType {
  user: CustomerUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signingOutRef = useRef(false);

  const refreshUser = useCallback(async () => {
    try {
      const current = await fetchCurrentCustomer();
      setUser(current);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchCurrentCustomer()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const handleSignOut = useCallback(async () => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    resetSession();
    useStore.getState().clearCart();
    await logoutCustomer();
    setUser(null);
    signingOutRef.current = false;
  }, []);

  useEffect(() => {
    if (!user) {
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return;
    }

    const INACTIVITY_MS = 10 * 60 * 1000;
    const WARNING_MS = 9 * 60 * 1000;
    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    const resetInactivityTimer = () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);

      warningTimerRef.current = setTimeout(() => {
        showNotification('You will be signed out in 1 minute due to inactivity.');
        const staySignedIn = window.confirm(
          'You have been inactive for 9 minutes. Click OK to stay signed in, or Cancel to sign out now.'
        );
        if (staySignedIn) {
          resetInactivityTimer();
          return;
        }
        handleSignOut().catch(() => {});
      }, WARNING_MS);

      inactivityTimerRef.current = setTimeout(() => {
        handleSignOut().catch(() => {});
      }, INACTIVITY_MS);
    };

    events.forEach((eventName) => window.addEventListener(eventName, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, resetInactivityTimer));
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
        warningTimerRef.current = null;
      }
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [user, handleSignOut]);

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
