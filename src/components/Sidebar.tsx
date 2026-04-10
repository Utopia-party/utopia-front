import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import {
  ChevronDown,
  House,
  CircleUserRound,
  Siren,
  Shield,
  Menu,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const mypageMenus = [
  { label: '프로필', to: '/mypage/profile' },
  { label: '내 파티', to: '/mypage/party' },
  { label: '신뢰도 변화', to: '/mypage/my_trust_history' },
  { label: '결제 내역', to: '/mypage/payment' },
  { label: '신고 내역', to: '/mypage/report' },
  { label: '활동 로그', to: '/mypage/history' },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();

  const isMypageRoute = useMemo(
    () =>
      location.pathname === '/mypage' ||
      location.pathname.startsWith('/mypage/'),
    [location.pathname],
  );

  const [isMypageOpen, setIsMypageOpen] = useState(isMypageRoute);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (isMypageRoute && !isCollapsed) {
      setIsMypageOpen(true);
    }
  }, [isMypageRoute, isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;

      if (next) {
        setIsMypageOpen(false);
      } else if (isMypageRoute) {
        setIsMypageOpen(true);
      }

      return next;
    });
  };

  const getMainLinkClass = (isActive: boolean) =>
    [
      'flex items-center rounded-xl px-4 py-3 text-sm font-semibold transition',
      isCollapsed ? 'justify-center' : 'justify-between',
      isActive
        ? 'bg-blue-50 text-primary'
        : 'text-slate-800 hover:bg-slate-100',
    ].join(' ');

  const getSubLinkClass = (isActive: boolean) =>
    [
      'block rounded-xl px-4 py-3 text-sm font-semibold transition',
      isActive
        ? 'bg-blue-50 text-primary'
        : 'text-slate-700 hover:bg-slate-100',
    ].join(' ');

  const getIconClass = (isCollapsed: boolean) =>
    isCollapsed ? 'h-5 w-5 shrink-0' : 'h-5 w-5 shrink-0 text-slate-500';

  return (
    <aside
      className={`flex min-h-screen flex-col border-r border-slate-200 bg-white py-6 transition-all duration-300 ${
        isCollapsed ? 'w-20 px-2' : 'w-72 px-5'
      }`}
    >
      <div
        className={`mb-8 flex items-center ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        {!isCollapsed ? (
          <>
            <Link to="/home" className="flex items-center gap-3 px-2">
              <div className="h-8 w-8 rounded-lg bg-primary" />
              <span className="text-[20px] font-extrabold text-slate-900">
                Party-Up
              </span>
            </Link>

            <button
              type="button"
              onClick={toggleSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="사이드바 접기"
            >
              <Menu className="h-5 w-5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="사이드바 펼치기"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex flex-col gap-2">
        <NavLink
          to="/home"
          className={({ isActive }) => getMainLinkClass(isActive)}
          title="홈"
        >
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3">
                <House className={getIconClass(isCollapsed)} />
                <span>홈</span>
              </div>
            </>
          ) : (
            <House className="h-5 w-5" />
          )}
        </NavLink>

        <div className="mt-1">
          <button
            type="button"
            onClick={() => {
              if (isCollapsed) {
                setIsCollapsed(false);
                setIsMypageOpen(true);
                return;
              }
              setIsMypageOpen((prev) => !prev);
            }}
            className={getMainLinkClass(isMypageRoute)}
            title="마이페이지"
          >
            {!isCollapsed ? (
              <>
                <div className="flex items-center gap-3">
                  <CircleUserRound className={getIconClass(isCollapsed)} />
                  <span>마이페이지</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-slate-500 transition-transform ${
                    isMypageOpen ? 'rotate-180' : ''
                  }`}
                />
              </>
            ) : (
              <CircleUserRound className="h-5 w-5" />
            )}
          </button>

          {!isCollapsed && isMypageOpen && (
            <div className="mt-2 flex flex-col gap-1 pl-3">
              {mypageMenus.map((menu) => (
                <NavLink
                  key={menu.to}
                  to={menu.to}
                  className={({ isActive }) => getSubLinkClass(isActive)}
                >
                  {menu.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>

        <NavLink
          to="/report"
          className={({ isActive }) => getMainLinkClass(isActive)}
          title="신고"
        >
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3">
                <Siren className={getIconClass(isCollapsed)} />
                <span>신고</span>
              </div>
            </>
          ) : (
            <Siren className="h-5 w-5" />
          )}
        </NavLink>
      </nav>

      {user?.role?.toLowerCase() === 'admin' && (
        <div className="mt-auto pt-6">
          {!isCollapsed && (
            <div className="mb-2 px-4 text-xs font-bold text-slate-400">
              관리자
            </div>
          )}

          <NavLink
            to="/admin"
            className={({ isActive }) => getMainLinkClass(isActive)}
            title="관리자 바로가기"
          >
            {!isCollapsed ? (
              <div className="flex items-center gap-3">
                <Shield className={getIconClass(isCollapsed)} />
                <span>관리자 바로가기</span>
              </div>
            ) : (
              <Shield className="h-5 w-5" />
            )}
          </NavLink>
        </div>
      )}
    </aside>
  );
}
