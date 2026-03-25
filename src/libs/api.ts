import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
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
  }
);
