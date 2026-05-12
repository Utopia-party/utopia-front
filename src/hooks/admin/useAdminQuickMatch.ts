import { useCallback, useEffect, useState } from 'react';
import {
  forceFailAdminQuickMatchRequest,
  getAdminQuickMatchQuality,
  getAdminQuickMatchRequestDetail,
  getAdminQuickMatchRequests,
  getAdminQuickMatchSummary,
  getAdminQuickMatchTrainingEvents,
  getAdminQuickMatchTrainingStats,
  rebuildAdminQuickMatchTrainingStats,
  retryAdminQuickMatchRequest,
  runAdminQuickMatchTrainingLabel,
} from '../../apis/admin/adminQuickMatch';
import type {
  AdminQuickMatchDetailResponse,
  AdminQuickMatchListParams,
  AdminQuickMatchSummary,
  QuickMatchQualityResponse,
  QuickMatchRequestRow,
  TrainingEventListParams,
  TrainingEventListResponse,
  TrainingStatsResponse,
} from '../../types/admin/adminQuickMatch';

const PAGE_SIZE = 20;

export function useAdminQuickMatch() {
  const [params, setParams] = useState<AdminQuickMatchListParams>({
    status: 'all',
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const [eventParams, setEventParams] = useState<TrainingEventListParams>({
    labelStatus: 'all',
    seedOnly: false,
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const [statType, setStatType] = useState('all');

  const [rows, setRows] = useState<QuickMatchRequestRow[]>([]);
  const [summary, setSummary] = useState<AdminQuickMatchSummary | null>(null);
  const [detail, setDetail] = useState<AdminQuickMatchDetailResponse | null>(
    null,
  );
  const [trainingStats, setTrainingStats] =
    useState<TrainingStatsResponse | null>(null);
  const [trainingEvents, setTrainingEvents] =
    useState<TrainingEventListResponse | null>(null);
  const [quality, setQuality] = useState<QuickMatchQualityResponse | null>(
    null,
  );
  const [total, setTotal] = useState(0);
  const [selectedRequestId, setSelectedRequestId] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    const data = await getAdminQuickMatchSummary();
    setSummary(data);
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [summaryData, listData] = await Promise.all([
        getAdminQuickMatchSummary(),
        getAdminQuickMatchRequests(params),
      ]);
      setSummary(summaryData);
      setRows(listData.rows);
      setTotal(listData.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청 목록 조회 실패');
    } finally {
      setLoading(false);
    }
  }, [params]);

  const fetchDetail = useCallback(async (requestId: string) => {
    if (!requestId) {
      setDetail(null);
      setSelectedRequestId('');
      return;
    }

    setDetailLoading(true);
    setError(null);

    try {
      const data = await getAdminQuickMatchRequestDetail(requestId);
      setSelectedRequestId(requestId);
      setDetail(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청 상세 조회 실패');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const fetchTrainingStats = useCallback(async () => {
    setTrainingLoading(true);
    setError(null);

    try {
      const data = await getAdminQuickMatchTrainingStats(statType);
      setTrainingStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '학습 통계 조회 실패');
    } finally {
      setTrainingLoading(false);
    }
  }, [statType]);

  const fetchTrainingEvents = useCallback(async () => {
    setTrainingLoading(true);
    setError(null);

    try {
      const data = await getAdminQuickMatchTrainingEvents(eventParams);
      setTrainingEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '학습 이벤트 조회 실패');
    } finally {
      setTrainingLoading(false);
    }
  }, [eventParams]);

  const fetchQuality = useCallback(async () => {
    setQualityLoading(true);
    setError(null);

    try {
      const data = await getAdminQuickMatchQuality();
      setQuality(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '품질 지표 조회 실패');
    } finally {
      setQualityLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    fetchTrainingStats();
  }, [fetchTrainingStats]);

  useEffect(() => {
    fetchTrainingEvents();
  }, [fetchTrainingEvents]);

  useEffect(() => {
    fetchQuality();
  }, [fetchQuality]);

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
      status: 'all',
      page: 1,
      pageSize: PAGE_SIZE,
    });
  }, []);

  const updateEventParams = useCallback(
    (next: Partial<TrainingEventListParams>) => {
      setEventParams((prev) => ({
        ...prev,
        ...next,
        page: next.page ?? 1,
      }));
    },
    [],
  );

  const retryRequest = useCallback(
    async (requestId: string) => {
      await retryAdminQuickMatchRequest(requestId);
      await fetchRequests();
      await fetchSummary();
      if (selectedRequestId === requestId) await fetchDetail(requestId);
    },
    [fetchDetail, fetchRequests, fetchSummary, selectedRequestId],
  );

  const forceFailRequest = useCallback(
    async (requestId: string, reason?: string) => {
      await forceFailAdminQuickMatchRequest(requestId, reason);
      await fetchRequests();
      await fetchSummary();
      if (selectedRequestId === requestId) await fetchDetail(requestId);
    },
    [fetchDetail, fetchRequests, fetchSummary, selectedRequestId],
  );

  const rebuildStats = useCallback(async () => {
    await rebuildAdminQuickMatchTrainingStats();
    await Promise.all([fetchSummary(), fetchTrainingStats(), fetchQuality()]);
  }, [fetchQuality, fetchSummary, fetchTrainingStats]);

  const runLabeling = useCallback(
    async (retentionDays = 30) => {
      await runAdminQuickMatchTrainingLabel(retentionDays);
      await Promise.all([
        fetchSummary(),
        fetchTrainingStats(),
        fetchTrainingEvents(),
        fetchQuality(),
      ]);
    },
    [fetchQuality, fetchSummary, fetchTrainingEvents, fetchTrainingStats],
  );

  return {
    rows,
    summary,
    total,
    detail,
    trainingStats,
    trainingEvents,
    quality,
    selectedRequestId,
    loading,
    detailLoading,
    trainingLoading,
    qualityLoading,
    error,
    params,
    eventParams,
    statType,

    setStatType,
    updateParams,
    resetParams,
    updateEventParams,
    selectRequest: fetchDetail,
    retryRequest,
    forceFailRequest,
    rebuildStats,
    runLabeling,
    refetch: fetchRequests,
    refetchTrainingStats: fetchTrainingStats,
    refetchTrainingEvents: fetchTrainingEvents,
    refetchQuality: fetchQuality,
  };
}
