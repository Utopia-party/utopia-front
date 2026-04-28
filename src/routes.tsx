import { createBrowserRouter, redirect, Outlet } from 'react-router';

// 레이아웃 컴포넌트
import App from './App';
import AppShell from './AppShell';

// 공개 페이지
import Home from './pages/Home';
import Landing from './pages/landing/Landing';
import Login from './pages/auth/Login';
import FindId from './pages/auth/FindId';
import FindPassword from './pages/auth/FindPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Signup from './pages/auth/Signup';
import SocialCallback from './pages/auth/SocialCallback';
import SocialSignup from './pages/auth/SocialSignup';
import HandOcrCaptcha from './pages/hand-ocr-captcha/HandOcrCaptcha';
import Chat from './pages/chat/Chat';
import CreateParty from './components/party/CreateParty';

// 보호 라우트
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/auth/ProtectedRoute';

// 사이드바가 필요한 페이지
import Report from './pages/report/Report';
import Party from './pages/Party';

// 마이페이지 관련
import Profile from './pages/mypage/Profile';
import MyParty from './pages/mypage/MyParty';
import MyReport from './pages/mypage/MyReport';
import MyPayment from './pages/mypage/MyPayment';
import MyTrustHistory from './pages/mypage/MyTrustHistory';
import MyPraises from './pages/mypage/MyPraises';

// 관리자 페이지
import AdminShell from './pages/admin/AdminShell';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRoles from './pages/admin/AdminRoles';
import AdminUsers from './pages/admin/AdminUsers';
import AdminServices from './pages/admin/AdminServices';
import AdminParties from './pages/admin/AdminParties';
import AdminReports from './pages/admin/AdminReports';
import AdminSettlements from './pages/admin/AdminSettlements';
import AdminPayments from './pages/admin/AdminPayments';
import AdminSystemLogs from './pages/admin/AdminSystemLogs';
import AdminModeration from './pages/admin/AdminModeration';
import AdminCloudMonitor from './pages/admin/AdminCloudMonitor';
import AdminHandOCR from './pages/admin/AdminHandOCR';
import AdminCaptcha from './pages/admin/AdminCaptcha';
import AdminQuickMatch from './pages/admin/AdminQuickMatch';

const router = createBrowserRouter([
  {
    index: true,
    Component: Landing,
  },
  {
    path: '/유토피아-Partyup-파티-매칭-플랫폼',
    Component: Landing,
  },

  {
    path: '/',
    Component: App,
    children: [
      {
        path: 'home',
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
        path: 'find-id',
        Component: FindId,
      },
      {
        path: 'find-password',
        Component: FindPassword,
      },
      {
        path: 'reset-password',
        Component: ResetPassword,
      },
      {
        path: 'handcaptcha',
        element: (
          <ProtectedRoute>
            <HandOcrCaptcha />
          </ProtectedRoute>
        ),
      },
      {
        path: 'oauth/callback/:provider',
        Component: SocialCallback,
      },
      {
        path: 'social-signup',
        Component: SocialSignup,
      },
      {
        path: 'party/:partyId/chat',
        Component: Chat,
      },
      {
        path: 'party/create',
        element: (
          <ProtectedRoute>
            <CreateParty />
          </ProtectedRoute>
        ),
      },
    ],
  },

  {
    path: '/',
    Component: AppShell,
    children: [
      {
        path: 'report',
        element: (
          <ProtectedRoute>
            <Report />
          </ProtectedRoute>
        ),
      },
      {
        path: 'party/:partyId',
        Component: Party,
      },
      {
        path: 'mypage',
        element: (
          <ProtectedRoute>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            loader: () => redirect('/mypage/profile'),
          },
          {
            path: 'profile',
            element: <Profile />,
          },
          {
            path: 'party',
            element: <MyParty />,
          },
          {
            path: 'my_trust_history',
            element: <MyTrustHistory />,
          },
          {
            path: '/mypage/report',
            element: <MyReport />,
          },
          {
            path: 'payment',
            element: <MyPayment />,
          },
          {
            path: 'praises',
            element: <MyPraises />,
          },
        ],
      },
    ],
  },

  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminShell />
      </AdminRoute>
    ),
    children: [
      {
        index: true,
        Component: AdminDashboard,
      },
      {
        path: 'roles',
        Component: AdminRoles,
      },
      {
        path: 'users',
        Component: AdminUsers,
      },
      {
        path: 'services',
        Component: AdminServices,
      },
      {
        path: 'parties',
        Component: AdminParties,
      },
      {
        path: 'handocr',
        Component: AdminHandOCR,
      },
      {
        path: 'reports',
        Component: AdminReports,
      },
      {
        path: 'settlements',
        Component: AdminSettlements,
      },
      {
        path: 'payments',
        Component: AdminPayments,
      },
      {
        path: 'logs',
        Component: AdminSystemLogs,
      },
      {
        path: 'moderation',
        Component: AdminModeration,
      },
      {
        path: 'captcha',
        Component: AdminCaptcha,
      },
      {
        path: 'quick-match',
        Component: AdminQuickMatch,
      },
      {
        path: 'cloud-monitor',
        Component: AdminCloudMonitor,
      },
    ],
  },
]);

export default router;
