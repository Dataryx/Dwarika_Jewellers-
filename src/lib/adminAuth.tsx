import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    setIsAuthenticated(auth === 'true');
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function useAdminAuth() {
  const logout = () => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminEmail');
    window.location.href = '/admin/login';
  };

  const email = localStorage.getItem('adminEmail');

  return { logout, email };
}
