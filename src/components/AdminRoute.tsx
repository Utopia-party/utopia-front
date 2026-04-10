import { useEffect, type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from '../stores/authStore';

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isLoggedIn, loading, checkAuth } = useAuthStore();

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  if (loading) {
    return null;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role?.toLowerCase() !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
