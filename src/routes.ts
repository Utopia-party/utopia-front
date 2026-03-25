import { createBrowserRouter, redirect } from 'react-router';
// 레이아웃 컴포넌트
import App from './App'; // 풀스크린 (Navbar/Footer/Sidebar 없음)
import AppShell from './AppShell'; // Sidebar + Header 포함 레이아웃

// 일반 페이지
import Landing from './pages/landing/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SocialCallback from './pages/SocialCallback';
import Favor from './pages/Favor';
import HandOcrCaptcha from './pages/hand-ocr-captcha/HandOcrCaptcha';
import Chat from './pages/Chat';

// 사이드바가 필요한 페이지
import Profile from './pages/Profile';
import Report from './pages/Report';
import Party from './pages/Party';

// 마이페이지 관련
import Me from './pages/mypage/Me';
import MyParty from './pages/mypage/MyParty';
import MyHistory from './pages/mypage/MyHistory';
import MyReport from './pages/mypage/MyReport';
import MyPayment from './pages/mypage/MyPayment';

const router = createBrowserRouter([
  // ── 1. 풀스크린 레이아웃 그룹 (App.tsx 사용) ───────────────────
  // 배경을 꽉 채우거나, 사이드바가 방해되는 페이지들
  {
    path: '/',
    Component: App,
    children: [
      {
        index: true,
        Component: Landing,
      },
      {
        path: 'login',
        Component: Login,
      },
      {
        path: 'signup',
        Component: Signup,
      },
      {
        path: 'favor',
        Component: Favor,
      },
      {
        path: 'handcaptcha',
        Component: HandOcrCaptcha,
      },
      {
        path: 'oauth/callback/:provider',
        Component: SocialCallback,
      },
      {
        path: 'party/:partyId/chat',
        Component: Chat,
      },
    ],
  },

  // ── 2. 사이드바 + 헤더 레이아웃 그룹 (AppShell.tsx 사용) ──────
  // 대시보드 형태나 서비스 메인 기능을 이용하는 페이지들
  {
    path: '/',
    Component: AppShell,
    children: [
      {
        path: 'profile/:userId',
        Component: Profile,
      },
      {
        path: 'report',
        Component: Report,
      },
      {
        path: 'party/:partyId',
        Component: Party,
      },
      // 마이 페이지 중첩 라우팅
      {
        path: 'mypage',
        Component: Me,
        children: [
          {
            index: true,
            loader: () => redirect('/mypage/profile'),
          },
          {
            path: 'profile',
            Component: Profile,
          },
          {
            path: 'party',
            Component: MyParty,
          },
          {
            path: 'history',
            Component: MyHistory,
          },
          {
            path: 'report',
            Component: MyReport,
          },
          {
            path: 'payment',
            Component: MyPayment,
          },
        ],
      },
    ],
  },
]);

export default router;