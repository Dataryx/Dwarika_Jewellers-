import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { onAuthStateChange, AuthUser } from '../lib/auth';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { resetSession } from '../lib/session';
import { useStore } from '../lib/store';

interface AuthContextType {
  user: SupabaseUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function syncCustomer(user: SupabaseUser) {
  fetch('/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user.email,
      name: user.user_metadata?.full_name || '',
      auth_provider: user.app_metadata?.provider || 'email',
    }),
  }).catch(() => {});
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      setLoading(false);
      if (u) syncCustomer(u);
    });

    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
      if (user) syncCustomer(user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    resetSession();
    useStore.getState().clearCart();
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut: handleSignOut }}>
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
