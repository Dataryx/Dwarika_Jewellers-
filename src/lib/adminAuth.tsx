import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { adminFetch, MASTER_EMAIL } from './adminApi';

export type AdminProfile = {
  email: string;
  name: string;
  role: 'master' | 'admin';
  phone?: string;
  address?: string;
  city?: string;
  job_title?: string;
  created_at?: string;
};

type AdminAuthContextValue = {
  email: string | null;
  name: string;
  role: 'master' | 'admin';
  profile: AdminProfile | null;
  profileLoading: boolean;
  isMaster: boolean;
  logout: () => void;
  refreshAdminProfile: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const SESSION_AUTH_KEY = 'adminAuth';
const SESSION_EMAIL_KEY = 'adminEmail';

/** Display name comes only from MongoDB `name` — never the email local-part. */
export function resolveAdminDisplayName(
  apiName: string | undefined | null,
  adminEmail: string | null
): string {
  const trimmed = String(apiName || '').trim();
  const emailLocal = adminEmail?.split('@')[0]?.toLowerCase() || '';

  if (trimmed && trimmed.toLowerCase() !== emailLocal) {
    return trimmed;
  }
  if (adminEmail === MASTER_EMAIL) return 'Master Admin';
  return 'Admin';
}

function readSessionEmail(): string | null {
  const raw = localStorage.getItem(SESSION_EMAIL_KEY);
  return raw ? raw.trim().toLowerCase() : null;
}

export function setAdminSession(email: string) {
  localStorage.setItem(SESSION_AUTH_KEY, 'true');
  localStorage.setItem(SESSION_EMAIL_KEY, email.trim().toLowerCase());
  localStorage.removeItem('adminName');
  localStorage.removeItem('adminRole');
}

export function clearAdminSession() {
  localStorage.removeItem(SESSION_AUTH_KEY);
  localStorage.removeItem(SESSION_EMAIL_KEY);
  localStorage.removeItem('adminName');
  localStorage.removeItem('adminRole');
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(readSessionEmail);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [name, setName] = useState('Admin');
  const [role, setRole] = useState<'master' | 'admin'>('admin');
  const [profileLoading, setProfileLoading] = useState(
    () => localStorage.getItem(SESSION_AUTH_KEY) === 'true'
  );

  const refreshAdminProfile = useCallback(async () => {
    const sessionEmail = readSessionEmail();
    setEmail(sessionEmail);

    if (localStorage.getItem(SESSION_AUTH_KEY) !== 'true' || !sessionEmail) {
      setProfile(null);
      setName('Admin');
      setRole('admin');
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    try {
      const res = await adminFetch('/api/admin-auth?me=true');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load profile');

      const loaded: AdminProfile = {
        email: data.email || sessionEmail,
        name: data.name || '',
        role: data.role === 'master' ? 'master' : 'admin',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        job_title: data.job_title || '',
        created_at: data.created_at,
      };
      setProfile(loaded);
      setName(resolveAdminDisplayName(loaded.name, loaded.email));
      setRole(loaded.role);
    } catch {
      setProfile(null);
      setName(sessionEmail === MASTER_EMAIL ? 'Master Admin' : 'Admin');
      setRole(sessionEmail === MASTER_EMAIL ? 'master' : 'admin');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAdminProfile();
  }, [refreshAdminProfile]);

  const logout = () => {
    clearAdminSession();
    window.location.href = '/login';
  };

  const value: AdminAuthContextValue = {
    email,
    name,
    role,
    profile,
    profileLoading,
    isMaster: role === 'master' || email === MASTER_EMAIL,
    logout,
    refreshAdminProfile,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return ctx;
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    setIsAuthenticated(localStorage.getItem(SESSION_AUTH_KEY) === 'true');
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
