import { Link } from 'react-router';

interface ProfileMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onLogout: () => void;
  onClose: () => void;
  nickname?: string | null;
  email?: string | null;
  role?: string | null;
  profileImage?: string | null;
  profileImageError: boolean;
  onProfileImageError: () => void;
  profileInitial: string;
  trustScore: string | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function ProfileMenu({
  isOpen,
  onToggle,
  onLogout,
  onClose,
  nickname,
  email,
  role,
  profileImage,
  profileImageError,
  onProfileImageError,
  profileInitial,
  trustScore,
  containerRef,
}: ProfileMenuProps) {
  const showImage = Boolean(profileImage) && !profileImageError;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-3 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 transition hover:border-slate-300 hover:bg-slate-50"
        aria-label="프로필 메뉴"
        aria-expanded={isOpen}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-bold text-white">
          {showImage ? (
            <img
              src={profileImage ?? ''}
              alt=""
              onError={onProfileImageError}
              className="h-full w-full object-cover"
            />
          ) : (
            profileInitial
          )}
        </div>
        <div className="hidden min-w-0 text-left sm:block">
          <p className="max-w-[120px] truncate text-sm font-semibold text-slate-800">
            {nickname ?? '사용자'}
          </p>
          <p className="text-xs font-medium text-slate-400">내 프로필</p>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-14 z-50 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 bg-slate-50/80 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-base font-bold text-white shadow-sm">
                {showImage ? (
                  <img
                    src={profileImage ?? ''}
                    alt=""
                    onError={onProfileImageError}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  profileInitial
                )}
              </div>
              <div className="min-w-0 flex-1 pt-1">
                <p className="truncate text-base font-bold text-slate-900">
                  {nickname ?? '사용자'}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {email ?? '이메일 정보 없음'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600">
                    {role === 'admin' ? '관리자' : '회원'}
                  </span>
                  {trustScore && (
                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                      신뢰도 {trustScore}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-2">
            {[
              { to: '/mypage/party', label: '내 파티' },
              { to: '/mypage/payment', label: '결제 / 정산' },
              { to: '/mypage/profile', label: '설정' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={onClose}
                className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <span>{label}</span>
                <span className="text-slate-300">›</span>
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-100 p-2">
            <button
              type="button"
              onClick={onLogout}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
            >
              <span>로그아웃</span>
              <span className="text-rose-300">›</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
