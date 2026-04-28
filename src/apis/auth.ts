import { api } from './api';
import type {
  SignupPayload,
  SignupResponse,
  CheckExistsResponse,
  EmailRequestResponse,
  EmailVerifyResponse,
  FindIdPayload,
  FindIdResponse,
  FindPasswordPayload,
  FindPasswordResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
  LoginPayload,
  LoginResponse,
  MeResponse,
  SocialLoginPayload,
  SocialLoginResponse,
  SocialSignupPayload,
  SocialSignupResponse,
} from '../types/auth';

export const checkEmail = async (
  email: string,
): Promise<CheckExistsResponse> => {
  const response = await api.get<CheckExistsResponse>(
    '/api/users/check-email',
    {
      params: { email },
    },
  );
  return response.data;
};

export const requestEmailVerification = async (
  email: string,
  type: 'signup' | 'reset-password' = 'signup',
): Promise<EmailRequestResponse> => {
  const response = await api.post<EmailRequestResponse>(
    '/api/email-request',
    null,
    {
      params: { email, type },
    },
  );
  return response.data;
};

export const verifyEmailCode = async (
  email: string,
  code: string,
): Promise<EmailVerifyResponse> => {
  const response = await api.post<EmailVerifyResponse>(
    '/api/email-verify',
    null,
    {
      params: { email, code },
    },
  );
  return response.data;
};

export const checkNickname = async (
  nickname: string,
): Promise<CheckExistsResponse> => {
  const response = await api.get<CheckExistsResponse>(
    '/api/users/check-nickname',
    {
      params: { nickname },
    },
  );
  return response.data;
};

export const signup = async (
  payload: SignupPayload,
  captchaToken: string,
): Promise<SignupResponse> => {
  const response = await api.post<SignupResponse>('/api/users', payload, {
    headers: { 'X-Captcha-Token': captchaToken },
  });
  return response.data;
};

export const findId = async (
  payload: FindIdPayload,
): Promise<FindIdResponse> => {
  const response = await api.post<FindIdResponse>(
    '/api/users/find-id',
    payload,
  );
  return response.data;
};

export const findPassword = async (
  payload: FindPasswordPayload,
): Promise<FindPasswordResponse> => {
  const response = await api.post<FindPasswordResponse>(
    '/api/users/find-password',
    payload,
  );
  return response.data;
};

export const resetPassword = async (
  payload: ResetPasswordPayload,
): Promise<ResetPasswordResponse> => {
  const response = await api.post<ResetPasswordResponse>(
    '/api/users/reset-password',
    payload,
  );
  return response.data;
};

export const login = async (
  payload: LoginPayload,
  captchaToken: string,
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/api/login', payload, {
    headers: { 'X-Captcha-Token': captchaToken },
  });

  return response.data;
};

export const socialLogin = async (
  payload: SocialLoginPayload,
): Promise<SocialLoginResponse> => {
  const response = await api.post<SocialLoginResponse>(
    '/api/auth/login',
    payload,
  );
  return response.data;
};

export const socialSignup = async (
  payload: SocialSignupPayload,
): Promise<SocialSignupResponse> => {
  const response = await api.post<SocialSignupResponse>(
    '/api/auth/social/signup',
    payload,
  );
  return response.data;
};

export const getMe = async (): Promise<MeResponse> => {
  const response = await api.get<MeResponse>('/api/me');
  return response.data;
};

export const logout = async (): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/api/logout');
  return response.data;
};
