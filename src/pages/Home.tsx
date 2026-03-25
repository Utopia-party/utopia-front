/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 'react-router'보다 '-dom'이 일반적입니다.
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
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

// 공통 스타일 및 라벨 정의
const STATUS_LABEL: Record<string, string> = {
  RECRUITING: '모집중',
  FULL: '마감',
  COMPLETED: '완료',
  CANCELED: '취소',
};

const CATEGORY_COLOR: Record<string, string> = {
  'OTT': 'bg-blue-100 text-blue-700',
  '멤버십/음악': 'bg-green-100 text-green-700',
  '교육/도서': 'bg-purple-100 text-purple-700',
  '생산성': 'bg-pink-100 text-pink-700',
  '기타': 'bg-slate-100 text-slate-600',
};

// ── SearchBar ─────────────────────────────────────────────────────────────
function SearchBar({ onSearch }: { onSearch: (q: string) => void }) {
  const [value, setValue] = useState('');
  
  const handleSearch = () => onSearch(value);

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 shadow-lg focus-within:ring-2 focus-within:ring-white/50">
        <svg className="w-5 h-5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="flex-1 outline-none text-sm text-slate-900 bg-transparent placeholder:text-slate-400"
          placeholder="찾고 있는 서비스나 상품을 검색하세요"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        {value && (
          <button className="text-slate-400 text-sm hover:text-slate-600" onClick={() => { setValue(''); onSearch(''); }}>✕</button>
        )}
      </div>
    </div>
  );
}

// ── PartyCard ─────────────────────────────────────────────────────────────
function PartyCard({ party, onApply }: { party: Party; onApply: (p: Party) => void }) {
  const navigate = useNavigate();
  const isFull = party.status !== 'RECRUITING';

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5 flex-wrap">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${party.status === 'RECRUITING' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
            {STATUS_LABEL[party.status ?? ''] || '알 수 없음'}
          </span>
          {party.category_name && (
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLOR[party.category_name] ?? 'bg-slate-100 text-slate-600'}`}>
              {party.category_name}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground font-medium">{party.platform_name}</span>
      </div>

      <h3 className="text-sm font-bold text-foreground leading-snug h-10 line-clamp-2">{party.title}</h3>

      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>👥 {party.member_count}명 참여중</span>
        <span>👤 {party.host_nickname}</span>
      </div>

      <div className="flex gap-2 mt-1">
        <button
          onClick={() => navigate(`/party/${party.party_id}/chat`)}
          className="flex-1 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-accent transition-colors"
        >
          채팅방 입장
        </button>
        <button
          disabled={isFull}
          onClick={() => onApply(party)}
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
  const queryClient = useQueryClient();
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () => applyParty(party.party_id),
    onSuccess: () => {
      setDone(true);
      // 신청 성공 시 파티 목록 새로고침
      queryClient.invalidateQueries({ queryKey: partyKeys.all });
    },
    onError: (e: Error) => alert(e.message),
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl p-8 w-full max-w-sm shadow-xl flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        {done ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">🎉</div>
            <h3 className="font-bold text-foreground mb-1">신청 완료!</h3>
            <p className="text-sm text-muted-foreground mb-6">파티 참여 신청이 완료되었습니다.</p>
            <button onClick={onClose} className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-bold">확인</button>
          </div>
        ) : (
          <>
            <h3 className="font-extrabold text-lg">파티 참여 신청</h3>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">[{party.platform_name}] {party.title}</span><br/>파티에 참여하시겠습니까?
            </p>
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground bg-muted rounded-xl p-3">
              <span>👥 현재 {party.member_count}명 참여 중</span>
              <span>👤 호스트: {party.host_nickname}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={onClose} className="flex-1 py-3 border border-border rounded-xl text-sm font-semibold hover:bg-muted transition-colors">취소</button>
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
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [applyTarget, setApplyTarget] = useState<Party | null>(null);
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  // 1. 카테고리 데이터
  const { data: categories = [] } = useQuery({
    queryKey: categoryKeys.all,
    queryFn: fetchCategories,
  });

  // 2. 파티 목록 데이터
  const { data: partyData, isLoading } = useQuery({
    queryKey: partyKeys.list(categoryId, search),
    queryFn: () => fetchParties({ category_id: categoryId ?? undefined, search }),
  });

  // 3. 알림 데이터
  const { data: notices = [] } = useQuery({
    queryKey: notificationKeys.latest,
    queryFn: fetchLatestNotifications,
    enabled: !noticeDismissed, // 알림을 껐다면 굳이 호출 안 함
  });

  const activeNotice = !noticeDismissed && notices.length > 0 ? notices[0] : null;
  const parties = Array.isArray(partyData?.parties) ? partyData.parties : [];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto pb-10">
          {/* Hero Section */}
          <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-primary to-blue-500 px-6 py-16 text-center">
            <h1 className="relative text-3xl font-black text-white mb-2">함께하면 더 저렴하게</h1>
            <p className="relative text-sm text-white/80 mb-8">구독 서비스부터 공동구매까지, 파티업에서 파티원을 찾아보세요</p>
            <SearchBar onSearch={setSearch} />
          </section>

          <div className="max-w-6xl mx-auto px-6">
            {/* 알림 배너 */}
            {activeNotice && (
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3.5 mt-6 animate-in fade-in slide-in-from-top-2">
                <span className="text-lg shrink-0">📢</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-blue-800">{activeNotice.type}</p>
                  <p className="text-xs text-blue-600 mt-0.5">{activeNotice.content}</p>
                </div>
                <button onClick={() => setNoticeDismissed(true)} className="text-blue-400 hover:text-blue-600">✕</button>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-8 py-8">
              {/* 사이드 필터 */}
              <aside className="w-full md:w-52 shrink-0 flex flex-col gap-4">
                <div className="bg-card border border-border rounded-2xl p-4 sticky top-4">
                  <p className="text-[10px] font-bold text-muted-foreground mb-3 uppercase tracking-widest">CATEGORIES</p>
                  <nav className="flex flex-col gap-1">
                    <button
                      onClick={() => setCategoryId(null)}
                      className={`text-left px-3 py-2 rounded-xl text-sm transition-all ${categoryId === null ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                      전체 파티
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.category_id}
                        onClick={() => setCategoryId(cat.category_id)}
                        className={`text-left px-3 py-2 rounded-xl text-sm transition-all ${categoryId === cat.category_id ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-muted'}`}
                      >
                        {cat.category_name}
                      </button>
                    ))}
                  </nav>
                </div>
                <button
                  onClick={() => navigate('/party/create')}
                  className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  + 파티 생성하기
                </button>
              </aside>

              {/* 파티 리스트 영역 */}
              <section className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold">
                    {search ? `'${search}' 검색 결과` : '실시간 파티 목록'}
                  </h2>
                  <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md">
                    총 {partyData?.total ?? 0}개
                  </span>
                </div>

                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="h-48 bg-muted animate-pulse rounded-2xl" />
                    ))}
                  </div>
                ) : parties.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-3xl border border-dashed">
                    <span className="text-4xl mb-4">🔎</span>
                    <p className="text-muted-foreground text-sm">진행 중인 파티가 없네요. 직접 만들어보세요!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {parties.map(party => (
                      <PartyCard key={party.party_id} party={party} onApply={setApplyTarget} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>

      {applyTarget && (
        <ApplyModal 
          party={applyTarget} 
          onClose={() => setApplyTarget(null)} 
        />
      )}
    </div>
  );
}