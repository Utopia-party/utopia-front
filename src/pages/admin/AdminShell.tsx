import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import AdminSidebar from './components/AdminSidebar';
import {
  fetchAdminPermissions,
  getAdminErrorMessage,
  type AdminPermissions,
} from '../../apis/admin';
import { fetchAdminAppeals } from '../../apis/admin/adminAppeals';
import { fetchAdminReportUnhandledCount } from '../../apis/admin-report';

const ADMIN_REPORT_COUNT_CHANGED_EVENT = 'admin-report-count-changed';

/**
 * 관리자 전용 레이아웃
 * - /admin 하위 라우트에서만 렌더링
 * - 모바일/태블릿에서는 본문을 화면 전체 폭으로 사용
 * - 데스크톱 이상에서만 사이드바 너비만큼 본문을 밀어냄
 */
export default function AdminShell() {
  const location = useLocation();
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [appealPendingCount, setAppealPendingCount] = useState(0);
  const [reportUnhandledCount, setReportUnhandledCount] = useState(0);

  useEffect(() => {
    let alive = true;

    const loadPermissions = async () => {
      try {
        setLoading(true);
        setError('');

        const nextPermissions = await fetchAdminPermissions();

        if (alive) {
          setPermissions(nextPermissions);
        }
      } catch (err) {
        if (alive) {
          setError(getAdminErrorMessage(err));
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    void loadPermissions();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!permissions?.canManageUsers) {
      setAppealPendingCount(0);
      return;
    }

    let alive = true;

    fetchAdminAppeals('PENDING')
      .then((data) => {
        if (alive) {
          setAppealPendingCount(data.length);
        }
      })
      .catch(() => {
        if (alive) {
          setAppealPendingCount(0);
        }
      });

    return () => {
      alive = false;
    };
  }, [location.pathname, permissions?.canManageUsers]);

  const loadReportUnhandledCount = useCallback(async () => {
    if (!permissions?.canManageReports) {
      setReportUnhandledCount(0);
      return;
    }

    try {
      const count = await fetchAdminReportUnhandledCount();
      setReportUnhandledCount(count);
    } catch {
      setReportUnhandledCount(0);
    }
  }, [permissions?.canManageReports]);

  useEffect(() => {
    void loadReportUnhandledCount();
  }, [location.pathname, loadReportUnhandledCount]);

  useEffect(() => {
    const handleReportCountChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ delta?: number }>;
      const delta = customEvent.detail?.delta;

      // 처리 성공 직후 화면 숫자를 먼저 즉시 반영
      if (typeof delta === 'number') {
        setReportUnhandledCount((prev) => Math.max(0, prev + delta));
      }

      // 이후 서버 기준 count로 다시 동기화
      void loadReportUnhandledCount();
    };

    window.addEventListener(
      ADMIN_REPORT_COUNT_CHANGED_EVENT,
      handleReportCountChanged,
    );

    return () => {
      window.removeEventListener(
        ADMIN_REPORT_COUNT_CHANGED_EVENT,
        handleReportCountChanged,
      );
    };
  }, [loadReportUnhandledCount]);

  const allowedByPath = useMemo(() => {
    const path = location.pathname;

    if (path === '/admin') {
      return permissions?.canViewDashboard ?? false;
    }

    if (path.startsWith('/admin/roles')) {
      return permissions?.canManageAdmins ?? false;
    }

    if (path.startsWith('/admin/users')) {
      return permissions?.canManageUsers ?? false;
    }

    if (path.startsWith('/admin/services')) {
      return permissions?.canManageServices ?? false;
    }

    if (path.startsWith('/admin/parties')) {
      return permissions?.canManageParties ?? false;
    }

    if (path.startsWith('/admin/quick-match')) {
      return permissions?.canManageQuickMatch ?? false;
    }

    if (path.startsWith('/admin/reports')) {
      return permissions?.canManageReports ?? false;
    }

    if (path.startsWith('/admin/settlements')) {
      return permissions?.canApproveSettlements ?? false;
    }

    if (path.startsWith('/admin/payments')) {
      return permissions?.canManagePayments ?? false;
    }

    if (path.startsWith('/admin/logs')) {
      return permissions?.canViewLogs ?? false;
    }

    if (path.startsWith('/admin/moderation')) {
      return permissions?.canManageChatModeration ?? false;
    }

    if (path.startsWith('/admin/captcha')) {
      return permissions?.canManageCaptcha ?? false;
    }

    if (path.startsWith('/admin/cloud-monitor')) {
      return permissions?.canViewCloudMonitoring ?? false;
    }

    if (path.startsWith('/admin/handocr')) {
      return Boolean(
        permissions?.canManageHandOcr ?? permissions?.canManageCaptcha ?? false,
      );
    }

    if (path.startsWith('/admin/appeals')) {
      return permissions?.canManageUsers ?? false;
    }

    if (path.startsWith('/admin/saas')) {
      return permissions?.canManageCaptcha ?? false;
    }

    return true;
  }, [location.pathname, permissions]);

  if (loading) {
    return null;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5] p-6">
        <div className="rounded-2xl border border-red-200 bg-white px-6 py-5 text-sm text-red-600 shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!allowedByPath) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="flex min-h-screen w-full min-w-0 overflow-x-hidden bg-[#f5f5f5] text-foreground">
      <AdminSidebar
        permissions={permissions}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
        appealPendingCount={appealPendingCount}
        reportUnhandledCount={reportUnhandledCount}
      />

      <div
        className={`ml-0 flex w-full min-w-0 flex-1 flex-col overflow-x-hidden transition-all duration-300 ${
          sidebarCollapsed ? 'md:ml-18' : 'md:ml-60'
        }`}
      >
        <Outlet />
      </div>
    </div>
  );
}
