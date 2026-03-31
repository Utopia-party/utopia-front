/**
 * CaptchaWidget 관련 타입 정의
 */

// ─────────────────────────────────────────────
// Widget Props
// ─────────────────────────────────────────────
export interface CaptchaWidgetProps {
  onSuccess: (token: string) => void;
  onError?: (error: string) => void;
  triggerType?: 'register' | 'new_ip_login' | 'login_fail';
}

// ─────────────────────────────────────────────
// API 응답 타입
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// 위젯 내부 상태
// ─────────────────────────────────────────────
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
