import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, 
});

let isRefreshing = false; 
let failedQueue: any[] = []; 

const SESSION_EXPIRED_MESSAGE = '로그인이 만료되었습니다. 다시 로그인해주세요.';
const NO_REFRESH_RETRY_PATHS = new Set([
  '/api/login',
  '/api/refresh',
  '/api/users',
  '/api/users/find-id',
  '/api/users/find-password',
  '/api/users/reset-password',
  '/api/users/check-email',
  '/api/users/check-nickname',
  '/api/email-request',
  '/api/email-verify',
  '/api/appeals',
  '/api/appeals/my',
]);

const BAN_DETAILS = new Set(['비활성화된 계정입니다.', '이용이 제한된 계정입니다.']);

const isRefreshTokenErrorMessage = (message: unknown) => {
  if (typeof message !== 'string') return false;
  return (
    message.includes('refresh token이 없습니다') ||
    message.includes('유효하지 않은 refresh token') ||
    message.includes('만료된 refresh token') ||
    message.includes('재사용된 refresh token')
  );
};

const shouldSkipRefreshRetry = (url: unknown) => {
  if (typeof url !== 'string') return false;
  return NO_REFRESH_RETRY_PATHS.has(url);
};

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error); 
    } else {
      prom.resolve(); 
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url;
    const detail = error.response?.data?.detail ?? '';

    if (status === 403 && BAN_DETAILS.has(detail)) {
      // 이의제기 경로는 정지 유저도 접근 가능해야 하므로 리디렉트 제외
      if (!url?.startsWith('/api/appeals')) {
        const banType = detail === '이용이 제한된 계정입니다.' ? 'ip_ban' : 'manual';
        window.location.replace(`/login?reason=banned&ban_type=${banType}`);
        return Promise.reject(error);
      }
    }

    if (status === 401 && !shouldSkipRefreshRetry(url)) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(api(originalRequest)), 
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        await api.post('/api/refresh');

        processQueue(null);

        return api(originalRequest);
      } catch (refreshError) {
        if (axios.isAxiosError(refreshError)) {
          const detail = refreshError.response?.data?.detail;
          const message = refreshError.response?.data?.message;

          if (
            isRefreshTokenErrorMessage(detail) ||
            isRefreshTokenErrorMessage(message)
          ) {
            if (refreshError.response?.data) {
              refreshError.response.data.detail = SESSION_EXPIRED_MESSAGE;
              refreshError.response.data.message = SESSION_EXPIRED_MESSAGE;
            }
          }
        }

        processQueue(refreshError);

        console.log('로그인 만료 → 로그아웃 처리');
        window.dispatchEvent(new Event('auth-changed'));

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
