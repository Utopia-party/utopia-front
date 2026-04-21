import { useMutation } from '@tanstack/react-query';
import {
  generateQuickMatchCandidates,
  joinQuickMatchParty,
  requestQuickMatch,
  selectQuickMatchParty,
} from '../apis/quickMatchApi';
import { useAuthStore } from '../stores/authStore';
import type { QuickMatchCreatePayload } from '../types/quickMatch';

const assertQuickMatchAvailable = (
  isLoggedIn: boolean,
  loading: boolean,
): void => {
  if (loading) {
    throw new Error('AUTH_LOADING');
  }

  if (!isLoggedIn) {
    throw new Error('LOGIN_REQUIRED');
  }
};

export const useQuickMatchRequest = () => {
  const { isLoggedIn, loading } = useAuthStore();

  return useMutation({
    mutationFn: async (payload: QuickMatchCreatePayload) => {
      assertQuickMatchAvailable(isLoggedIn, loading);
      return requestQuickMatch(payload);
    },
  });
};

export const useQuickMatchCandidates = () => {
  const { isLoggedIn, loading } = useAuthStore();

  return useMutation({
    mutationFn: async (requestId: string) => {
      assertQuickMatchAvailable(isLoggedIn, loading);
      return generateQuickMatchCandidates(requestId);
    },
  });
};

export const useQuickMatchSelect = () => {
  const { isLoggedIn, loading } = useAuthStore();

  return useMutation({
    mutationFn: async (requestId: string) => {
      assertQuickMatchAvailable(isLoggedIn, loading);
      return selectQuickMatchParty(requestId);
    },
  });
};

export const useQuickMatchJoin = () => {
  const { isLoggedIn, loading } = useAuthStore();

  return useMutation({
    mutationFn: async (requestId: string) => {
      assertQuickMatchAvailable(isLoggedIn, loading);
      return joinQuickMatchParty(requestId);
    },
  });
};

export const useQuickMatch = () => {
  return useQuickMatchRequest();
};
