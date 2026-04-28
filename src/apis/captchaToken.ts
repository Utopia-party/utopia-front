const CAPTCHA_PASS_TOKEN_KEY = 'captchaPassToken';
const CAPTCHA_PASS_TOKEN_TTL_MS = 3 * 60 * 1000;

interface CaptchaTokenPayload {
  token: string;
  expiresAt: number;
}

export const captchaTokenStorage = {
  set(token: string) {
    const payload: CaptchaTokenPayload = {
      token,
      expiresAt: Date.now() + CAPTCHA_PASS_TOKEN_TTL_MS,
    };

    sessionStorage.setItem(CAPTCHA_PASS_TOKEN_KEY, JSON.stringify(payload));
  },

  get() {
    const raw = sessionStorage.getItem(CAPTCHA_PASS_TOKEN_KEY);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as CaptchaTokenPayload;

      if (!parsed.token || !parsed.expiresAt) {
        sessionStorage.removeItem(CAPTCHA_PASS_TOKEN_KEY);
        return null;
      }

      if (Date.now() >= parsed.expiresAt) {
        sessionStorage.removeItem(CAPTCHA_PASS_TOKEN_KEY);
        return null;
      }

      return parsed.token;
    } catch {
      sessionStorage.removeItem(CAPTCHA_PASS_TOKEN_KEY);
      return null;
    }
  },

  clear() {
    sessionStorage.removeItem(CAPTCHA_PASS_TOKEN_KEY);
  },

  has() {
    return !!this.get();
  },
};
