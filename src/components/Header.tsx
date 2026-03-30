import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '../stores/authStore';

export default function Header() {
  const navigate = useNavigate();

  const { isLoggedIn, loading, logout } = useAuthStore();

  if (loading) return null;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('로그아웃 실패', error);
    } finally {
      alert('로그아웃 되었습니다.');
      navigate('/home', { replace: true });
    }
  };

  return (
    <header className="flex h-16 items-center justify-end border-b-2 border-gray-200 bg-card px-8">
      {isLoggedIn ? (
        <button
          onClick={handleLogout}
          className="rounded-lg border border-red-300 px-4 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          로그아웃
        </button>
      ) : (
        <Link
          to="/login"
          className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium transition hover:bg-muted"
        >
          로그인
        </Link>
      )}
    </header>
  );
}
