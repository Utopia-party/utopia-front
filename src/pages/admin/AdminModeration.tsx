import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import Pagination from './components/Pagination';
import {
  fetchAdminFlaggedChats,
  fetchAdminModerationStats,
  fetchModerationTrend,
  fetchStageStats,
  fetchMlHealth,
  fetchUserViolationPattern,
  getAdminErrorMessage,
  updateAdminChatModerationStatus,
  type AdminChatFlagged,
  type AdminModerationStat,
  type ModerationTrendPoint,
  type StageStats,
  type MlHealth,
  type UserViolationPattern,
} from '../../apis/admin';

const API = '/api/admin/moderation';

const STATUS_STYLE: Record<string, string> = {
  blocked:        'bg-red-50 text-red-600 border-red-200',
  warned:         'bg-amber-50 text-amber-600 border-amber-200',
  false_positive: 'bg-slate-100 text-slate-500 border-slate-200',
  pending:        'bg-blue-50 text-blue-500 border-blue-200',
};
const STATUS_LABEL: Record<string, string> = {
  blocked: '차단', warned: '경고', false_positive: '오탐지', pending: '검토 중',
};
const STAGE_STYLE: Record<number, string> = {
  1: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  2: 'bg-blue-50 text-blue-700 border-blue-200',
  3: 'bg-violet-50 text-violet-700 border-violet-200',
};
const STAGE_LABEL: Record<number, string> = {
  1: '규칙', 2: 'ML', 3: 'AI',
};
const EXAMPLE_LABEL_KO: Record<string, string> = { none: '정상', offensive: '경고', hate: '즉시차단' };
const FILTER_TABS = ['전체', '차단', '경고', '오탐지', '검토 중'];
const TAB_TO_STATUS: Record<string, string> = { 차단: 'blocked', 경고: 'warned', 오탐지: 'false_positive', '검토 중': 'pending' };

type Config = {
  stage1_enabled: boolean; stage2_enabled: boolean; stage3_enabled: boolean;
  stage2_pass_threshold: number; stage2_block_threshold: number;
  ollama_prompt_examples: { text: string; label: string }[];
  whitelist: string[]; blacklist: string[];
};
type FinetuneStats = { total: number; hate: number; offensive: number; none: number; ready: boolean; min_required: number };
type ChatBan = { ip: string; ttl: number };

// ── 바 차트 ────────────────────────────────────────────────
function BarChart({ data, period }: { data: ModerationTrendPoint[]; period: 'daily' | 'weekly' | 'monthly' }) {
  const minSlots = period === 'daily' ? 7 : period === 'weekly' ? 8 : 6;
  const filled = [...data];
  while (filled.length < minSlots) filled.unshift({ date: '', blocked: 0, warned: 0, false_positive: 0, total: 0 });
  const max = Math.max(...filled.map((d) => d.total), 1);
  const ch = 160;
  return (
    <div className="w-full overflow-x-auto [&::-webkit-scrollbar]:hidden">
      <div className="flex items-end gap-1.5 min-w-[480px]" style={{ height: ch }}>
        {filled.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center group relative">
            {d.date && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] rounded-xl px-3 py-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-xl">
                <div className="font-bold mb-1">{d.date}</div>
                <div className="flex items-center gap-1.5 text-red-300"><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />차단 {d.blocked}</div>
                <div className="flex items-center gap-1.5 text-amber-300"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />경고 {d.warned}</div>
                <div className="flex items-center gap-1.5 text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />오탐 {d.false_positive}</div>
                <div className="border-t border-slate-700 mt-1.5 pt-1.5 font-bold">합계 {d.total}</div>
              </div>
            )}
            <div className="w-full flex flex-col justify-end rounded-lg overflow-hidden cursor-pointer hover:brightness-95 transition-all" style={{ height: ch - 22 }}>
              {d.total > 0 ? (
                <>
                  <div className="w-full bg-red-400" style={{ height: `${(d.blocked / max) * (ch - 22)}px` }} />
                  <div className="w-full bg-amber-400" style={{ height: `${(d.warned / max) * (ch - 22)}px` }} />
                  <div className="w-full bg-slate-300" style={{ height: `${(d.false_positive / max) * (ch - 22)}px` }} />
                </>
              ) : <div className="w-full bg-slate-100 rounded-lg" style={{ height: 4 }} />}
            </div>
            <span className="text-[9px] text-slate-400 mt-1.5 truncate w-full text-center">{d.date ? d.date.slice(5) : ''}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 justify-end">
        {[['bg-red-400', '차단'], ['bg-amber-400', '경고'], ['bg-slate-300', '오탐지']].map(([cls, label]) => (
          <div key={label} className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-sm ${cls}`} /><span className="text-xs text-slate-400">{label}</span></div>
        ))}
      </div>
    </div>
  );
}

// ── 도넛 차트 ────────────────────────────────────────────────
function DonutChart({ blocked, warned, falsePositive, pending }: { blocked: number; warned: number; falsePositive: number; pending: number }) {
  const total = blocked + warned + falsePositive + pending || 1;
  const r = 52; const cx = 64; const cy = 64;
  const circ = 2 * Math.PI * r;
  const segs = [
    { value: blocked, color: '#f87171', label: '차단' },
    { value: warned, color: '#fbbf24', label: '경고' },
    { value: falsePositive, color: '#94a3b8', label: '오탐지' },
    { value: pending, color: '#93c5fd', label: '검토중' },
  ];
  let offset = 0;
  const arcs = segs.map((s) => {
    const dash = (s.value / total) * circ;
    const arc = { ...s, dash, gap: circ - dash, offset: circ - offset };
    offset += dash; return arc;
  });
  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <svg width={128} height={128} viewBox="0 0 128 128" className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={16} />
        {arcs.map((a, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={a.color} strokeWidth={16}
            strokeDasharray={`${a.dash} ${a.gap}`} strokeDashoffset={a.offset}
            style={{ transition: 'stroke-dasharray 0.5s ease' }} />
        ))}
        <text x={cx} y={cy - 5} textAnchor="middle" fill="#0f172a" fontSize={17} fontWeight={700}>{(blocked + warned).toLocaleString()}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" fontSize={9}>탐지</text>
      </svg>
      <div className="flex flex-col gap-2.5 w-full sm:w-auto">
        {segs.map((s) => (
          <div key={s.label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color }} /><span className="text-xs text-slate-500 w-12">{s.label}</span></div>
            <div className="flex items-center gap-1.5"><span className="text-xs font-bold text-slate-700">{s.value.toLocaleString()}</span><span className="text-[10px] text-slate-400">({Math.round((s.value / total) * 100)}%)</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 토글 ──────────────────────────────────────────────────
function Toggle({ checked, onChange, color = 'bg-violet-600' }: { checked: boolean; onChange: (v: boolean) => void; color?: string }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} role="switch" aria-checked={checked}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${checked ? color : 'bg-slate-200'}`}>
      <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

// ── 섹션 카드 ──────────────────────────────────────────────
function SectionCard({ children, className = '', noPad = false }: { children: React.ReactNode; className?: string; noPad?: boolean }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06)] ${noPad ? '' : 'p-5'} ${className}`}>
      {children}
    </div>
  );
}

// ── 스테이지 배지 ────────────────────────────────────────
function StageBadge({ stage }: { stage: number }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${STAGE_STYLE[stage] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}>
      {STAGE_LABEL[stage] ?? `${stage}단계`}
    </span>
  );
}

export default function AdminModeration() {
  const [mainTab, setMainTab] = useState<'설정' | '통계' | '로그' | 'IP 벤'>('설정');
  const [config, setConfig] = useState<Config | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMsg, setConfigMsg] = useState('');
  const [configTab, setConfigTab] = useState<'파이프라인' | '규칙 단어' | '프롬프트' | '파인튜닝'>('파이프라인');
  const [ftStats, setFtStats] = useState<FinetuneStats | null>(null);
  const [wlInput, setWlInput] = useState('');
  const [blInput, setBlInput] = useState('');
  const [exText, setExText] = useState('');
  const [exLabel, setExLabel] = useState('none');
  const [wordMsg, setWordMsg] = useState<{ type: 'whitelist' | 'blacklist'; text: string } | null>(null);
  const [stats, setStats] = useState<AdminModerationStat | null>(null);
  const [trend, setTrend] = useState<ModerationTrendPoint[]>([]);
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [statsLoading, setStatsLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [statsDateFrom, setStatsDateFrom] = useState('');
  const [statsDateTo, setStatsDateTo] = useState('');
  const [stageStats, setStageStats] = useState<StageStats | null>(null);
  const [mlHealth, setMlHealth] = useState<MlHealth | null>(null);
  const [mlHealthLoading, setMlHealthLoading] = useState(false);
  const [userPattern, setUserPattern] = useState<Record<string, UserViolationPattern>>({});
  const [patternBusy, setPatternBusy] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('전체');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [chats, setChats] = useState<AdminChatFlagged[]>([]);
  const [logLoading, setLogLoading] = useState(true);
  const [logError, setLogError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [chatBans, setChatBans] = useState<ChatBan[]>([]);
  const [chatBansLoading, setChatBansLoading] = useState(false);
  const [unbanBusy, setUnbanBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/config`).then((r) => r.json()).then((d) => { setConfig(d); setConfigLoading(false); }).catch(() => setConfigLoading(false));
  }, []);

  useEffect(() => {
    if (configTab === '파인튜닝') fetch(`${API}/finetune/stats`).then((r) => r.json()).then(setFtStats).catch(() => setFtStats(null));
  }, [configTab]);

  const saveConfig = async () => {
    if (!config) return;
    setConfigSaving(true);
    try {
      const res = await fetch(`${API}/config`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
      setConfigMsg(res.ok ? '저장되었습니다.' : '저장 실패');
    } catch { setConfigMsg('저장 실패'); }
    setConfigSaving(false);
    setTimeout(() => setConfigMsg(''), 3000);
  };

  const addWord = async (type: 'whitelist' | 'blacklist') => {
    const raw = (type === 'whitelist' ? wlInput : blInput).trim();
    if (!raw || !config) return;
    const words = raw.split(/[,\n]/).map((w) => w.trim()).filter(Boolean);
    const newList = [...config[type]];
    for (const word of words) {
      if (!newList.includes(word)) {
        newList.push(word);
        await fetch(`${API}/${type}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ word }) });
      }
    }
    setConfig((c) => (c ? { ...c, [type]: newList } : c));
    type === 'whitelist' ? setWlInput('') : setBlInput('');
    setWordMsg({ type, text: `${words.length}개 추가` });
    setTimeout(() => setWordMsg(null), 2500);
  };

  const removeWord = async (type: 'whitelist' | 'blacklist', word: string) => {
    setConfig((c) => (c ? { ...c, [type]: c[type].filter((w) => w !== word) } : c));
    await fetch(`${API}/${type}/${encodeURIComponent(word)}`, { method: 'DELETE' });
  };

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try { setStats(await fetchAdminModerationStats({ date_from: statsDateFrom || undefined, date_to: statsDateTo || undefined })); }
    catch { setStats(null); }
    setStatsLoading(false);
  }, [statsDateFrom, statsDateTo]);

  const loadTrend = useCallback(async (period: 'daily' | 'weekly' | 'monthly') => {
    setTrendLoading(true);
    try { setTrend(await fetchModerationTrend({ period })); }
    catch { setTrend([]); }
    setTrendLoading(false);
  }, []);

  useEffect(() => {
    if (mainTab !== '통계') return;
    const t = setTimeout(() => {
      void loadStats();
      void loadTrend(trendPeriod);
      setMlHealthLoading(true);
      fetchMlHealth().then(setMlHealth).finally(() => setMlHealthLoading(false));
      fetchStageStats({ date_from: statsDateFrom || undefined, date_to: statsDateTo || undefined })
        .then(setStageStats).catch(() => setStageStats(null));
    }, 0);
    return () => clearTimeout(t);
  }, [mainTab, trendPeriod, loadStats, loadTrend]);

  const loadUserPattern = async (userId: string) => {
    if (userPattern[userId] || userId === '-') return;
    setPatternBusy(userId);
    try {
      const result = await fetchUserViolationPattern(userId);
      setUserPattern((prev) => ({ ...prev, [userId]: result }));
    } catch {}
    setPatternBusy(null);
  };

  const loadChats = async (params?: { moderation_status?: string; date_from?: string; date_to?: string; keyword?: string }) => {
    setLogLoading(true); setLogError('');
    try { setChats(await fetchAdminFlaggedChats(params)); }
    catch (err) { setLogError(getAdminErrorMessage(err)); }
    setLogLoading(false);
  };

  useEffect(() => {
    if (mainTab === '로그') void Promise.resolve().then(() => loadChats());
  }, [mainTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab); setPage(1);
    void loadChats({ moderation_status: TAB_TO_STATUS[tab], keyword: search || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined });
  };

  const handleStatusUpdate = async (chatId: string, status: 'blocked' | 'warned' | 'false_positive' | 'pending') => {
    setBusyId(chatId);
    try {
      const chat = chats.find((c) => c.id === chatId);
      if (status === 'false_positive' && chat?.moderationStatus === 'blocked' && chat.senderId) {
        await fetch(`${API}/unblock/user/${chat.senderId}`, { method: 'POST' });
      }
      await updateAdminChatModerationStatus(chatId, status);
      setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, moderationStatus: status } : c));
    } catch (err) { setLogError(getAdminErrorMessage(err)); }
    setBusyId(null);
  };

  const loadChatBans = async () => {
    setChatBansLoading(true);
    try { const res = await fetch(`${API}/chat-bans`); setChatBans(await res.json()); }
    catch { setChatBans([]); }
    setChatBansLoading(false);
  };

  useEffect(() => {
    if (mainTab === 'IP 벤') void Promise.resolve().then(() => loadChatBans());
  }, [mainTab]);

  const handleUnbanIp = async (ip: string) => {
    setUnbanBusy(ip);
    try { await fetch(`${API}/unblock/ip/${encodeURIComponent(ip)}`, { method: 'DELETE' }); setChatBans((prev) => prev.filter((b) => b.ip !== ip)); }
    catch {}
    setUnbanBusy(null);
  };

  const formatTtl = (ttl: number) => ttl < 0 ? '영구' : `${Math.floor(ttl / 3600)}시간 ${Math.floor((ttl % 3600) / 60)}분`;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return chats;
    return chats.filter((c) => c.message.toLowerCase().includes(q) || c.senderNickname.toLowerCase().includes(q) || c.partyTitle.toLowerCase().includes(q));
  }, [chats, search]);

  const paginated = filtered.slice((page - 1) * 20, page * 20);

  const STAGES = [
    { key: 'stage1_enabled' as keyof Config, num: 1, label: '규칙 기반', desc: '화이트 / 블랙리스트', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', time: '0ms' },
    { key: 'stage2_enabled' as keyof Config, num: 2, label: 'ML 모델', desc: 'GPU 서버 · BERT 계열', badge: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500', time: '10~30ms' },
    { key: 'stage3_enabled' as keyof Config, num: 3, label: 'Ollama AI', desc: '문맥 기반 LLM 판단', badge: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-500', time: '500ms~3s' },
  ];

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col bg-[#f8f9fc]">
      <AdminHeader
        placeholder="메시지 / 닉네임 / 파티명 검색..."
        onSearch={setSearch}
        rightContent={
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
            채팅 모더레이션
          </span>
        }
      />

      <div className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* 페이지 헤더 */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">채팅 모더레이션</h1>
            <p className="mt-1 text-sm text-slate-400">탐지 파이프라인 설정 · 통계 분석 · AI 탐지 로그 관리</p>
          </div>

          {/* 메인 탭 */}
          <div className="flex gap-0 border-b-2 border-slate-100 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {(['설정', '통계', '로그', 'IP 벤'] as const).map((t) => (
              <button key={t} onClick={() => setMainTab(t)}
                className={`shrink-0 px-5 py-3 text-sm font-semibold border-b-2 -mb-[2px] transition-all ${mainTab === t ? 'border-violet-600 text-violet-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
                {t}
              </button>
            ))}
          </div>

          {/* ── 설정 탭 ── */}
          {mainTab === '설정' && (
            <div className="space-y-5">
              <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit overflow-x-auto [&::-webkit-scrollbar]:hidden">
                {(['파이프라인', '규칙 단어', '프롬프트', '파인튜닝'] as const).map((t) => (
                  <button key={t} onClick={() => setConfigTab(t)}
                    className={`shrink-0 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${configTab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    {t}
                  </button>
                ))}
              </div>

              {configLoading ? (
                <SectionCard><p className="text-sm text-slate-400 text-center py-8">불러오는 중...</p></SectionCard>
              ) : config && (
                <>
                  {configTab === '파이프라인' && (
                    <div className="space-y-4">
                      <SectionCard>
                        <div className="flex items-center justify-between mb-5">
                          <div>
                            <p className="text-sm font-bold text-slate-800">탐지 파이프라인</p>
                            <p className="text-xs text-slate-400 mt-0.5">메시지는 활성화된 단계를 순서대로 통과합니다</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STAGES.filter((s) => config[s.key]).length === 3 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                            {STAGES.filter((s) => config[s.key]).length}단계 활성
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-0">
                          <div className="flex sm:flex-col items-center gap-2 sm:gap-1 px-3 py-3 sm:py-0 sm:min-w-[72px]">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 sm:text-center">채팅 메시지</span>
                          </div>
                          {STAGES.map((stage) => (
                            <div key={stage.key} className="flex sm:flex-row flex-col items-center flex-1 min-w-0">
                              <div className="flex items-center justify-center w-8 shrink-0">
                                {config[stage.key]
                                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
                              </div>
                              <div className={`flex-1 min-w-0 rounded-xl border-2 p-3 sm:p-4 transition-all ${config[stage.key] ? 'border-slate-200 bg-white shadow-sm' : 'border-dashed border-slate-200 bg-slate-50 opacity-50'}`}>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-bold border ${stage.badge}`}>{stage.num}</span>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-slate-800 truncate">{stage.label}</p>
                                      <p className="text-[10px] text-slate-400 truncate">{stage.desc}</p>
                                    </div>
                                  </div>
                                  <Toggle checked={config[stage.key] as boolean} onChange={(v) => setConfig((c) => c ? { ...c, [stage.key]: v } : c)} />
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <span className={`text-[10px] font-semibold ${config[stage.key] ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {config[stage.key] ? '● 활성' : '○ 비활성'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">{stage.time}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          <div className="flex items-center justify-center w-8 shrink-0">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                          </div>
                          <div className="flex sm:flex-col items-center gap-2 sm:gap-1 px-3 py-3 sm:py-0 sm:min-w-[60px]">
                            <div className="flex gap-1.5">
                              <div className="w-3 h-3 rounded-full bg-emerald-400" title="통과" />
                              <div className="w-3 h-3 rounded-full bg-red-400" title="차단" />
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500 sm:text-center">판정</span>
                          </div>
                        </div>
                      </SectionCard>

                      <SectionCard>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="text-sm font-bold text-slate-800">2단계 ML 임계값</p>
                            <p className="text-xs text-slate-400 mt-0.5">두 임계값 사이 점수는 3단계(Ollama)로 전달됩니다</p>
                          </div>
                          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">ML 모델</span>
                        </div>
                        <div className="mb-5 relative h-8 rounded-full overflow-hidden bg-slate-100">
                          <div className="absolute inset-y-0 left-0 bg-emerald-400/80 transition-all duration-300"
                            style={{ width: `${config.stage2_pass_threshold * 100}%` }} />
                          <div className="absolute inset-y-0 right-0 bg-red-400/80 transition-all duration-300"
                            style={{ width: `${(1 - config.stage2_block_threshold) * 100}%` }} />
                          <div className="absolute inset-y-0 bg-amber-300/60 transition-all duration-300"
                            style={{ left: `${config.stage2_pass_threshold * 100}%`, right: `${(1 - config.stage2_block_threshold) * 100}%` }} />
                          <div className="absolute inset-0 flex items-center justify-center gap-6 text-[9px] font-bold">
                            <span className="text-emerald-800">통과</span>
                            <span className="text-amber-800">→ Ollama</span>
                            <span className="text-red-800">차단</span>
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {([
                            ['stage2_pass_threshold', '통과 임계값', '이상이면 정상으로 즉시 통과', 0.5, 0.99, 'accent-emerald-500'] as [keyof Config, string, string, number, number, string],
                            ['stage2_block_threshold', '차단 임계값', '이상이면 위반으로 즉시 차단', 0.5, 0.99, 'accent-red-500'] as [keyof Config, string, string, number, number, string],
                          ]).map(([key, label, desc, min, max, accent]) => (
                            <div key={key}>
                              <div className="flex justify-between items-baseline mb-2">
                                <div>
                                  <span className="text-xs font-semibold text-slate-700">{label}</span>
                                  <span className="text-[10px] text-slate-400 ml-1.5">{desc}</span>
                                </div>
                                <span className="font-mono text-sm font-bold text-violet-600">{(config[key] as number).toFixed(2)}</span>
                              </div>
                              <input type="range" min={min} max={max} step={0.01} value={config[key] as number}
                                onChange={(e) => setConfig((c) => c ? { ...c, [key]: parseFloat(e.target.value) } : c)}
                                className={`w-full h-1.5 rounded-full ${accent}`} />
                            </div>
                          ))}
                        </div>
                      </SectionCard>

                      <div className="flex justify-end items-center gap-3">
                        {configMsg && <span className={`text-xs font-semibold ${configMsg.includes('실패') ? 'text-red-600' : 'text-emerald-600'}`}>{configMsg}</span>}
                        <button onClick={() => fetch(`${API}/config/reset`, { method: 'POST' }).then((r) => r.json()).then(setConfig)}
                          className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition">
                          초기화
                        </button>
                        <button onClick={saveConfig} disabled={configSaving}
                          className="px-5 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 active:scale-95 transition">
                          {configSaving ? '저장 중...' : '저장'}
                        </button>
                      </div>
                    </div>
                  )}

                  {configTab === '규칙 단어' && (
                    <div className="grid md:grid-cols-2 gap-4">
                      {([
                        ['whitelist', '화이트리스트', '항상 정상 처리 — 오탐지된 단어', wlInput, setWlInput, 'emerald', 'bg-emerald-600 hover:bg-emerald-700'] as const,
                        ['blacklist', '블랙리스트', '항상 즉시 차단 — 명백한 욕설 축약어', blInput, setBlInput, 'red', 'bg-red-600 hover:bg-red-700'] as const,
                      ]).map(([type, title, sub, val, setVal, color, btnCls]) => (
                        <SectionCard key={type} className="flex flex-col h-full">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold text-slate-800">{title}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-${color}-50 text-${color}-700 border border-${color}-200`}>
                              {config[type].length}개
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mb-4">{sub}</p>
                          <div className="flex flex-wrap gap-1.5 mb-4 min-h-[48px] items-start content-start flex-1">
                            {config[type].map((w) => (
                              <span key={w} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-${color}-50 text-${color}-700 border-${color}-200`}>
                                {w}
                                <button onClick={() => removeWord(type, w)} className="opacity-40 hover:opacity-100 text-base leading-none ml-0.5 transition">×</button>
                              </span>
                            ))}
                            {config[type].length === 0 && <span className="text-xs text-slate-300">비어있음</span>}
                          </div>
                          <div className="flex gap-2 mt-auto">
                            <textarea value={val} onChange={(e) => setVal(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), addWord(type))}
                              placeholder={'단어 입력\n쉼표(,) 또는 줄바꿈으로 구분'} rows={2}
                              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 resize-none transition" />
                            <button onClick={() => addWord(type)} className={`px-4 py-2 text-white rounded-xl text-xs font-semibold transition active:scale-95 self-stretch ${btnCls}`}>추가</button>
                          </div>
                          {wordMsg?.type === type && <p className="text-[10px] text-emerald-600 font-semibold mt-2">{wordMsg.text}</p>}
                        </SectionCard>
                      ))}
                    </div>
                  )}

                  {configTab === '프롬프트' && (
                    <div className="space-y-4">
                      <SectionCard>
                        <p className="text-sm font-bold text-slate-800 mb-1">Ollama few-shot 예시</p>
                        <p className="text-xs text-slate-400 mb-4">오탐지가 많은 표현 추가 → Ollama 판단 품질 개선</p>
                        <div className="rounded-xl border border-slate-100 divide-y divide-slate-100 mb-4 overflow-x-auto">
                          {config.ollama_prompt_examples.length === 0
                            ? <p className="text-xs text-slate-300 p-4">예시 없음 — 기본 내장 예시 사용 중</p>
                            : config.ollama_prompt_examples.map((ex, i) => (
                              <div key={i} className="flex items-center gap-3 px-4 py-2.5 min-w-[300px] hover:bg-slate-50 transition">
                                <span className="font-mono text-xs text-slate-700 flex-1 truncate">{ex.text}</span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${ex.label === 'none' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ex.label === 'offensive' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                  {EXAMPLE_LABEL_KO[ex.label] ?? ex.label}
                                </span>
                                <button onClick={() => setConfig((c) => c ? { ...c, ollama_prompt_examples: c.ollama_prompt_examples.filter((_, j) => j !== i) } : c)}
                                  className="text-slate-300 hover:text-slate-500 text-lg leading-none px-1 transition">×</button>
                              </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                          <input value={exText} onChange={(e) => setExText(e.target.value)} placeholder="예시 텍스트 입력"
                            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition" />
                          <select value={exLabel} onChange={(e) => setExLabel(e.target.value)}
                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-400 bg-white">
                            <option value="none">정상</option>
                            <option value="offensive">경고</option>
                            <option value="hate">즉시차단</option>
                          </select>
                          <button onClick={() => { if (!exText.trim()) return; setConfig((c) => c ? { ...c, ollama_prompt_examples: [...c.ollama_prompt_examples, { text: exText.trim(), label: exLabel }] } : c); setExText(''); }}
                            className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 active:scale-95 transition">추가</button>
                        </div>
                      </SectionCard>
                      <div className="flex justify-end">
                        <button onClick={saveConfig} disabled={configSaving}
                          className="px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 active:scale-95 transition">
                          {configSaving ? '저장 중...' : '저장'}
                        </button>
                      </div>
                    </div>
                  )}

                  {configTab === '파인튜닝' && (
                    <div className="space-y-4">
                      <div className="grid sm:grid-cols-3 gap-3">
                        {[
                          { key: 'hate', label: '차단', value: ftStats?.hate ?? 0, cls: 'border-red-100 bg-red-50', valCls: 'text-red-700' },
                          { key: 'offensive', label: '경고', value: ftStats?.offensive ?? 0, cls: 'border-amber-100 bg-amber-50', valCls: 'text-amber-700' },
                          { key: 'none', label: '정상', value: ftStats?.none ?? 0, cls: 'border-slate-100 bg-slate-50', valCls: 'text-slate-700' },
                        ].map((card) => (
                          <SectionCard key={card.key} className={`text-center ${card.cls}`}>
                            <p className={`text-3xl font-bold ${card.valCls}`}>{card.value.toLocaleString()}</p>
                            <p className="text-xs text-slate-500 mt-1 font-semibold">{card.label}</p>
                          </SectionCard>
                        ))}
                      </div>
                      <SectionCard>
                        <div className="flex justify-between text-xs text-slate-500 mb-2 font-semibold">
                          <span>학습 데이터 진행률</span>
                          <span className="text-violet-600">{ftStats?.total ?? 0} / {ftStats?.min_required ?? 500}건</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-700"
                            style={{ width: `${Math.min(100, Math.round(((ftStats?.total ?? 0) / (ftStats?.min_required ?? 500)) * 100))}%` }} />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">라벨별 최소 100건 필요 · 로그 탭에서 오탐지 수집</p>
                      </SectionCard>
                      <SectionCard className={`border-l-4 ${ftStats?.ready ? 'border-l-emerald-500' : 'border-l-amber-400'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-800 mb-1">파인튜닝 실행</p>
                            <p className="text-xs text-slate-400">klue/roberta-base 기반 · K-HATERS + K-MHaS 데이터셋</p>
                            <p className={`text-xs font-semibold mt-2 ${ftStats?.ready ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {ftStats?.ready ? '✓ 데이터 충분 — 실행 가능' : '⚠ 데이터 부족 — 더 수집 필요'}
                            </p>
                          </div>
                          <button disabled={!ftStats?.ready}
                            className="shrink-0 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition">
                            파인튜닝 시작
                          </button>
                        </div>
                      </SectionCard>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── 통계 탭 ── */}
          {mainTab === '통계' && (
            <div className="space-y-5">
              <SectionCard>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex gap-2">
                    {[['시작일', statsDateFrom, setStatsDateFrom], ['종료일', statsDateTo, setStatsDateTo]].map(([label, val, setVal]) => (
                      <label key={label as string} className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-500">{label as string}</span>
                        <input type="date" value={val as string} onChange={(e) => (setVal as (v: string) => void)(e.target.value)}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition" />
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 ml-auto self-end">
                    <button onClick={loadStats} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 active:scale-95 transition">조회</button>
                    <button onClick={() => { setStatsDateFrom(''); setStatsDateTo(''); void loadStats(); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition">초기화</button>
                  </div>
                </div>
              </SectionCard>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: '총 탐지', value: stats?.totalFlagged ?? 0, sub: `탐지율 ${stats?.detectionRate ?? 0}%`, top: 'border-t-slate-400' },
                    { label: '차단', value: stats?.blocked ?? 0, sub: '즉시 차단', top: 'border-t-red-400' },
                    { label: '경고', value: stats?.warned ?? 0, sub: '경고 처리', top: 'border-t-amber-400' },
                    { label: '오탐지', value: stats?.falsePositive ?? 0, sub: '관리자 수정', top: 'border-t-slate-300' },
                  ].map((card) => (
                    <SectionCard key={card.label} className={`border-t-2 ${card.top}`}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                      <p className="mt-2 text-3xl font-bold text-slate-900">{statsLoading ? '—' : card.value.toLocaleString()}</p>
                      <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
                    </SectionCard>
                  ))}
                </div>
                <SectionCard className="flex items-center justify-center">
                  {stats ? <DonutChart blocked={stats.blocked} warned={stats.warned} falsePositive={stats.falsePositive} pending={stats.pending} />
                    : <p className="text-sm text-slate-400">불러오는 중...</p>}
                </SectionCard>
              </div>

              <SectionCard>
                <div className="flex items-center justify-between mb-5 gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-800">탐지 추세</p>
                    <p className="text-xs text-slate-400 mt-0.5">기간별 차단 / 경고 / 오탐지</p>
                  </div>
                  <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                    {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                      <button key={p} onClick={() => setTrendPeriod(p)}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${trendPeriod === p ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
                        {p === 'daily' ? '일별' : p === 'weekly' ? '주별' : '월별'}
                      </button>
                    ))}
                  </div>
                </div>
                {trendLoading ? <div className="h-40 flex items-center justify-center text-sm text-slate-400">불러오는 중...</div>
                  : trend.length > 0 ? <BarChart data={trend} period={trendPeriod} />
                    : <div className="h-40 flex items-center justify-center text-sm text-slate-400">데이터가 없습니다.</div>}
              </SectionCard>

              {/* ML 서버 상태 */}
              <SectionCard>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold text-slate-800">ML 서버 상태</p>
                    <p className="text-xs text-slate-400 mt-0.5">KR-ELECTRA 추론 서버 실시간 연결 확인</p>
                  </div>
                  <button
                    onClick={() => {
                      setMlHealthLoading(true);
                      fetchMlHealth().then(setMlHealth).finally(() => setMlHealthLoading(false));
                    }}
                    className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition">
                    새로고침
                  </button>
                </div>
                {mlHealthLoading ? (
                  <p className="text-sm text-slate-400">확인 중...</p>
                ) : mlHealth ? (
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm ${mlHealth.status === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                      <span className={`w-2 h-2 rounded-full ${mlHealth.status === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {mlHealth.status === 'ok' ? '정상' : '연결 불가'}
                    </div>
                    {mlHealth.model && (
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">{mlHealth.model}</span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">데이터 없음</p>
                )}
              </SectionCard>

              {/* 단계별 탐지 건수 + 신뢰도 분포 */}
              <div className="grid md:grid-cols-2 gap-4">
                <SectionCard>
                  <p className="text-sm font-bold text-slate-800 mb-4">단계별 탐지 건수</p>
                  <div className="space-y-3">
                    {[
                      { stage: 1, label: '1단계 규칙', color: 'bg-emerald-500', textColor: 'text-emerald-700' },
                      { stage: 2, label: '2단계 ML', color: 'bg-blue-500', textColor: 'text-blue-700' },
                      { stage: 3, label: '3단계 Ollama', color: 'bg-violet-500', textColor: 'text-violet-700' },
                    ].map(({ stage, label, color, textColor }) => {
                      const count = stageStats ? (stage === 1 ? stageStats.stage1 : stage === 2 ? stageStats.stage2 : stageStats.stage3) : 0;
                      const total = stageStats ? (stageStats.stage1 + stageStats.stage2 + stageStats.stage3) || 1 : 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={stage}>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className={textColor}>{label}</span>
                            <span className="text-slate-600">{count.toLocaleString()}건 ({pct}%)</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </SectionCard>

                <SectionCard>
                  <p className="text-sm font-bold text-slate-800 mb-1">ML 신뢰도 점수 분포</p>
                  <p className="text-xs text-slate-400 mb-4">2단계 ML 탐지 기준</p>
                  {stageStats?.confidenceDist ? (
                    <div className="flex items-end gap-1 h-28">
                      {stageStats.confidenceDist.map((d, i) => {
                        const max = Math.max(...stageStats.confidenceDist.map((x) => x.count), 1);
                        const h = Math.max((d.count / max) * 100, d.count > 0 ? 4 : 0);
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center group relative">
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                              {d.range}<br />{d.count}건
                            </div>
                            <div className="w-full rounded-t bg-blue-400 hover:bg-blue-500 transition-colors cursor-pointer" style={{ height: `${h}%` }} />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 py-8 text-center">데이터 없음</p>
                  )}
                  {stageStats?.confidenceDist && (
                    <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                      <span>0.50</span><span>0.75</span><span>1.00</span>
                    </div>
                  )}
                </SectionCard>
              </div>
            </div>
          )}

          {/* ── 로그 탭 ── */}
          {mainTab === '로그' && (
            <div className="space-y-4">
              <SectionCard>
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-500">키워드</span>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="메시지 / 닉네임 / 파티명"
                      className="w-56 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition" />
                  </label>
                  <div className="flex gap-2">
                    {[['시작일', dateFrom, setDateFrom], ['종료일', dateTo, setDateTo]].map(([label, val, setVal]) => (
                      <label key={label as string} className="flex flex-col gap-1">
                        <span className="text-xs font-medium text-slate-500">{label as string}</span>
                        <input type="date" value={val as string} onChange={(e) => (setVal as (v: string) => void)(e.target.value)}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 transition" />
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 ml-auto self-end">
                    <button onClick={() => { setPage(1); void loadChats({ moderation_status: TAB_TO_STATUS[activeTab], keyword: search || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined }); }}
                      className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 active:scale-95 transition">조회</button>
                    <button onClick={() => { setPage(1); setSearch(''); setDateFrom(''); setDateTo(''); setActiveTab('전체'); void loadChats(); }}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition">초기화</button>
                  </div>
                </div>
              </SectionCard>

              <FilterTabs tabs={FILTER_TABS} activeTab={activeTab} onTabChange={handleTabChange} />

              {logError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{logError}</div>}

              <SectionCard noPad>
                <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden">
                  <table className="min-w-[1000px] w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/80">
                        {['상태', '파티', '발신자', '메시지', '탐지 사유', '단계', 'ML 신뢰도', '경고', '삭제', '발생일', '관리'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logLoading && <tr><td colSpan={11} className="px-4 py-12 text-center text-sm text-slate-400">탐지 로그를 불러오는 중...</td></tr>}
                      {paginated.map((chat) => {
                        const isExpanded = expandedId === chat.id;
                        const isBusy = busyId === chat.id;
                        const statusKey = chat.moderationStatus ?? 'pending';
                        return (
                          <Fragment key={chat.id}>
                            <tr className="border-b border-slate-100 hover:bg-slate-50/60 transition">
                              <td className="px-4 py-3.5">
                                <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${STATUS_STYLE[statusKey] ?? STATUS_STYLE.pending}`}>
                                  {STATUS_LABEL[statusKey] ?? statusKey}
                                </span>
                              </td>
                              <td className="px-4 py-3.5"><span className="block truncate max-w-[120px] text-xs text-slate-600" title={chat.partyTitle}>{chat.partyTitle}</span></td>
                              <td className="px-4 py-3.5"><span className="block truncate max-w-[100px] text-xs font-semibold text-slate-800" title={chat.senderNickname}>{chat.senderNickname}</span></td>
                              <td className="px-4 py-3.5"><span className={`block truncate max-w-[160px] text-xs ${chat.isDeleted ? 'line-through text-slate-400' : 'text-slate-700'}`} title={chat.message}>{chat.message}</span></td>
                              <td className="px-4 py-3.5"><span className="block truncate max-w-[100px] text-xs text-slate-500" title={chat.flagReason ?? '—'}>{chat.flagReason ?? '—'}</span></td>
                              <td className="px-4 py-3.5">{chat.flagStage != null ? <StageBadge stage={chat.flagStage} /> : <span className="text-xs text-slate-300">—</span>}</td>
                              <td className="px-4 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">{chat.flagConfidence != null ? `${(chat.flagConfidence * 100).toFixed(0)}%` : '—'}</td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {chat.warnCount != null
                                  ? <span className={`text-xs font-bold ${chat.warnCount >= 3 ? 'text-red-500' : chat.warnCount >= 1 ? 'text-amber-500' : 'text-slate-400'}`}>{chat.warnCount}회</span>
                                  : <span className="text-xs text-slate-300">—</span>}
                              </td>
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                {chat.isDeleted
                                  ? <span className="text-[10px] font-semibold text-slate-400">삭제됨</span>
                                  : <span className="text-[10px] font-semibold text-emerald-500">유지</span>}
                              </td>
                              <td className="px-4 py-3.5 font-mono text-[10px] text-slate-400 whitespace-nowrap">{chat.createdAt}</td>
                              <td className="px-4 py-3.5">
                                <div className="flex gap-1.5 whitespace-nowrap">
                                  <button onClick={() => setExpandedId((prev) => prev === chat.id ? null : chat.id)}
                                    className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition active:scale-95 ${isExpanded ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                                    {isExpanded ? '닫기' : '상세'}
                                  </button>
                                  {statusKey !== 'false_positive' && (
                                    <button disabled={isBusy} onClick={() => void handleStatusUpdate(chat.id, 'false_positive')}
                                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 active:scale-95 transition">
                                      {isBusy ? '...' : '오탐지'}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="border-b border-slate-100 bg-slate-50/40">
                                <td colSpan={11} className="p-4">
                                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-start justify-between mb-4 gap-3">
                                      <div>
                                        <h3 className="text-sm font-bold text-slate-900">탐지 상세</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">AI 탐지 결과 확인 및 상태 수동 수정</p>
                                      </div>
                                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLE[statusKey] ?? STATUS_STYLE.pending}`}>
                                        {STATUS_LABEL[statusKey] ?? statusKey}
                                      </span>
                                    </div>
                                    <div className="grid gap-2 grid-cols-2 md:grid-cols-4 mb-4">
                                      {([['파티', chat.partyTitle], ['발신자', chat.senderNickname], ['탐지 사유', chat.flagReason ?? '—'], ['탐지 단계', chat.flagStage != null ? `${chat.flagStage}단계` : '—'], ['ML 신뢰도', chat.flagConfidence != null ? `${(chat.flagConfidence * 100).toFixed(1)}%` : '—'], ['경고 누적', chat.warnCount != null ? `${chat.warnCount}회` : '—'], ['삭제 여부', chat.isDeleted ? '삭제됨' : '유지'], ['발생일', chat.createdAt]] as [string, string][]).map(([label, value]) => (
                                        <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                                          <div className="text-[10px] text-slate-400 mb-1 font-medium">{label}</div>
                                          <div className="text-xs font-semibold text-slate-800 break-all">{value}</div>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 mb-4">
                                      <div className="text-[10px] text-slate-400 mb-1.5 font-medium">원본 메시지</div>
                                      <p className={`text-sm break-all leading-relaxed ${chat.isDeleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>{chat.message}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center mb-4">
                                      <span className="text-xs font-semibold text-slate-500 mr-1">상태 변경:</span>
                                      {(['blocked', 'warned', 'false_positive', 'pending'] as const).map((s) => (
                                        <button key={s} disabled={isBusy || statusKey === s} onClick={() => void handleStatusUpdate(chat.id, s)}
                                          className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition disabled:opacity-40 active:scale-95 ${statusKey === s ? (STATUS_STYLE[s] ?? '') : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}>
                                          {STATUS_LABEL[s]}
                                        </button>
                                      ))}
                                    </div>

                                    {/* 유저 위반 패턴 */}
                                    {chat.senderId && chat.senderId !== '-' && (
                                      <div className="border-t border-slate-100 pt-4">
                                        <div className="flex items-center justify-between mb-3">
                                          <p className="text-xs font-bold text-slate-700">유저 위반 패턴</p>
                                          {!userPattern[chat.senderId] && (
                                            <button
                                              disabled={patternBusy === chat.senderId}
                                              onClick={() => void loadUserPattern(chat.senderId)}
                                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 active:scale-95 transition">
                                              {patternBusy === chat.senderId ? '조회 중...' : '패턴 분석'}
                                            </button>
                                          )}
                                        </div>
                                        {userPattern[chat.senderId] && (() => {
                                          const p = userPattern[chat.senderId];
                                          const total = p.totalViolations || 1;
                                          return (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-center">
                                                <p className="text-lg font-bold text-slate-800">{p.totalViolations}</p>
                                                <p className="text-[10px] text-slate-400">총 위반</p>
                                              </div>
                                              <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-center">
                                                <p className="text-lg font-bold text-red-700">{p.statusCounts.blocked}</p>
                                                <p className="text-[10px] text-red-400">차단</p>
                                              </div>
                                              <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5 text-center">
                                                <p className="text-lg font-bold text-amber-700">{p.statusCounts.warned}</p>
                                                <p className="text-[10px] text-amber-400">경고</p>
                                              </div>
                                              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-center">
                                                <p className="text-lg font-bold text-slate-700">
                                                  {p.avgConfidence != null ? `${(p.avgConfidence * 100).toFixed(0)}%` : '—'}
                                                </p>
                                                <p className="text-[10px] text-slate-400">평균 신뢰도</p>
                                              </div>
                                              <div className="col-span-2 md:col-span-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                                                <p className="text-[10px] text-slate-400 mb-2 font-semibold">단계별 위반</p>
                                                <div className="flex gap-3">
                                                  {([1, 2, 3] as const).map((s) => {
                                                    const cnt = p.stageCounts[s];
                                                    const pct = Math.round((cnt / total) * 100);
                                                    const cls = s === 1 ? 'bg-emerald-500' : s === 2 ? 'bg-blue-500' : 'bg-violet-500';
                                                    const lbl = s === 1 ? '규칙' : s === 2 ? 'ML' : 'AI';
                                                    return (
                                                      <div key={s} className="flex-1">
                                                        <div className="flex justify-between text-[10px] mb-1">
                                                          <span className="text-slate-500">{lbl}</span>
                                                          <span className="font-bold text-slate-700">{cnt}</span>
                                                        </div>
                                                        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                                          <div className={`h-full rounded-full ${cls}`} style={{ width: `${pct}%` }} />
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                      {paginated.length === 0 && !logLoading && (
                        <tr><td colSpan={11} className="px-4 py-12 text-center text-sm text-slate-400">탐지된 메시지가 없습니다.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination total={filtered.length} page={page} pageSize={20} onChange={(p) => setPage(p)} />
                <div className="border-t border-slate-100 px-4 py-3 text-[10px] text-slate-400">
                  오탐지로 표시하면 해당 메시지는 통계에서 false_positive로 집계됩니다.
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── IP 벤 탭 ── */}
          {mainTab === 'IP 벤' && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">채팅 IP 차단 목록</h2>
                  <p className="text-xs text-slate-400 mt-0.5">욕설 감지로 IP 차단된 목록입니다. 해제 시 해당 IP로 다시 로그인 가능합니다.</p>
                </div>
                <button onClick={loadChatBans} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-95 transition">새로고침</button>
              </div>
              <SectionCard noPad>
                {chatBansLoading ? <div className="px-4 py-16 text-center text-sm text-slate-400">불러오는 중...</div>
                  : chatBans.length === 0 ? <div className="px-4 py-16 text-center text-sm text-slate-400">차단된 IP가 없습니다.</div>
                    : (
                      <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden">
                        <table className="min-w-[400px] w-full border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/80">
                              {['IP 주소', '남은 시간', '해제'].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {chatBans.map((ban) => (
                              <tr key={ban.ip} className="border-b border-slate-100 hover:bg-slate-50/60 transition">
                                <td className="px-4 py-3.5 font-mono text-sm font-semibold text-slate-700">{ban.ip}</td>
                                <td className="px-4 py-3.5">
                                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${ban.ttl < 0 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                                    {formatTtl(ban.ttl)}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5">
                                  <button disabled={unbanBusy === ban.ip} onClick={() => void handleUnbanIp(ban.ip)}
                                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 active:scale-95 transition">
                                    {unbanBusy === ban.ip ? '처리 중...' : '차단 해제'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
              </SectionCard>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
