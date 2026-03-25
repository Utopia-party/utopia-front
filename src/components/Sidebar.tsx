import { Link } from 'react-router';

/**
 * 사이드바 네비게이션 컴포넌트
 * - 앱의 왼쪽 레이아웃을 담당하며 주요 페이지 이동 링크를 포함
 * - 로그인 상태에 따라 메뉴 노출 여부를 제어할 예정(사용자 / 관리자)
 */

export default function Sidebar() {
  return (
    <aside className="w-64 border-r-2 border-gray-200 bg-card p-6 flex flex-col">
      <div className="mb-10 text-2xl font-bold text-foreground">
        Party-Up
      </div>
      <nav className="flex flex-col gap-4 font-medium">
        <Link to="/" className="hover:text-primary transition">홈</Link>
        <Link to="/mypage" className="hover:text-primary transition">마이페이지</Link>
        <Link to="/report" className="hover:text-primary transition">신고</Link>
      </nav>
    </aside>
  );
}