import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import {
  ChevronDown,
  Menu,
  LayoutGrid,
  UserRound,
  OctagonAlert,
  Book,
} from 'lucide-react';
import logoImage from '../assets/logo.png';

const mypageMenus = [
  { label: '프로필', to: '/mypage/profile' },
  { label: '내 파티', to: '/mypage/party' },
  { label: '신뢰도 변화', to: '/mypage/my_trust_history' },
  { label: '칭찬 내역', to: '/mypage/praises' },
  { label: '결제 내역', to: '/mypage/payment' },
  { label: '신고 내역', to: '/mypage/report' },
  { label: '캡챠 SaaS (L1)', to: '/mypage/developer' },
  { label: '캡챠 SaaS (L2)', to: '/mypage/developer-l2' },
  { label: '채팅 AI SaaS', to: '/mypage/developer-chat' },
];

export default function Sidebar() {
  const location = useLocation();

  const isMypageRoute = useMemo(
    () =>
      location.pathname === '/mypage' ||
      location.pathname.startsWith('/mypage/'),
    [location.pathname],
  );

  const [isMypageOpen, setIsMypageOpen] = useState(isMypageRoute);

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  const isMypageMenuOpen = isMypageOpen;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMenuClick = () => {
    setIsMypageOpen(false);

    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleMypageClick = () => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
    }

    setIsMypageOpen((prev) => !prev);
  };

  const handleMypageSubMenuClick = () => {
    setIsMypageOpen(true);

    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const getMainLinkClass = (isActive: boolean) =>
    [
      'flex w-full items-center rounded-xl py-2.5 text-sm font-semibold transition whitespace-nowrap',
      isActive
        ? 'bg-blue-50 text-primary'
        : 'text-slate-800 hover:bg-slate-100',
      isSidebarOpen ? 'justify-between px-3' : 'justify-center px-0',
    ].join(' ');

  const getSubLinkClass = (isActive: boolean) =>
    [
      'block rounded-xl px-3 py-2.5 text-sm font-medium transition whitespace-nowrap',
      isActive
        ? 'bg-blue-50 text-primary'
        : 'text-slate-700 hover:bg-slate-100',
    ].join(' ');

  const iconClass = 'h-5 w-5 shrink-0';

  return (
    <>
      {!isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl transition-transform hover:scale-105 active:scale-95 md:hidden"
          aria-label="메뉴 열기"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white px-3 py-6 transition-all duration-300 md:relative md:h-auto md:min-h-screen ${
          isSidebarOpen
            ? 'w-56 min-w-56 translate-x-0'
            : 'w-56 -translate-x-full md:w-18 md:min-w-18 md:translate-x-0'
        }`}
      >
        <div
          className={`mb-10 flex items-center ${
            isSidebarOpen ? 'justify-between' : 'flex-col gap-4'
          }`}
        >
          <Link
            to="/home"
            onClick={handleMenuClick}
            className={`flex items-center ${
              isSidebarOpen ? 'gap-3 px-1' : 'justify-center'
            }`}
          >
            <img
              src={logoImage}
              alt="Party-Up"
              className="h-8 w-8 shrink-0 object-contain"
            />
            {isSidebarOpen && (
              <span className="whitespace-nowrap text-[20px] font-extrabold tracking-tight text-slate-900">
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
            onClick={handleMenuClick}
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
              onClick={handleMypageClick}
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
                  className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                    isMypageMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>

            {isSidebarOpen && isMypageMenuOpen && (
              <div className="mt-2 flex flex-col gap-1 pl-2">
                {mypageMenus.map((menu) => (
                  <NavLink
                    key={menu.to}
                    to={menu.to}
                    onClick={handleMypageSubMenuClick}
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
            onClick={handleMenuClick}
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

          <NavLink
            to="/manual"
            onClick={handleMenuClick}
            className={({ isActive }) => getMainLinkClass(isActive)}
          >
            <div
              className={`flex items-center ${
                isSidebarOpen ? 'gap-3' : 'justify-center'
              }`}
            >
              <Book className={iconClass} />
              {isSidebarOpen && <span>매뉴얼</span>}
            </div>
          </NavLink>
        </nav>
      </aside>
    </>
  );
}
