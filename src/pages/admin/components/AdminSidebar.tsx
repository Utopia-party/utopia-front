import { NavLink } from 'react-router';

const menuItems = [
  { path: '/admin', label: '통계 대시보드', end: true },
  { path: '/admin/roles', label: '권한관리', end: false },
  { path: '/admin/users', label: '사용자관리', end: false },
  { path: '/admin/parties', label: '파티관리', end: false },
  { path: '/admin/reports', label: '신고관리', end: false },
  { path: '/admin/receipts', label: '영수증 승인', end: false },
  { path: '/admin/settlements', label: '정산 승인', end: false },
  { path: '/admin/logs', label: '시스템 로그', end: false },
];

export default function AdminSidebar() {
  return (
    <aside className="w-[200px] bg-white border-r border-gray-200 py-6 flex flex-col fixed top-0 left-0 bottom-0 z-50">
      <a
        href="/"
        className="flex items-center gap-2.5 px-5 mb-8 text-lg font-bold text-foreground no-underline"
      >
        <span className="w-7 h-7 bg-[#6C9FFF] rounded-full" />
        Party-Up
      </a>
      <nav className="flex flex-col gap-0.5 flex-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `block px-5 py-2.5 text-sm font-medium no-underline border-l-3 transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-500 border-blue-500 font-semibold'
                  : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
        <div className="flex-1" />
        <NavLink
          to="/"
          className="block px-5 py-2.5 text-sm font-medium text-gray-500 no-underline border-l-3 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-all"
        >
          사용자 홈
        </NavLink>
      </nav>
    </aside>
  );
}
