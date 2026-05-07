import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router';
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
  Zap,
  ScanText,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Users,
  MessageCircleWarning,
  type LucideIcon,
} from 'lucide-react';
import type { AdminPermissions } from '../../../apis/admin';
import logoImage from '../../../assets/logo.png';

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
        visibleIf: (permissions) => Boolean(permissions?.canViewDashboard),
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
      {
        path: '/admin/appeals',
        label: '이의제기 관리',
        icon: MessageCircleWarning,
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
        visibleIf: (permissions) => Boolean(permissions?.canManageServices),
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
        visibleIf: (permissions) => Boolean(permissions?.canManageQuickMatch),
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
        label: 'HandOCR 캡챠',
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
        visibleIf: (permissions) =>
          Boolean(permissions?.canViewCloudMonitoring),
      },
    ],
  },
];

export default function AdminSidebar({
  permissions,
  collapsed,
  onToggleCollapsed,
  appealPendingCount = 0,
}: {
  permissions: AdminPermissions | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  appealPendingCount?: number;
}) {
  // 💡 모바일 상태 관리를 위한 State 추가
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // 화면 크기에 따라 데스크탑 여부 감지
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false); // PC 사이즈로 넘어가면 모바일 메뉴는 닫기
      }
    };

    // 초기 로드시 1회 실행
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 💡 모바일에서는 항상 확장된 뷰(글자까지 모두 보이는 상태)로 표시되도록 보정
  const displayCollapsed = isDesktop ? collapsed : false;

  const visibleSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.visibleIf) return true;
        return item.visibleIf(permissions);
      }),
    }))
    .filter((section) => section.items.length > 0);

  // 💡 링크 클릭 시 모바일 환경이라면 사이드바 자동 닫기
  const handleLinkClick = () => {
    if (!isDesktop) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* 💡 모바일 햄버거 플로팅 버튼 (사이드바 닫혀있을 때 표시) */}
      {!isMobileOpen && (
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl transition-transform hover:scale-105 active:scale-95 md:hidden"
          aria-label="메뉴 열기"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}

      {/* 💡 모바일 사이드바 배경 백드롭 (열려있을 때 딤처리) */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        // 💡 핵심: 모바일은 화면 밖에 숨겨두고(`-translate-x-full`), PC는 `md:translate-x-0`으로 항상 고정
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-gray-200 bg-white py-6 transition-all duration-300 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 w-60 ${displayCollapsed ? 'md:w-18' : 'md:w-60'}`}
      >
        <div
          className={`mb-6 flex ${
            displayCollapsed
              ? 'flex-col items-center gap-4 px-0'
              : 'items-center justify-between px-5'
          }`}
        >
          <Link
            to="/home"
            title={displayCollapsed ? 'Party-Up' : undefined}
            onClick={handleLinkClick}
            className={`flex items-center text-lg font-bold text-foreground no-underline ${
              displayCollapsed ? 'justify-center' : 'gap-2.5'
            }`}
          >
            <img
              src={logoImage}
              alt="Party-Up"
              className={`shrink-0 object-contain ${
                displayCollapsed ? 'h-8 w-8' : 'h-8 w-8'
              }`}
            />
            {!displayCollapsed && <span>Party-Up</span>}
          </Link>

          <button
            type="button"
            onClick={() => {
              if (!isDesktop) {
                setIsMobileOpen(false); // 모바일에서는 닫기 버튼으로 동작
              } else {
                onToggleCollapsed(); // 데스크탑에서는 접기/펴기 버튼으로 동작
              }
            }}
            aria-label={displayCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
            aria-expanded={!displayCollapsed}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 active:scale-95"
          >
            <Menu size={22} strokeWidth={2.25} />
          </button>
        </div>

        {/* 💡 사이드바 메뉴 영역 스크롤바 숨김 */}
        <nav className="flex flex-1 flex-col overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <div className="flex flex-col gap-1">
            {visibleSections.map((section) => (
              <div
                key={section.title}
                className={
                  displayCollapsed ? 'mt-2 first:mt-0' : 'mt-4 first:mt-0'
                }
              >
                {!displayCollapsed && (
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
                        title={displayCollapsed ? item.label : undefined}
                        onClick={handleLinkClick}
                        className={({ isActive }) =>
                          `flex items-center border-l-4 py-3 text-sm font-medium no-underline transition-all active:scale-[0.98] ${
                            displayCollapsed
                              ? 'justify-center px-0'
                              : 'gap-3 px-5'
                          } ${
                            isActive
                              ? 'border-blue-500 bg-blue-50 text-blue-600 font-bold'
                              : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                          }`
                        }
                      >
                        <Icon size={20} strokeWidth={2} className="shrink-0" />
                        {!displayCollapsed && (
                          <span className="flex flex-1 items-center justify-between">
                            {item.label}
                            {item.path === '/admin/appeals' &&
                              appealPendingCount > 0 && (
                                <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                                  {appealPendingCount}
                                </span>
                              )}
                          </span>
                        )}
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
            title={displayCollapsed ? '사용자 홈' : undefined}
            onClick={handleLinkClick}
            className={`mt-4 flex items-center border-l-4 border-transparent py-3 text-sm font-medium text-gray-500 no-underline transition-all hover:bg-gray-50 hover:text-gray-900 active:scale-[0.98] ${
              displayCollapsed ? 'justify-center px-0' : 'gap-3 px-5'
            }`}
          >
            <Home size={20} strokeWidth={2} className="shrink-0" />
            {!displayCollapsed && <span>사용자 홈</span>}
          </NavLink>
        </nav>
      </aside>
    </>
  );
}
