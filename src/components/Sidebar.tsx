import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { ChevronDown } from 'lucide-react';

const mypageMenus = [
  { label: '프로필', to: '/mypage/profile' },
  { label: '내 파티', to: '/mypage/party' },
  { label: '결제 내역', to: '/mypage/payment' },
  { label: '신고 내역', to: '/mypage/report' },
  { label: '활동 로그', to: '/mypage/history' },
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

  useEffect(() => {
    if (isMypageRoute) {
      setIsMypageOpen(true);
    }
  }, [isMypageRoute]);

  const getMainLinkClass = (isActive: boolean) =>
    [
      'flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition',
      isActive
        ? 'bg-blue-50 text-primary'
        : 'text-slate-800 hover:bg-slate-100',
    ].join(' ');

  const getSubLinkClass = (isActive: boolean) =>
    [
      'block rounded-2xl px-4 py-3 text-sm font-semibold transition',
      isActive
        ? 'bg-blue-50 text-primary'
        : 'text-slate-700 hover:bg-slate-100',
    ].join(' ');

  return (
    <aside className="flex min-h-screen w-72 flex-col border-r border-slate-200 bg-white px-5 py-8">
      <Link to="/home" className="mb-10 flex items-center gap-3 px-2">
        <div className="h-8 w-8 rounded-xl bg-primary" />
        <span className="text-[20px] font-extrabold tracking-tight text-slate-900">
          Party-Up
        </span>
      </Link>

      <nav className="flex flex-col gap-2">
        <NavLink
          to="/home"
          className={({ isActive }) => getMainLinkClass(isActive)}
        >
          <span>홈</span>
        </NavLink>

        <div className="mt-1">
          <button
            type="button"
            onClick={() => setIsMypageOpen((prev) => !prev)}
            className={getMainLinkClass(isMypageRoute)}
          >
            <span>마이페이지</span>
            <ChevronDown
              className={`w-4 h-4 text-slate-500 transition-transform ${
                isMypageOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isMypageOpen ? (
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
          ) : null}
        </div>

        <NavLink
          to="/report"
          className={({ isActive }) => getMainLinkClass(isActive)}
        >
          <span>신고</span>
        </NavLink>
      </nav>
    </aside>
  );
}
