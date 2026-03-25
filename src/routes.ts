import { createBrowserRouter, redirect } from 'react-router';
import App from './App';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Report from './pages/Report';
import Party from './pages/Party';
import Me from './pages/mypage/Me';
import MyParty from './pages/mypage/MyParty';
import MyHistory from './pages/mypage/MyHistory';
import MyReport from './pages/mypage/MyReport';
import MyPayment from './pages/mypage/MyPayment';
import HandOcrCaptcha from './pages/hand-ocr-captcha/HandOcrCaptcha';
import Landing from './pages/landing/Landing';

const router = createBrowserRouter([
  {
    path: '/',
    Component: App,
    children: [
      {
        index: true,
        Component: Landing,
      },
      // 로그인
      {
        path: 'login',
        Component: Login,
      },
      // 회원가입
      {
        path: 'signup',
        Component: Signup,
      },
      // 유저 페이지 /profile/유저ID
      // 내 아이디일경우 /mypage로 이동?
      {
        path: 'profile/:userId',
        Component: Profile,
      },

      // 마이 페이지
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
      // 신고 페이지
      {
        path: 'report',
        Component: Report,
      },
      // 파티 페이지
      {
        path: 'party/:partyId',
        Component: Party,
      },
      {
        path: 'handcaptcha',
        Component: HandOcrCaptcha,
      },
    ],
  },
]);

export default router;
