import { Navigate } from 'react-router';
import type { ReactNode } from 'react';
import { useAuthStore } from '../../stores/authStore';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn, loading } = useAuthStore();

  if (loading) return null;

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
