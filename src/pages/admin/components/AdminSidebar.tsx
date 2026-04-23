import { NavLink } from 'react-router';
import type { AdminPermissions } from '../../../apis/admin';

type PermissionKey = keyof AdminPermissions;

type MenuItem = {
  path: string;
  label: string;
  end?: boolean;
  permission?: PermissionKey;
};

type MenuSection = {
  title?: string;
  items: MenuItem[];
};

const menuSections: MenuSection[] = [
  {
    items: [{ path: '/admin', label: '통계 대시보드', end: true }],
  },
  {
    title: '운영 관리',
    items: [
      {
        path: '/admin/roles',
        label: '권한관리',
        permission: 'canManageAdmins',
      },
      {
        path: '/admin/users',
        label: '사용자관리',
        permission: 'canManageUsers',
      },
      {
        path: '/admin/services',
        label: '구독 서비스',
        permission: 'canManageParties',
      },
      {
        path: '/admin/parties',
        label: '파티관리',
        permission: 'canManageParties',
      },
      {
        path: '/admin/handocr',
        label: 'HandOCR CAPTCHA',
        permission: 'canManageHandOcr',
      },
      {
        path: '/admin/captcha',
        label: '캡챠 관리',
        permission: 'canManageCaptcha',
      },
    ],
  },
  {
    title: '정책 / 신고',
    items: [
      {
        path: '/admin/reports',
        label: '신고관리',
        permission: 'canManageReports',
      },
      {
        path: '/admin/moderation',
        label: '채팅 모더레이션',
        permission: 'canManageChatModeration',
      },
    ],
  },
  {
    title: '정산 / 결제',
    items: [
      {
        path: '/admin/settlements',
        label: '정산 승인',
        permission: 'canApproveSettlements',
      },
      {
        path: '/admin/payments',
        label: '결제 내역',
        permission: 'canManagePayments',
      },
    ],
  },
  {
    title: '감사 / 로그',
    items: [
      {
        path: '/admin/logs',
        label: '시스템 로그',
        permission: 'canViewLogs',
      },
    ],
  },
];

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  `block px-5 py-2.5 text-sm font-medium no-underline border-l-4 transition-all ${
    isActive
      ? 'bg-blue-50 text-blue-500 border-blue-500 font-semibold'
      : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-900'
  }`;

export default function AdminSidebar({
  permissions,
}: {
  permissions: AdminPermissions | null;
}) {
  const visibleSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.permission) return true;
        return permissions?.[item.permission] ?? false;
      }),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside className="fixed top-0 left-0 bottom-0 z-50 flex w-[220px] flex-col border-r border-gray-200 bg-white py-6">
      <NavLink
        to="/home"
        className="mb-8 flex items-center gap-2.5 px-5 text-lg font-bold text-foreground no-underline"
      >
        <span className="h-7 w-7 rounded-full bg-[#6C9FFF]" />
        Party-Up
      </NavLink>

      <nav className="flex flex-1 flex-col overflow-y-auto">
        {visibleSections.map((section, sectionIndex) => (
          <div
            key={section.title ?? `section-${sectionIndex}`}
            className="mb-4"
          >
            {section.title && (
              <div className="px-5 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {section.title}
              </div>
            )}

            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end ?? false}
                  className={linkClassName}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        <div className="flex-1" />

        <div className="mt-4 border-t border-gray-100 pt-4">
          <NavLink to="/home" className={linkClassName}>
            사용자 홈
          </NavLink>
        </div>
      </nav>
    </aside>
  );
}
