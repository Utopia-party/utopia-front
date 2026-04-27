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

const allMenuItems: MenuItem[] = [
  {
    path: '/admin',
    label: '통계 대시보드',
    icon: LayoutDashboard,
    end: true,
  },
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
  {
    path: '/admin/reports',
    label: '신고관리',
    icon: Siren,
    visibleIf: (permissions) => Boolean(permissions?.canManageReports),
  },
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
  {
    path: '/admin/logs',
    label: '시스템 로그',
    icon: FileText,
    visibleIf: (permissions) => Boolean(permissions?.canViewLogs),
  },
  {
    path: '/admin/moderation',
    label: '채팅 모더레이션',
    icon: MessagesSquare,
    visibleIf: (permissions) => Boolean(permissions?.canManageChatModeration),
  },
  {
    path: '/admin/captcha',
    label: '캡챠 관리',
    icon: ShieldAlert,
    visibleIf: (permissions) => Boolean(permissions?.canManageCaptcha),
  },
  {
    path: '/admin/cloud-monitor',
    label: '클라우드 모니터링',
    icon: CloudCog,
    visibleIf: (permissions) => Boolean(permissions?.canViewLogs),
  },
  {
    path: '/admin/handocr',
    label: 'HandOCR CAPTCHA',
    icon: ScanText,
    visibleIf: (permissions) =>
      Boolean(
        permissions?.canManageHandOcr ?? permissions?.canManageCaptcha ?? false,
      ),
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
  const menuItems = allMenuItems.filter((item) => {
    if (!item.visibleIf) return true;
    return item.visibleIf(permissions);
  });

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-50 flex flex-col border-r border-gray-200 bg-white py-6 transition-all duration-300 ${
        collapsed ? 'w-[64px]' : 'w-[200px]'
      }`}
    >
      <div
        className={`mb-6 flex items-center ${
          collapsed ? 'justify-center px-0' : 'justify-between px-5'
        }`}
      >
        <a
          href="/home"
          title={collapsed ? 'Party-Up' : undefined}
          className="flex items-center gap-2.5 text-lg font-bold text-foreground no-underline"
        >
          <span className="h-7 w-7 shrink-0 rounded-full bg-[#6C9FFF]" />
          {!collapsed && <span>Party-Up</span>}
        </a>

        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          aria-expanded={!collapsed}
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 ${
            collapsed ? 'mt-4' : ''
          }`}
        >
          <Menu size={20} strokeWidth={2} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center border-l-4 py-2.5 text-sm font-medium no-underline transition-all ${
                  collapsed ? 'justify-center px-0' : 'gap-3 px-5'
                } ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 text-blue-500 font-semibold'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon size={18} strokeWidth={2} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}

        <div className="flex-1" />

        <NavLink
          to="/home"
          title={collapsed ? '사용자 홈' : undefined}
          className={`flex items-center border-l-4 border-transparent py-2.5 text-sm font-medium text-gray-500 no-underline transition-all hover:bg-gray-50 hover:text-gray-900 ${
            collapsed ? 'justify-center px-0' : 'gap-3 px-5'
          }`}
        >
          <Home size={18} strokeWidth={2} className="shrink-0" />
          {!collapsed && <span>사용자 홈</span>}
        </NavLink>
      </nav>
    </aside>
  );
}
