/**
 * CaptchaWidget 관련 타입 정의
 * CONTEXT.md Section 4, 11, 14 기반
 */

// ── CaptchaWidget Props ────────────────────────────
export interface CaptchaWidgetProps {
  /** 캡챠 통과 시 JWT 토큰을 전달하는 콜백 */
  onSuccess: (token: string) => void;
  /** 캡챠 실패/차단 시 콜백 (선택) */
  onError?: (error: string) => void;
  /** 캡챠 트리거 타입 */
  triggerType?: 'register' | 'new_ip_login' | 'login_fail';
}

// ── API 응답 타입 ──────────────────────────────────

/** POST /api/captcha/init 응답 */
export interface CaptchaInitResponse {
  /** 비간섭 검증 결과: pass / challenge / block */
  status: 'pass' | 'challenge' | 'block';
  /** pass일 때 바로 발급되는 JWT */
  token?: string;
  /** challenge일 때 세션 ID */
  session_id?: string;
  /** block일 때 메시지 */
  message?: string;
}

/** GET /api/captcha/challenge 응답 */
export interface CaptchaChallengeResponse {
  session_id: string;
  /** 이모지 3개 이미지 URL (GAN 생성 + CLIP perturbation) */
  emojis: EmojiItem[];
  /** 실제 동물 사진 9개 URL (3×3 그리드) */
  photos: PhotoItem[];
}

export interface EmojiItem {
  id: string;
  url: string;
  category: string; // cat, dog, bear, fox, penguin
}

export interface PhotoItem {
  id: string;
  url: string;
  /** 0~8 (그리드 위치) */
  index: number;
}

/** POST /api/captcha/verify 요청 */
export interface CaptchaVerifyRequest {
  session_id: string;
  /** 사용자가 선택한 사진 인덱스 배열 (순서 포함) */
  selected_indices: number[];
}

/** POST /api/captcha/verify 응답 */
export interface CaptchaVerifyResponse {
  success: boolean;
  token?: string;
  /** 실패 시: 남은 시도 횟수, 0이면 차단 */
  remaining_attempts?: number;
  message?: string;
}

// ── 위젯 내부 상태 ─────────────────────────────────
export type CaptchaPhase =
  | 'idle' // 초기: 체크박스만 표시
  | 'verifying' // 비간섭 검증 진행중 (로딩)
  | 'passed' // 비간섭 검증 통과 (체크 완료)
  | 'challenge' // 이미지 캡챠 출제
  | 'submitting' // 정답 제출 중
  | 'success' // 캡챠 통과
  | 'failed' // 실패 (재시도 가능)
  | 'blocked'; // 차단
