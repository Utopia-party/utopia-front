import { Outlet } from 'react-router';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

/**
 * App 컴포넌트는 'Header + Footer가 있는 풀스크린 레이아웃' 역할을 합니다.
 * Sidebar가 없는 페이지(랜딩, 로그인, 회원가입, 채팅 등)에서 사용됩니다.
 * Sidebar가 필요한 페이지는 AppShell을 사용합니다.
 */
function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1">
          <div className="mx-auto w-full max-w-350">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
