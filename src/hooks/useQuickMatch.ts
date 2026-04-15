import { useMutation } from '@tanstack/react-query';
import { requestQuickMatch } from '../apis/quickMatchApi';
import type { QuickMatchRequest } from '../types/quickMatch';

export const useQuickMatch = () => {
  return useMutation({
    mutationFn: (payload: QuickMatchRequest) => requestQuickMatch(payload),
  });
};
