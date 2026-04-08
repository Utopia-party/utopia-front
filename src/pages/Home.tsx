import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Party, SystemNotification } from '../types/party';
import {
  fetchParties,
  fetchLatestNotifications,
  fetchCategories,
  applyParty,
  partyKeys,
  notificationKeys,
  categoryKeys,
} from '../libs/partyapi';
import PartyDetailModal from '../components/party/PartyDetail';
import QuickMatchForm from '../components/party/QuickMatchForm';

const STATUS_LABEL: Record<string, string> = {
  recruiting: '모집중',
  full: '마감',
  completed: '완료',
  canceled: '취소',
};

const CATEGORY_COLOR: Record<string, string> = {
  OTT: 'bg-blue-100 text-blue-700',
  '멤버십/음악': 'bg-green-100 text-green-700',
  '교육/도서': 'bg-purple-100 text-purple-700',
  생산성: 'bg-pink-100 text-pink-700',
  기타: 'bg-slate-100 text-slate-600',
};

// ── SearchBar ─────────────────────────────────────────────────────────────
function SearchBar({ onSearch }: { onSearch: (q: string) => void }) {
  const [value, setValue] = useState('');
  const handleSearch = () => onSearch(value);

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 shadow-lg focus-within:ring-2 focus-within:ring-white/50">
        <svg
          className="w-5 h-5 text-slate-400 shrink-0"
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
          className="flex-1 outline-none text-sm text-slate-900 bg-transparent placeholder:text-slate-400"
          placeholder="파티 검색 (예: Netflix, 쿠팡, 헬스...)"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        {value && (
          <button
            className="text-slate-400 text-sm hover:text-slate-600"
            onClick={() => {
              setValue('');
              onSearch('');
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// ── PartyCard ─────────────────────────────────────────────────────────────
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
  const isFull = party.status !== 'recruiting';

  const isJoined = (party as any).is_joined;

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${party.status === 'recruiting' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
          >
            {STATUS_LABEL[party.status ?? ''] || '모집중'}
          </span>
          {party.category_name && (
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLOR[party.category_name] ?? 'bg-slate-100 text-slate-600'}`}
            >
              {party.category_name}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {party.service_name}
        </span>
      </div>

      <h3 className="text-sm font-bold text-foreground leading-snug h-10 line-clamp-2">
        {party.title}
      </h3>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>
          👥 {party.member_count}/{party.max_members ?? '?'}명
        </span>
        <span>👤 {party.host_nickname || '익명'}</span>
        {party.monthly_price != null && party.monthly_price > 0 && (
          <span>💰 월 {party.monthly_price.toLocaleString()}원</span>
        )}
      </div>

      <div className="flex gap-2 mt-1">
        <button
          onClick={() => onDetail(party)}
          className="flex-1 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-muted transition-colors"
        >
          자세히 보기
        </button>

        {/* ✅ 참여 여부에 따른 버튼 분기 처리 */}
        {isJoined ? (
          <button
            onClick={() => navigate(`/party/${party.id}/chat`)}
            className="flex-1 py-2 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
          >
            채팅방 입장
          </button>
        ) : (
          <button
            disabled={isFull}
            onClick={() => onApply(party)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${isFull ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:opacity-90'}`}
          >
            {isFull ? STATUS_LABEL[party.status ?? ''] || '마감' : '참여신청'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── ApplyModal ────────────────────────────────────────────────────────────
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
      // ✅ 이미 참여중이라 400 에러가 난 경우에도 채팅방으로 안내
      if (e.response?.status === 400 || e.message?.includes('이미 참여')) {
        navigate(`/party/${party.id}/chat`);
      } else {
        alert(e.message || '참여 신청 중 오류가 발생했습니다.');
      }
    },
  });

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl p-8 w-full max-w-sm shadow-xl flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="font-bold text-foreground mb-1">신청 완료!</h3>
            <p className="text-sm text-muted-foreground mb-6">
              파티 참여 신청이 완료되었습니다.
            </p>
            <button
              onClick={() => navigate(`/party/${party.id}/chat`)}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold"
            >
              확인
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-extrabold text-lg">파티 참여 신청</h3>
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                [{party.service_name}] {party.title}
              </span>
              <br />
              파티에 참여하시겠습니까?
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground bg-muted rounded-xl p-3">
              <span>
                👥 현재 {party.member_count}/{party.max_members ?? '?'}명 참여
                중
              </span>
              <span>👤 호스트: {party.host_nickname}</span>
              {party.monthly_price != null && party.monthly_price > 0 && (
                <span>💰 월 {party.monthly_price.toLocaleString()}원</span>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold disabled:opacity-50"
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

// ── Home ──────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const [category, setCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [applyTarget, setApplyTarget] = useState<Party | null>(null);
  const [detailTarget, setDetailTarget] = useState<Party | null>(null);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [showQuickMatch, setShowQuickMatch] = useState(false);

  // ✅ 카테고리 fetch 시 422 에러를 방지하기 위해 데이터 구조를 확인합니다.
  const { data: categoriesRaw } = useQuery({
    queryKey: categoryKeys.all,
    queryFn: fetchCategories,
  });

  // 백엔드 응답이 [{id: ..., name: ...}] 형태이므로 이를 안전하게 처리합니다.
  const categories = Array.isArray(categoriesRaw) ? categoriesRaw : [];

  const { data: partyData, isLoading } = useQuery({
    queryKey: partyKeys.list(category, search),
    queryFn: () => fetchParties({ category: category ?? undefined, search }),
  });
  const parties =
    partyData && Array.isArray(partyData.parties) ? partyData.parties : [];

  const { data: noticesRaw } = useQuery<SystemNotification[]>({
    queryKey: notificationKeys.latest,
    queryFn: fetchLatestNotifications,
    enabled: !noticeDismissed,
  });
  const notices = Array.isArray(noticesRaw) ? noticesRaw : [];
  const activeNotice =
    !noticeDismissed && notices.length > 0 ? notices[0] : null;

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-primary to-blue-500 px-6 py-16 text-center">
        <h1 className="relative text-3xl font-black text-white mb-2">
          함께하면 더 저렴하게
        </h1>
        <p className="relative text-sm text-white/80 mb-8">
          구독 서비스부터 공동구매까지, 파티업에서 파티원을 찾아보세요
        </p>
        <SearchBar onSearch={setSearch} />
      </section>

      <div className="max-w-6xl mx-auto px-6">
        {activeNotice && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3.5 mt-6">
            <span className="text-lg shrink-0">📢</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-blue-800">
                {activeNotice.type}
              </p>
              <p className="text-xs text-blue-600 mt-0.5">
                {activeNotice.content}
              </p>
            </div>
            <button
              onClick={() => setNoticeDismissed(true)}
              className="text-blue-400 hover:text-blue-600"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8 py-8">
          <aside className="w-full md:w-52 shrink-0 flex flex-col gap-4">
            <div className="bg-card border border-border rounded-2xl p-4 sticky top-4">
              <p className="text-[10px] font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                CATEGORIES
              </p>
              <nav className="flex flex-col gap-1">
                <button
                  onClick={() => setCategory(null)}
                  className={`text-left px-3 py-2 rounded-xl text-sm transition-all ${category === null ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  전체 파티
                </button>
                {categories.map((cat: any) => (
                  <button
                    key={cat.id || cat.name}
                    onClick={() => setCategory(cat.name)}
                    className={`text-left px-3 py-2 rounded-xl text-sm transition-all ${category === cat.name ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </nav>
            </div>
            <button
              onClick={() => navigate('/handcaptcha')}
              className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-lg hover:scale-[1.02] transition-all"
            >
              + 파티 생성하기
            </button>
            <button
              onClick={() => setShowQuickMatch(true)}
              className="w-full py-3.5 bg-white border border-border text-foreground rounded-2xl text-sm font-bold shadow-sm hover:bg-muted transition-all"
            >
              빠른 매칭
            </button>
          </aside>

          <section className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">
                {search
                  ? `'${search}' 검색 결과`
                  : category
                    ? `${category} 파티`
                    : '실시간 파티 목록'}
              </h2>
              <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md">
                총 {partyData?.total ?? 0}개
              </span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-48 bg-muted animate-pulse rounded-2xl"
                  />
                ))}
              </div>
            ) : parties.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-3xl border border-dashed">
                <span className="text-4xl mb-4">🔎</span>
                <p className="text-muted-foreground text-sm">
                  진행 중인 파티가 없네요. 직접 만들어보세요!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {detailTarget && (
        <PartyDetailModal
          party={detailTarget}
          onClose={() => setDetailTarget(null)}
          onApply={(p) => {
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
        onSubmit={() => {}}
      />
    </>
  );
}
