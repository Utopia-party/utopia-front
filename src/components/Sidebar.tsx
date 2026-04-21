import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import {
  ChevronDown,
  Menu,
  LayoutGrid,
  UserRound,
  OctagonAlert,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const mypageMenus = [
  { label: '프로필', to: '/mypage/profile' },
  { label: '내 파티', to: '/mypage/party' },
  { label: '신뢰도 변화', to: '/mypage/my_trust_history' },
  { label: '결제 내역', to: '/mypage/payment' },
  { label: '신고 내역', to: '/mypage/report' },
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (isMypageRoute) {
      setIsMypageOpen(true);
    }
  }, [isMypageRoute]);

  const getMainLinkClass = (isActive: boolean) =>
    [
      'flex w-full items-center rounded-xl py-2.5 text-sm font-semibold transition',
      isActive
        ? 'bg-blue-50 text-primary'
        : 'text-slate-800 hover:bg-slate-100',
      isSidebarOpen ? 'justify-between px-3' : 'justify-center px-0',
    ].join(' ');

  const getSubLinkClass = (isActive: boolean) =>
    [
      'block rounded-xl px-3 py-2.5 text-sm font-medium transition',
      isActive
        ? 'bg-blue-50 text-primary'
        : 'text-slate-700 hover:bg-slate-100',
    ].join(' ');

  const iconClass = 'h-5 w-5 shrink-0';

  return (
    <aside
      className={`flex min-h-screen flex-col border-r border-slate-200 bg-white px-3 py-6 transition-all duration-300 ${
        isSidebarOpen ? 'w-56' : 'w-18'
      }`}
    >
      <div
        className={`mb-10 flex items-center ${
          isSidebarOpen ? 'justify-between' : 'flex-col gap-4'
        }`}
      >
        <Link
          to="/home"
          className={`flex items-center ${
            isSidebarOpen ? 'gap-3 px-1' : 'justify-center'
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-[20px] font-extrabold leading-none text-white">
            P
          </div>
          {isSidebarOpen && (
            <span className="text-[20px] font-extrabold tracking-tight text-slate-900">
              Party-Up
            </span>
          )}
        </Link>

        <button
          type="button"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100"
          aria-label={isSidebarOpen ? '사이드바 닫기' : '사이드바 열기'}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex flex-col gap-2">
        <NavLink
          to="/home"
          className={({ isActive }) => getMainLinkClass(isActive)}
        >
          <div
            className={`flex items-center ${
              isSidebarOpen ? 'gap-3' : 'justify-center'
            }`}
          >
            <LayoutGrid className={iconClass} />
            {isSidebarOpen && <span>홈</span>}
          </div>
        </NavLink>

        <div className="mt-1">
          <button
            type="button"
            onClick={() => {
              if (!isSidebarOpen) {
                setIsSidebarOpen(true);
              }
              setIsMypageOpen((prev) => !prev);
            }}
            className={getMainLinkClass(isMypageRoute)}
          >
            <div
              className={`flex items-center ${
                isSidebarOpen ? 'gap-3' : 'justify-center'
              }`}
            >
              <UserRound className={iconClass} />
              {isSidebarOpen && <span>마이페이지</span>}
            </div>

            {isSidebarOpen && (
              <ChevronDown
                className={`h-4 w-4 text-slate-500 transition-transform ${
                  isMypageOpen ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>

          {isSidebarOpen && isMypageOpen && (
            <div className="mt-2 flex flex-col gap-1 pl-2">
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
        >
          <div
            className={`flex items-center ${
              isSidebarOpen ? 'gap-3' : 'justify-center'
            }`}
          >
            <OctagonAlert className={iconClass} />
            {isSidebarOpen && <span>신고</span>}
          </div>
        </NavLink>
      </nav>

      {user?.role?.toLowerCase() === 'admin' && (
        <div className="mt-auto pt-6">
          {isSidebarOpen && (
            <div className="mb-2 px-3 text-xs font-bold tracking-wide text-slate-400">
              관리자
            </div>
          )}

          <NavLink
            to="/admin"
            className={({ isActive }) => getMainLinkClass(isActive)}
          >
            <div
              className={`flex items-center ${
                isSidebarOpen ? 'gap-3' : 'justify-center'
              }`}
            >
              <Shield className={iconClass} />
              {isSidebarOpen && <span>관리자</span>}
            </div>
          </NavLink>
        </div>
      )}
    </aside>
  );
}
