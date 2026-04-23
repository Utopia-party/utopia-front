import { useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import AdminSidebar from './components/AdminSidebar';
import {
  fetchAdminPermissions,
  getAdminErrorMessage,
  type AdminPermissions,
} from '../../apis/admin';

/**
 * 관리자 전용 레이아웃
 * - 기존 AppShell과 별도로, 관리자 사이드바 + 헤더를 사용
 * - /admin 하위 라우트에서만 렌더링
 */
export default function AdminShell() {
  const location = useLocation();
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const allowedByPath = useMemo(() => {
    const path = location.pathname;
    if (path === '/admin') {
      return true;
    }
    if (path.startsWith('/admin/roles')) {
      return permissions?.canManageAdmins ?? false;
    }
    if (path.startsWith('/admin/users')) {
      return permissions?.canManageUsers ?? false;
    }
    if (path.startsWith('/admin/services')) {
      return permissions?.canManageParties ?? false;
    }
    if (path.startsWith('/admin/parties')) {
      return permissions?.canManageParties ?? false;
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
    if (path.startsWith('/admin/handocr')) {
      return permissions?.canManageHandOcr ?? false;
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
    <div className="flex min-h-screen bg-[#f5f5f5] text-foreground">
      <AdminSidebar permissions={permissions} />
      <div className="flex-1 flex flex-col ml-[200px]">
        <Outlet />
      </div>
    </div>
  );
}
