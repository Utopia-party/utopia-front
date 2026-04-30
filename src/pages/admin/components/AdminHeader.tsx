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
    // 💡 핵심 수정: z-40을 z-30으로 낮춰서 모바일 사이드바의 어두운 배경(z-40) 아래로 들어가도록 조치!
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 sm:px-6 md:px-8">
      <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-3 md:gap-4">
        <div className="order-2 md:order-1 flex w-full md:w-auto flex-1 items-center gap-3">
          <div className="hidden lg:block shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm">
            {currentTime}
          </div>
          <div className="flex flex-1 items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg md:rounded-xl px-3 py-2 max-w-full md:max-w-[320px] lg:max-w-120 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 transition-all">
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
              onChange={(e) => onSearch?.(e.target.value)}
              className="w-full border-none bg-transparent outline-none text-xs md:text-sm text-gray-700 placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="order-1 md:order-2 flex w-full md:w-auto items-center justify-between md:justify-end gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {rightContent}
          </div>
          <button
            className="shrink-0 px-3 md:px-4 py-1.5 md:py-2 border border-gray-300 rounded-lg bg-white text-[11px] md:text-sm font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition"
            onClick={() => void handleLogout()}
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
