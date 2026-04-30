import { Fragment, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import Pagination from './components/Pagination';

import type {
  AdminOperationLog,
  AdminUserDetail,
  AdminUserRecord,
  AdminUserStatus,
} from '../../types/admin/adminUser';

import {
  fetchAdminOperationLogs,
  fetchAdminUserDetail,
  fetchAdminUsers,
  getAdminUserErrorMessage,
  updateAdminUserRecommender,
  updateAdminUserStatus,
  updateAdminUserTrustScore,
} from '../../apis/admin/adminUser';

const STATUS_STYLE: Record<string, string> = {
  정상: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  주의: 'bg-amber-50 text-amber-600 border-amber-100',
  정지: 'bg-red-50 text-red-600 border-red-100',
};

const FILTER_TABS = ['전체', '정상', '주의', '정지'];
const DETAIL_TABS = ['요약', '수정', '이력'] as const;

type DetailTab = (typeof DETAIL_TABS)[number];

type RecommenderUserDetail = AdminUserDetail & {
  referrerId?: string | null;
  referrerName?: string | null;
  referrerNickname?: string | null;
  referrerCount?: number;
};

type OperationDraft = {
  status: AdminUserRecord['status'];
  statusReason: string;
  trustScore: string;
  trustReason: string;
  referrerNickname: string;
  recommenderReason: string;
};

const OPERATION_LOG_TITLE: Record<AdminOperationLog['type'], string> = {
  STATUS_CHANGE: '상태 변경',
  SANCTION: '제재 처리',
  REPORT_RECEIVED: '신고 당함',
  REPORT_CREATED: '신고함',
  TRUST_SCORE_CHANGE: '신뢰도 변경',
  RECOMMENDER_CHANGE: '추천인 변경',
};

const OPERATION_LOG_STYLE: Record<AdminOperationLog['type'], string> = {
  STATUS_CHANGE: 'bg-blue-50 text-blue-600 border-blue-100',
  SANCTION: 'bg-red-50 text-red-600 border-red-100',
  REPORT_RECEIVED: 'bg-amber-50 text-amber-600 border-amber-100',
  REPORT_CREATED: 'bg-slate-50 text-slate-600 border-slate-200',
  TRUST_SCORE_CHANGE: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  RECOMMENDER_CHANGE: 'bg-violet-50 text-violet-600 border-violet-100',
};

function getTrustTone(score: number) {
  if (score >= 70) return 'bg-blue-500';
  if (score >= 36.5) return 'bg-emerald-500';
  if (score >= 35) return 'bg-amber-500';
  return 'bg-red-500';
}

function formatAdminDateTime(value?: string | null) {
  if (!value) return '-';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString('ko-KR', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getRecommenderText(detail?: RecommenderUserDetail | null) {
  if (!detail) return '-';

  return (
    detail.referrerName?.trim() ||
    detail.referrerNickname?.trim() ||
    detail.referrerId ||
    '-'
  );
}

function toAdminUserStatus(
  status?: string | null,
  fallback: AdminUserStatus = '정상',
): AdminUserStatus {
  if (status === '정상' || status === '주의' || status === '정지') {
    return status;
  }

  return fallback;
}

function TrustBar({ score }: { score: number }) {
  return (
    <div className="min-w-[120px]">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
        <span>신뢰도</span>
        <span className="font-semibold text-gray-700">{score.toFixed(1)}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full ${getTrustTone(score)}`}
          style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

function OperationLogCard({ log }: { log: AdminOperationLog }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
              OPERATION_LOG_STYLE[log.type]
            }`}
          >
            {OPERATION_LOG_TITLE[log.type]}
          </span>
          <span className="text-xs text-slate-400">
            {formatAdminDateTime(log.createdAt)}
          </span>
        </div>

        {log.adminId && (
          <span className="text-xs text-slate-400">관리자: {log.adminId}</span>
        )}
      </div>

      <p className="mt-3 text-sm text-slate-700">
        {log.reason || log.reportReason || '사유 없음'}
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
        {log.beforeStatus && (
          <span className="rounded-full bg-white px-2.5 py-1">
            이전 상태: {log.beforeStatus}
          </span>
        )}

        {log.afterStatus && (
          <span className="rounded-full bg-white px-2.5 py-1">
            변경 상태: {log.afterStatus}
          </span>
        )}

        {log.sanctionType && (
          <span className="rounded-full bg-white px-2.5 py-1">
            제재 유형: {log.sanctionType}
          </span>
        )}

        {log.sanctionDurationDays !== undefined &&
          log.sanctionDurationDays !== null && (
            <span className="rounded-full bg-white px-2.5 py-1">
              제재 기간: {log.sanctionDurationDays}일
            </span>
          )}

        {log.beforeTrustScore !== undefined && (
          <span className="rounded-full bg-white px-2.5 py-1">
            이전 신뢰도: {log.beforeTrustScore}
          </span>
        )}

        {log.afterTrustScore !== undefined && (
          <span className="rounded-full bg-white px-2.5 py-1">
            변경 후 신뢰도: {log.afterTrustScore}
          </span>
        )}

        {log.reportReason && (
          <span className="rounded-full bg-white px-2.5 py-1">
            신고 사유: {log.reportReason}
          </span>
        )}

        {log.reportId && (
          <span className="rounded-full bg-white px-2.5 py-1">
            신고 ID: {log.reportId}
          </span>
        )}
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const currentUserId = useAuthStore((state) => state.user?.user_id);

  const [activeTab, setActiveTab] = useState('전체');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [userDetails, setUserDetails] = useState<
    Record<string, RecommenderUserDetail>
  >({});
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<Record<string, DetailTab>>({});
  const [draftMap, setDraftMap] = useState<Record<string, OperationDraft>>({});

  const [operationLogsMap, setOperationLogsMap] = useState<
    Record<string, AdminOperationLog[]>
  >({});
  const [operationLogsLoading, setOperationLogsLoading] = useState<
    string | null
  >(null);

  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [page, setPage] = useState(1);

  const buildUserParams = (status?: string) => ({
    keyword: search || undefined,
    status: status && status !== '전체' ? status : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const makeDraft = (
    user: AdminUserRecord,
    detail?: RecommenderUserDetail,
  ): OperationDraft => ({
    status: toAdminUserStatus(detail?.status, user.status),
    statusReason: '',
    trustScore: (detail?.trustScore ?? user.trustScore).toFixed(1),
    trustReason: '',
    referrerNickname: detail?.referrerNickname ?? '',
    recommenderReason: '',
  });

  const clearOperationLogsCache = (userId: string) => {
    setOperationLogsMap((prev) => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  };

  const reloadUsers = async (status = activeTab) => {
    setLoading(true);
    setError('');

    try {
      setUsers(await fetchAdminUsers(buildUserParams(status)));
    } catch (err) {
      setError(getAdminUserErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;

    const loadUsers = async () => {
      try {
        setLoading(true);
        setError('');

        const nextUsers = await fetchAdminUsers();

        if (alive) setUsers(nextUsers);
      } catch (err) {
        if (alive) setError(getAdminUserErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    };

    void loadUsers();

    const timer = setInterval(() => void loadUsers(), 60_000);

    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const handleSearch = async (status = activeTab) => {
    setPage(1);
    await reloadUsers(status);
  };

  const handleReset = async () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setActiveTab('전체');
    setPage(1);

    setLoading(true);
    setError('');

    try {
      setUsers(await fetchAdminUsers());
    } catch (err) {
      setError(getAdminUserErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadOperationLogs = async (userId: string) => {
    if (operationLogsMap[userId]) return;

    try {
      setOperationLogsLoading(userId);

      const response = await fetchAdminOperationLogs(userId);

      setOperationLogsMap((prev) => ({
        ...prev,
        [userId]: response.logs,
      }));
    } catch (err) {
      setDetailError(getAdminUserErrorMessage(err));
    } finally {
      setOperationLogsLoading(null);
    }
  };

  const openDetail = async (user: AdminUserRecord, nextTab?: DetailTab) => {
    if (expandedUserId === user.id && !nextTab) {
      setExpandedUserId(null);
      setDetailError('');
      return;
    }

    const targetTab = nextTab ?? detailTab[user.id] ?? '요약';

    setExpandedUserId(user.id);
    setDetailError('');

    setDetailTab((prev) => ({
      ...prev,
      [user.id]: targetTab,
    }));

    setDraftMap((prev) => ({
      ...prev,
      [user.id]: prev[user.id] ?? makeDraft(user, userDetails[user.id]),
    }));

    if (!userDetails[user.id]) {
      try {
        setDetailLoadingId(user.id);

        const detail = (await fetchAdminUserDetail(
          user.id,
        )) as RecommenderUserDetail;

        setUserDetails((prev) => ({ ...prev, [user.id]: detail }));

        setDraftMap((prev) => ({
          ...prev,
          [user.id]: makeDraft(user, detail),
        }));
      } catch (err) {
        setDetailError(getAdminUserErrorMessage(err));
      } finally {
        setDetailLoadingId(null);
      }
    }

    if (targetTab === '이력') {
      await loadOperationLogs(user.id);
    }
  };

  const changeDetailTab = async (userId: string, tab: DetailTab) => {
    setDetailTab((prev) => ({ ...prev, [userId]: tab }));

    if (tab === '이력') {
      await loadOperationLogs(userId);
    }
  };

  const updateDraft = (userId: string, patch: Partial<OperationDraft>) => {
    setDraftMap((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], ...patch },
    }));
  };

  const saveStatus = async (user: AdminUserRecord) => {
    const draft = draftMap[user.id];

    if (!draft) return;

    if (currentUserId === user.id && draft.status === '정지') {
      setDetailError('현재 로그인한 관리자 본인 계정은 정지할 수 없습니다.');
      return;
    }

    try {
      setBusyUserId(user.id);

      await updateAdminUserStatus(user.id, {
        status: draft.status,
        reason: draft.statusReason.trim() || undefined,
      });

      const detail = (await fetchAdminUserDetail(
        user.id,
      )) as RecommenderUserDetail;

      setUserDetails((prev) => ({ ...prev, [user.id]: detail }));
      setDraftMap((prev) => ({ ...prev, [user.id]: makeDraft(user, detail) }));
      clearOperationLogsCache(user.id);

      await reloadUsers();
    } catch (err) {
      setDetailError(getAdminUserErrorMessage(err));
    } finally {
      setBusyUserId(null);
    }
  };

  const saveTrustScore = async (user: AdminUserRecord) => {
    const draft = draftMap[user.id];

    if (!draft) return;

    const parsed = Number(draft.trustScore);

    if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
      setDetailError('신뢰도는 0점 이상 100점 이하 숫자로 입력해야 합니다.');
      return;
    }

    try {
      setBusyUserId(user.id);

      const detail = (await updateAdminUserTrustScore(user.id, {
        trustScore: parsed,
        reason: draft.trustReason.trim() || undefined,
      })) as RecommenderUserDetail;

      setUserDetails((prev) => ({ ...prev, [user.id]: detail }));
      setDraftMap((prev) => ({ ...prev, [user.id]: makeDraft(user, detail) }));
      clearOperationLogsCache(user.id);

      await reloadUsers();
    } catch (err) {
      setDetailError(getAdminUserErrorMessage(err));
    } finally {
      setBusyUserId(null);
    }
  };

  const saveRecommender = async (user: AdminUserRecord) => {
    const draft = draftMap[user.id];

    if (!draft) return;

    try {
      setBusyUserId(user.id);

      const detail = (await updateAdminUserRecommender(user.id, {
        referrerNickname: draft.referrerNickname.trim() || null,
        reason: draft.recommenderReason.trim() || undefined,
      })) as RecommenderUserDetail;

      setUserDetails((prev) => ({ ...prev, [user.id]: detail }));
      setDraftMap((prev) => ({ ...prev, [user.id]: makeDraft(user, detail) }));
      clearOperationLogsCache(user.id);

      await reloadUsers();
    } catch (err) {
      setDetailError(getAdminUserErrorMessage(err));
    } finally {
      setBusyUserId(null);
    }
  };

  const filtered = useMemo(() => users, [users]);
  const paginated = filtered.slice((page - 1) * 20, page * 20);

  const summary = useMemo(
    () => [
      { label: '전체 사용자', value: `${users.length}` },
      {
        label: '정상',
        value: `${users.filter((user) => user.status === '정상').length}`,
      },
      {
        label: '정지',
        value: `${users.filter((user) => user.status === '정지').length}`,
      },
      {
        label: '신뢰도 주의',
        value: `${users.filter((user) => user.trustScore < 36.5).length}`,
      },
    ],
    [users],
  );

  return (
    <>
      <AdminHeader
        placeholder="사용자 검색 (이름/닉네임/상태)..."
        onSearch={setSearch}
      />

      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section>
            <h1 className="text-2xl font-bold text-gray-900">사용자관리</h1>
            <p className="mt-1 text-sm text-gray-500">
              사용자 상태, 신뢰도, 추천인, 운영 이력을 한 화면에서 관리합니다.
            </p>
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summary.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <FilterTabs
            tabs={FILTER_TABS}
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              void handleSearch(tab);
            }}
          />

          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">
                  키워드
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="사용자 ID / 이름 / 닉네임"
                  className="w-56 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">
                  시작일
                </span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">
                  종료일
                </span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                />
              </label>

              <div className="flex gap-2 pb-0.5">
                <button
                  type="button"
                  onClick={() => void handleSearch()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  조회
                </button>

                <button
                  type="button"
                  onClick={() => void handleReset()}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  초기화
                </button>
              </div>
            </div>
          </section>

          {loading && (
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500 shadow-sm">
              사용자 목록을 불러오는 중입니다.
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
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      생성 시각
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      사용자
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      상태
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      신고
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      참여
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      신뢰도
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      최근 활동
                    </th>
                    <th className="w-[100px] px-4 py-3 text-right text-xs font-semibold text-gray-500">
                      관리
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginated.map((user) => {
                    const isExpanded = expandedUserId === user.id;
                    const detail = userDetails[user.id];
                    const draft = draftMap[user.id] ?? makeDraft(user, detail);
                    const isDetailLoading = detailLoadingId === user.id;
                    const isCurrentAdmin = currentUserId === user.id;
                    const trustScoreNumber = Number(draft.trustScore);
                    const trustPreview = Number.isNaN(trustScoreNumber)
                      ? 0
                      : Math.min(Math.max(trustScoreNumber, 0), 100);
                    const activeDetailTab = detailTab[user.id] ?? '요약';
                    const primaryLabel = user.name?.trim() || user.nickname;
                    const secondaryLabel =
                      user.name && user.name !== user.nickname
                        ? user.nickname
                        : '';

                    return (
                      <Fragment key={user.id}>
                        <tr className="border-b border-gray-100 transition hover:bg-gray-50">
                          <td className="whitespace-nowrap px-4 py-3.5 text-sm text-gray-500">
                            {user.createdAt}
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="text-sm font-medium text-gray-900">
                              {primaryLabel}
                            </div>
                            {secondaryLabel && (
                              <div className="text-xs text-gray-400">
                                {secondaryLabel}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-sm">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[user.status]}`}
                            >
                              {user.status}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            {user.reportCount}건
                          </td>

                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            {user.partyCount}개
                          </td>

                          <td className="px-4 py-3.5">
                            <TrustBar score={user.trustScore} />
                          </td>

                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            {user.lastActive}
                          </td>

                          <td className="w-[100px] px-4 py-3.5 text-right text-sm">
                            <button
                              type="button"
                              aria-expanded={isExpanded}
                              onClick={() => void openDetail(user)}
                              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                                isExpanded
                                  ? 'border-slate-300 bg-slate-100 text-slate-700'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600'
                              }`}
                            >
                              <span>{isExpanded ? '접기' : '관리'}</span>

                              <svg
                                className={`h-3 w-3 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="border-b border-gray-100 bg-slate-50/70">
                            <td colSpan={8} className="px-4 py-4">
                              {isDetailLoading && (
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-500 shadow-sm">
                                  사용자 상세 정보를 불러오는 중입니다.
                                </div>
                              )}

                              {!isDetailLoading && detailError && (
                                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-600 shadow-sm">
                                  {detailError}
                                </div>
                              )}

                              {!isDetailLoading && detail && (
                                <div className="space-y-4">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex gap-2">
                                      {DETAIL_TABS.map((tab) => (
                                        <button
                                          key={tab}
                                          type="button"
                                          onClick={() =>
                                            void changeDetailTab(user.id, tab)
                                          }
                                          className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                                            activeDetailTab === tab
                                              ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                                              : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                          }`}
                                        >
                                          {tab}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {activeDetailTab === '요약' && (
                                    <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
                                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="flex items-start justify-between gap-4">
                                          <div>
                                            <h3 className="text-base font-semibold text-slate-900">
                                              {detail.name?.trim() ||
                                                detail.nickname}
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-500">
                                              운영 판단에 필요한 핵심 사용자
                                              정보입니다.
                                            </p>
                                          </div>

                                          <span
                                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                              STATUS_STYLE[detail.status] ??
                                              STATUS_STYLE[user.status]
                                            }`}
                                          >
                                            {detail.status}
                                          </span>
                                        </div>

                                        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                          {[
                                            ['사용자 ID', detail.id],
                                            ['이메일', detail.email],
                                            ['닉네임', detail.nickname],
                                            ['이름', detail.name || '-'],
                                            ['전화번호', detail.phone || '-'],
                                            ['권한', detail.role],
                                            [
                                              '신뢰도',
                                              detail.trustScore.toFixed(1),
                                            ],
                                            [
                                              '추천인',
                                              getRecommenderText(detail),
                                            ],
                                            [
                                              '신고 수',
                                              `${detail.reportCount}건`,
                                            ],
                                            [
                                              '참여 파티',
                                              `${detail.partyCount}개`,
                                            ],
                                            ['가입일', detail.createdAt || '-'],
                                            [
                                              '최근 활동',
                                              detail.lastActive || '-',
                                            ],
                                          ].map(([label, value]) => (
                                            <div
                                              key={label}
                                              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                                            >
                                              <div className="text-xs font-medium text-slate-400">
                                                {label}
                                              </div>
                                              <div className="mt-1 break-all text-sm font-semibold text-slate-800">
                                                {value}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <h4 className="text-sm font-semibold text-slate-900">
                                          최근 접속 정보
                                        </h4>

                                        <div className="mt-4 space-y-3">
                                          {[
                                            [
                                              '최근 로그인 시각',
                                              detail.recentLoginAt || '-',
                                            ],
                                            [
                                              '최근 접속 IP',
                                              detail.recentLoginIp || '-',
                                            ],
                                            [
                                              '최근 브라우저',
                                              detail.recentLoginUserAgent ||
                                                '-',
                                            ],
                                            [
                                              '정지 만료',
                                              detail.bannedUntil || '-',
                                            ],
                                          ].map(([label, value]) => (
                                            <div
                                              key={label}
                                              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                                            >
                                              <div className="text-xs font-medium text-slate-400">
                                                {label}
                                              </div>
                                              <div className="mt-1 break-all text-sm text-slate-700">
                                                {value}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {activeDetailTab === '수정' && (
                                    <div className="grid gap-4 xl:grid-cols-3">
                                      <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                                        <h3 className="text-base font-semibold text-slate-900">
                                          상태 변경
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                          정상·주의·정지 상태를 변경합니다.
                                        </p>

                                        <div className="mt-4 flex flex-wrap gap-2">
                                          {(
                                            ['정상', '주의', '정지'] as const
                                          ).map((status) => (
                                            <button
                                              key={status}
                                              type="button"
                                              onClick={() =>
                                                updateDraft(user.id, {
                                                  status,
                                                })
                                              }
                                              disabled={
                                                isCurrentAdmin &&
                                                status === '정지'
                                              }
                                              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                                draft.status === status
                                                  ? STATUS_STYLE[status]
                                                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                              } ${
                                                isCurrentAdmin &&
                                                status === '정지'
                                                  ? 'cursor-not-allowed opacity-40'
                                                  : ''
                                              }`}
                                            >
                                              {status}
                                            </button>
                                          ))}
                                        </div>

                                        {isCurrentAdmin && (
                                          <p className="mt-3 text-xs text-slate-500">
                                            현재 로그인한 관리자 본인 계정은
                                            정지할 수 없습니다.
                                          </p>
                                        )}

                                        <textarea
                                          value={draft.statusReason}
                                          onChange={(event) =>
                                            updateDraft(user.id, {
                                              statusReason: event.target.value,
                                            })
                                          }
                                          rows={4}
                                          placeholder="상태 변경 사유"
                                          className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                                        />

                                        <button
                                          type="button"
                                          disabled={busyUserId === user.id}
                                          onClick={() => void saveStatus(user)}
                                          className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                                        >
                                          {busyUserId === user.id
                                            ? '저장 중...'
                                            : '상태 저장'}
                                        </button>
                                      </div>

                                      <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                                        <h3 className="text-base font-semibold text-slate-900">
                                          신뢰도 변경
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                          0~100점 범위에서 직접 보정합니다.
                                        </p>

                                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                                          <div className="flex justify-between text-xs text-slate-500">
                                            <span>미리보기</span>
                                            <span className="font-semibold text-slate-700">
                                              {trustPreview.toFixed(1)}
                                            </span>
                                          </div>

                                          <div className="mt-3 h-3 rounded-full bg-white">
                                            <div
                                              className={`h-3 rounded-full ${getTrustTone(
                                                trustPreview,
                                              )}`}
                                              style={{
                                                width: `${trustPreview}%`,
                                              }}
                                            />
                                          </div>
                                        </div>

                                        <input
                                          type="range"
                                          min="0"
                                          max="100"
                                          step="0.1"
                                          value={trustPreview}
                                          onChange={(event) =>
                                            updateDraft(user.id, {
                                              trustScore: event.target.value,
                                            })
                                          }
                                          className="mt-4 w-full accent-emerald-500"
                                        />

                                        <input
                                          type="number"
                                          min="0"
                                          max="100"
                                          step="0.1"
                                          value={draft.trustScore}
                                          onChange={(event) =>
                                            updateDraft(user.id, {
                                              trustScore: event.target.value,
                                            })
                                          }
                                          className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
                                        />

                                        <textarea
                                          value={draft.trustReason}
                                          onChange={(event) =>
                                            updateDraft(user.id, {
                                              trustReason: event.target.value,
                                            })
                                          }
                                          rows={3}
                                          placeholder="신뢰도 변경 사유"
                                          className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
                                        />

                                        <button
                                          type="button"
                                          disabled={busyUserId === user.id}
                                          onClick={() =>
                                            void saveTrustScore(user)
                                          }
                                          className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                          {busyUserId === user.id
                                            ? '저장 중...'
                                            : '신뢰도 저장'}
                                        </button>
                                      </div>

                                      <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
                                        <h3 className="text-base font-semibold text-slate-900">
                                          추천인 변경
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                          오입력된 추천인 닉네임을 수정하거나
                                          비울 수 있습니다.
                                        </p>

                                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                          <div className="text-xs font-medium text-slate-400">
                                            현재 추천인
                                          </div>
                                          <div className="mt-1 break-all text-sm font-semibold text-slate-800">
                                            {getRecommenderText(detail)}
                                          </div>
                                        </div>

                                        <label className="mt-4 block">
                                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                            추천인 닉네임
                                          </span>

                                          <input
                                            type="text"
                                            value={draft.referrerNickname}
                                            onChange={(event) =>
                                              updateDraft(user.id, {
                                                referrerNickname:
                                                  event.target.value,
                                              })
                                            }
                                            placeholder="비우면 추천인 해제"
                                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                          />
                                        </label>

                                        <textarea
                                          value={draft.recommenderReason}
                                          onChange={(event) =>
                                            updateDraft(user.id, {
                                              recommenderReason:
                                                event.target.value,
                                            })
                                          }
                                          rows={4}
                                          placeholder="추천인 변경 사유"
                                          className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-400"
                                        />

                                        <button
                                          type="button"
                                          disabled={busyUserId === user.id}
                                          onClick={() =>
                                            void saveRecommender(user)
                                          }
                                          className="mt-3 w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
                                        >
                                          {busyUserId === user.id
                                            ? '저장 중...'
                                            : '추천인 저장'}
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {activeDetailTab === '이력' && (
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                      <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                          <h3 className="text-base font-semibold text-slate-900">
                                            운영 이력
                                          </h3>
                                          <p className="mt-1 text-sm text-slate-500">
                                            상태 변경, 신고, 제재, 신뢰도 변경,
                                            추천인 변경을 시간순으로 확인합니다.
                                          </p>
                                        </div>
                                      </div>

                                      {operationLogsLoading === user.id && (
                                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                                          운영 이력을 불러오는 중입니다...
                                        </div>
                                      )}

                                      {operationLogsLoading !== user.id &&
                                        (operationLogsMap[user.id] ?? [])
                                          .length === 0 && (
                                          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                                            운영 이력이 없습니다.
                                          </div>
                                        )}

                                      <div className="mt-4 space-y-3">
                                        {(operationLogsMap[user.id] ?? []).map(
                                          (log) => (
                                            <OperationLogCard
                                              key={`${log.type}-${log.id}`}
                                              log={log}
                                            />
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}

                  {paginated.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-sm text-gray-400"
                      >
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              total={filtered.length}
              page={page}
              pageSize={20}
              onChange={setPage}
            />

            <div className="px-4 py-3 text-xs text-gray-400">
              목록에서는 공간을 줄이고, 실제 수정 작업은 상세 패널 안에서
              처리합니다.
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
