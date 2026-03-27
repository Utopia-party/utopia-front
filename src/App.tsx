import { Outlet } from 'react-router';
import Header from './components/Header';
// import Footer from './components/layout/Footer';
import Sidebar from './components/Sidebar';

/**
 * App 컴포넌트는 'Header + Footer가 있는 풀스크린 레이아웃' 역할을 합니다.
 * Sidebar가 없는 페이지(랜딩, 로그인, 회원가입, 채팅 등)에서 사용됩니다.
 * Sidebar가 필요한 페이지는 AppShell을 사용합니다.
 */
function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        {/* <Footer /> */}
      </div>
    </div>
  );
}

export default App;
