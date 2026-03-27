/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
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

const MOCK_PARTIES: Party[] = [
  {
    party_id: 1,
    host_id: 1,
    platform_id: 1,
    title: 'Netflix 프리미엄 파티 모집',
    status: 'RECRUITING',
    host_nickname: '홍길동',
    platform_name: 'Netflix',
    category_name: 'OTT',
    member_count: 2,
  },
  {
    party_id: 2,
    host_id: 2,
    platform_id: 8,
    title: '쿠팡 로켓와우 함께 쓸 분',
    status: 'RECRUITING',
    host_nickname: '김철수',
    platform_name: '쿠팡 로켓와우',
    category_name: '멤버십/음악',
    member_count: 1,
  },
];

const MOCK_NOTICE: SystemNotification = {
  notification_id: 1,
  user_id: null,
  type: 'SYSTEM',
  content: '이번 달부터 파티 참여 이력에 따른 신뢰도 점수가 반영됩니다.',
  is_read: false,
  created_at: '2026-03-12',
};

const STATUS_LABEL: Record<string, string> = {
  RECRUITING: '모집중',
  FULL: '마감',
  COMPLETED: '완료',
  CANCELED: '취소',
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
  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 shadow-lg">
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
          className="flex-1 outline-none text-sm text-foreground bg-transparent placeholder:text-slate-400"
          placeholder="찾고 있는 서비스나 상품을 검색하세요"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch(value)}
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
  onApply,
}: {
  party: Party;
  onApply: (p: Party) => void;
}) {
  const navigate = useNavigate();
  const isFull = party.status !== 'RECRUITING';

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          {party.status && (
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${party.status === 'RECRUITING' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}
            >
              {STATUS_LABEL[party.status]}
            </span>
          )}
          {party.category_name && (
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLOR[party.category_name] ?? 'bg-slate-100 text-slate-600'}`}
            >
              {party.category_name}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {party.platform_name}
        </span>
      </div>

      <h3 className="text-sm font-bold text-foreground leading-snug">
        {party.title}
      </h3>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>👥 {party.member_count}명 참여중</span>
        <span>👤 {party.host_nickname}</span>
      </div>

      <div className="flex gap-2 mt-1">
        <button
          onClick={() => navigate(`/party/${party.party_id}/chat`)}
          className="flex-1 py-2 text-xs font-semibold border border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          채팅방 입장
        </button>
        <button
          disabled={isFull}
          onClick={() => !isFull && onApply(party)}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${isFull ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:opacity-90'}`}
        >
          {isFull ? STATUS_LABEL[party.status ?? 'FULL'] : '참여 신청'}
        </button>
      </div>
    </div>
  );
}

// ── ApplyModal ────────────────────────────────────────────────────────────
function ApplyModal({ party, onClose }: { party: Party; onClose: () => void }) {
  const [done, setDone] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const mutation = useMutation({
    mutationFn: () => applyParty(party.party_id),
    onSuccess: () => setDone(true),
    onError: (e: Error) => setErrMsg(e.message),
  });

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl p-8 w-full max-w-sm mx-4 shadow-xl flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <>
            <div className="text-center text-4xl">🎉</div>
            <h3 className="text-center font-bold text-foreground">
              신청 완료!
            </h3>
            <p className="text-center text-sm text-muted-foreground">
              파티 참여 신청이 완료되었습니다.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold"
            >
              확인
            </button>
          </>
        ) : (
          <>
            <h3 className="font-extrabold text-lg text-foreground">
              파티 참여 신청
            </h3>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {party.title}
              </span>{' '}
              파티에 참여하시겠습니까?
            </p>
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground bg-muted rounded-xl p-3">
              <span>🎮 {party.platform_name}</span>
              <span>👥 {party.member_count}명 참여중</span>
              <span>👤 호스트: {party.host_nickname}</span>
            </div>
            {errMsg && <p className="text-xs text-destructive">{errMsg}</p>}
            <div className="flex gap-2 mt-1">
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-border rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {mutation.isPending ? '신청 중...' : '신청하기'}
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
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [applyTarget, setApplyTarget] = useState<Party | null>(null);
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  const { data: categories } = useQuery({
    queryKey: categoryKeys.all,
    queryFn: fetchCategories,
  });

  const { data: partyData, isLoading } = useQuery({
    queryKey: partyKeys.list(categoryId, search),
    queryFn: () =>
      fetchParties({ category_id: categoryId ?? undefined, search }),
  });

  const { data: notices } = useQuery({
    queryKey: notificationKeys.latest,
    queryFn: fetchLatestNotifications,
  });

  const notice =
    !noticeDismissed && Array.isArray(notices) && notices.length > 0
      ? notices[0]
      : null;

  // 핵심 수정: API 응답이 배열이 아닐 경우 빈 배열로 처리하여 .map 에러 방지
  const parties = Array.isArray(partyData?.parties) ? partyData.parties : [];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto">
          <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-primary to-blue-400 px-6 py-14 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(255,255,255,0.12),transparent_60%)]" />
            <h1 className="relative text-3xl font-black text-white tracking-tight mb-2">
              함께하면 더 저렴하게
            </h1>
            <p className="relative text-sm text-white/80 mb-7">
              구독 서비스부터 공동구매까지, 파티업에서 파티원을 찾아보세요
            </p>
            <SearchBar onSearch={setSearch} />
          </section>

          <div className="max-w-6xl mx-auto px-6">
            {notice && (
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3.5 mt-5">
                <span className="text-lg shrink-0">📢</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-blue-800">
                    {notice.type}
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    {notice.content}
                  </p>
                </div>
                <button
                  onClick={() => setNoticeDismissed(true)}
                  className="text-blue-400 hover:text-blue-600 text-sm shrink-0"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex gap-6 py-6">
              <aside className="w-52 shrink-0 flex flex-col gap-4">
                <div className="bg-card border border-border rounded-2xl p-4">
                  <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">
                    카테고리
                  </p>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => setCategoryId(null)}
                      className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${categoryId === null ? 'bg-blue-50 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                      전체 파티
                    </button>
                    {/* 카테고리 map 안전 처리 */}
                    {Array.isArray(categories) &&
                      categories.map((cat) => (
                        <button
                          key={cat.category_id}
                          onClick={() => setCategoryId(cat.category_id)}
                          className={`text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${categoryId === cat.category_id ? 'bg-blue-50 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}
                        >
                          {cat.category_name}
                        </button>
                      ))}
                  </div>
                </div>
                <button
                  onClick={() => navigate('/party/create')}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-md shadow-primary/30 hover:opacity-90 transition-opacity"
                >
                  + 파티생성
                </button>
              </aside>

              <section className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-base font-extrabold text-foreground">
                    전체 파티
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {partyData?.total ?? 0}개
                  </span>
                </div>
                {isLoading ? (
                  <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
                    불러오는 중...
                  </div>
                ) : parties.length === 0 ? (
                  <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
                    검색 결과가 없습니다.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* parties가 확실히 배열일 때만 렌더링 */}
                    {parties.map((party) => (
                      <PartyCard
                        key={party.party_id}
                        party={party}
                        onApply={setApplyTarget}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
      {applyTarget && (
        <ApplyModal party={applyTarget} onClose={() => setApplyTarget(null)} />
      )}
    </div>
  );
}
