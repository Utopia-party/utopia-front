import { Fragment, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import Pagination from './components/Pagination';
import {
  fetchAdminUserDetail,
  fetchAdminUserStatusLogs,
  fetchAdminUsers,
  type AdminUserDetail,
  type AdminUserStatusLog,
  getAdminErrorMessage,
  updateAdminUserStatus,
  updateAdminUserTrustScore,
  type AdminUserRecord,
} from '../../apis/admin';

const STATUS_STYLE: Record<string, string> = {
  정상: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  주의: 'bg-amber-50 text-amber-600 border-amber-100',
  정지: 'bg-red-50 text-red-600 border-red-100',
};

const FILTER_TABS = ['전체', '정상', '주의', '정지'];

function TrustBar({ score }: { score: number }) {
  const tone =
    score >= 70
      ? 'bg-blue-500'
      : score >= 36.5
        ? 'bg-emerald-500'
        : score >= 35
          ? 'bg-amber-500'
          : 'bg-red-500';

  return (
    <div className="min-w-[120px]">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
        <span>신뢰도</span>
        <span className="font-semibold text-gray-700">{score.toFixed(1)}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full ${tone}`}
          style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}

function getTrustTone(score: number) {
  if (score >= 70) return 'bg-blue-500';
  if (score >= 36.5) return 'bg-emerald-500';
  if (score >= 35) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function AdminUsers() {
  const currentUserId = useAuthStore((state) => state.user?.user_id);
  const [activeTab, setActiveTab] = useState('전체');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [userDetails, setUserDetails] = useState<
    Record<string, AdminUserDetail>
  >({});
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState('');
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [statusEditorUserId, setStatusEditorUserId] = useState<string | null>(
    null,
  );
  const [statusDraft, setStatusDraft] =
    useState<AdminUserRecord['status']>('주의');
  const [statusReason, setStatusReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [detailTab, setDetailTab] = useState<Record<string, 'info' | 'logs'>>({});
  const [statusLogsMap, setStatusLogsMap] = useState<Record<string, AdminUserStatusLog[]>>({});
  const [statusLogsLoading, setStatusLogsLoading] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const nextUsers = await fetchAdminUsers();
        if (alive) {
          setUsers(nextUsers);
        }
      } catch (err) {
        if (alive) {
          setError(getAdminErrorMessage(err));
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    void loadUsers();
    return () => {
      alive = false;
    };
  }, []);

  const buildUserParams = (status?: string) => ({
    keyword: search || undefined,
    status: status && status !== '전체' ? status : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const reloadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await fetchAdminUsers(buildUserParams(activeTab)));
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (status = activeTab) => {
    setLoading(true);
    setError('');
    try {
      setUsers(await fetchAdminUsers(buildUserParams(status)));
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setActiveTab('전체');
    setLoading(true);
    setError('');
    try {
      setUsers(await fetchAdminUsers());
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      setDetailError('');
      return;
    }

    setExpandedUserId(userId);
    setDetailError('');

    if (userDetails[userId]) {
      return;
    }

    try {
      setDetailLoadingId(userId);
      const detail = await fetchAdminUserDetail(userId);
      setUserDetails((prev) => ({ ...prev, [userId]: detail }));
    } catch (err) {
      setDetailError(getAdminErrorMessage(err));
    } finally {
      setDetailLoadingId(null);
    }
  };

  const openStatusEditor = async (
    user: AdminUserRecord,
    forcedStatus?: AdminUserRecord['status'],
  ) => {
    setExpandedUserId(user.id);
    setDetailError('');
    setStatusEditorUserId(user.id);
    setStatusDraft(forcedStatus ?? user.status);
    setStatusReason('');

    if (!userDetails[user.id]) {
      try {
        setDetailLoadingId(user.id);
        const detail = await fetchAdminUserDetail(user.id);
        setUserDetails((prev) => ({ ...prev, [user.id]: detail }));
      } catch (err) {
        setDetailError(getAdminErrorMessage(err));
      } finally {
        setDetailLoadingId(null);
      }
    }
  };

  const submitStatusUpdate = async () => {
    if (!statusEditorUserId) {
      return;
    }

    try {
      setBusyUserId(statusEditorUserId);
      await updateAdminUserStatus(statusEditorUserId, {
        status: statusDraft,
        reason: statusReason.trim() || undefined,
      });
      await reloadUsers();
      setStatusEditorUserId(null);
      setStatusReason('');
    } catch (err) {
      setDetailError(getAdminErrorMessage(err));
    } finally {
      setBusyUserId(null);
    }
  };

  const openTrustEditor = async (user: AdminUserRecord) => {
    setExpandedUserId(user.id);
    setDetailError('');
    setTrustEditorUserId(user.id);
    setTrustScoreDraft(user.trustScore.toFixed(1));
    setTrustReason('');

    if (!userDetails[user.id]) {
      try {
        setDetailLoadingId(user.id);
        const detail = await fetchAdminUserDetail(user.id);
        setUserDetails((prev) => ({ ...prev, [user.id]: detail }));
        setTrustScoreDraft(detail.trustScore.toFixed(1));
      } catch (err) {
        setDetailError(getAdminErrorMessage(err));
      } finally {
        setDetailLoadingId(null);
      }
    }
  };

  const submitTrustScoreUpdate = async () => {
    if (!trustEditorUserId) return;

    const parsed = Number(trustScoreDraft);
    if (Number.isNaN(parsed)) {
      setDetailError('신뢰도는 숫자로 입력해야 합니다.');
      return;
    }
    if (parsed < 0 || parsed > 100) {
      setDetailError('신뢰도는 0점 이상 100점 이하로만 설정할 수 있습니다.');
      return;
    }

    try {
      setBusyUserId(trustEditorUserId);
      const nextDetail = await updateAdminUserTrustScore(trustEditorUserId, {
        trustScore: parsed,
        reason: trustReason.trim() || undefined,
      });
      setUserDetails((prev) => ({ ...prev, [trustEditorUserId]: nextDetail }));
      await reloadUsers();
      setTrustEditorUserId(null);
      setTrustReason('');
    } catch (err) {
      setDetailError(getAdminErrorMessage(err));
    } finally {
      setBusyUserId(null);
    }
  };

  const handleLoadStatusLogs = async (userId: string) => {
    const current = detailTab[userId] ?? 'info';
    const nextTab = current === 'info' ? 'logs' : 'info';
    setDetailTab((prev) => ({ ...prev, [userId]: nextTab }));

    if (nextTab === 'logs' && !statusLogsMap[userId]) {
      try {
        setStatusLogsLoading(userId);
        const logs = await fetchAdminUserStatusLogs(userId);
        setStatusLogsMap((prev) => ({ ...prev, [userId]: logs }));
      } catch {
      } finally {
        setStatusLogsLoading(null);
      }
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

  const trustEditorDetail = trustEditorUserId ? userDetails[trustEditorUserId] : null;
  const trustScoreNumber = Number(trustScoreDraft);
  const trustScorePreview = Number.isNaN(trustScoreNumber) ? 0 : Math.min(Math.max(trustScoreNumber, 0), 100);
  const trustTone = getTrustTone(trustScorePreview);
  const trustScoreError =
    trustScoreDraft.trim() === ''
      ? '신뢰도를 입력해주세요.'
      : Number.isNaN(trustScoreNumber)
        ? '신뢰도는 숫자로 입력해주세요.'
        : trustScoreNumber < 0 || trustScoreNumber > 100
          ? '0점 이상 100점 이하 범위 안에서 입력해주세요.'
          : '';

  return (
    <>
      <AdminHeader
        placeholder="사용자 검색 (이름/닉네임/상태)..."
        onSearch={setSearch}
        rightContent={
          <button
            className="rounded-md border border-gray-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            onClick={() => setIsPolicyOpen((prev) => !prev)}
          >
            {isPolicyOpen ? '정책 닫기' : '신뢰도 정책'}
          </button>
        }
      />
      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section>
            <h1 className="text-2xl font-bold text-gray-900">사용자관리</h1>
            <p className="mt-1 text-sm text-gray-500">
              사용자 상태, 신고 누적 수, 신뢰도를 기준으로 빠르게 대응할 수
              있도록 구성했습니다.
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
              void handleSearch(tab); setPage(1);
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

          {isPolicyOpen && (
            <section className="rounded-2xl border border-blue-100 bg-blue-50/70 px-5 py-4 text-sm text-slate-600 shadow-sm">
              기본 신뢰도는 36.5점입니다. 70.0점 이상은 우수 구간(파란색),
              36.5점 이상 69.9점 이하는 정상 구간(초록색), 35.0점 이상 36.4점
              이하는 경계 구간(주황색), 35.0점 미만은 위험 구간(빨간색)으로
              표시합니다. 신고가 2건 이상 누적되거나 신뢰도가 36.5점 미만이면
              관리자 검토 대상으로 우선 확인합니다.
            </section>
          )}

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
                      사용자
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      상태
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      신고 수
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      참여 파티
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      신뢰도
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      최근 활동
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((user) => {
                    const isExpanded = expandedUserId === user.id;
                    const isEditingStatus = statusEditorUserId === user.id;
                    const detail = userDetails[user.id];
                    const isDetailLoading = detailLoadingId === user.id;
                    const isCurrentAdmin = currentUserId === user.id;
                    const primaryLabel = user.name?.trim() || user.nickname;
                    const secondaryLabel =
                      user.name && user.name !== user.nickname
                        ? user.nickname
                        : '';

                    return (
                      <Fragment key={user.id}>
                        <tr className="border-b border-gray-100 transition hover:bg-gray-50">
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
                          <td className="px-4 py-3.5 text-sm">
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                className={`rounded-md border px-3 py-1 text-xs font-medium transition ${
                                  isExpanded
                                    ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                                onClick={() => void handleViewDetail(user.id)}
                              >
                                {isExpanded ? '닫기' : '상세'}
                              </button>
                              <button
                                className="rounded-md border border-blue-300 px-3 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                                disabled={busyUserId === user.id}
                                onClick={() => void openStatusEditor(user)}
                              >
                                {busyUserId === user.id
                                  ? '처리 중...'
                                  : '상태 변경'}
                              </button>
                              <button
                                className="rounded-md border border-emerald-300 px-3 py-1 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50"
                                disabled={busyUserId === user.id}
                                onClick={() => void openTrustEditor(user)}
                              >
                                신뢰도 변경
                              </button>
                              {!isCurrentAdmin && user.status !== '정지' && (
                                <button
                                  className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50"
                                  disabled={busyUserId === user.id}
                                  onClick={() =>
                                    void openStatusEditor(user, '정지')
                                  }
                                >
                                  강제 정지
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="border-b border-gray-100 bg-slate-50/70">
                            <td colSpan={7} className="px-4 py-4">
                              {isDetailLoading && (
                                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-5 text-sm text-slate-500 shadow-sm">
                                  사용자 상세 정보를 불러오는 중입니다.
                                </div>
                              )}

                              {!isDetailLoading && detailError && !detail && (
                                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-600 shadow-sm">
                                  {detailError}
                                </div>
                              )}

                              {!isDetailLoading && detail && (
                                <div className="space-y-4">
                                  {/* 탭 전환 버튼 */}
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setDetailTab((prev) => ({ ...prev, [user.id]: 'info' }))}
                                      className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                                        (detailTab[user.id] ?? 'info') === 'info'
                                          ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                      }`}
                                    >
                                      기본 정보
                                    </button>
                                    <button
                                      onClick={() => void handleLoadStatusLogs(user.id)}
                                      className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                                        (detailTab[user.id] ?? 'info') === 'logs'
                                          ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                      }`}
                                    >
                                      상태 변경 이력
                                      {(statusLogsMap[user.id] ?? []).length > 0 && (
                                        <span className="ml-1.5 rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] text-indigo-600">
                                          {statusLogsMap[user.id]?.length}
                                        </span>
                                      )}
                                    </button>
                                  </div>

                                  {/* 기본 정보 탭 */}
                                  {(detailTab[user.id] ?? 'info') === 'info' && (
                                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
                                      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                          <div>
                                            <h3 className="text-base font-semibold text-slate-900">
                                              {detail.nickname}
                                            </h3>
                                            <p className="mt-1 text-sm text-slate-500">
                                              사용자 상세 정보와 운영 판단 지표를 한 번에 확인합니다.
                                            </p>
                                          </div>
                                          <span
                                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[detail.status as keyof typeof STATUS_STYLE] ?? STATUS_STYLE[user.status]}`}
                                          >
                                            {detail.status}
                                          </span>
                                        </div>
                                        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                          {[
                                            ['사용자 ID', detail.id],
                                            ['이메일', detail.email],
                                            ['이름', detail.name || '-'],
                                            ['전화번호', detail.phone || '-'],
                                            ['권한', detail.role],
                                            ['신뢰도', `${detail.trustScore.toFixed(1)}`],
                                            ['신고 수', `${detail.reportCount}건`],
                                            ['참여 파티', `${detail.partyCount}개`],
                                            ['가입일', detail.createdAt || '-'],
                                            ['최근 활동', detail.lastActive || '-'],
                                          ].map(([label, value]) => (
                                            <div
                                              key={label}
                                              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                                            >
                                              <div className="text-xs font-medium text-slate-400">{label}</div>
                                              <div className="mt-1 break-all text-sm font-semibold text-slate-800">{value}</div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {isEditingStatus && (
                                        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 shadow-sm">
                                          <h3 className="text-base font-semibold text-slate-900">상태 변경</h3>
                                          <p className="mt-1 text-sm text-slate-500">
                                            팝업 대신 이 패널에서 상태와 사유를 바로 수정합니다.
                                          </p>
                                          <div className="mt-4 flex flex-wrap gap-2">
                                            {(['정상', '주의', '정지'] as const).map((status) => (
                                              <button
                                                key={status}
                                                type="button"
                                                onClick={() => setStatusDraft(status)}
                                                disabled={isCurrentAdmin && status === '정지'}
                                                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                                  statusDraft === status
                                                    ? STATUS_STYLE[status]
                                                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                                } ${isCurrentAdmin && status === '정지' ? 'cursor-not-allowed opacity-40' : ''}`}
                                              >
                                                {status}
                                              </button>
                                            ))}
                                          </div>
                                          {isCurrentAdmin && (
                                            <p className="mt-3 text-xs text-slate-500">
                                              현재 로그인한 관리자 본인 계정은 정지할 수 없습니다.
                                            </p>
                                          )}
                                          <label className="mt-4 block">
                                            <span className="text-sm font-medium text-slate-700">변경 사유</span>
                                            <textarea
                                              value={statusReason}
                                              onChange={(event) => setStatusReason(event.target.value)}
                                              rows={4}
                                              placeholder="상태 변경 사유를 입력하세요."
                                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                                            />
                                          </label>
                                          <div className="mt-4 flex flex-wrap gap-2">
                                            <button
                                              type="button"
                                              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                              disabled={busyUserId === user.id}
                                              onClick={() => void submitStatusUpdate()}
                                            >
                                              {busyUserId === user.id ? '저장 중...' : '저장'}
                                            </button>
                                            <button
                                              type="button"
                                              className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                                              onClick={() => {
                                                setStatusEditorUserId(null);
                                                setStatusReason('');
                                                setStatusDraft(user.status);
                                              }}
                                            >
                                              취소
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* 상태 변경 이력 탭 */}
                                  {(detailTab[user.id] ?? 'info') === 'logs' && (
                                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                      <h3 className="text-base font-semibold text-slate-900">상태 변경 이력</h3>
                                      <p className="mt-1 text-sm text-slate-500">
                                        정상·주의·정지 상태가 변경된 전체 기록입니다.
                                      </p>
                                      {statusLogsLoading === user.id && (
                                        <div className="mt-4 text-sm text-slate-400">이력을 불러오는 중입니다...</div>
                                      )}
                                      {statusLogsLoading !== user.id && (statusLogsMap[user.id] ?? []).length === 0 && (
                                        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                                          상태 변경 이력이 없습니다.
                                        </div>
                                      )}
                                      {statusLogsLoading !== user.id && (statusLogsMap[user.id] ?? []).length > 0 && (
                                        <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                          {(statusLogsMap[user.id] ?? []).map((log) => (
                                            <div key={log.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
                                              <span className={`mt-0.5 inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[log.toStatus] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                {log.toStatus}
                                              </span>
                                              <span className={`mt-0.5 inline-flex shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                                                log.trigger === 'manual' ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                : log.trigger === 'report' ? 'bg-amber-50 text-amber-600 border-amber-100'
                                                : 'bg-slate-100 text-slate-500 border-slate-200'
                                              }`}>
                                                {log.trigger === 'manual' ? '수동' : log.trigger === 'report' ? '신고' : '자동'}
                                              </span>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm text-slate-700">{log.reason ?? '사유 없음'}</p>
                                                <p className="mt-0.5 text-xs text-slate-400">{log.changedBy} · {log.createdAt}</p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
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
                        colSpan={7}
                        className="px-4 py-8 text-center text-sm text-gray-400"
                      >
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination total={filtered.length} page={page} pageSize={20} onChange={(p) => { setPage(p); }} />
            <div className="px-4 py-3 text-xs text-gray-400">
              신고 누적이 높거나 신뢰도가 낮은 계정은 상태 변경 전에 상세 이력을
              먼저 확인할 수 있도록 버튼 구성을 분리했습니다.
            </div>
          </section>
        </div>
      </div>
      {trustEditorUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <button
            type="button"
            aria-label="신뢰도 변경 닫기"
            className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm"
            onClick={() => { setTrustEditorUserId(null); setTrustReason(''); }}
          />
          <div className="relative z-10 w-[440px] max-w-[calc(100vw-32px)] rounded-[28px] border border-white/60 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.24)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">신뢰도 변경</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {trustEditorDetail?.name?.trim() || trustEditorDetail?.nickname || '선택한 사용자'}
                </p>
              </div>
              <button
                type="button"
                className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500 transition hover:bg-slate-50"
                onClick={() => { setTrustEditorUserId(null); setTrustReason(''); }}
              >
                닫기
              </button>
            </div>
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>실시간 미리보기</span>
                <span className="font-semibold text-slate-700">{trustScorePreview.toFixed(1)}</span>
              </div>
              <div className="mt-3 h-3 rounded-full bg-white">
                <div className={`h-3 rounded-full ${trustTone} transition-all duration-200`} style={{ width: `${trustScorePreview}%` }} />
              </div>
            </div>
            <label className="mt-5 block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Slider</span>
              <input type="range" min="0" max="100" step="0.1" value={trustScorePreview}
                onChange={(e) => setTrustScoreDraft(e.target.value)}
                className="mt-3 w-full accent-emerald-500" />
            </label>
            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Score</span>
              <input type="number" min="0" max="100" step="0.1" value={trustScoreDraft}
                onChange={(e) => setTrustScoreDraft(e.target.value)}
                className={`mt-2 w-full rounded-xl bg-white px-4 py-3 text-sm text-slate-700 outline-none transition ${trustScoreError ? 'border border-rose-300' : 'border border-slate-200 focus:border-emerald-400'}`} />
              {trustScoreError && <p className="mt-2 text-xs font-medium text-rose-500">{trustScoreError}</p>}
            </label>
            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Reason</span>
              <textarea value={trustReason} onChange={(e) => setTrustReason(e.target.value)} rows={3}
                placeholder="신뢰도 변경 사유를 입력하세요."
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400" />
            </label>
            <div className="mt-5 flex gap-2">
              <button type="button"
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={busyUserId === trustEditorUserId || Boolean(trustScoreError)}
                onClick={() => void submitTrustScoreUpdate()}>
                {busyUserId === trustEditorUserId ? '저장 중...' : '적용'}
              </button>
              <button type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                onClick={() => { setTrustEditorUserId(null); setTrustReason(''); }}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
