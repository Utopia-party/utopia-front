export interface CaptchaUserDiagnosis {
  pose?: {
    matched?: boolean;
    expected?: string;
    detected?: string | null;
    confidence?: number | null;
  };
  text?: {
    matched?: boolean;
    expected?: string;
    detected?: string | null;
    confidence?: number | null;
    matchMode?: string;
  };
  nextAction?: string;
  remainingAttempts?: number;
}

export interface CaptchaFailureReason {
  type?: string;
  retryAfterSeconds?: number;

  expectedPose?: string;
  detectedPose?: string | null;
  expectedText?: string;
  detectedText?: string | null;

  poseConfidence?: number | null;
  ocrConfidence?: number | null;
  ocrCandidates?: string[];

  aiErrorCode?: string;
  aiMessage?: string;
  aiDetail?: string;
  aiGuide?: string;

  userHint?: string;
  remainingAttempts?: number;
  userDiagnosis?: CaptchaUserDiagnosis;

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
