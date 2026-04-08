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
} from '../types/auth';

// 회원가입
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
): Promise<EmailRequestResponse> => {
  const response = await api.post<EmailRequestResponse>(
    '/api/email-request',
    null,
    {
      params: { email },
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

// 이메일 찾기
export const findId = async (
  payload: FindIdPayload,
): Promise<FindIdResponse> => {
  const response = await api.post<FindIdResponse>(
    '/api/users/find-id',
    payload,
  );
  return response.data;
};

// 비밀번호 찾기
export const findPassword = async (
  payload: FindPasswordPayload,
): Promise<FindPasswordResponse> => {
  const response = await api.post<FindPasswordResponse>(
    '/api/users/find-password',
    payload,
  );
  return response.data;
};
