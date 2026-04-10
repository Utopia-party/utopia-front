import { Outlet } from 'react-router';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

function AppShell() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, []);
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppShell;
