import { api } from '../libs/api';
import type {
  StartCaptchaResponse,
  VerifyCaptchaResponse,
} from '../types/captcha';

export const startCaptcha = async (): Promise<StartCaptchaResponse> => {
  // axios는 응답 결과를 .data 안에 담아줍니다.
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
        'Content-Type': 'multipart/form-data', // 🌟 파일 전송을 위한 헤더 설정
      },
    },
  );

  return response.data;
};
