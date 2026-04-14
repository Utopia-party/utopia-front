import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Party } from '../types/party';
import {
  fetchParties,
  fetchCategories,
  applyParty,
  partyKeys,
  categoryKeys,
} from '../libs/partyapi';
import PartyDetailModal from '../components/party/PartyDetail';
import QuickMatchForm from '../components/party/QuickMatchForm';
// import SystemNoticeBanner from '../components/notification/SystemNoticeBanner';

const STATUS_LABEL: Record<string, string> = {
  recruiting: '모집중',
  full: '마감',
  completed: '완료',
  canceled: '취소',
};

const CATEGORY_COLOR: Record<string, string> = {
  OTT: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/80',
  음악: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80',
  '멤버십/음악': 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80',
  '교육/도서': 'bg-violet-50 text-violet-700 ring-1 ring-violet-200/80',
  생산성: 'bg-pink-50 text-pink-700 ring-1 ring-pink-200/80',
  '생산성/기타': 'bg-pink-50 text-pink-700 ring-1 ring-pink-200/80',
  기타: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80',
};

const CATEGORY_ICON: Record<string, string> = {
  OTT: '📺',
  음악: '🎵',
  '멤버십/음악': '🎵',
  '교육/도서': '📚',
  생산성: '🧰',
  '생산성/기타': '🧰',
  기타: '✨',
};

const QUICK_KEYWORDS = [
  'Netflix',
  'YouTube Premium',
  '쿠팡',
  '디즈니+',
  'Spotify',
];

function SearchBar({ onSearch }: { onSearch: (q: string) => void }) {
  const [value, setValue] = useState('');
  const handleSearch = () => onSearch(value.trim());

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/95 px-5 py-3 shadow-2xl backdrop-blur-md transition focus-within:-translate-y-0.5 focus-within:shadow-white/10">
        <svg
          className="h-5 w-5 shrink-0 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          placeholder="파티 검색 (예: Netflix, 쿠팡, Spotify, 밀리의서재...)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        {value ? (
          <button
            className="rounded-lg px-2 py-1 text-sm text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            onClick={() => {
              setValue('');
              onSearch('');
            }}
          >
            ✕
          </button>
        ) : null}
        <button
          onClick={handleSearch}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          검색
        </button>
      </div>
    </div>
  );
}

function KeywordChips({ onPick }: { onPick: (keyword: string) => void }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
      <span className="text-xs font-medium text-white/70">인기 검색</span>
      {QUICK_KEYWORDS.map((keyword) => (
        <button
          key={keyword}
          onClick={() => onPick(keyword)}
          className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-white/20"
        >
          {keyword}
        </button>
      ))}
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      ) : null}
    </div>
  );
}

function PartyCard({
  party,
  onDetail,
  onApply,
}: {
  party: Party;
  onDetail: (p: Party) => void;
  onApply: (p: Party) => void;
}) {
  const navigate = useNavigate();
  const isClosed = party.status !== 'recruiting';
  const isJoined = (party as any).is_joined;
  const categoryName = party.category_name || '기타';
  const categoryIcon = CATEGORY_ICON[categoryName] ?? '✨';
  const spotsLeft = Math.max(
    (party.max_members ?? 0) - (party.member_count ?? 0),
    0,
  );

  const savingPct =
    party.original_price && party.original_price > (party.monthly_price ?? 0)
      ? Math.round(
          (1 - (party.monthly_price ?? 0) / party.original_price) * 100,
        )
      : null;

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-indigo-500 via-sky-500 to-cyan-400" />

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl ring-1 ring-slate-200">
            {categoryIcon}
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap gap-1.5">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${party.status === 'recruiting' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200/80'}`}
              >
                {STATUS_LABEL[party.status ?? ''] || '모집중'}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${CATEGORY_COLOR[categoryName] ?? 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80'}`}
              >
                {categoryName}
              </span>
            </div>
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-400">
              {party.service_name}
            </p>
          </div>
        </div>

        {party.monthly_price != null && party.monthly_price > 0 ? (
          <div className="shrink-0 rounded-2xl bg-indigo-50 px-3 py-2 text-right ring-1 ring-indigo-100">
            {savingPct !== null ? (
              <div className="mb-1 flex items-center justify-end gap-1.5">
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {savingPct}% 절약
                </span>
                <span className="text-[11px] text-slate-400 line-through">
                  {party.original_price!.toLocaleString()}원
                </span>
              </div>
            ) : (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500">
                월 이용료
              </p>
            )}
            <p className="text-sm font-extrabold text-indigo-700">
              {party.monthly_price.toLocaleString()}원
            </p>
          </div>
        ) : null}
      </div>

      <h3 className="min-h-13 text-base font-bold leading-snug text-slate-900 line-clamp-2">
        {party.title}
      </h3>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-500">현재 인원</span>
          <span className="font-extrabold text-slate-900">
            {party.member_count}/{party.max_members ?? '?'}명
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-slate-900 transition-all"
            style={{
              width: `${Math.min(100, party.max_members ? (party.member_count / party.max_members) * 100 : 0)}%`,
            }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>호스트 {party.host_nickname || '익명'}</span>
          <span>
            {party.status === 'recruiting'
              ? `남은 자리 ${spotsLeft}개`
              : '모집 종료'}
          </span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onDetail(party)}
          className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          조건 확인
        </button>
        {isJoined ? (
          <button
            onClick={() => navigate(`/party/${party.id}/chat`)}
            className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-500"
          >
            채팅방 입장
          </button>
        ) : (
          <button
            disabled={isClosed}
            onClick={() => onApply(party)}
            className={`flex-1 rounded-2xl px-4 py-3 text-sm font-bold transition ${isClosed ? 'cursor-not-allowed bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
          >
            {isClosed
              ? STATUS_LABEL[party.status ?? ''] || '마감'
              : '참여 신청'}
          </button>
        )}
      </div>
    </div>
  );
}

function ApplyModal({ party, onClose }: { party: Party; onClose: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () => applyParty(party.id),
    onSuccess: () => {
      setDone(true);
      queryClient.invalidateQueries({ queryKey: partyKeys.all });
    },
    onError: (e: any) => {
      if (e.response?.status === 400 || e.message?.includes('이미 참여')) {
        navigate(`/party/${party.id}/chat`);
      } else {
        alert(e.message || '참여 신청 중 오류가 발생했습니다.');
      }
    },
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-white/30 bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="py-4 text-center">
            <div className="mb-4 text-5xl">🎉</div>
            <h3 className="text-xl font-black text-slate-900">신청 완료!</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              파티 참여 신청이 정상적으로 완료되었습니다.
              <br />
              바로 채팅방으로 이동해보세요.
            </p>
            <button
              onClick={() => navigate(`/party/${party.id}/chat`)}
              className="mt-6 w-full rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              채팅방으로 이동
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-500">
                Join party
              </p>
              <h3 className="mt-2 text-xl font-black text-slate-900">
                파티 참여 신청
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                아래 내용을 확인한 뒤 참여를 진행해주세요.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <p className="text-sm font-bold text-slate-900">
                [{party.service_name}] {party.title}
              </p>
              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                <p>
                  👥 현재 {party.member_count}/{party.max_members ?? '?'}명 참여
                  중
                </p>
                <p>👤 호스트: {party.host_nickname || '익명'}</p>
                {party.monthly_price != null && party.monthly_price > 0 ? (
                  <p>💰 월 {party.monthly_price.toLocaleString()}원</p>
                ) : null}
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                취소
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="flex-1 rounded-2xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {mutation.isPending ? '처리 중...' : '신청하기'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function CategorySidebar({
  categories,
  category,
  setCategory,
  onCreate,
  onQuickMatch,
}: {
  categories: any[];
  category: string | null;
  setCategory: (value: string | null) => void;
  onCreate: () => void;
  onQuickMatch: () => void;
}) {
  return (
    <aside className="w-full shrink-0 md:w-64">
      <div className="sticky top-4 space-y-4">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Browse
            </p>
            <h3 className="mt-2 text-lg font-extrabold text-slate-900">
              카테고리
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              원하는 서비스 유형만 빠르게 골라보세요.
            </p>
          </div>
          <nav className="flex flex-col gap-1 p-3">
            <button
              onClick={() => setCategory(null)}
              className={`rounded-2xl px-3 py-3 text-left text-sm transition ${category === null ? 'bg-slate-900 font-bold text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              전체 파티
            </button>
            {categories.map((cat: any) => {
              const name = cat.name;
              return (
                <button
                  key={name}
                  onClick={() => setCategory(name)}
                  className={`flex items-center justify-between rounded-2xl px-3 py-3 text-left text-sm transition ${category === name ? 'bg-indigo-50 font-bold text-indigo-700 ring-1 ring-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <span className="flex items-center gap-2">
                    <span>{CATEGORY_ICON[name] ?? '✨'}</span>
                    <span>{name}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <button
          onClick={onCreate}
          className="w-full rounded-3xl bg-slate-900 px-4 py-4 text-left text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                Create
              </p>
              <p className="mt-1 text-base font-extrabold">+ 파티 생성하기</p>
              <p className="mt-1 text-sm text-white/70">
                직접 모집글을 올리고 멤버를 모아보세요.
              </p>
            </div>
            <span className="text-2xl">🚀</span>
          </div>
        </button>

        <button
          onClick={onQuickMatch}
          className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Quick match
              </p>
              <p className="mt-1 text-base font-extrabold text-slate-900">
                빠른 매칭
              </p>
              <p className="mt-1 text-sm text-slate-500">
                조건만 입력하면 맞는 파티를 더 빠르게 찾아드려요.
              </p>
            </div>
            <span className="text-2xl">⚡</span>
          </div>
        </button>
      </div>
    </aside>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [applyTarget, setApplyTarget] = useState<Party | null>(null);
  const [detailTarget, setDetailTarget] = useState<Party | null>(null);
  const [showQuickMatch, setShowQuickMatch] = useState(false);

  const { data: categoriesRaw } = useQuery({
    queryKey: categoryKeys.all,
    queryFn: fetchCategories,
  });

  const categories = Array.isArray(categoriesRaw) ? categoriesRaw : [];

  const { data: partyData, isLoading } = useQuery({
    queryKey: partyKeys.list(category, search, refreshKey),
    queryFn: () =>
      fetchParties({
        category_name: category ?? undefined, // category → category_name
        search,
        size: 6,
      }),
  });

  const parties =
    partyData && Array.isArray(partyData.parties) ? partyData.parties : [];

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

  return (
    <>
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),linear-gradient(135deg,#4f46e5_0%,#6366f1_42%,#0ea5e9_100%)] px-6 pb-10 pt-10 text-center">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(15,23,42,0.08))]" />
        <div className="relative mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
            <span>✨</span>
            <span>함께 쓰면 더 저렴한 구독 생활</span>
          </div>

          <h1 className="relative mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
            같이 구독하고,
            <br className="hidden md:block" />
            부담은 더 가볍게
          </h1>

          <p className="relative mx-auto mt-3 max-w-xl text-sm leading-6 text-white/80 md:text-base">
            구독 서비스부터 공동구매까지, 원하는 파티를 찾고 바로 참여해보세요.
          </p>

          <div className="relative mt-6">
            <SearchBar onSearch={setSearch} />
            <KeywordChips onPick={setSearch} />
          </div>
        </div>
      </section>

      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* <SystemNoticeBanner /> */}

          <div className="mt-6 flex flex-col gap-8 md:flex-row">
            <CategorySidebar
              categories={categories}
              category={category}
              setCategory={(val) => {
                setCategory(val);
                setRefreshKey(0);
              }}
              onCreate={() => navigate('/handcaptcha')}
              onQuickMatch={() => setShowQuickMatch(true)}
            />

            <section className="min-w-0 flex-1">
              <div className="mb-5 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
                <SectionTitle title={titleText} subtitle={subtitleText} />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRefreshKey((k) => k + 1)}
                    className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95"
                  >
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
                  </button>
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
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
                      className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white"
                    />
                  ))}
                </div>
              ) : parties.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
                    🔎
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    조건에 맞는 파티가 아직 없어요
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    검색어를 바꿔보거나, 직접 새 파티를 만들어 멤버를
                    모집해보세요.
                  </p>
                  <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={() => navigate('/handcaptcha')}
                      className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                    >
                      파티 생성하기
                    </button>
                    <button
                      onClick={() => setShowQuickMatch(true)}
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
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
        onSubmit={() => {}}
      />
    </>
  );
}
