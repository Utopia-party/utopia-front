export interface StartCaptchaResponse {
  sessionId: string;
  text: string;
  pose: string;
}

export interface VerifyCaptchaResponse {
  success: boolean;
  message: string;
}
