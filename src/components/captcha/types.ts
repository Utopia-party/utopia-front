/**
 * CaptchaWidget 관련 타입 정의
 * CONTEXT.md Section 4, 11, 14 기반
 */

// 상원: 캡챠 위젯은 성공 시 토큰을 부모 로그인/회원가입 폼으로 전달합니다.
export interface CaptchaWidgetProps {
  onSuccess: (token: string) => void;
  onError?: (error: string) => void;
  triggerType?: 'register' | 'new_ip_login' | 'login_fail';
}

// 상원: init, challenge, verify, status 네 단계에서 주고받는 1차 캡챠 API 응답 타입입니다.
export interface CaptchaInitResponse {
  status: 'pass' | 'challenge' | 'block';
  token?: string | null;
  session_id?: string | null;
  message?: string | null;
}

export interface EmojiItem {
  id: string;
  url: string;
  category: string;
}

export interface PhotoItem {
  id: string;
  url: string;
  index: number;
}

export interface CaptchaChallengeResponse {
  session_id: string;
  emojis: EmojiItem[];
  photos: PhotoItem[];
}

export interface CaptchaVerifyResponse {
  success: boolean;
  token?: string | null;
  remaining_attempts?: number | null;
  message?: string | null;
}

export interface CaptchaStatusResponse {
  status: 'NORMAL' | 'WAIT' | 'LOCKED' | 'BANNED';
  message: string;
  retry_after_seconds?: number | null;
  active_session_id?: string | null;
}

// 상원: 위젯 내부에서는 서버 상태를 화면 단계로 매핑해서 체크박스, 모달, 상태 카드를 제어합니다.
export type CaptchaPhase =
  | 'idle'
  | 'verifying'
  | 'passed'
  | 'challenge'
  | 'submitting'
  | 'success'
  | 'failed'
  | 'wait'
  | 'locked'
  | 'banned';
