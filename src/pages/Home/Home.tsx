import { useEffect, useMemo, useState } from 'react';
import type { ComponentProps } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';

import type { Party } from '../../types/party';
import {
  fetchParties,
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
import { useAuthStore } from '../../stores/authStore';
import CategorySidebar from './components/CategorySidebar';
import SearchBar from './components/SearchBar';
import KeywordChips from './components/KeywordChips';
import SectionTitle from './components/SectionTitle';
import PartyCard from './components/PartyCard';
import ApplyModal from './components/ApplyModal';
import { useQuickMatchFlow, type JoinResult } from './hooks/useQuickMatchFlow';

type PartyWithDetails = Party & {
  description?: string;
  host_trust_score?: number;
};

type MatchedParty = NonNullable<
  ComponentProps<typeof MatchingSuccessModal>['matchedParty']
> & {
  id?: number | string;
};

const COOLDOWN_SECONDS = 600;
const STORAGE_KEY = 'party_refresh_until';

const VISIBLE_PARTY_STATUSES: Array<Party['status']> = [
  'recruiting',
  'completed',
  'active',
  'full',
  'ended',
  null,
];

// ── 유저 이용 메뉴얼 ─────────────────────────────────────

type GuideItem = { title: string; content: React.ReactNode };

function GuideAccordion({ items }: { items: GuideItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="divide-y divide-slate-100">
      {items.map((item, idx) => {
        const isOpen = openIdx === idx;
        return (
          <div key={idx}>
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : idx)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm font-semibold text-slate-800">{item.title}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"
                className={`shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                <div className="pt-3">{item.content}</div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const GUIDE_ITEMS: GuideItem[] = [
  {
    title: '파티 카드 읽는 법',
    content: (
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '모집중', color: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', desc: '참여 신청 가능' },
            { label: '마감', color: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200', desc: '정원이 꽉 찬 상태' },
            { label: '운영중', color: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200', desc: '파티 진행 중' },
            { label: '완료', color: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200', desc: '정산까지 완료' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2">
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${s.color}`}>{s.label}</span>
              <span className="text-xs text-slate-500">{s.desc}</span>
            </div>
          ))}
        </div>
        <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
          <li>인원 막대의 검은 부분은 확정 멤버, 노란 부분은 승인 대기 중인 신청자입니다.</li>
          <li>월 이용료 옆 빨간 뱃지는 정가 대비 절약 비율입니다.</li>
          <li>조건 확인을 누르면 파티 상세 정보를 팝업으로 볼 수 있습니다.</li>
        </ul>
      </div>
    ),
  },
  {
    title: '파티 참여 신청하기',
    content: (
      <div className="space-y-2.5">
        <ol className="text-xs text-slate-600 space-y-2 list-none">
          {[
            { n: '1', t: '모집중 상태의 파티 카드에서 참여 신청 버튼을 누릅니다.' },
            { n: '2', t: '파티명, 호스트, 월 이용료를 확인한 뒤 신청하기를 누릅니다.' },
            { n: '3', t: '신청 완료 후 카드 버튼이 승인 대기중으로 바뀝니다.' },
            { n: '4', t: '호스트가 승인하면 채팅방 입장 버튼이 활성화됩니다.' },
          ].map((item) => (
            <li key={item.n} className="flex items-start gap-2">
              <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px]">{item.n}</span>
              <span>{item.t}</span>
            </li>
          ))}
        </ol>
        <div className="rounded-lg border border-slate-100 bg-white px-3 py-2.5 text-xs text-slate-500">
          로그인하지 않은 상태에서 신청 버튼을 누르면 로그인 페이지로 이동합니다.
        </div>
      </div>
    ),
  },
  {
    title: '파티 직접 생성하기',
    content: (
      <div className="space-y-2.5">
        <ol className="text-xs text-slate-600 space-y-2 list-none">
          {[
            { n: '1', t: '왼쪽 사이드바의 파티 생성하기 버튼을 누릅니다.' },
            { n: '2', t: '핸드 캡챠 인증을 통과하면 파티 생성 폼으로 이동합니다.' },
            { n: '3', t: '서비스, 제목, 최대 인원, 월 이용료 등을 입력하고 등록합니다.' },
            { n: '4', t: '생성된 파티는 홈 목록에 바로 노출됩니다.' },
          ].map((item) => (
            <li key={item.n} className="flex items-start gap-2">
              <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px]">{item.n}</span>
              <span>{item.t}</span>
            </li>
          ))}
        </ol>
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
          파티 생성은 핸드 캡챠 인증이 필요합니다. 스팸 방지를 위한 절차로 1~2분 내로 완료됩니다.
        </div>
      </div>
    ),
  },
  {
    title: '빠른 매칭 이용하기',
    content: (
      <div className="space-y-2.5">
        <p className="text-xs text-slate-500">카테고리와 서비스를 고르면 조건에 맞는 파티를 자동으로 찾아드립니다.</p>
        <ol className="text-xs text-slate-600 space-y-2 list-none">
          {[
            { n: '1', t: '왼쪽 사이드바의 빠른 매칭 버튼을 누릅니다. (로그인 필요)' },
            { n: '2', t: 'OTT / 교육·도서 / 음악·멤버십 / 생산성 중 카테고리를 선택합니다.' },
            { n: '3', t: '세부 서비스(예: 넷플릭스, 스포티파이 등)와 희망 기간을 선택합니다.' },
            { n: '4', t: '매칭 시작을 누르면 적합한 파티를 자동으로 찾아 연결합니다.' },
          ].map((item) => (
            <li key={item.n} className="flex items-start gap-2">
              <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold text-[10px]">{item.n}</span>
              <span>{item.t}</span>
            </li>
          ))}
        </ol>
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-700">
          빠른 매칭은 별도 수수료가 부과됩니다. 직접 파티를 찾아 신청하면 수수료 없이 이용할 수 있습니다.
        </div>
      </div>
    ),
  },
  {
    title: '검색 및 카테고리 필터',
    content: (
      <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
        <li>상단 검색창에 파티명, 서비스명을 입력하면 관련 파티만 표시됩니다.</li>
        <li>인기 검색어 칩을 클릭하면 해당 키워드로 바로 검색됩니다.</li>
        <li>왼쪽 카테고리(OTT, 교육/도서 등)를 선택하면 해당 유형만 필터링됩니다.</li>
        <li>새로고침 버튼으로 목록을 갱신할 수 있습니다. 단, 10분 쿨다운이 적용됩니다.</li>
      </ul>
    ),
  },
  {
    title: '신청 후 상태 안내',
    content: (
      <div className="space-y-2">
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">버튼 상태</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">의미</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { state: '승인 대기중', color: 'bg-amber-100 text-amber-700', desc: '호스트의 승인을 기다리는 중' },
                { state: '채팅방 입장', color: 'bg-indigo-600 text-white', desc: '승인 완료. 채팅방에 입장할 수 있습니다' },
                { state: '재신청', color: 'bg-slate-900 text-white', desc: '이전 신청이 거절됨. 다시 신청 가능' },
                { state: '참여 불가', color: 'bg-rose-100 text-rose-700', desc: '호스트에 의해 강퇴된 상태' },
              ].map((r) => (
                <tr key={r.state}>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-xl px-2.5 py-1 text-[11px] font-bold ${r.color}`}>{r.state}</span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-500">{r.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
];

function UserGuide() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
            </svg>
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800">서비스 이용 안내</p>
            <p className="text-xs text-slate-400 mt-0.5">파티 참여·생성·매칭 이용 방법</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:inline text-xs font-semibold text-indigo-500 bg-indigo-50 rounded-full px-2.5 py-0.5 border border-indigo-100">
            {GUIDE_ITEMS.length}개 항목
          </span>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="border-t border-slate-100">
          <GuideAccordion items={GUIDE_ITEMS} />
        </div>
      )}
    </div>
  );
}

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
  const [cooldown, setCooldown] = useState<number>(() => {
    const until = localStorage.getItem(STORAGE_KEY);
    if (!until) return 0;
    const remaining = Math.ceil((Number(until) - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  });

  const {
    isMatching,
    matchResult,
    matchPaymentPreview,
    matchError,
    matchErrorCode,
    currentStepTitle,
    handleSubmit: handleQuickMatchSubmit,
    clearResult,
    clearError,
    goToParty,
  } = useQuickMatchFlow();

  const { data: trendingKeywords = [], isLoading: isTrendingLoading } =
    useQuery({
      queryKey: searchKeys.trending,
      queryFn: fetchTrendingKeywords,
      refetchInterval: 30000,
      staleTime: 20000,
    });

  const handleSearchAction = (keyword: string) => {
    setSearch(keyword);

    if (keyword.trim()) {
      recordSearchKeyword(keyword.trim()).catch((err) =>
        console.warn('검색어 기록 실패:', err),
      );
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
      } catch {
        /* ignore */
      }

      return next;
    });

    const until = Date.now() + COOLDOWN_SECONDS * 1000;
    localStorage.setItem(STORAGE_KEY, String(until));
    setCooldown(COOLDOWN_SECONDS);
  };

  const handleQuickMatchOpen = () => {
    if (!isLoggedIn) {
      navigate(
        `/login?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`,
      );
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

  const visibleParties = useMemo(
    () =>
      parties.filter((party) => VISIBLE_PARTY_STATUSES.includes(party.status)),
    [parties],
  );

  const titleText = useMemo(() => {
    if (search) return `'${search}' 검색 결과`;
    if (category) return `${category} 파티`;
    return '실시간 파티 목록';
  }, [category, search]);

  const subtitleText = useMemo(() => {
    if (search) return '검색어와 관련된 파티를 모아봤어요.';
    if (category) return '선택한 카테고리의 파티를 확인해보세요.';
    return '지금 바로 참여할 수 있는 파티를 한눈에 확인해보세요.';
  }, [category, search]);

  const matchedParty = useMemo<MatchedParty | undefined>(() => {
    if (!matchResult) return undefined;

    const targetId = matchResult.party_id ?? matchResult.id;
    if (!targetId) return undefined;

    const found = parties.find((p) => String(p.id) === String(targetId));

    const foundNormalized = found
      ? {
          ...found,
          leader_id: found.leader_id ?? undefined,
          service_id: found.service_id ?? undefined,
          status: found.status ?? undefined,
          host_nickname: found.host_nickname ?? undefined,
          host_trust_score: found.host_trust_score ?? undefined,
          service_name: found.service_name ?? undefined,
          category_name: found.category_name ?? undefined,
          max_members: found.max_members ?? undefined,
          monthly_price: found.monthly_price ?? undefined,
          original_price: found.original_price ?? undefined,
          service_total_price: found.service_total_price ?? undefined,
          logo_image_key: found.logo_image_key ?? undefined,
          logo_image_url: found.logo_image_url ?? undefined,
          start_date: found.start_date ?? undefined,
          end_date: found.end_date ?? undefined,
          min_trust_score: found.min_trust_score ?? undefined,
          created_at: found.created_at ?? undefined,
          leader_discount_rate: found.leader_discount_rate ?? undefined,
        }
      : undefined;

    const base: JoinResult = foundNormalized
      ? { ...foundNormalized, ...matchResult, id: found!.id }
      : { ...matchResult, id: targetId };

    return {
      ...base,
      title:
        matchResult.title ??
        matchResult.party_title ??
        found?.title ??
        '매칭된 파티',
      service_name: (matchResult.service_name ??
        found?.service_name ??
        '') as string,
      category_name:
        matchResult.category_name ?? found?.category_name ?? '기타',
      member_count: matchResult.member_count ?? found?.member_count ?? 0,
      max_members: matchResult.max_members ?? found?.max_members ?? 0,
      monthly_price:
        matchResult.monthly_price ?? found?.monthly_price ?? undefined,
      original_price:
        matchResult.original_price ?? found?.original_price ?? undefined,
      host_nickname:
        (matchResult.host_nickname ?? found?.host_nickname) || '익명',
      description:
        matchResult.description ??
        (found as PartyWithDetails | undefined)?.description ??
        '',
      status: (matchResult.status ?? found?.status) || 'recruiting',
    } as MatchedParty;
  }, [matchResult, parties]);

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col bg-slate-50">
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),linear-gradient(135deg,#4f46e5_0%,#6366f1_42%,#0ea5e9_100%)] px-4 sm:px-6 py-8 sm:py-10 text-center">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(15,23,42,0.08))]" />

        <div className="relative mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
            <span>✨</span>
            <span>함께 쓰면 더 저렴한 구독 생활</span>
          </div>

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
              <UserGuide />

              <div className="mt-4 mb-5 flex flex-col gap-4 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
                <SectionTitle title={titleText} subtitle={subtitleText} />

                <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={cooldown > 0}
                    className={`flex w-full sm:w-auto justify-center items-center gap-1.5 rounded-xl sm:rounded-2xl border px-3 py-3 sm:py-2 text-sm font-semibold transition ${
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
                      {partyData?.total ?? visibleParties.length}
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
              ) : visibleParties.length === 0 ? (
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
                  {visibleParties.map((party) => (
                    <PartyCard
                      key={party.id}
                      party={party}
                      onDetail={setDetailTarget}
                      onApply={(p) => {
                        if (!isLoggedIn) {
                          navigate('/login');
                          return;
                        }

                        setApplyTarget(p);
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {detailTarget && (
        <PartyDetailModal
          party={detailTarget}
          onClose={() => setDetailTarget(null)}
          onApply={(p) => {
            if (!isLoggedIn) {
              navigate('/login');
              return;
            }

            setDetailTarget(null);
            setApplyTarget(p);
          }}
        />
      )}

      {applyTarget && (
        <ApplyModal party={applyTarget} onClose={() => setApplyTarget(null)} />
      )}

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
        onClose={clearError}
      />

      <MatchingSuccessModal
        open={!!matchResult && !isMatching && !matchError}
        matchedParty={matchedParty}
        paymentPreview={matchPaymentPreview}
        onClose={clearResult}
        onGoParty={() => {
          if (matchedParty?.id) goToParty(matchedParty.id);
        }}
      />
    </div>
  );
}
