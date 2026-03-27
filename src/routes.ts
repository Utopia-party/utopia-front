import { createBrowserRouter, redirect } from 'react-router';

// 레이아웃 컴포넌트
import App from './App'; // 풀스크린 (Navbar/Footer/Sidebar 없음)
import AppShell from './AppShell'; // Sidebar + Header 포함 레이아웃

import Home from './pages/Home';
import Landing from './pages/landing/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SocialCallback from './pages/SocialCallback';
import Favor from './pages/Favor';
import HandOcrCaptcha from './pages/hand-ocr-captcha/HandOcrCaptcha';
import Chat from './pages/Chat';
import CaptchaDemo from './pages/CaptchaDemo';

// 사이드바가 필요한 페이지
import Report from './pages/Report';
import Profile from './pages/Profile';
import Party from './pages/Party';

// 마이페이지 관련
import Profile from './pages/mypage/Profile';
import MyParty from './pages/mypage/MyParty';
import MyHistory from './pages/mypage/MyHistory';
import MyReport from './pages/mypage/MyReport';
import MyPayment from './pages/mypage/MyPayment';

// 관리자 페이지 (팀원 추가분)
import AdminShell from './pages/admin/AdminShell';
import AdminReports from './pages/admin/AdminReports';
import AdminReceipts from './pages/admin/AdminReceipts';
import AdminSettlements from './pages/admin/AdminSettlements';
import AdminSystemLogs from './pages/admin/AdminSystemLogs';
import Report from './pages/report/Report';

const router = createBrowserRouter([
  // ── 1. 풀스크린 레이아웃 그룹 (App.tsx 사용) ───────────────────

  {
    index: true,
    Component: Landing, // 팀원의 랜딩 페이지를 인덱스로 설정
  },

  {
    path: '/',
    Component: App,
    children: [
      {
        path: 'home', // 성보님의 Home 페이지
        Component: Home,
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
      {
        path: 'captcha-demo',
        Component: CaptchaDemo,
      },
    ],
  },

  // ── 2. 사이드바 + 헤더 레이아웃 그룹 (AppShell.tsx 사용) ──────
  {
    path: '/',
    Component: AppShell,
    children: [
      {
        path: 'report',
        Component: Report,
      },
      {
        path: 'party/:partyId',
        Component: Party,
      },
      {
        path: '/mypage',
        Component: Profile,
        children: [
          {
            index: true,
            loader: () => redirect('/mypage/profile'),
          },
          {
            path: '/mypage/profile',
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

  // ── 3. 관리자 레이아웃 그룹 (AdminShell 사용) ──────────────
  {
    path: '/admin',
    Component: AdminShell,
    children: [
      {
        index: true,
        loader: () => redirect('/admin/reports'),
      },
      {
        path: 'reports',
        Component: AdminReports,
      },
      {
        path: 'receipts',
        Component: AdminReceipts,
      },
      {
        path: 'settlements',
        Component: AdminSettlements,
      },
      {
        path: 'logs',
        Component: AdminSystemLogs,
      },
    ],
  },
]);

export default router;
