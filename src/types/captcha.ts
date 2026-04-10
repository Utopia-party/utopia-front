export interface StartCaptchaResponse {
  success: boolean;
  sessionId?: string;
  text?: string;
  pose?: string;
  reused?: boolean;
  remainingSeconds?: number;
  message?: string;
  failureReason?: {
    type?: string;
    retryAfterSeconds?: number;
  };
}

export interface VerifyCaptchaResponse {
  success: boolean;
  message: string;
  passToken?: string;
}
