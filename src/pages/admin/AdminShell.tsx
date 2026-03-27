import { Outlet } from 'react-router';
import AdminSidebar from './components/AdminSidebar';


/**
 * 관리자 전용 레이아웃
 * - 기존 AppShell과 별도로, 관리자 사이드바 + 헤더를 사용
 * - /admin 하위 라우트에서만 렌더링
 */
export default function AdminShell() {
  return (
    <div className="flex min-h-screen bg-[#f5f5f5] text-foreground">
      <AdminSidebar />
      <div className="flex-1 flex flex-col ml-[200px]">
        <Outlet />
      </div>
    </div>
  );
}
