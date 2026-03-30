import { Navigate } from 'react-router';
import { useAuthStore } from '../stores/authStore';

export default function ProtectedRoute({ children }: any) {
  const { isLoggedIn, loading } = useAuthStore();

  if (loading) return null;

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
