import { useState } from 'react';
import { useNavigate } from 'react-router';
import { fetchParty } from '../../../libs/partyapi';
import { getPaymentPreview } from '../../../apis/quickMatchApi';
import {
  useQuickMatchRequest,
  useQuickMatchCandidates,
  useQuickMatchSelect,
  useQuickMatchJoin,
} from '../../../hooks/useQuickMatch';
import type { PaymentPreviewResponse } from '../../../types/quickMatch';
import type { ApiError } from '../../../types/error';

type MatchStep = 'idle' | 'requesting' | 'finding' | 'selecting' | 'joining';

export type JoinResult = {
  party_id?: number;
  party_title?: string;
  title?: string;
  service_name?: string;
  monthly_price?: number | null;
  original_price?: number | null;
  service_total_price?: number | null;
  member_count?: number;
  max_members?: number | null;
  host_nickname?: string;
  host_trust_score?: number | null;
  category_name?: string;
  description?: string;
  status?: string;
  id?: number | string;
  [key: string]: unknown;
};

type PartyDetailResponse = {
  id?: number | string;
  title?: string;
  service_name?: string;
  category_name?: string;
  member_count?: number;
  max_members?: number | null;
  monthly_price?: number | null;
  original_price?: number | null;
  service_total_price?: number | null;
  host_nickname?: string;
  host_trust_score?: number | null;
  description?: string;
  status?: string;
};

function normalizeErrorCode(error: unknown): string {
  const apiError = error as ApiError;
  const rawCode = apiError.response?.data?.code;
  const detail = apiError.response?.data?.detail;
  const message = apiError.response?.data?.message || apiError.message;
  const raw = String(rawCode || detail || message || '').trim();

  if (
    raw === 'ALREADY_IN_ACTIVE_PARTY' ||
    raw.includes('이미 참여 중인 활성 파티') ||
    raw.includes('이미 가입') ||
    raw.includes('활성 파티가 있습니다')
  )
    return 'ALREADY_IN_ACTIVE_PARTY';
  if (raw === 'ALREADY_REQUESTED' || raw.includes('이미 빠른매칭'))
    return 'ALREADY_REQUESTED';
  if (raw === 'NO_RECRUITING_PARTY') return 'NO_RECRUITING_PARTY';
  if (raw === 'NO_CANDIDATE') return 'NO_CANDIDATE';
  if (raw === 'USER_BANNED') return 'USER_BANNED';
  if (raw === 'USER_INACTIVE') return 'USER_INACTIVE';
  return raw || 'UNKNOWN_ERROR';
}

export function useQuickMatchFlow() {
  const navigate = useNavigate();
  const [isMatching, setIsMatching] = useState(false);
  const [matchStep, setMatchStep] = useState<MatchStep>('idle');
  const [matchResult, setMatchResult] = useState<JoinResult | null>(null);
  const [matchPaymentPreview, setMatchPaymentPreview] =
    useState<PaymentPreviewResponse | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchErrorCode, setMatchErrorCode] = useState<string | null>(null);

  const requestMut = useQuickMatchRequest();
  const candidatesMut = useQuickMatchCandidates();
  const selectMut = useQuickMatchSelect();
  const joinMut = useQuickMatchJoin();

  const currentStepTitle = (() => {
    switch (matchStep) {
      case 'requesting':
        return '빠른 매칭 요청을 확인하고 있어요';
      case 'finding':
        return '조건에 맞는 파티를 찾고 있어요';
      case 'selecting':
        return '가장 잘 맞는 파티를 고르고 있어요';
      case 'joining':
        return '선택된 파티에 자동으로 참여하는 중이에요';
      default:
        return '조건에 맞는 파티를 찾고 있어요';
    }
  })();

  const handleSubmit = async (payload: {
    service_id: string;
    preferred_conditions?: {
      duration_preference?: 'under_1_month' | '1_3_months' | 'over_3_months';
    };
  }) => {
    try {
      setIsMatching(true);
      setMatchStep('requesting');
      setMatchResult(null);
      setMatchError(null);
      setMatchErrorCode(null);
      setMatchPaymentPreview(null);

      const { request_id } = await requestMut.mutateAsync(payload);

      setMatchStep('finding');
      await candidatesMut.mutateAsync(request_id);

      setMatchStep('selecting');
      await selectMut.mutateAsync(request_id);

      setMatchStep('joining');
      const joinResponse = (await joinMut.mutateAsync(
        request_id,
      )) as unknown as JoinResult;
      const matchedPartyId = joinResponse?.party_id ?? joinResponse?.id;

      if (!matchedPartyId)
        throw new Error('매칭된 파티 정보를 찾을 수 없습니다.');

      let paymentPreview: PaymentPreviewResponse | null = null;
      try {
        paymentPreview = await getPaymentPreview(String(matchedPartyId));
        setMatchPaymentPreview(paymentPreview);
      } catch {
        setMatchPaymentPreview(null);
      }

      let detailedParty: PartyDetailResponse | null = null;
      try {
        detailedParty = (await fetchParty(
          String(matchedPartyId),
        )) as PartyDetailResponse;
      } catch {
        /* ignore */
      }

      setMatchResult({
        ...joinResponse,
        ...(detailedParty ?? {}),
        party_id: (() => {
          const n = Number(joinResponse?.party_id ?? detailedParty?.id);
          return Number.isNaN(n) ? undefined : n;
        })(),
        party_title:
          joinResponse?.party_title ?? detailedParty?.title ?? '매칭된 파티',
        title:
          detailedParty?.title ?? joinResponse?.party_title ?? '매칭된 파티',
        service_name:
          detailedParty?.service_name ?? joinResponse?.service_name ?? '',
        category_name:
          detailedParty?.category_name ?? joinResponse?.category_name ?? '기타',
        member_count:
          detailedParty?.member_count ?? joinResponse?.member_count ?? 0,
        max_members:
          detailedParty?.max_members ?? joinResponse?.max_members ?? null,
        monthly_price:
          detailedParty?.monthly_price ?? joinResponse?.monthly_price ?? null,
        original_price:
          detailedParty?.original_price ?? joinResponse?.original_price ?? null,
        service_total_price:
          detailedParty?.service_total_price ??
          joinResponse?.service_total_price ??
          null,
        host_nickname:
          detailedParty?.host_nickname ?? joinResponse?.host_nickname ?? '익명',
        host_trust_score:
          detailedParty?.host_trust_score ??
          joinResponse?.host_trust_score ??
          null,
        description:
          detailedParty?.description ?? joinResponse?.description ?? '',
        status: detailedParty?.status ?? joinResponse?.status ?? 'recruiting',
      });
    } catch (error: unknown) {
      const apiError = error as ApiError;
      setMatchErrorCode(normalizeErrorCode(error));
      setMatchError(
        apiError.response?.data?.message ||
          apiError.response?.data?.detail ||
          apiError.message ||
          '빠른 매칭 요청 중 오류가 발생했습니다.',
      );
    } finally {
      setIsMatching(false);
      setMatchStep('idle');
    }
  };

  const clearResult = () => {
    setMatchResult(null);
    setMatchPaymentPreview(null);
  };
  const clearError = () => {
    setMatchError(null);
    setMatchErrorCode(null);
  };

  const goToParty = (partyId: number | string) => {
    clearResult();
    navigate(`/party/${partyId}/chat`);
  };

  return {
    isMatching,
    matchResult,
    matchPaymentPreview,
    matchError,
    matchErrorCode,
    currentStepTitle,
    handleSubmit,
    clearResult,
    clearError,
    goToParty,
  };
}
