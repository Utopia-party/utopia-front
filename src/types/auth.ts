// 회원가입
export interface SignupPayload {
  email: string;
  password: string;
  name: string;
  nickname: string;
  phone: string;
  referrer?: string;
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
  name: string;
  phone_number: string;
}

export interface FindIdResponse {
  email?: string;
  message?: string;
}

// 비밀번호 찾기 요청
export interface FindPasswordPayload {
  email: string;
  name: string;
}

// 비밀번호 찾기 응답
export interface FindPasswordResponse {
  message: string;
}
