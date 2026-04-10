import { QueryClient } from '@tanstack/react-query';

// 전역 데이터 관리 설정
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
