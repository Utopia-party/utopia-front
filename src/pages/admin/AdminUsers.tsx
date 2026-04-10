import { Fragment, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import {
  fetchAdminUserDetail,
  fetchAdminUsers,
  type AdminUserDetail,
  getAdminErrorMessage,
  updateAdminUserStatus,
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
    score >= 85
      ? 'bg-emerald-500'
      : score >= 60
        ? 'bg-amber-500'
        : 'bg-red-500';

  return (
    <div className="min-w-[120px]">
      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
        <span>신뢰도</span>
        <span className="font-semibold text-gray-700">{score}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div
          className={`h-2 rounded-full ${tone}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const currentUserId = useAuthStore((state) => state.user?.user_id);
  const [activeTab, setActiveTab] = useState('전체');
  const [search, setSearch] = useState('');
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

  const reloadUsers = async () => {
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

  const filtered = useMemo(() => {
    let data = users;

    if (activeTab !== '전체') {
      data = data.filter((user) => user.status === activeTab);
    }

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (user) =>
          user.id.toLowerCase().includes(q) ||
          (user.name || '').toLowerCase().includes(q) ||
          user.nickname.toLowerCase().includes(q) ||
          user.status.toLowerCase().includes(q),
      );
    }

    return data;
  }, [activeTab, search, users]);

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
        value: `${users.filter((user) => user.trustScore < 75).length}`,
      },
    ],
    [users],
  );

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
            onTabChange={setActiveTab}
          />

          {isPolicyOpen && (
            <section className="rounded-2xl border border-blue-100 bg-blue-50/70 px-5 py-4 text-sm text-slate-600 shadow-sm">
              신뢰도 75점 미만 또는 신고 2건 이상이면 주의 상태로 우선 검토하고,
              반복 위반 또는 누적 리스크가 크면 정지 상태로 전환합니다.
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
                  {filtered.map((user) => {
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
                                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
                                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                      <div>
                                        <h3 className="text-base font-semibold text-slate-900">
                                          {detail.nickname}
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                          사용자 상세 정보와 운영 판단 지표를 한
                                          번에 확인합니다.
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
                                        ['신뢰도', `${detail.trustScore}`],
                                        ['신고 수', `${detail.reportCount}건`],
                                        ['참여 파티', `${detail.partyCount}개`],
                                        ['가입일', detail.createdAt || '-'],
                                        ['최근 활동', detail.lastActive || '-'],
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

                                  {isEditingStatus && (
                                    <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 shadow-sm">
                                      <h3 className="text-base font-semibold text-slate-900">
                                        상태 변경
                                      </h3>
                                      <p className="mt-1 text-sm text-slate-500">
                                        팝업 대신 이 패널에서 상태와 사유를 바로
                                        수정합니다.
                                      </p>

                                      <div className="mt-4 flex flex-wrap gap-2">
                                        {(
                                          ['정상', '주의', '정지'] as const
                                        ).map((status) => (
                                          <button
                                            key={status}
                                            type="button"
                                            onClick={() =>
                                              setStatusDraft(status)
                                            }
                                            disabled={
                                              isCurrentAdmin &&
                                              status === '정지'
                                            }
                                            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                              statusDraft === status
                                                ? STATUS_STYLE[status]
                                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
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

                                      <label className="mt-4 block">
                                        <span className="text-sm font-medium text-slate-700">
                                          변경 사유
                                        </span>
                                        <textarea
                                          value={statusReason}
                                          onChange={(event) =>
                                            setStatusReason(event.target.value)
                                          }
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
                                          onClick={() =>
                                            void submitStatusUpdate()
                                          }
                                        >
                                          {busyUserId === user.id
                                            ? '저장 중...'
                                            : '저장'}
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
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {filtered.length === 0 && (
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
            <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">
              신고 누적이 높거나 신뢰도가 낮은 계정은 상태 변경 전에 상세 이력을
              먼저 확인할 수 있도록 버튼 구성을 분리했습니다.
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
