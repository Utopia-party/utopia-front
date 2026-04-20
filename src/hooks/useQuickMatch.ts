import { useMutation } from '@tanstack/react-query';
import {
  generateQuickMatchCandidates,
  joinQuickMatchParty,
  requestQuickMatch,
  selectQuickMatchParty,
} from '../apis/quickMatchApi';
import type { QuickMatchCreatePayload } from '../types/quickMatch';

export const useQuickMatchRequest = () => {
  return useMutation({
    mutationFn: (payload: QuickMatchCreatePayload) =>
      requestQuickMatch(payload),
  });
};

export const useQuickMatchCandidates = () => {
  return useMutation({
    mutationFn: (requestId: string) => generateQuickMatchCandidates(requestId),
  });
};

export const useQuickMatchSelect = () => {
  return useMutation({
    mutationFn: (requestId: string) => selectQuickMatchParty(requestId),
  });
};

export const useQuickMatchJoin = () => {
  return useMutation({
    mutationFn: (requestId: string) => joinQuickMatchParty(requestId),
  });
};

export const useQuickMatch = () => {
  return useQuickMatchRequest();
};
