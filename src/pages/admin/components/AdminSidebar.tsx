import { NavLink } from 'react-router';
import {
  BadgeCheck,
  CloudCog,
  CreditCard,
  FileText,
  Home,
  LayoutDashboard,
  Menu,
  MessagesSquare,
  Package,
  PartyPopper,
  ScanText,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { AdminPermissions } from '../../../apis/admin';

type MenuItem = {
  path: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  visibleIf?: (permissions: AdminPermissions | null) => boolean;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

const menuSections: MenuSection[] = [
  {
    title: '대시보드',
    items: [
      {
        path: '/admin',
        label: '통계 대시보드',
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    title: '계정 관리',
    items: [
      {
        path: '/admin/roles',
        label: '권한관리',
        icon: ShieldCheck,
        visibleIf: (permissions) => Boolean(permissions?.canManageAdmins),
      },
      {
        path: '/admin/users',
        label: '사용자관리',
        icon: Users,
        visibleIf: (permissions) => Boolean(permissions?.canManageUsers),
      },
    ],
  },
  {
    title: '서비스 관리',
    items: [
      {
        path: '/admin/services',
        label: '구독 서비스',
        icon: Package,
        visibleIf: (permissions) => Boolean(permissions?.canManageParties),
      },
      {
        path: '/admin/parties',
        label: '파티관리',
        icon: PartyPopper,
        visibleIf: (permissions) => Boolean(permissions?.canManageParties),
      },
      {
        path: '/admin/quick-match',
        label: '빠른매칭 관리',
        icon: Zap,
        visibleIf: (permissions) => Boolean(permissions?.canManageParties),
      },
    ],
  },
  {
    title: '운영 관리',
    items: [
      {
        path: '/admin/reports',
        label: '신고관리',
        icon: Siren,
        visibleIf: (permissions) => Boolean(permissions?.canManageReports),
      },
      {
        path: '/admin/moderation',
        label: '채팅 모더레이션',
        icon: MessagesSquare,
        visibleIf: (permissions) =>
          Boolean(permissions?.canManageChatModeration),
      },
      {
        path: '/admin/captcha',
        label: '캡챠 관리',
        icon: ShieldAlert,
        visibleIf: (permissions) => Boolean(permissions?.canManageCaptcha),
      },
      {
        path: '/admin/handocr',
        label: 'HandOCR CAPTCHA',
        icon: ScanText,
        visibleIf: (permissions) =>
          Boolean(
            permissions?.canManageHandOcr ??
            permissions?.canManageCaptcha ??
            false,
          ),
      },
    ],
  },
  {
    title: '정산/매출',
    items: [
      {
        path: '/admin/settlements',
        label: '정산 승인',
        icon: BadgeCheck,
        visibleIf: (permissions) => Boolean(permissions?.canApproveSettlements),
      },
      {
        path: '/admin/payments',
        label: '매출 내역',
        icon: CreditCard,
        visibleIf: (permissions) => Boolean(permissions?.canManagePayments),
      },
    ],
  },
  {
    title: '시스템',
    items: [
      {
        path: '/admin/logs',
        label: '시스템 로그',
        icon: FileText,
        visibleIf: (permissions) => Boolean(permissions?.canViewLogs),
      },
      {
        path: '/admin/cloud-monitor',
        label: '클라우드 모니터링',
        icon: CloudCog,
        visibleIf: (permissions) => Boolean(permissions?.canViewLogs),
      },
    ],
  },
];

export default function AdminSidebar({
  permissions,
  collapsed,
  onToggleCollapsed,
}: {
  permissions: AdminPermissions | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const visibleSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.visibleIf) return true;
        return item.visibleIf(permissions);
      }),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-50 flex flex-col border-r border-gray-200 bg-white py-6 transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
    >
      <div
        className={`mb-6 flex ${
          collapsed
            ? 'flex-col items-center gap-4 px-0'
            : 'items-center justify-between px-5'
        }`}
      >
        <a
          href="/home"
          title={collapsed ? 'Party-Up' : undefined}
          className={`flex items-center text-lg font-bold text-foreground no-underline ${
            collapsed ? 'justify-center' : 'gap-2.5'
          }`}
        >
          <span className="h-7 w-7 shrink-0 rounded-full bg-[#6C9FFF]" />
          {!collapsed && <span>Party-Up</span>}
        </a>

        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          aria-expanded={!collapsed}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
        >
          <Menu size={22} strokeWidth={2.25} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col gap-1">
          {visibleSections.map((section) => (
            <div
              key={section.title}
              className={collapsed ? 'mt-2 first:mt-0' : 'mt-4 first:mt-0'}
            >
              {!collapsed && (
                <div className="mb-1 px-5 text-[11px] font-semibold tracking-wide text-gray-400">
                  {section.title}
                </div>
              )}

              <div className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.end}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `flex items-center border-l-4 py-3 text-sm font-medium no-underline transition-all ${
                          collapsed ? 'justify-center px-0' : 'gap-3 px-5'
                        } ${
                          isActive
                            ? 'border-blue-500 bg-blue-50 text-blue-500 font-semibold'
                            : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        }`
                      }
                    >
                      <Icon size={20} strokeWidth={2} className="shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1" />

        <NavLink
          to="/home"
          title={collapsed ? '사용자 홈' : undefined}
          className={`mt-4 flex items-center border-l-4 border-transparent py-3 text-sm font-medium text-gray-500 no-underline transition-all hover:bg-gray-50 hover:text-gray-900 ${
            collapsed ? 'justify-center px-0' : 'gap-3 px-5'
          }`}
        >
          <Home size={20} strokeWidth={2} className="shrink-0" />
          {!collapsed && <span>사용자 홈</span>}
        </NavLink>
      </nav>
    </aside>
  );
}
