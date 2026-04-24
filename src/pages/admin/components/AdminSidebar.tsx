import { NavLink } from 'react-router';
import type { AdminPermissions } from '../../../apis/admin';

type MenuItem = {
  path: string;
  label: string;
  end?: boolean;
  visibleIf?: (permissions: AdminPermissions | null) => boolean;
};

const allMenuItems: MenuItem[] = [
  {
    path: '/admin',
    label: '통계 대시보드',
    end: true,
  },
  {
    path: '/admin/roles',
    label: '권한관리',
    visibleIf: (permissions) => Boolean(permissions?.canManageAdmins),
  },
  {
    path: '/admin/users',
    label: '사용자관리',
    visibleIf: (permissions) => Boolean(permissions?.canManageUsers),
  },
  {
    path: '/admin/services',
    label: '구독 서비스',
    visibleIf: (permissions) => Boolean(permissions?.canManageParties),
  },
  {
    path: '/admin/parties',
    label: '파티관리',
    visibleIf: (permissions) => Boolean(permissions?.canManageParties),
  },
  {
    path: '/admin/quick-match',
    label: '빠른매칭 관리',
    visibleIf: (permissions) => Boolean(permissions?.canManageParties),
  },
  {
    path: '/admin/reports',
    label: '신고관리',
    visibleIf: (permissions) => Boolean(permissions?.canManageReports),
  },
  {
    path: '/admin/settlements',
    label: '정산 승인',
    visibleIf: (permissions) => Boolean(permissions?.canApproveSettlements),
  },
  {
    path: '/admin/payments',
    label: '매출 내역',
    visibleIf: (permissions) => Boolean(permissions?.canManagePayments),
  },
  {
    path: '/admin/logs',
    label: '시스템 로그',
    visibleIf: (permissions) => Boolean(permissions?.canViewLogs),
  },
  {
    path: '/admin/moderation',
    label: '채팅 모더레이션',
    visibleIf: (permissions) => Boolean(permissions?.canManageChatModeration),
  },
  {
    path: '/admin/captcha',
    label: '캡챠 관리',
    visibleIf: (permissions) => Boolean(permissions?.canManageCaptcha),
  },
  {
    path: '/admin/cloud-monitor',
    label: '클라우드 모니터링',
    visibleIf: (permissions) => Boolean(permissions?.canViewLogs),
  },
  {
    path: '/admin/handocr',
    label: 'HandOCR CAPTCHA',
    visibleIf: (permissions) =>
      Boolean(
        permissions?.canManageHandOcr ?? permissions?.canManageCaptcha ?? false,
      ),
  },
];

export default function AdminSidebar({
  permissions,
}: {
  permissions: AdminPermissions | null;
}) {
  const menuItems = allMenuItems.filter((item) => {
    if (!item.visibleIf) return true;
    return item.visibleIf(permissions);
  });

  return (
    <aside className="fixed top-0 left-0 bottom-0 z-50 flex w-[200px] flex-col border-r border-gray-200 bg-white py-6">
      <a
        href="/home"
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
              `block px-5 py-2.5 text-sm font-medium no-underline border-l-4 transition-all ${
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
          to="/home"
          className="block px-5 py-2.5 text-sm font-medium text-gray-500 no-underline border-l-4 border-transparent hover:bg-gray-50 hover:text-gray-900 transition-all"
        >
          사용자 홈
        </NavLink>
      </nav>
    </aside>
  );
}
