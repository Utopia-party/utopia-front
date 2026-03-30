import axios from 'axios';

export const api = axios.create({
  // 프론트 .env가 아직 없더라도 로컬 백엔드(8000번 포트)로 붙도록 기본값을 둡니다.
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    if (status === 401 && url !== '/me') {
      console.log('로그인이 만료되었습니다.');
      window.dispatchEvent(new Event('auth-changed'));
    }

    return Promise.reject(error);
  },
);
