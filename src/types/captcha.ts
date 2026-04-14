export interface CaptchaFailureReason {
  type?: string;
  retryAfterSeconds?: number;
  [key: string]: unknown;
}

export interface StartCaptchaResponse {
  success: boolean;
  sessionId?: string;
  text?: string;
  pose?: string;
  message?: string;
  failureReason?: CaptchaFailureReason;
}

export interface VerifyCaptchaResponse {
  success: boolean;
  message: string;
  passToken?: string;
  failureReason?: CaptchaFailureReason;
}
