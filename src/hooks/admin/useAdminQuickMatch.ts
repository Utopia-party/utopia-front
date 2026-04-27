import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  forceFailAdminQuickMatchRequest,
  getAdminQuickMatchPolicy,
  getAdminQuickMatchRequests,
  regeneratePartyQuickMatchEmbedding,
  regenerateUserQuickMatchEmbedding,
  retryAdminQuickMatchRequest,
  runQuickMatchEmbeddingBackfill,
  updateAdminQuickMatchPolicy,
} from '../../apis/admin/admin-quick-match';
import type {
  AdminQuickMatchListParams,
  AdminQuickMatchSummary,
  QuickMatchRequestRow,
  TuningPolicy,
} from '../../types/admin/admin-quick-match';

const PAGE_SIZE = 20;

export function useAdminQuickMatch() {
  const [params, setParams] = useState<AdminQuickMatchListParams>({
    status: '전체',
    serviceName: '전체',
    page: 1,
    pageSize: PAGE_SIZE,
  });

  const [rows, setRows] = useState<QuickMatchRequestRow[]>([]);
  const [summary, setSummary] = useState<AdminQuickMatchSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [policy, setPolicy] = useState<TuningPolicy | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(() => {
    return (
      rows.find((row) => row.requestId === selectedRequestId) ?? rows[0] ?? null
    );
  }, [rows, selectedRequestId]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAdminQuickMatchRequests(params);
      setRows(data.rows);
      setSummary(data.summary);
      setTotal(data.total);

      if (!selectedRequestId && data.rows[0]) {
        setSelectedRequestId(data.rows[0].requestId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청 목록 조회 실패');
    } finally {
      setLoading(false);
    }
  }, [params, selectedRequestId]);

  const fetchPolicy = useCallback(async () => {
    setPolicyLoading(true);

    try {
      const data = await getAdminQuickMatchPolicy();
      setPolicy(data.policy);
    } catch (err) {
      setError(err instanceof Error ? err.message : '튜닝 정책 조회 실패');
    } finally {
      setPolicyLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  const updateParams = useCallback(
    (next: Partial<AdminQuickMatchListParams>) => {
      setParams((prev) => ({
        ...prev,
        ...next,
        page: next.page ?? 1,
      }));
    },
    [],
  );

  const resetParams = useCallback(() => {
    setParams({
      status: '전체',
      serviceName: '전체',
      page: 1,
      pageSize: PAGE_SIZE,
    });
  }, []);

  const savePolicy = useCallback(async (nextPolicy: TuningPolicy) => {
    const data = await updateAdminQuickMatchPolicy(nextPolicy);
    setPolicy(data.policy);
    return data.policy;
  }, []);

  const retryRequest = useCallback(
    async (requestId: string) => {
      await retryAdminQuickMatchRequest(requestId);
      await fetchRequests();
    },
    [fetchRequests],
  );

  const forceFailRequest = useCallback(
    async (requestId: string) => {
      await forceFailAdminQuickMatchRequest(requestId);
      await fetchRequests();
    },
    [fetchRequests],
  );

  const regenerateUserEmbedding = useCallback(
    async (userId: string) => {
      await regenerateUserQuickMatchEmbedding(userId);
      await fetchRequests();
    },
    [fetchRequests],
  );

  const regeneratePartyEmbedding = useCallback(
    async (partyId: string) => {
      await regeneratePartyQuickMatchEmbedding(partyId);
      await fetchRequests();
    },
    [fetchRequests],
  );

  const runEmbeddingBackfill = useCallback(async () => {
    await runQuickMatchEmbeddingBackfill();
    await fetchRequests();
  }, [fetchRequests]);

  return {
    rows,
    summary,
    total,
    policy,
    selected,
    selectedRequestId,
    loading,
    policyLoading,
    error,
    params,

    setSelectedRequestId,
    updateParams,
    resetParams,
    savePolicy,
    retryRequest,
    forceFailRequest,
    regenerateUserEmbedding,
    regeneratePartyEmbedding,
    runEmbeddingBackfill,
    refetch: fetchRequests,
  };
}
