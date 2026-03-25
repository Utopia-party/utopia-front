import { Outlet } from 'react-router';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Sidebar + Header 있는 레이아웃 (마이페이지, 파티 상세 등)
function AppShell() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto bg-[#fcfcfc] p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;
