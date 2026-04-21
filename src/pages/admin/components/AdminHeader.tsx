import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '../../../stores/authStore';

interface AdminHeaderProps {
  placeholder?: string;
  onSearch?: (value: string) => void;
  rightContent?: ReactNode;
}

export default function AdminHeader({
  placeholder = '검색...',
  onSearch,
  rightContent,
}: AdminHeaderProps) {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [currentTime, setCurrentTime] = useState(() =>
    new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(
        new Date().toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
      );
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
          {currentTime}
        </div>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 w-[480px]">
          <svg
            width="16"
            height="16"
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder={placeholder}
            onChange={(e) => onSearch?.(e.target.value)}
            className="border-none bg-transparent outline-none text-sm text-gray-500 w-full"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        {rightContent}
        <button
          className="px-3.5 py-1.5 border border-gray-300 rounded-md bg-white text-sm text-gray-700 cursor-pointer hover:bg-gray-50 transition"
          onClick={() => void handleLogout()}
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
