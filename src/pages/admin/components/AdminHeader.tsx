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
    <header className="sticky top-0 z-30 w-full min-w-0 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 md:px-8">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 lg:flex-nowrap lg:gap-4">
        <div className="order-2 flex w-full min-w-0 flex-1 items-center gap-3 lg:order-1 lg:w-auto">
          <div className="hidden shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm xl:block">
            {currentTime}
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 transition-all focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 lg:max-w-105 lg:rounded-xl">
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>

            <input
              type="text"
              placeholder={placeholder}
              onChange={(event) => onSearch?.(event.target.value)}
              className="w-full min-w-0 border-none bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400 md:text-sm"
            />
          </div>
        </div>

        <div className="order-1 flex w-full shrink-0 items-center justify-between gap-2 sm:gap-3 lg:order-2 lg:w-auto lg:justify-end">
          {rightContent && (
            <div className="flex min-w-0 items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
              {rightContent}
            </div>
          )}

          <button
            type="button"
            className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[11px] font-bold text-gray-700 transition hover:bg-gray-50 active:scale-95 md:px-4 md:py-2 md:text-sm"
            onClick={() => void handleLogout()}
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
