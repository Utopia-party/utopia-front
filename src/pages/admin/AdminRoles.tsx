import { useEffect, useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import {
  fetchAdminRoles,
  getAdminErrorMessage,
  updateAdminRole,
  type AdminRoleRecord,
} from '../../apis/admin';

const ROLE_STYLE: Record<string, string> = {
  ROOT: 'bg-red-50 text-red-600 border-red-100',
  ADMIN: 'bg-blue-50 text-blue-600 border-blue-100',
};

const FILTER_TABS = ['전체', 'ROOT', 'ADMIN'];

const ROLE_GUIDE = [
  {
    role: 'ROOT',
    description: '전체 정책 변경, 관리자 권한 편집, 중요 승인 처리',
  },
  {
    role: 'ADMIN',
    description: '사용자/파티/신고 관리와 영수증·정산 승인 처리',
  },
];

export default function AdminRoles() {
  const [activeTab, setActiveTab] = useState('전체');
  const [search, setSearch] = useState('');
  const [roles, setRoles] = useState<AdminRoleRecord[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'update'>('create');
  const [draftUserId, setDraftUserId] = useState('');
  const [draftRole, setDraftRole] = useState<AdminRoleRecord['role']>('ADMIN');
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

  const openRoleEditor = (
    userId?: string,
    currentRole: AdminRoleRecord['role'] = 'ADMIN',
  ) => {
    setError('');
    if (userId) {
      setEditorMode('update');
      setDraftUserId(userId);
      setDraftRole(currentRole);
      setIsEditorOpen(true);
      return;
    }

    setEditorMode('create');
    setDraftUserId('');
    setDraftRole('ADMIN');
    setIsEditorOpen((prev) => !prev);
  };

  const handleRoleUpdate = async () => {
    const targetUserId = draftUserId.trim();

    if (!targetUserId) {
      setError('관리자 권한을 부여할 사용자 ID를 입력해주세요.');
      return;
    }

    try {
      setBusyUserId(targetUserId);
      await updateAdminRole(targetUserId, draftRole);
      await reloadRoles();
      setIsEditorOpen(false);
      if (editorMode === 'create') {
        setDraftUserId('');
        setDraftRole('ADMIN');
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
      data = data.filter((role) => role.role === activeTab);
    }

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (role) =>
          role.adminId.toLowerCase().includes(q) ||
          role.role.toLowerCase().includes(q) ||
          role.scope.toLowerCase().includes(q),
      );
    }

    return data;
  }, [activeTab, roles, search]);

  const roleSummary = useMemo(
    () => [
      { label: '전체 관리자', value: `${roles.length}` },
      {
        label: 'ROOT',
        value: `${roles.filter((role) => role.role === 'ROOT').length}`,
      },
      {
        label: 'ADMIN',
        value: `${roles.filter((role) => role.role === 'ADMIN').length}`,
      },
    ],
    [roles],
  );

  return (
    <>
      <AdminHeader
        placeholder="권한 검색 (관리자 ID/역할/범위)..."
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
              관리자 역할과 접근 범위를 확인하고 최소 권한 원칙으로 운영합니다.
            </p>
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {roleSummary.map((item) => (
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
                    브라우저 기본 prompt 다이얼로그 대신 화면 안에서 바로 역할을
                    토글해서 저장합니다.
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

              <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    사용자 ID
                  </span>
                  <input
                    type="text"
                    value={draftUserId}
                    onChange={(event) => setDraftUserId(event.target.value)}
                    disabled={editorMode === 'update'}
                    placeholder="권한을 부여할 사용자 ID(UUID)"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400"
                  />
                </label>

                <div>
                  <span className="text-sm font-medium text-slate-700">
                    역할 선택
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(['ROOT', 'ADMIN'] as const).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setDraftRole(role)}
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          draftRole === role
                            ? ROLE_STYLE[role]
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    ROOT는 정책과 권한 편집, ADMIN은 일상 운영 처리 전반을
                    담당합니다.
                  </p>
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
                    setDraftRole('ADMIN');
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
                        역할
                      </th>
                      <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                        관리 범위
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
                    {filtered.map((role) => (
                      <tr
                        key={role.id}
                        className="border-b border-gray-100 transition hover:bg-gray-50"
                      >
                        <td className="px-4 py-3.5 text-sm font-medium text-gray-900">
                          {role.adminId}
                        </td>
                        <td className="px-4 py-3.5 text-sm">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${ROLE_STYLE[role.role]}`}
                          >
                            {role.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-gray-600">
                          {role.scope}
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
                            onClick={() =>
                              openRoleEditor(role.userId, role.role)
                            }
                          >
                            {busyUserId === role.userId
                              ? '처리 중...'
                              : '권한 편집'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
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
                ROOT는 권한 편집과 정책 변경, ADMIN은 운영 처리 전반을 담당하는
                두 단계 구조를 기준으로 합니다.
              </div>
            </section>

            <div className="space-y-4">
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">
                  역할(Role) 가이드
                </h2>
                <div className="mt-4 space-y-3">
                  {ROLE_GUIDE.map((item) => (
                    <div
                      key={item.role}
                      className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        {item.role}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">
                  최소 권한 원칙
                </h2>
                <ul className="mt-4 space-y-2 text-sm text-gray-500">
                  <li>관리자 추가 시 기본 역할은 ADMIN으로 시작합니다.</li>
                  <li>권한 변경 이력은 모두 시스템 로그와 함께 남겨 둡니다.</li>
                  <li>
                    민감 기능은 ROOT 계정에서만 접근 가능하도록 제한합니다.
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
