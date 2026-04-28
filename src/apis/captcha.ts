import { api } from './api';
import type {
  StartCaptchaResponse,
  VerifyCaptchaResponse,
} from '../types/captcha';

export const startCaptcha = async (): Promise<StartCaptchaResponse> => {
  const response = await api.post<StartCaptchaResponse>(
    '/api/captcha/handocr/start',
  );

  return response.data;
};

export const verifyCaptcha = async (
  sessionId: string,
  imageFile: File,
): Promise<VerifyCaptchaResponse> => {
  const formData = new FormData();
  formData.append('sessionId', sessionId);
  formData.append('image', imageFile);

  const response = await api.post<VerifyCaptchaResponse>(
    '/api/captcha/handocr/verify',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );

  return response.data;
};
