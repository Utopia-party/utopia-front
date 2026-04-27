import { useEffect, useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import Pagination from './components/Pagination';
import {
  fetchAdminFlaggedChats,
  fetchAdminModerationStats,
  fetchModerationTrend,
  getAdminErrorMessage,
  updateAdminChatModerationStatus,
  type AdminChatFlagged,
  type AdminModerationStat,
  type ModerationTrendPoint,
} from '../../apis/admin';

const API = '/api/admin/moderation';

// ── 상수 ──
const STATUS_STYLE: Record<string, string> = {
  blocked: 'bg-red-50 text-red-600 border-red-100',
  warned: 'bg-amber-50 text-amber-600 border-amber-100',
  false_positive: 'bg-slate-100 text-slate-500 border-slate-200',
  pending: 'bg-blue-50 text-blue-500 border-blue-100',
};
const STATUS_LABEL: Record<string, string> = {
  blocked: '차단',
  warned: '경고',
  false_positive: '오탐지',
  pending: '검토 중',
};
const STAGE_STYLE: Record<number, string> = {
  1: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  2: 'bg-blue-50 text-blue-700 border-blue-100',
  3: 'bg-violet-50 text-violet-700 border-violet-100',
};
const EXAMPLE_LABEL_KO: Record<string, string> = { none: '정상', offensive: '경고', hate: '즉시차단' };

const FILTER_TABS = ['전체', '차단', '경고', '오탐지', '검토 중'];
const TAB_TO_STATUS: Record<string, string> = {
  차단: 'blocked',
  경고: 'warned',
  오탐지: 'false_positive',
  '검토 중': 'pending',
};

// ── 설정 타입 ──
type Config = {
  stage1_enabled: boolean;
  stage2_enabled: boolean;
  stage3_enabled: boolean;
  stage2_pass_threshold: number;
  stage2_block_threshold: number;
  ollama_prompt_examples: { text: string; label: string }[];
  whitelist: string[];
  blacklist: string[];
};
type FinetuneStats = {
  total: number;
  hate: number;
  offensive: number;
  none: number;
  ready: boolean;
  min_required: number;
};
type ChatBan = {
  ip: string;
  ttl: number;
};

// ── 큰 바 차트 ──
function BarChart({ data, period }: { data: ModerationTrendPoint[]; period: 'daily' | 'weekly' | 'monthly' }) {
  // 기간별 최소 슬롯 수 — 바 너비 일정하게 유지
  const minSlots = period === 'daily' ? 7 : period === 'weekly' ? 8 : 6;

  // 빈 슬롯 채우기
  const filled = [...data];
  while (filled.length < minSlots) {
    filled.unshift({ date: '', blocked: 0, warned: 0, false_positive: 0, total: 0 });
  }

  const max = Math.max(...filled.map((d) => d.total), 1);
  const chartHeight = 180;

  return (
    <div className="w-full">
      <div className="flex items-end gap-2" style={{ height: chartHeight }}>
        {filled.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
            {d.date && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs rounded-lg px-2 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none shadow-lg">
                <div className="font-semibold mb-0.5">{d.date}</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-red-400 inline-block" />차단 {d.blocked}</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" />경고 {d.warned}</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-slate-300 inline-block" />오탐 {d.false_positive}</div>
                <div className="border-t border-slate-700 mt-1 pt-1 font-semibold">합계 {d.total}</div>
              </div>
            )}
            <div
              className="w-full flex flex-col justify-end rounded overflow-hidden cursor-pointer transition-all hover:brightness-95"
              style={{ height: chartHeight - 20 }}
            >
              {d.total > 0 ? (
                <>
                  <div className="w-full bg-red-400" style={{ height: `${(d.blocked / max) * (chartHeight - 20)}px` }} />
                  <div className="w-full bg-amber-400" style={{ height: `${(d.warned / max) * (chartHeight - 20)}px` }} />
                  <div className="w-full bg-slate-300" style={{ height: `${(d.false_positive / max) * (chartHeight - 20)}px` }} />
                </>
              ) : (
                <div className="w-full bg-slate-100 rounded" style={{ height: 4 }} />
              )}
            </div>
            <span className="text-[10px] text-slate-400 truncate w-full text-center mt-1">{d.date ? d.date.slice(5) : ''}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 justify-end">
        {[['bg-red-400', '차단'], ['bg-amber-400', '경고'], ['bg-slate-300', '오탐지']].map(([cls, label]) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm ${cls}`} />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 도넛 차트 ──
function DonutChart({ blocked, warned, falsePositive, pending }: {
  blocked: number; warned: number; falsePositive: number; pending: number;
}) {
  const total = blocked + warned + falsePositive + pending || 1;
  const r = 52;
  const cx = 64, cy = 64;
  const circumference = 2 * Math.PI * r;

  const segments = [
    { value: blocked, color: '#f87171', label: '차단' },
    { value: warned, color: '#fbbf24', label: '경고' },
    { value: falsePositive, color: '#94a3b8', label: '오탐지' },
    { value: pending, color: '#93c5fd', label: '검토중' },
  ];

  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct = seg.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const arc = { ...seg, dash, gap, offset: circumference - offset };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={128} height={128} viewBox="0 0 128 128">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={18} />
        {arcs.map((arc, i) => (
          <circle
            key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={arc.color} strokeWidth={18}
            strokeDasharray={`${arc.dash} ${arc.gap}`}
            strokeDashoffset={arc.offset} strokeLinecap="butt"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#1e293b" fontSize={18} fontWeight={700}>
          {(blocked + warned).toLocaleString()}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" fontSize={10}>탐지</text>
      </svg>
      <div className="flex flex-col gap-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: seg.color }} />
            <span className="text-xs text-slate-500 w-12">{seg.label}</span>
            <span className="text-xs font-semibold text-slate-800">{seg.value.toLocaleString()}</span>
            <span className="text-xs text-slate-400">({Math.round(seg.value / total * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminModeration() {
  const [mainTab, setMainTab] = useState<'설정' | '통계' | '로그' | 'IP 벤'>('설정');

  // ── 설정 상태 ──
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

  // ── 통계 상태 ──
  const [stats, setStats] = useState<AdminModerationStat | null>(null);
  const [trend, setTrend] = useState<ModerationTrendPoint[]>([]);
  const [trendPeriod, setTrendPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [statsLoading, setStatsLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [statsDateFrom, setStatsDateFrom] = useState('');
  const [statsDateTo, setStatsDateTo] = useState('');

  // ── 로그 상태 ──
  const [activeTab, setActiveTab] = useState('전체');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [chats, setChats] = useState<AdminChatFlagged[]>([]);
  const [logLoading, setLogLoading] = useState(true);
  const [logError, setLogError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [unblockBusyId, setUnblockBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // ── IP 벤 상태 ──
  const [chatBans, setChatBans] = useState<ChatBan[]>([]);
  const [chatBansLoading, setChatBansLoading] = useState(false);
  const [unbanBusy, setUnbanBusy] = useState<string | null>(null);

  // ── 설정 로드 ──
  useEffect(() => {
    fetch(`${API}/config`)
      .then((r) => r.json())
      .then((d) => { setConfig(d); setConfigLoading(false); })
      .catch(() => setConfigLoading(false));
  }, []);

  useEffect(() => {
    if (configTab === '파인튜닝') {
      fetch(`${API}/finetune/stats`).then((r) => r.json()).then(setFtStats).catch(() => {});
    }
  }, [configTab]);

  const saveConfig = async () => {
    if (!config) return;
    setConfigSaving(true);
    try {
      const res = await fetch(`${API}/config`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      setConfigMsg(res.ok ? '저장되었습니다.' : '저장 실패');
    } catch {
      setConfigMsg('저장 실패');
    }
    setConfigSaving(false);
    setTimeout(() => setConfigMsg(''), 3000);
  };

  const [wordMsg, setWordMsg] = useState<{type: 'whitelist'|'blacklist', text: string} | null>(null);

  const addWord = async (type: 'whitelist' | 'blacklist') => {
    const raw = type === 'whitelist' ? wlInput.trim() : blInput.trim();
    if (!raw || !config) return;
    // 쉼표 또는 줄바꿈으로 분리해 다중 추가
    const words = raw.split(/[,\n]/).map((w) => w.trim()).filter((w) => w.length > 0);
    const newList = [...config[type]];
    for (const word of words) {
      if (!newList.includes(word)) {
        newList.push(word);
        await fetch(`${API}/${type}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ word }),
        });
      }
    }
    setConfig((c) => c ? { ...c, [type]: newList } : c);
    type === 'whitelist' ? setWlInput('') : setBlInput('');
    setWordMsg({ type, text: `${words.length}개 추가되었습니다.` });
    setTimeout(() => setWordMsg(null), 3000);
  };

  const removeWord = async (type: 'whitelist' | 'blacklist', word: string) => {
    setConfig((c) => c ? { ...c, [type]: c[type].filter((w) => w !== word) } : c);
    await fetch(`${API}/${type}/${encodeURIComponent(word)}`, { method: 'DELETE' });
  };

  // ── 통계 로드 ──
  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const s = await fetchAdminModerationStats({
        date_from: statsDateFrom || undefined,
        date_to: statsDateTo || undefined,
      });
      setStats(s);
    } catch {}
    setStatsLoading(false);
  };

  const loadTrend = async (period: 'daily' | 'weekly' | 'monthly') => {
    setTrendLoading(true);
    try {
      const t = await fetchModerationTrend({ period });
      setTrend(t);
    } catch {}
    setTrendLoading(false);
  };

  useEffect(() => {
    if (mainTab === '통계') { void loadStats(); void loadTrend(trendPeriod); }
  }, [mainTab]);

  useEffect(() => {
    if (mainTab === '통계') void loadTrend(trendPeriod);
  }, [trendPeriod]);

  // ── 로그 로드 ──
  const loadChats = async (params?: {
    moderation_status?: string;
    date_from?: string;
    date_to?: string;
    keyword?: string;
  }) => {
    setLogLoading(true);
    setLogError('');
    try {
      setChats(await fetchAdminFlaggedChats(params));
    } catch (err) {
      setLogError(getAdminErrorMessage(err));
    }
    setLogLoading(false);
  };

  useEffect(() => {
    if (mainTab === '로그') void loadChats();
  }, [mainTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setPage(1);
    void loadChats({
      moderation_status: TAB_TO_STATUS[tab],
      keyword: search || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
  };

  const handleStatusUpdate = async (
    chatId: string,
    status: 'blocked' | 'warned' | 'false_positive' | 'pending',
  ) => {
    setBusyId(chatId);
    try {
      await updateAdminChatModerationStatus(chatId, status);
      setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, moderationStatus: status } : c));
    } catch (err) {
      setLogError(getAdminErrorMessage(err));
    }
    setBusyId(null);
  };

  const handleUnblockUser = async (senderId: string, chatId: string) => {
    setUnblockBusyId(chatId);
    try {
      await fetch(`${API}/unblock/user/${senderId}`, { method: 'POST' });
      await updateAdminChatModerationStatus(chatId, 'false_positive');
      setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, moderationStatus: 'false_positive' } : c));
    } catch (err) {
      setLogError(getAdminErrorMessage(err));
    }
    setUnblockBusyId(null);
  };

  // ── IP 벤 로드 ──
  const loadChatBans = async () => {
    setChatBansLoading(true);
    try {
      const res = await fetch(`${API}/chat-bans`);
      const data: ChatBan[] = await res.json();
      setChatBans(data);
    } catch {}
    setChatBansLoading(false);
  };

  useEffect(() => {
    if (mainTab === 'IP 벤') void loadChatBans();
  }, [mainTab]);

  const handleUnbanIp = async (ip: string) => {
    setUnbanBusy(ip);
    try {
      await fetch(`${API}/unblock/ip/${encodeURIComponent(ip)}`, { method: 'DELETE' });
      setChatBans((prev) => prev.filter((b) => b.ip !== ip));
    } catch {}
    setUnbanBusy(null);
  };

  const formatTtl = (ttl: number) => {
    if (ttl < 0) return '영구';
    const h = Math.floor(ttl / 3600);
    const m = Math.floor((ttl % 3600) / 60);
    return `${h}시간 ${m}분`;
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return chats;
    return chats.filter(
      (c) =>
        c.message.toLowerCase().includes(q) ||
        c.senderNickname.toLowerCase().includes(q) ||
        c.partyTitle.toLowerCase().includes(q),
    );
  }, [chats, search]);

  const paginated = filtered.slice((page - 1) * 20, page * 20);

  return (
    <>
      <AdminHeader
        placeholder="메시지 / 닉네임 / 파티명 검색..."
        onSearch={setSearch}
        rightContent={
          <span className="rounded-md border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-sm font-semibold text-violet-700">
            채팅 모더레이션
          </span>
        }
      />

      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section>
            <h1 className="text-2xl font-bold text-gray-900">채팅 모더레이션</h1>
            <p className="mt-1 text-sm text-gray-500">탐지 파이프라인 설정 · 통계 분석 · AI 탐지 로그 관리</p>
          </section>

          {/* 메인 탭 */}
          <div className="flex gap-1 border-b border-gray-200">
            {(['설정', '통계', '로그', 'IP 벤'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setMainTab(t)}
                className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                  mainTab === t ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* ── 설정 탭 ── */}
          {mainTab === '설정' && (
            <div className="space-y-5">
              <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {(['파이프라인', '규칙 단어', '프롬프트', '파인튜닝'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setConfigTab(t)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                      configTab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {configLoading ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-400">불러오는 중...</div>
              ) : config && (
                <>
                  {configTab === '파이프라인' && (
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-1">
                        <p className="text-sm font-bold text-gray-800 mb-4">탐지 단계 활성화</p>
                        {(([
                          ['stage1_enabled', '1단계 — 규칙 기반', '화이트/블랙리스트 (0ms)', 'bg-emerald-100 text-emerald-700'],
                          ['stage2_enabled', '2단계 — ML 모델', 'GPU 서버 HTTP 호출 (10~30ms)', 'bg-blue-100 text-blue-700'],
                          ['stage3_enabled', '3단계 — Ollama Exaone', '문맥 판단 (500ms~3s)', 'bg-violet-100 text-violet-700'],
                        ]) as [keyof Config, string, string, string][]).map(([key, label, sub, badge]) => (
                          <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>
                                {label.split('—')[0].trim()}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-gray-800">{label.split('—')[1]?.trim()}</p>
                                <p className="text-xs text-gray-400">{sub}</p>
                              </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox" className="sr-only peer"
                                checked={config[key] as boolean}
                                onChange={(e) => setConfig((c) => c ? { ...c, [key]: e.target.checked } : c)}
                              />
                              <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-violet-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-bold text-gray-800 mb-1">2단계 임계값</p>
                        <p className="text-xs text-gray-400 mb-5">통과~차단 사이 점수는 3단계(Ollama)로 전달</p>
                        {(([
                          ['stage2_pass_threshold', '통과 임계값', '이하이면 정상 처리', 0.5, 0.9],
                          ['stage2_block_threshold', '차단 임계값', '이상이면 즉시 차단', 0.7, 0.99],
                        ]) as [keyof Config, string, string, number, number][]).map(([key, label, sub, min, max]) => (
                          <div key={key} className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                              <div>
                                <span className="font-medium text-gray-700">{label}</span>
                                <span className="text-gray-400 text-xs ml-1">— {sub}</span>
                              </div>
                              <span className="font-bold text-violet-600">{(config[key] as number).toFixed(2)}</span>
                            </div>
                            <input
                              type="range" min={min} max={max} step={0.01}
                              value={config[key] as number}
                              onChange={(e) => setConfig((c) => c ? { ...c, [key]: parseFloat(e.target.value) } : c)}
                              className="w-full accent-violet-600 h-1.5"
                            />
                          </div>
                        ))}
                        <div className="mt-4 rounded-xl bg-violet-50 border border-violet-100 px-4 py-2.5 text-xs text-violet-700 font-medium">
                          {`점수 < ${config.stage2_pass_threshold.toFixed(2)} → 통과  |  ${config.stage2_pass_threshold.toFixed(2)} ~ ${config.stage2_block_threshold.toFixed(2)} → Ollama  |  점수 ≥ ${config.stage2_block_threshold.toFixed(2)} → 차단`}
                        </div>
                      </div>

                      <div className="md:col-span-2 flex justify-end gap-2">
                        <button
                          onClick={() => fetch(`${API}/config/reset`, { method: 'POST' }).then((r) => r.json()).then(setConfig)}
                          className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
                        >초기화</button>
                        <button
                          onClick={saveConfig} disabled={configSaving}
                          className="px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
                        >{configSaving ? '저장 중...' : '저장'}</button>
                        {configMsg && (
                          <span className={`text-xs font-medium self-center ${configMsg.includes('실패') ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {configMsg}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {configTab === '규칙 단어' && (
                    <div className="grid md:grid-cols-2 gap-5">
                      {(([
                        ['whitelist', '화이트리스트', '항상 정상 처리 — 오탐지된 단어 추가', wlInput, setWlInput, 'bg-emerald-50 text-emerald-700 border-emerald-200', 'bg-emerald-600 hover:bg-emerald-700'] as const,
                        ['blacklist', '블랙리스트', '항상 즉시 차단 — 명백한 욕설 축약어', blInput, setBlInput, 'bg-red-50 text-red-700 border-red-200', 'bg-red-600 hover:bg-red-700'] as const,
                      ])).map(([type, title, sub, val, setVal, tagStyle, btnStyle]) => (
                        <div key={type} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                          <p className="text-sm font-bold text-gray-800 mb-1">{title}</p>
                          <p className="text-xs text-gray-400 mb-4">{sub}</p>
                          <div className="flex flex-wrap gap-2 mb-4 min-h-10">
                            {config[type].map((w) => (
                              <span key={w} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${tagStyle}`}>
                                {w}
                                <button onClick={() => removeWord(type, w)} className="opacity-60 hover:opacity-100 text-sm leading-none">×</button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <textarea
                              value={val} onChange={(e) => setVal(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), addWord(type))}
                              placeholder={"단어 입력 후 추가\n여러 개는 쉼표(,) 또는 줄바꿈으로 구분"}
                              rows={2}
                              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-400 resize-none"
                            />
                            <button onClick={() => addWord(type)} className={`px-4 py-2 text-white rounded-xl text-sm font-semibold ${btnStyle}`}>추가</button>
                          </div>
                          {wordMsg?.type === type && (
                            <p className="text-xs text-emerald-600 font-medium mt-2">{wordMsg.text}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {configTab === '프롬프트' && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-bold text-gray-800 mb-1">Ollama few-shot 예시</p>
                        <p className="text-xs text-gray-400 mb-4">Exaone에게 넘겨주는 판단 예시 — 오탐지가 많은 표현 추가</p>
                        <div className="space-y-0 mb-4 divide-y divide-gray-100">
                          {config.ollama_prompt_examples.map((ex, i) => (
                            <div key={i} className="flex items-center gap-3 py-2.5">
                              <span className="font-mono text-sm flex-1 text-gray-800">{ex.text}</span>
                              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${
                                ex.label === 'none' ? 'bg-emerald-50 text-emerald-700' :
                                ex.label === 'offensive' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                              }`}>{EXAMPLE_LABEL_KO[ex.label] ?? ex.label}</span>
                              <button
                                onClick={() => setConfig((c) => c ? { ...c, ollama_prompt_examples: c.ollama_prompt_examples.filter((_, j) => j !== i) } : c)}
                                className="text-gray-300 hover:text-gray-600 text-lg leading-none"
                              >×</button>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input value={exText} onChange={(e) => setExText(e.target.value)} placeholder="예시 텍스트"
                            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-400" />
                          <select value={exLabel} onChange={(e) => setExLabel(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-violet-400 bg-white">
                            <option value="none">정상</option>
                            <option value="offensive">경고</option>
                            <option value="hate">즉시차단</option>
                          </select>
                          <button
                            onClick={() => { if (!exText.trim()) return; setConfig((c) => c ? { ...c, ollama_prompt_examples: [...c.ollama_prompt_examples, { text: exText.trim(), label: exLabel }] } : c); setExText(''); }}
                            className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700"
                          >추가</button>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button onClick={saveConfig} disabled={configSaving}
                          className="px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50">
                          {configSaving ? '저장 중...' : '저장'}
                        </button>
                      </div>
                    </div>
                  )}

                  {configTab === '파인튜닝' && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-bold text-gray-800 mb-4">학습 데이터 현황</p>
                        <div className="grid grid-cols-3 gap-3 mb-5">
                          {[
                            ['hate', ftStats?.hate ?? 0, '차단', 'bg-red-50 text-red-700'],
                            ['offensive', ftStats?.offensive ?? 0, '경고', 'bg-amber-50 text-amber-700'],
                            ['none', ftStats?.none ?? 0, '오탐지', 'bg-slate-50 text-slate-700'],
                          ].map(([k, v, l, cls]) => (
                            <div key={k as string} className={`rounded-xl p-3 text-center ${cls}`}>
                              <p className="text-2xl font-bold">{(v as number).toLocaleString()}</p>
                              <p className="text-xs mt-0.5 opacity-70">{k as string} ({l as string})</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                          <span>진행률</span>
                          <span className="font-semibold">{ftStats?.total ?? 0} / {ftStats?.min_required ?? 500}건</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-2 rounded-full bg-violet-500 transition-all duration-700"
                            style={{ width: `${Math.min(100, Math.round((ftStats?.total ?? 0) / (ftStats?.min_required ?? 500) * 100))}%` }}
                          />
                        </div>
                      </div>
                      <div className={`px-4 py-3 rounded-xl text-sm border ${ftStats?.ready ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {ftStats?.ready ? '데이터 충분 — 파인튜닝을 실행할 수 있습니다.' : '데이터 부족 — 라벨별 100건 이상 필요합니다. 로그 탭에서 오탐지를 계속 수집해주세요.'}
                      </div>
                      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm font-bold text-gray-800 mb-1">파인튜닝 실행</p>
                        <p className="text-xs text-gray-400 mb-4">GPU 서버의 smilegate 모델 기반으로 fine-tuning</p>
                        <button disabled={!ftStats?.ready}
                          className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed">
                          파인튜닝 시작
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── 통계 탭 ── */}
          {mainTab === '통계' && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-500">시작일</span>
                    <input type="date" value={statsDateFrom} onChange={(e) => setStatsDateFrom(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-500">종료일</span>
                    <input type="date" value={statsDateTo} onChange={(e) => setStatsDateTo(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400" />
                  </label>
                  <button onClick={loadStats} className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 pb-2.5">조회</button>
                  <button onClick={() => { setStatsDateFrom(''); setStatsDateTo(''); void loadStats(); }}
                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 pb-2.5">초기화</button>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-5">
                <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: '총 탐지', value: stats?.totalFlagged ?? 0, sub: `탐지율 ${stats?.detectionRate ?? 0}%`, color: 'border-gray-200' },
                    { label: '차단', value: stats?.blocked ?? 0, sub: '즉시 차단', color: 'border-red-100 bg-red-50' },
                    { label: '경고', value: stats?.warned ?? 0, sub: '경고 처리', color: 'border-amber-100 bg-amber-50' },
                    { label: '오탐지', value: stats?.falsePositive ?? 0, sub: '관리자 수정', color: 'border-slate-200 bg-slate-50' },
                  ].map((card) => (
                    <div key={card.label} className={`rounded-2xl border p-4 shadow-sm bg-white ${card.color}`}>
                      <p className="text-xs text-gray-500">{card.label}</p>
                      <p className="mt-1.5 text-2xl font-bold text-gray-900">{statsLoading ? '-' : card.value.toLocaleString()}</p>
                      <p className="mt-0.5 text-xs text-gray-400">{card.sub}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex items-center justify-center">
                  {stats ? (
                    <DonutChart blocked={stats.blocked} warned={stats.warned} falsePositive={stats.falsePositive} pending={stats.pending} />
                  ) : (
                    <div className="text-sm text-gray-400">불러오는 중...</div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-sm font-bold text-gray-800">탐지 현황</p>
                    <p className="text-xs text-gray-400 mt-0.5">기간별 차단/경고/오탐지 현황</p>
                  </div>
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                      <button key={p} onClick={() => setTrendPeriod(p)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${trendPeriod === p ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'}`}>
                        {p === 'daily' ? '일별' : p === 'weekly' ? '주별' : '월별'}
                      </button>
                    ))}
                  </div>
                </div>
                {trendLoading ? (
                  <div className="h-48 flex items-center justify-center text-sm text-gray-400">불러오는 중...</div>
                ) : trend.length > 0 ? (
                  <BarChart data={trend} period={trendPeriod} />
                ) : (
                  <div className="h-48 flex items-center justify-center text-sm text-gray-400">데이터가 없습니다.</div>
                )}
              </div>
            </div>
          )}

          {/* ── 로그 탭 ── */}
          {mainTab === '로그' && (
            <div className="space-y-5">
              <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-500">키워드</span>
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder="메시지 / 닉네임 / 파티명"
                      className="w-56 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-violet-400" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-500">시작일</span>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-violet-400" />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-500">종료일</span>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-violet-400" />
                  </label>
                  <div className="flex gap-2 pb-0.5">
                    <button
                      onClick={() => { setPage(1); void loadChats({ moderation_status: TAB_TO_STATUS[activeTab], keyword: search || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined }); }}
                      className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                    >조회</button>
                    <button
                      onClick={() => { setPage(1); setSearch(''); setDateFrom(''); setDateTo(''); setActiveTab('전체'); void loadChats(); }}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >초기화</button>
                  </div>
                </div>
              </section>

              <FilterTabs tabs={FILTER_TABS} activeTab={activeTab} onTabChange={handleTabChange} />

              {logLoading && (
                <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-400 shadow-sm">탐지 로그를 불러오는 중입니다.</div>
              )}
              {logError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 shadow-sm">{logError}</div>
              )}

              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse table-fixed">
                    <colgroup>
                      <col style={{ width: '72px' }} />
                      <col style={{ width: '110px' }} />
                      <col style={{ width: '88px' }} />
                      <col style={{ width: '110px' }} />
                      <col style={{ width: '140px' }} />
                      <col style={{ width: '76px' }} />
                      <col style={{ width: '76px' }} />
                      <col style={{ width: '68px' }} />
                      <col style={{ width: '52px' }} />
                      <col style={{ width: '128px' }} />
                      <col style={{ width: '88px' }} />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        {['상태', '파티', '발신자', '메시지', '탐지 사유', '탐지 단계', 'ML 신뢰도', '경고 횟수', '삭제', '발생일', '관리'].map((h) => (
                          <th key={h} className="px-3 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.map((chat) => {
                        const isExpanded = expandedId === chat.id;
                        const isBusy = busyId === chat.id;
                        const isUnblockBusy = unblockBusyId === chat.id;
                        const statusKey = chat.moderationStatus ?? 'pending';
                        return (
                          <>
                            <tr key={chat.id} className="border-b border-gray-100 transition hover:bg-gray-50/70">
                              <td className="px-3 py-3.5">
                                <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[statusKey] ?? STATUS_STYLE.pending}`}>
                                  {STATUS_LABEL[statusKey] ?? statusKey}
                                </span>
                              </td>
                              <td className="px-3 py-3.5">
                                <span className="block truncate text-sm text-gray-700" title={chat.partyTitle}>{chat.partyTitle}</span>
                              </td>
                              <td className="px-3 py-3.5">
                                <span className="block truncate text-sm text-gray-700" title={chat.senderNickname}>{chat.senderNickname}</span>
                              </td>
                              <td className="px-3 py-3.5">
                                <span className={`block truncate text-sm ${chat.isDeleted ? 'line-through text-gray-400' : 'text-gray-800'}`} title={chat.message}>
                                  {chat.message}
                                </span>
                              </td>
                              <td className="px-3 py-3.5">
                                <span className="block truncate text-sm text-gray-500" title={chat.flagReason ?? '-'}>{chat.flagReason ?? '-'}</span>
                              </td>
                              <td className="px-3 py-3.5">
                                {chat.flagStage != null ? (
                                  <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold ${STAGE_STYLE[chat.flagStage] ?? 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                    {chat.flagStage}단계
                                  </span>
                                ) : <span className="text-sm text-gray-400">-</span>}
                              </td>
                              <td className="px-3 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                                {chat.flagConfidence != null ? `${(chat.flagConfidence * 100).toFixed(0)}%` : '-'}
                              </td>
                              <td className="px-3 py-3.5 whitespace-nowrap">
                                {chat.warnCount != null ? (
                                  <span className={`text-sm font-semibold ${chat.warnCount >= 3 ? 'text-red-500' : chat.warnCount >= 1 ? 'text-amber-500' : 'text-gray-400'}`}>
                                    {chat.warnCount}회
                                  </span>
                                ) : <span className="text-sm text-gray-400">-</span>}
                              </td>
                              <td className="px-3 py-3.5 whitespace-nowrap">
                                {chat.isDeleted
                                  ? <span className="text-xs text-gray-400">삭제됨</span>
                                  : <span className="text-xs text-emerald-500">유지</span>}
                              </td>
                              <td className="px-3 py-3.5 text-xs text-gray-400 whitespace-nowrap">{chat.createdAt}</td>
                              <td className="px-3 py-3.5">
                                <div className="flex gap-1 whitespace-nowrap">
                                  <button
                                    onClick={() => setExpandedId((prev) => (prev === chat.id ? null : chat.id))}
                                    className={`rounded-md border px-2 py-1 text-xs font-medium transition ${isExpanded ? 'border-violet-300 bg-violet-50 text-violet-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                  >{isExpanded ? '닫기' : '상세'}</button>
                                  {statusKey !== 'false_positive' && (
                                    <button
                                      disabled={isBusy}
                                      onClick={() => void handleStatusUpdate(chat.id, 'false_positive')}
                                      className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                    >{isBusy ? '...' : '오탐지'}</button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr key={`${chat.id}-detail`} className="bg-slate-50/70 border-b border-gray-100">
                                <td colSpan={11} className="px-4 py-4">
                                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex items-start justify-between mb-4">
                                      <div>
                                        <h3 className="text-sm font-bold text-slate-900">탐지 상세</h3>
                                        <p className="text-xs text-slate-400 mt-0.5">AI 탐지 결과 확인 및 상태 수동 수정</p>
                                      </div>
                                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[statusKey] ?? STATUS_STYLE.pending}`}>
                                        {STATUS_LABEL[statusKey] ?? statusKey}
                                      </span>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-3 mb-4">
                                      {([
                                        ['파티', chat.partyTitle],
                                        ['발신자', chat.senderNickname],
                                        ['탐지 사유', chat.flagReason ?? '-'],
                                        ['탐지 단계', chat.flagStage != null ? `${chat.flagStage}단계` : '-'],
                                        ['ML 신뢰도', chat.flagConfidence != null ? `${(chat.flagConfidence * 100).toFixed(1)}%` : '-'],
                                        ['경고 누적', chat.warnCount != null ? `${chat.warnCount}회` : '-'],
                                        ['삭제 여부', chat.isDeleted ? '삭제됨' : '유지'],
                                        ['발생일', chat.createdAt],
                                      ] as [string, string][]).map(([label, value]) => (
                                        <div key={label} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
                                          <div className="text-xs text-slate-400 mb-0.5">{label}</div>
                                          <div className="text-sm font-semibold text-slate-800 break-all">{value}</div>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 mb-4">
                                      <div className="text-xs text-slate-400 mb-1">원본 메시지</div>
                                      <p className={`text-sm break-all ${chat.isDeleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>{chat.message}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                      <span className="text-xs font-semibold text-slate-600">상태 변경:</span>
                                      {(['blocked', 'warned', 'false_positive', 'pending'] as const).map((s) => (
                                        <button
                                          key={s}
                                          disabled={isBusy || statusKey === s}
                                          onClick={() => void handleStatusUpdate(chat.id, s)}
                                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition disabled:opacity-40 ${statusKey === s ? (STATUS_STYLE[s] ?? '') : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                                        >{STATUS_LABEL[s]}</button>
                                      ))}
                                    </div>
                                    {statusKey === 'blocked' && (
                                      <div className="mt-3 pt-3 border-t border-slate-100">
                                        <p className="text-xs text-slate-400 mb-2">차단 해제 — Redis 차단 삭제, is_active 복구, banned_until 초기화</p>
                                        <button
                                          disabled={isUnblockBusy}
                                          onClick={() => void handleUnblockUser(chat.senderId, chat.id)}
                                          className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
                                        >
                                          {isUnblockBusy ? '처리 중...' : '채팅 차단 해제'}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                      {paginated.length === 0 && !logLoading && (
                        <tr>
                          <td colSpan={11} className="px-4 py-10 text-center text-sm text-gray-400">탐지된 메시지가 없습니다.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination total={filtered.length} page={page} pageSize={20} onChange={(p) => setPage(p)} />
                <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">
                  오탐지로 표시하면 해당 메시지는 통계에서 false_positive로 집계됩니다.
                </div>
              </section>
            </div>
          )}

          {/* ── IP 벤 탭 ── */}
          {mainTab === 'IP 벤' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">채팅 IP 벤 목록</h2>
                  <p className="text-xs text-gray-400 mt-0.5">욕설 감지로 IP 차단된 목록입니다. 해제 시 해당 IP로 다시 로그인 가능합니다.</p>
                </div>
                <button onClick={loadChatBans} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">
                  새로고침
                </button>
              </div>
              <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {chatBansLoading ? (
                  <div className="px-5 py-10 text-center text-sm text-gray-400">불러오는 중...</div>
                ) : chatBans.length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-gray-400">채팅 IP 벤 목록이 없습니다.</div>
                ) : (
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        {['IP 주소', '남은 시간', '해제'].map((h) => (
                          <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chatBans.map((ban) => (
                        <tr key={ban.ip} className="border-b border-gray-100 hover:bg-gray-50/70">
                          <td className="px-5 py-3.5 font-mono text-sm text-gray-800">{ban.ip}</td>
                          <td className="px-5 py-3.5 text-sm text-gray-500">
                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                              ban.ttl < 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              {formatTtl(ban.ttl)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <button
                              disabled={unbanBusy === ban.ip}
                              onClick={() => void handleUnbanIp(ban.ip)}
                              className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40"
                            >
                              {unbanBusy === ban.ip ? '처리 중...' : '벤 해제'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
