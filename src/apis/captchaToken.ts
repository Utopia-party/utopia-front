const CAPTCHA_PASS_TOKEN_KEY = 'captchaPassToken';

export const captchaTokenStorage = {
  set(token: string) {
    sessionStorage.setItem(CAPTCHA_PASS_TOKEN_KEY, token);
  },

  get() {
    return sessionStorage.getItem(CAPTCHA_PASS_TOKEN_KEY);
  },

  clear() {
    sessionStorage.removeItem(CAPTCHA_PASS_TOKEN_KEY);
  },

  has() {
    return !!sessionStorage.getItem(CAPTCHA_PASS_TOKEN_KEY);
  },
};
