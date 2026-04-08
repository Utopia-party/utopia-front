import { createBrowserRouter, redirect } from 'react-router';

// 레이아웃 컴포넌트
import App from './App';
import AppShell from './AppShell';

// 공개 페이지
import Home from './pages/Home';
import Landing from './pages/landing/Landing';
import Login from './pages/Login';
import FindId from './pages/FindId';
import FindPassword from './pages/FindPassword';
import ResetPassword from './pages/ResetPassword';
import Signup from './pages/Signup';
import SocialCallback from './pages/SocialCallback';
import SocialSignup from './pages/SocialSignup';
import Favor from './pages/Favor';
import HandOcrCaptcha from './pages/hand-ocr-captcha/HandOcrCaptcha';
import Chat from './pages/Chat';
import CreateParty from './components/party/CreateParty';
// 상원: 기존 캡챠 데모 라우트는 실제 1차/2차 캡챠 흐름으로 대체되어 import를 제거했습니다.

// 보호 라우트
import AdminRoute from './components/AdminRoute';
import ProtectedRoute from './components/ProtectedRoute';

// 사이드바가 필요한 페이지
import Report from './pages/report/Report';
import Party from './pages/Party';

// 마이페이지 관련
import Profile from './pages/mypage/Profile';
import MyParty from './pages/mypage/MyParty';
import MyHistory from './pages/mypage/MyHistory';
import MyReport from './pages/mypage/MyReport';
import MyPayment from './pages/mypage/MyPayment';
import MyTrustHistory from './pages/mypage/MyTrustHistory';

// 관리자 페이지
import AdminShell from './pages/admin/AdminShell';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRoles from './pages/admin/AdminRoles';
import AdminUsers from './pages/admin/AdminUsers';
import AdminParties from './pages/admin/AdminParties';
import AdminReports from './pages/admin/AdminReports';
import AdminReceipts from './pages/admin/AdminReceipts';
import AdminSettlements from './pages/admin/AdminSettlements';
import AdminSystemLogs from './pages/admin/AdminSystemLogs';

const router = createBrowserRouter([
  {
    index: true,
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
        path: 'favor',
        Component: Favor,
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
      // 상원: 실제 회원가입/로그인 캡챠 흐름을 쓰므로 별도 captcha-demo 라우트는 두지 않습니다.
    ],
  },

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
        path: 'mypage',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            loader: () => redirect('/mypage/profile'),
          },
          {
            path: 'profile',
            element: (
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            ),
          },
          {
            path: 'party',
            element: (
              <ProtectedRoute>
                <MyParty />
              </ProtectedRoute>
            ),
          },
          {
            path: 'history',
            element: (
              <ProtectedRoute>
                <MyHistory />
              </ProtectedRoute>
            ),
          },
          {
            path: 'my_trust_history',
            element: (
              <ProtectedRoute>
                <MyTrustHistory />
              </ProtectedRoute>
            ),
          },
          {
            path: 'report',
            element: (
              <ProtectedRoute>
                <MyReport />
              </ProtectedRoute>
            ),
          },
          {
            path: 'payment',
            element: (
              <ProtectedRoute>
                <MyPayment />
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
  },

  {
    path: '/admin',
    // 상원: 관리자 페이지는 직접 URL로 들어와도 인증과 관리자 권한을 먼저 확인합니다.
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
        path: 'parties',
        Component: AdminParties,
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
