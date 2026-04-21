import { useEffect, useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import {
  fetchAdminFlaggedChats,
  fetchAdminModerationStats,
  getAdminErrorMessage,
  updateAdminChatModerationStatus,
  type AdminChatFlagged,
  type AdminModerationStat,
} from '../../apis/admin';

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

const FILTER_TABS = ['전체', '차단', '경고', '오탐지', '검토 중'];
const TAB_TO_STATUS: Record<string, string> = {
  차단: 'blocked',
  경고: 'warned',
  오탐지: 'false_positive',
  '검토 중': 'pending',
};

function StatCard({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'red' | 'amber' | 'slate';
}) {
  const toneClass =
    tone === 'red'
      ? 'border-red-100 bg-red-50'
      : tone === 'amber'
        ? 'border-amber-100 bg-amber-50'
        : tone === 'slate'
          ? 'border-slate-200 bg-slate-50'
          : 'border-gray-200 bg-white';
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneClass}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export default function AdminModeration() {
  const [activeTab, setActiveTab] = useState('전체');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [chats, setChats] = useState<AdminChatFlagged[]>([]);
  const [stats, setStats] = useState<AdminModerationStat | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadChats = async (params?: {
    moderation_status?: string;
    date_from?: string;
    date_to?: string;
    keyword?: string;
  }) => {
    try {
      setLoading(true);
      setError('');
      setChats(await fetchAdminFlaggedChats(params));
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async (params?: { date_from?: string; date_to?: string }) => {
    try {
      setStatsLoading(true);
      setStats(await fetchAdminModerationStats(params));
    } catch {
      // 통계 오류는 조용히 처리
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    void loadChats();
    void loadStats();
  }, []);

  const handleSearch = () => {
    const statusParam = TAB_TO_STATUS[activeTab];
    void loadChats({
      moderation_status: statusParam,
      keyword: search || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
    void loadStats({ date_from: dateFrom || undefined, date_to: dateTo || undefined });
  };

  const handleReset = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setActiveTab('전체');
    void loadChats();
    void loadStats();
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const statusParam = TAB_TO_STATUS[tab];
    void loadChats({
      moderation_status: statusParam,
      keyword: search || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
  };

  const handleStatusUpdate = async (
    chatId: string,
    status: 'blocked' | 'warned' | 'false_positive' | 'pending',
  ) => {
    try {
      setBusyId(chatId);
      await updateAdminChatModerationStatus(chatId, status);
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, moderationStatus: status } : c)),
      );
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setBusyId(null);
    }
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

  return (
    <>
      <AdminHeader
        placeholder="메시지 / 닉네임 / 파티명 검색..."
        onSearch={setSearch}
        rightContent={
          <span className="rounded-md border border-violet-200 bg-violet-50 px-3.5 py-1.5 text-sm font-semibold text-violet-700">
            채팅 AI 탐지 로그
          </span>
        }
      />
      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section>
            <h1 className="text-2xl font-bold text-gray-900">채팅 모더레이션</h1>
            <p className="mt-1 text-sm text-gray-500">
              Ollama LLM이 탐지한 부적절 메시지 로그 · 오탐지 수정 · 탐지율 통계
            </p>
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="총 탐지"
              value={statsLoading ? '-' : `${stats?.totalFlagged ?? 0}건`}
              sub={`탐지율 ${stats?.detectionRate ?? 0}%`}
            />
            <StatCard
              label="차단됨"
              value={statsLoading ? '-' : `${stats?.blocked ?? 0}건`}
              tone="red"
            />
            <StatCard
              label="경고 처리"
              value={statsLoading ? '-' : `${stats?.warned ?? 0}건`}
              tone="amber"
            />
            <StatCard
              label="오탐지"
              value={statsLoading ? '-' : `${stats?.falsePositive ?? 0}건`}
              tone="slate"
            />
            <StatCard
              label="검토 중"
              value={statsLoading ? '-' : `${stats?.pending ?? 0}건`}
            />
          </div>

          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">키워드</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="메시지 / 닉네임 / 파티명"
                  className="w-56 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-violet-400"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">시작일</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-violet-400"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">종료일</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-violet-400"
                />
              </label>
              <div className="flex gap-2 pb-0.5">
                <button
                  onClick={handleSearch}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                >
                  조회
                </button>
                <button
                  onClick={handleReset}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  초기화
                </button>
              </div>
            </div>
          </section>

          <FilterTabs tabs={FILTER_TABS} activeTab={activeTab} onTabChange={handleTabChange} />

          {loading && (
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500 shadow-sm">
              탐지 로그를 불러오는 중입니다.
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 shadow-sm">
              {error}
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">상태</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">파티</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">발신자</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500 max-w-xs">메시지</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">탐지 사유</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">신뢰도</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">삭제</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">발생일</th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((chat) => {
                    const isExpanded = expandedId === chat.id;
                    const isBusy = busyId === chat.id;
                    const statusKey = chat.moderationStatus ?? 'pending';

                    return (
                      <>
                        <tr key={chat.id} className="border-b border-gray-100 transition hover:bg-gray-50">
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[statusKey] ?? STATUS_STYLE.pending}`}>
                              {STATUS_LABEL[statusKey] ?? statusKey}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-700">{chat.partyTitle}</td>
                          <td className="px-4 py-3.5 text-sm text-gray-700">{chat.senderNickname}</td>
                          <td className="px-4 py-3.5 max-w-xs">
                            <span
                              className={`block truncate text-sm ${chat.isDeleted ? 'line-through text-gray-400' : 'text-gray-800'}`}
                              title={chat.message}
                            >
                              {chat.message}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-500">{chat.flagReason ?? '-'}</td>
                          <td className="px-4 py-3.5 text-sm text-gray-500">
                            {chat.flagConfidence != null ? `${(chat.flagConfidence * 100).toFixed(0)}%` : '-'}
                          </td>
                          <td className="px-4 py-3.5 text-sm">
                            {chat.isDeleted
                              ? <span className="text-xs text-gray-400">삭제됨</span>
                              : <span className="text-xs text-emerald-500">유지</span>}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">{chat.createdAt}</td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                className={`rounded-md border px-3 py-1 text-xs font-medium transition ${
                                  isExpanded
                                    ? 'border-violet-300 bg-violet-50 text-violet-600'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                                onClick={() => setExpandedId((prev) => (prev === chat.id ? null : chat.id))}
                              >
                                {isExpanded ? '닫기' : '상세'}
                              </button>
                              {statusKey !== 'false_positive' && (
                                <button
                                  className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 transition disabled:opacity-40"
                                  disabled={isBusy}
                                  onClick={() => void handleStatusUpdate(chat.id, 'false_positive')}
                                >
                                  {isBusy ? '처리 중...' : '오탐지'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr key={`${chat.id}-detail`} className="border-b border-gray-100 bg-slate-50/70">
                            <td colSpan={9} className="px-4 py-4">
                              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                  <div>
                                    <h3 className="text-base font-semibold text-slate-900">탐지 상세</h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                      AI 탐지 결과를 확인하고 상태를 수동으로 수정할 수 있습니다.
                                    </p>
                                  </div>
                                  <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[statusKey] ?? STATUS_STYLE.pending}`}>
                                    {STATUS_LABEL[statusKey] ?? statusKey}
                                  </span>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                  {([
                                    ['파티', chat.partyTitle],
                                    ['발신자', chat.senderNickname],
                                    ['탐지 사유', chat.flagReason ?? '-'],
                                    ['신뢰도', chat.flagConfidence != null ? `${(chat.flagConfidence * 100).toFixed(1)}%` : '-'],
                                    ['삭제 여부', chat.isDeleted ? '삭제됨' : '유지'],
                                    ['발생일', chat.createdAt],
                                  ] as [string, string][]).map(([label, value]) => (
                                    <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                      <div className="text-xs font-medium text-slate-400">{label}</div>
                                      <div className="mt-1 break-all text-sm font-semibold text-slate-800">{value}</div>
                                    </div>
                                  ))}
                                </div>

                                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                  <div className="text-xs font-medium text-slate-400 mb-1">원본 메시지</div>
                                  <p className={`text-sm break-all ${chat.isDeleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                    {chat.message}
                                  </p>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2 items-center">
                                  <span className="text-sm font-medium text-slate-700">상태 변경:</span>
                                  {(['blocked', 'warned', 'false_positive', 'pending'] as const).map((s) => (
                                    <button
                                      key={s}
                                      disabled={isBusy || statusKey === s}
                                      onClick={() => void handleStatusUpdate(chat.id, s)}
                                      className={`rounded-full border px-3 py-1 text-xs font-semibold transition disabled:opacity-40 ${
                                        statusKey === s
                                          ? (STATUS_STYLE[s] ?? '')
                                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                      }`}
                                    >
                                      {STATUS_LABEL[s]}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                  {filtered.length === 0 && !loading && (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">
                        탐지된 메시지가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">
              오탐지로 표시하면 해당 메시지는 통계에서 false_positive로 집계됩니다.
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
