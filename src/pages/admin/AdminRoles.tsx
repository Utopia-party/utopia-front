import { useEffect, useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import {
  fetchAdminRoles,
  getAdminErrorMessage,
  updateAdminRole,
  type AdminRoleRecord,
  type AdminRoleUpdatePayload,
} from '../../apis/admin';

type PermissionKey = keyof AdminRoleUpdatePayload;

const PERMISSION_OPTIONS: Array<{
  key: PermissionKey;
  label: string;
  description: string;
  tone: string;
}> = [
  {
    key: 'canViewDashboard',
    label: '통계 대시보드',
    description: '관리자 통계 대시보드와 요약 지표 조회',
    tone: 'bg-sky-50 text-sky-600 border-sky-100',
  },
  {
    key: 'canManageUsers',
    label: '사용자 관리',
    description: '계정 조회, 상태 변경, 사용자 운영 관리',
    tone: 'bg-blue-50 text-blue-600 border-blue-100',
  },
  {
    key: 'canManageServices',
    label: '구독 서비스',
    description: '구독 서비스 목록, 요금, 할인 정책 관리',
    tone: 'bg-violet-50 text-violet-600 border-violet-100',
  },
  {
    key: 'canManageParties',
    label: '파티 관리',
    description: '파티 조회, 강제 종료, 운영 상태 관리',
    tone: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  },
  {
    key: 'canManageQuickMatch',
    label: '빠른매칭 관리',
    description: '빠른매칭 요청, 후보, 정책과 상태 관리',
    tone: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
  },
  {
    key: 'canManageReports',
    label: '신고 관리',
    description: '신고 검토, 처리 상태 변경, 운영 대응',
    tone: 'bg-amber-50 text-amber-600 border-amber-100',
  },
  {
    key: 'canManageChatModeration',
    label: '채팅 모더레이션 관리',
    description: '채팅 제재 상태 변경과 실시간 운영 개입',
    tone: 'bg-rose-50 text-rose-600 border-rose-100',
  },
  {
    key: 'canManageCaptcha',
    label: '캡챠 관리',
    description: '캡챠 운영 상태와 제재 정책 관리',
    tone: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  },
  {
    key: 'canManageHandOcr',
    label: 'HandOCR CAPTCHA',
    description: 'HandOCR 검증 이력과 차단 세션 관리',
    tone: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  },
  {
    key: 'canApproveSettlements',
    label: '정산 승인',
    description: '정산 검토와 승인/거절 처리',
    tone: 'bg-green-50 text-green-600 border-green-100',
  },
  {
    key: 'canManagePayments',
    label: '수익내역 관리',
    description: '결제 내역과 플랫폼 수수료 수익 조회',
    tone: 'bg-orange-50 text-orange-600 border-orange-100',
  },
  {
    key: 'canViewLogs',
    label: '시스템 로그',
    description: '시스템 로그와 관리자 작업 이력 조회',
    tone: 'bg-slate-100 text-slate-600 border-slate-200',
  },
  {
    key: 'canViewCloudMonitoring',
    label: '클라우드 모니터링',
    description: '클라우드 자원 지표와 운영 상태 모니터링',
    tone: 'bg-teal-50 text-teal-600 border-teal-100',
  },
  {
    key: 'canManageAdmins',
    label: '관리자 권한',
    description: '관리자 추가와 권한 변경',
    tone: 'bg-red-50 text-red-600 border-red-100',
  },
];

const FILTER_TABS = [
  '전체',
  '통계 대시보드',
  '관리자 권한',
  '사용자 관리',
  '구독 서비스',
  '파티 관리',
  '빠른매칭 관리',
  '신고 관리',
  '채팅 모더레이션 관리',
  '캡챠 관리',
  'HandOCR CAPTCHA',
  '정산 승인',
  '매출 내역',
  '시스템 로그',
  '클라우드 모니터링',
];

const FILTER_KEY_MAP: Record<string, PermissionKey> = {
  '통계 대시보드': 'canViewDashboard',
  '관리자 권한': 'canManageAdmins',
  '사용자 관리': 'canManageUsers',
  '구독 서비스': 'canManageServices',
  '파티 관리': 'canManageParties',
  '빠른매칭 관리': 'canManageQuickMatch',
  '신고 관리': 'canManageReports',
  '채팅 모더레이션 관리': 'canManageChatModeration',
  '캡챠 관리': 'canManageCaptcha',
  'HandOCR CAPTCHA': 'canManageHandOcr',
  '정산 승인': 'canApproveSettlements',
  '매출 내역': 'canManagePayments',
  '시스템 로그': 'canViewLogs',
  '클라우드 모니터링': 'canViewCloudMonitoring',
};

const DEFAULT_ADMIN_PERMISSIONS: AdminRoleUpdatePayload = {
  canViewDashboard: true,
  canManageUsers: true,
  canManageServices: true,
  canManageParties: true,
  canManageQuickMatch: true,
  canManageReports: true,
  canManageChatModeration: true,
  canManageCaptcha: true,
  canApproveSettlements: true,
  canManagePayments: true,
  canViewLogs: true,
  canViewCloudMonitoring: true,
  canManageHandOcr: true,
  canManageAdmins: false,
};

const clonePermissions = (
  source: AdminRoleUpdatePayload,
): AdminRoleUpdatePayload => ({ ...source });

const permissionsFromRole = (
  role: AdminRoleRecord,
): AdminRoleUpdatePayload => ({
  canViewDashboard: role.canViewDashboard,
  canManageUsers: role.canManageUsers,
  canManageServices: role.canManageServices,
  canManageParties: role.canManageParties,
  canManageQuickMatch: role.canManageQuickMatch,
  canManageReports: role.canManageReports,
  canManageChatModeration: role.canManageChatModeration,
  canManageCaptcha: role.canManageCaptcha,
  canApproveSettlements: role.canApproveSettlements,
  canManagePayments: role.canManagePayments,
  canViewLogs: role.canViewLogs,
  canViewCloudMonitoring: role.canViewCloudMonitoring,
  canManageHandOcr: role.canManageHandOcr,
  canManageAdmins: role.canManageAdmins,
});

const getEnabledPermissionLabels = (
  role: AdminRoleRecord | AdminRoleUpdatePayload,
) =>
  PERMISSION_OPTIONS.filter((option) => role[option.key]).map(
    (option) => option.label,
  );

export default function AdminRoles() {
  const [activeTab, setActiveTab] = useState('전체');
  const [search, setSearch] = useState('');
  const [roles, setRoles] = useState<AdminRoleRecord[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'update'>('create');
  const [draftUserId, setDraftUserId] = useState('');
  const [draftPermissions, setDraftPermissions] =
    useState<AdminRoleUpdatePayload>(
      clonePermissions(DEFAULT_ADMIN_PERMISSIONS),
    );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadRoles = async () => {
      try {
        setLoading(true);
        setError('');
        const nextRoles = await fetchAdminRoles();
        if (alive) {
          setRoles(nextRoles);
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

    void loadRoles();
    return () => {
      alive = false;
    };
  }, []);

  const reloadRoles = async () => {
    setLoading(true);
    setError('');
    try {
      setRoles(await fetchAdminRoles());
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const openRoleEditor = (role?: AdminRoleRecord) => {
    setError('');
    if (role) {
      setEditorMode('update');
      setDraftUserId(role.userId);
      setDraftPermissions(permissionsFromRole(role));
      setIsEditorOpen(true);
      return;
    }

    setEditorMode('create');
    setDraftUserId('');
    setDraftPermissions(clonePermissions(DEFAULT_ADMIN_PERMISSIONS));
    setIsEditorOpen((prev) => !prev);
  };

  const togglePermission = (key: PermissionKey) => {
    setDraftPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRoleUpdate = async () => {
    const targetUserId = draftUserId.trim();

    if (!targetUserId) {
      setError('관리자 권한을 부여할 사용자 ID를 입력해주세요.');
      return;
    }

    if (!Object.values(draftPermissions).some(Boolean)) {
      setError('최소 하나 이상의 관리자 권한을 켜야 합니다.');
      return;
    }

    try {
      setBusyUserId(targetUserId);
      await updateAdminRole(targetUserId, draftPermissions);
      await reloadRoles();
      setIsEditorOpen(false);
      if (editorMode === 'create') {
        setDraftUserId('');
        setDraftPermissions(clonePermissions(DEFAULT_ADMIN_PERMISSIONS));
      }
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setBusyUserId(null);
    }
  };

  const filtered = useMemo(() => {
    let data = roles;

    if (activeTab !== '전체') {
      const filterKey = FILTER_KEY_MAP[activeTab];
      if (filterKey) {
        data = data.filter((role) => role[filterKey]);
      }
    }

    if (search) {
      const q = search.toLowerCase();
      data = data.filter((role) => {
        const permissionLabels = getEnabledPermissionLabels(role)
          .join(' ')
          .toLowerCase();
        return (
          role.adminId.toLowerCase().includes(q) || permissionLabels.includes(q)
        );
      });
    }

    return data;
  }, [activeTab, roles, search]);

  const summary = useMemo(
    () => [
      { label: '전체 관리자', value: `${roles.length}` },
      {
        label: '권한 관리 가능',
        value: `${roles.filter((role) => role.canManageAdmins).length}`,
      },
      {
        label: '정산 승인 가능',
        value: `${roles.filter((role) => role.canApproveSettlements).length}`,
      },
      {
        label: '로그 조회 가능',
        value: `${roles.filter((role) => role.canViewLogs).length}`,
      },
    ],
    [roles],
  );

  return (
    <>
      <AdminHeader
        placeholder="권한 검색 (관리자 ID/권한명)..."
        onSearch={setSearch}
        rightContent={
          <button
            className="rounded-md border border-blue-500 bg-blue-500 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-600"
            onClick={() => openRoleEditor()}
          >
            {isEditorOpen && editorMode === 'create'
              ? '추가 닫기'
              : '관리자 추가'}
          </button>
        }
      />
      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section>
            <h1 className="text-2xl font-bold text-gray-900">권한관리</h1>
            <p className="mt-1 text-sm text-gray-500">
              관리자별로 실제 권한 토글을 확인하고 필요한 범위만 열어
              운영합니다.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              사용자관리, 파티관리, 신고관리, 정산 승인, 로그 조회 권한을
              계정별로 나눠서 제어할 수 있고 관리자 추가 후에도 필요한 권한만
              열어 최소 권한 원칙으로 운영할 수 있습니다.
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

          {isEditorOpen && (
            <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-slate-900">
                    {editorMode === 'create'
                      ? '관리자 추가'
                      : '관리자 권한 편집'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    역할명 대신 실제 `can_manage_*` 권한 토글을 직접 켜고 끄는
                    방식입니다.
                  </p>
                </div>
                <button
                  type="button"
                  className="self-start rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  onClick={() => setIsEditorOpen(false)}
                >
                  닫기
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    사용자 식별자
                  </span>
                  <input
                    type="text"
                    value={draftUserId}
                    onChange={(event) => setDraftUserId(event.target.value)}
                    disabled={editorMode === 'update'}
                    placeholder="사용자 UUID, 닉네임, 또는 이메일"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                  />
                </label>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {PERMISSION_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => togglePermission(option.key)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        draftPermissions[option.key]
                          ? option.tone
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-semibold">
                          {option.label}
                        </span>
                        <span className="text-xs font-bold">
                          {draftPermissions[option.key] ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs leading-5 opacity-90">
                        {option.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={busyUserId === draftUserId.trim()}
                  onClick={() => void handleRoleUpdate()}
                >
                  {busyUserId === draftUserId.trim() ? '저장 중...' : '저장'}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  onClick={() => {
                    setIsEditorOpen(false);
                    setDraftUserId('');
                    setDraftPermissions(
                      clonePermissions(DEFAULT_ADMIN_PERMISSIONS),
                    );
                  }}
                >
                  취소
                </button>
              </div>
            </section>
          )}

          {loading && (
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500 shadow-sm">
              관리자 권한 목록을 불러오는 중입니다.
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 shadow-sm">
              {error}
            </div>
          )}

          <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1.8fr)_320px]">
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                        관리자
                      </th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                        권한 토글
                      </th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                        최근 수정
                      </th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                        수정자
                      </th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                        편집
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((role) => {
                      const enabled = PERMISSION_OPTIONS.filter(
                        (option) => role[option.key],
                      );
                      return (
                        <tr
                          key={role.id}
                          className="border-b border-gray-100 align-top transition hover:bg-gray-50"
                        >
                          <td className="px-4 py-3.5 text-sm font-medium text-gray-900">
                            {role.adminId}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            <div className="flex flex-wrap gap-2">
                              {enabled.map((option) => (
                                <span
                                  key={option.key}
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${option.tone}`}
                                >
                                  {option.label}
                                </span>
                              ))}
                              {enabled.length === 0 && (
                                <span className="text-xs text-gray-400">
                                  설정된 권한이 없습니다.
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            {role.lastUpdated}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            {role.updatedBy}
                          </td>
                          <td className="px-4 py-3.5 text-sm">
                            <button
                              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                              disabled={busyUserId === role.userId}
                              onClick={() => openRoleEditor(role)}
                            >
                              {busyUserId === role.userId
                                ? '처리 중...'
                                : '권한 편집'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
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
                관리자 페이지는 역할명보다 실제 권한 토글을 기준으로 접근 범위를
                관리합니다.
              </div>
            </section>

            <div className="space-y-4">
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">
                  권한 가이드
                </h2>
                <div className="mt-4 space-y-3">
                  {PERMISSION_OPTIONS.map((option) => (
                    <div
                      key={option.key}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        {option.label}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {option.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
