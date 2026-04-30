/*
- 회원가입
- 이메일/비밀번호 찾기
- 일반로그인
- 소셜 로그인 
- 회원 전역상태관리
*/

// 회원가입
export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  nickname: string;
  phone: string;
  referrers: string[];
}

export interface CheckExistsResponse {
  exists: boolean;
}

export interface EmailRequestResponse {
  message: string;
  expires_in: number;
}

export interface EmailVerifyResponse {
  success: boolean;
  message: string;
}

export interface SignupResponse {
  id: string;
  email: string;
  name?: string | null;
  nickname: string;
  phone?: string | null;
  referrer?: string | null;
}

// 이메일 찾기
export interface FindIdPayload {
  nickname: string;
  phone: string;
}

export interface FindIdResponse {
  email?: string;
  message?: string;
}

// 비밀번호
export interface FindPasswordPayload {
  email: string;
}

export interface FindPasswordResponse {
  message: string;
}

export interface ResetPasswordPayload {
  email: string;
  new_password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

// 일반로그인
export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
}

export interface AuthErrorResponse {
  detail?: string;
  message?: string;
}

// 소셜 로그인
export type SocialProvider = 'google' | 'kakao' | 'naver';

export interface SocialLoginPayload {
  oauth: string;
  code: string;
  state?: string;
}

export interface SocialLoginNeedNicknameResponse {
  status: 'NEED_NICKNAME';
  oauth: string;
  oauth_id: string;
  email: string | null;
  name: string | null;
}

export interface SocialLoginSuccessResponse {
  status: 'LOGIN_SUCCESS' | 'SIGNUP_SUCCESS';
  message?: string;
  user?: {
    email: string;
    nickname: string;
    name?: string | null;
  };
}

export type SocialLoginResponse =
  | SocialLoginNeedNicknameResponse
  | SocialLoginSuccessResponse;

export interface SocialSignupPayload {
  oauth: string;
  oauth_id: string;
  email: string | null;
  name: string | null;
  nickname: string;
  phone: string | null;
}

export interface SocialSignupResponse {
  status: 'LOGIN_SUCCESS' | 'SIGNUP_SUCCESS';
  message: string;
  user: {
    email: string;
    nickname: string;
  };
}

export interface SocialSignupLocationState {
  oauth: string;
  oauth_id: string;
  email: string | null;
  name: string | null;
}

// 회원 정보 및 로그인 상태 관리
export interface AuthUser {
  user_id: string;
  email: string;
  name?: string | null;
  nickname: string;
  phone?: string;
  provider: string;
  role: string;
  trust_score: number;
  updated_at?: string;
  created_at?: string;
  profile_image?: string | null;
}

export interface MeResponse {
  is_logged_in: boolean;
  user: AuthUser | null;
}

export interface ExtendSessionResponse {
  message: string;
}

export interface RandomNicknameResponse {
  nickname: string;
}
