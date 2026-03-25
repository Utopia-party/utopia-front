import { Outlet } from 'react-router';

/**
 * App 컴포넌트는 '풀스크린 레이아웃' 역할을 합니다.
 * 네비바, 사이드바, 푸터가 없는 페이지(로그인, 채팅 등)들이 
 * 이 Outlet 자리에 렌더링됩니다.
 */
function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* routes.ts에서 App의 children으로 설정된 
         Login, Signup, Chat 등의 컴포넌트가 이 자리에 나타납니다. 
      */}
      <Outlet />
    </div>
  );
}

export default App;