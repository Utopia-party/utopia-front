import { useEffect, useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import type { Party } from '../../types/party';
import {
  fetchParties,
  fetchParty,
  fetchCategories,
  partyKeys,
  categoryKeys,
  fetchTrendingKeywords,
  recordSearchKeyword,
  searchKeys,
} from '../../libs/partyapi';
import PartyDetailModal from '../../components/party/PartyDetail';
import QuickMatchForm from '../../components/quickMatch/QuickMatchForm';
import MatchingLoadingModal from '../../components/quickMatch/MatchingLoadingModal';
import MatchingErrorModal from '../../components/quickMatch/MatchingErrorModal';
import MatchingSuccessModal from '../../components/quickMatch/MatchingSuccessModal';
import {
  useQuickMatchRequest,
  useQuickMatchCandidates,
  useQuickMatchSelect,
  useQuickMatchJoin,
} from '../../hooks/useQuickMatch';
import { useAuthStore } from '../../stores/authStore';
import { getPaymentPreview } from '../../apis/quickMatchApi';
import type { PaymentPreviewResponse } from '../../types/quickMatch';
import CategorySidebar from './components/CategorySidebar';
import SearchBar from './components/SearchBar';
import KeywordChips from './components/KeywordChips';
import SectionTitle from './components/SectionTitle';
import PartyCard from './components/PartyCard';
import ApplyModal from './components/ApplyModal';
import type { ApiError } from '../../types/error';

type PartyWithDetails = Party & {
  description?: string;
  host_trust_score?: number;
};

type JoinResult = {
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

type MatchStep = 'idle' | 'requesting' | 'finding' | 'selecting' | 'joining';

type MatchedParty = NonNullable<
  ComponentProps<typeof MatchingSuccessModal>['matchedParty']
> & { id?: number | string };

const COOLDOWN_SECONDS = 600;
const STORAGE_KEY = 'party_refresh_until';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useAuthStore();

  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [refreshKeys, setRefreshKeys] = useState<Record<string, number>>(() => {
    try {
      const raw = sessionStorage.getItem('party_refresh_keys');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [applyTarget, setApplyTarget] = useState<Party | null>(null);
  const [detailTarget, setDetailTarget] = useState<Party | null>(null);
  const [showQuickMatch, setShowQuickMatch] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [matchStep, setMatchStep] = useState<MatchStep>('idle');
  const [matchResult, setMatchResult] = useState<JoinResult | null>(null);
  const [matchPaymentPreview, setMatchPaymentPreview] =
    useState<PaymentPreviewResponse | null>(null);

  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchErrorCode, setMatchErrorCode] = useState<string | null>(null);

  const quickMatchRequestMutation = useQuickMatchRequest();
  const quickMatchCandidatesMutation = useQuickMatchCandidates();
  const quickMatchSelectMutation = useQuickMatchSelect();
  const quickMatchJoinMutation = useQuickMatchJoin();

  const [cooldown, setCooldown] = useState<number>(() => {
    const until = localStorage.getItem(STORAGE_KEY);
    if (!until) return 0;
    const remaining = Math.ceil((Number(until) - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  });

  const { data: trendingKeywords = [], isLoading: isTrendingLoading } =
    useQuery({
      queryKey: searchKeys.trending,
      queryFn: fetchTrendingKeywords,
      refetchInterval: 30000, // 30초마다 자동으로 새로고침 (실시간 효과)
      staleTime: 20000,
    });

  const handleSearchAction = (keyword: string) => {
    setSearch(keyword); // UI 업데이트 및 검색 쿼리 실행

    if (keyword.trim()) {
      // 검색어를 백엔드(Redis)로 전송 (사용자 경험을 위해 비동기로 던져놓기만 함)
      recordSearchKeyword(keyword.trim()).catch((err) => {
        console.warn('검색어 기록 실패:', err);
      });
    }
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          localStorage.removeItem(STORAGE_KEY);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const cacheKey = category ?? '__all__';
  const currentRefreshKey = refreshKeys[cacheKey] ?? 0;

  const handleRefresh = () => {
    if (cooldown > 0) return;
    setRefreshKeys((prev) => {
      const next = { ...prev, [cacheKey]: (prev[cacheKey] ?? 0) + 1 };
      try {
        sessionStorage.setItem('party_refresh_keys', JSON.stringify(next));
      } catch (error) {
        console.warn('party_refresh_keys 저장 실패:', error);
      }
      return next;
    });
    const until = Date.now() + COOLDOWN_SECONDS * 1000;
    localStorage.setItem(STORAGE_KEY, String(until));
    setCooldown(COOLDOWN_SECONDS);
  };

  const handleQuickMatchOpen = () => {
    if (!isLoggedIn) {
      const redirect = `${location.pathname}${location.search}`;
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }

    setShowQuickMatch(true);
  };

  const { data: categoriesRaw } = useQuery({
    queryKey: categoryKeys.all,
    queryFn: fetchCategories,
  });

  const categories = Array.isArray(categoriesRaw) ? categoriesRaw : [];

  const { data: partyData, isLoading } = useQuery({
    queryKey: partyKeys.list(category, search, currentRefreshKey),
    queryFn: () =>
      fetchParties({
        category_name: category ?? undefined,
        search,
        size: 6,
        random: !search,
        refreshKey: currentRefreshKey,
      }),
    staleTime: Infinity,
  });

  const parties = useMemo<PartyWithDetails[]>(() => {
    if (partyData && Array.isArray(partyData.parties)) {
      return partyData.parties as PartyWithDetails[];
    }

    return [];
  }, [partyData]);

  const titleText = useMemo(() => {
    if (search) return `'${search}' 검색 결과`;
    if (category) return `${category} 파티`;
    return '실시간 파티 목록';
  }, [category, search]);

  const subtitleText = useMemo(() => {
    if (search) return '검색어와 관련된 파티를 모아봤어요.';
    if (category) return '선택한 카테고리의 모집 중인 파티를 확인해보세요.';
    return '지금 바로 참여할 수 있는 파티를 한눈에 확인해보세요.';
  }, [category, search]);

  const matchedParty = useMemo<MatchedParty | undefined>(() => {
    if (!matchResult) return undefined;

    const targetPartyId = matchResult.party_id ?? matchResult.id;
    if (!targetPartyId) return undefined;

    const found = parties.find(
      (party) => String(party.id) === String(targetPartyId),
    );

    if (found) {
      return {
        ...found,
        ...matchResult,
        id: found.id,
        title:
          matchResult.title ??
          matchResult.party_title ??
          found.title ??
          '매칭된 파티',
        service_name: matchResult.service_name ?? found.service_name ?? '',
        category_name:
          matchResult.category_name ?? found.category_name ?? '기타',
        member_count: matchResult.member_count ?? found.member_count ?? 0,
        max_members: matchResult.max_members ?? found.max_members ?? 0,
        monthly_price:
          matchResult.monthly_price ?? found.monthly_price ?? undefined,
        original_price:
          matchResult.original_price ?? found.original_price ?? undefined,
        host_nickname:
          matchResult.host_nickname ?? found.host_nickname ?? '익명',
        description: matchResult.description ?? found.description ?? '',
        status: matchResult.status ?? found.status ?? 'recruiting',
      };
    }

    return {
      ...matchResult,
      id: targetPartyId,
      title: matchResult.title ?? matchResult.party_title ?? '매칭된 파티',
      service_name: matchResult.service_name ?? '',
      category_name: matchResult.category_name ?? '기타',
      member_count: matchResult.member_count ?? 0,
      max_members: matchResult.max_members ?? 0,
      monthly_price: matchResult.monthly_price ?? undefined,
      original_price: matchResult.original_price ?? undefined,
      host_nickname: matchResult.host_nickname ?? '익명',
      description: matchResult.description ?? '',
      status: matchResult.status ?? 'recruiting',
    } as MatchedParty;
  }, [matchResult, parties]);

  const currentStepTitle = useMemo(() => {
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
  }, [matchStep]);

  const normalizeQuickMatchErrorCode = (error: unknown): string => {
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
    ) {
      return 'ALREADY_IN_ACTIVE_PARTY';
    }

    if (raw === 'ALREADY_REQUESTED' || raw.includes('이미 빠른매칭')) {
      return 'ALREADY_REQUESTED';
    }

    if (raw === 'NO_RECRUITING_PARTY') {
      return 'NO_RECRUITING_PARTY';
    }

    if (raw === 'NO_CANDIDATE') {
      return 'NO_CANDIDATE';
    }

    if (raw === 'USER_BANNED') {
      return 'USER_BANNED';
    }

    if (raw === 'USER_INACTIVE') {
      return 'USER_INACTIVE';
    }

    return raw || 'UNKNOWN_ERROR';
  };

  const handleQuickMatchSubmit = async (payload: {
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
      setShowQuickMatch(false);
      setMatchPaymentPreview(null);

      const requestResponse =
        await quickMatchRequestMutation.mutateAsync(payload);
      const requestId = requestResponse.request_id;

      setMatchStep('finding');
      await quickMatchCandidatesMutation.mutateAsync(requestId);

      setMatchStep('selecting');
      await quickMatchSelectMutation.mutateAsync(requestId);

      setMatchStep('joining');
      const joinResponse = (await quickMatchJoinMutation.mutateAsync(
        requestId,
      )) as unknown as JoinResult;

      const matchedPartyId = joinResponse?.party_id ?? joinResponse?.id;

      if (!matchedPartyId) {
        throw new Error('매칭된 파티 정보를 찾을 수 없습니다.');
      }

      let paymentPreview: PaymentPreviewResponse | null = null;

      try {
        paymentPreview = await getPaymentPreview(String(matchedPartyId));
        setMatchPaymentPreview(paymentPreview);
      } catch (previewError) {
        console.warn('결제 금액 미리보기 조회 실패:', previewError);
        setMatchPaymentPreview(null);
      }

      let detailedParty: PartyDetailResponse | null = null;

      try {
        detailedParty = (await fetchParty(
          String(matchedPartyId),
        )) as PartyDetailResponse;
      } catch (detailError) {
        console.warn('파티 상세 조회 실패:', detailError);
      }

      setMatchResult({
        ...joinResponse,
        ...(detailedParty ?? {}),
        party_id: (() => {
          const v = joinResponse?.party_id ?? detailedParty?.id;
          const n = Number(v as unknown);
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
      console.error('빠른 매칭 실패:', error);

      const errorCode = normalizeQuickMatchErrorCode(error);

      const apiError = error as ApiError;
      const errorMessage =
        apiError.response?.data?.message ||
        apiError.response?.data?.detail ||
        apiError.message ||
        '빠른 매칭 요청 중 오류가 발생했습니다.';

      setMatchErrorCode(errorCode);
      setMatchError(errorMessage);
    } finally {
      setIsMatching(false);
      setMatchStep('idle');
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col bg-slate-50">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),linear-gradient(135deg,#4f46e5_0%,#6366f1_42%,#0ea5e9_100%)] px-4 sm:px-6 py-8 sm:py-10 text-center">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(15,23,42,0.08))]" />
        <div className="relative mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
            <span>✨</span>
            <span>함께 쓰면 더 저렴한 구독 생활</span>
          </div>

          {/* 폰트 크기 모바일 대응: text-2xl -> sm:text-3xl -> md:text-4xl */}
          <h1 className="relative mt-4 text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white">
            같이 구독하고,
            <br className="hidden sm:block" />
            부담은 더 가볍게
          </h1>

          <p className="relative mx-auto mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
            구독 서비스부터 공동구매까지, 원하는 파티를 찾고 바로 참여해보세요.
          </p>

          <div className="relative mt-6">
            <SearchBar onSearch={handleSearchAction} />
            <KeywordChips
              keywords={trendingKeywords}
              isLoading={isTrendingLoading}
              onPick={handleSearchAction}
            />
          </div>
        </div>
      </section>

      <div className="flex-1 bg-slate-50">
        {/* 모바일 여백 줄임: px-4 -> sm:px-6 */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
          <div className="mt-4 sm:mt-6 flex flex-col gap-6 md:gap-8 md:flex-row">
            <CategorySidebar
              categories={categories}
              category={category}
              setCategory={setCategory}
              onCreate={() => navigate('/handcaptcha')}
              onQuickMatch={handleQuickMatchOpen}
            />

            <section className="min-w-0 flex-1">
              {/* 컨트롤 패널 모바일 최적화 */}
              <div className="mb-5 flex flex-col gap-4 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
                <SectionTitle title={titleText} subtitle={subtitleText} />

                {/* 모바일에서는 하단 요소들이 가로 꽉 차게 변경 */}
                <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={cooldown > 0}
                    // 모바일 w-full, 터치 영역 확보를 위해 py-3 추가
                    className={`flex w-full sm:w-auto justify-center items-center gap-1.5 rounded-xl sm:rounded-2xl border px-3 py-3 sm:py-2 text-sm font-semibold transition
                      ${
                        cooldown > 0
                          ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 active:scale-95'
                      }`}
                  >
                    {cooldown > 0 ? (
                      <>
                        <svg
                          className="h-4 w-4 text-indigo-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="tabular-nums font-bold text-indigo-500">
                          {Math.floor(cooldown / 60)}:
                          {String(cooldown % 60).padStart(2, '0')}
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        새로고침
                      </>
                    )}
                  </button>
                  <div className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl sm:rounded-2xl bg-slate-100 px-3 py-3 sm:py-2 text-sm font-semibold text-slate-700">
                    <span className="text-slate-400">총</span>
                    <span className="text-base font-black text-slate-900">
                      {partyData?.total ?? 0}
                    </span>
                    <span className="text-slate-400">개</span>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-72 animate-pulse rounded-2xl sm:rounded-3xl border border-slate-200 bg-white"
                    />
                  ))}
                </div>
              ) : parties.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-16 sm:px-6 sm:py-20 text-center shadow-sm">
                  <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-slate-100 text-2xl sm:text-3xl">
                    🔎
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                    조건에 맞는 파티가 아직 없어요
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    검색어를 바꿔보거나, 직접 새 파티를 만들어 멤버를
                    모집해보세요.
                  </p>
                  <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <button
                      onClick={() => navigate('/handcaptcha')}
                      className="w-full sm:w-auto rounded-xl sm:rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                    >
                      파티 생성하기
                    </button>
                    <button
                      onClick={handleQuickMatchOpen}
                      className="w-full sm:w-auto rounded-xl sm:rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      빠른 매칭 열기
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {parties.map((party) => (
                    <PartyCard
                      key={party.id}
                      party={party}
                      onDetail={setDetailTarget}
                      onApply={setApplyTarget}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {detailTarget ? (
        <PartyDetailModal
          party={detailTarget}
          onClose={() => setDetailTarget(null)}
          onApply={(p) => {
            setDetailTarget(null);
            setApplyTarget(p);
          }}
        />
      ) : null}

      {applyTarget ? (
        <ApplyModal party={applyTarget} onClose={() => setApplyTarget(null)} />
      ) : null}

      <QuickMatchForm
        open={showQuickMatch}
        onClose={() => setShowQuickMatch(false)}
        onSubmit={handleQuickMatchSubmit}
        isSubmitting={isMatching}
      />

      <MatchingLoadingModal open={isMatching} message={currentStepTitle} />

      <MatchingErrorModal
        open={!!matchError}
        message={matchError ?? ''}
        errorCode={matchErrorCode ?? undefined}
        onClose={() => {
          setMatchError(null);
          setMatchErrorCode(null);
        }}
      />
      <MatchingSuccessModal
        open={!!matchResult && !isMatching && !matchError}
        matchedParty={matchedParty}
        paymentPreview={matchPaymentPreview}
        onClose={() => {
          setMatchResult(null);
          setMatchPaymentPreview(null);
        }}
        onGoParty={() => {
          if (matchedParty?.id) {
            setMatchResult(null);
            setMatchPaymentPreview(null);
            navigate(`/party/${matchedParty.id}/chat`);
          }
        }}
      />
    </div>
  );
}
