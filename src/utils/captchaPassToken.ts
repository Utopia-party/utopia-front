const CAPTCHA_PASS_TOKEN_KEY = 'hand_ocr_passtoken';

export const getPassToken = () => {
  return sessionStorage.getItem(CAPTCHA_PASS_TOKEN_KEY);
};

export const setPassToken = (token: string) => {
  sessionStorage.setItem(CAPTCHA_PASS_TOKEN_KEY, token);
};

export const clearPassToken = () => {
  sessionStorage.removeItem(CAPTCHA_PASS_TOKEN_KEY);
};
