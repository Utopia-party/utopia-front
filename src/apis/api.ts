import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // 쿠키(access/refresh token) 자동 포함
});

let isRefreshing = false; // refresh 중복 호출 방지 플래그
let failedQueue: any[] = []; // refresh 완료 후 재시도할 요청들

// refresh 끝나면 대기 중이던 요청들 재실행
const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error); // refresh 실패 → 전부 실패 처리
    } else {
      prom.resolve(); // refresh 성공 → 재요청 진행
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

    // access token 만료 (401) 발생 시
    // 단, /me, /refresh는 제외 (무한루프 방지)
    if (status === 401 && url !== '/api/me' && url !== '/api/refresh') {
      // 이미 refresh 진행 중이면 → 요청을 큐에 넣고 대기
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(api(originalRequest)), // refresh 끝나면 재요청
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        // refresh 요청 → 서버가 새 access/refresh 쿠키 발급
        await api.post('/api/refresh');

        // 대기 중 요청들 재실행
        processQueue(null);

        // 실패했던 원래 요청 재시도
        return api(originalRequest);
      } catch (refreshError) {
        // refresh 실패 → 모든 요청 실패 처리 + 로그아웃 이벤트
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
