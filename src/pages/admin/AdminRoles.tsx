import { useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import { adminRolesData } from './data/mockData';

const ROLE_STYLE: Record<string, string> = {
  ROOT: 'bg-red-50 text-red-600 border-red-100',
  OPS: 'bg-blue-50 text-blue-600 border-blue-100',
  CS: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

const FILTER_TABS = ['전체', 'ROOT', 'OPS', 'CS'];

const ROLE_GUIDE = [
  {
    role: 'ROOT',
    description: '전체 정책 변경, 관리자 권한 편집, 중요 승인 처리',
  },
  { role: 'OPS', description: '신고/정산/영수증 운영과 실시간 검토 처리' },
  { role: 'CS', description: '사용자 문의, 파티 관리, 제한적 조회 중심 권한' },
];

export default function AdminRoles() {
  const [activeTab, setActiveTab] = useState('전체');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let data = adminRolesData;

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
  }, [activeTab, search]);

  const roleSummary = useMemo(
    () => [
      { label: '전체 관리자', value: `${adminRolesData.length}` },
      {
        label: 'ROOT',
        value: `${adminRolesData.filter((role) => role.role === 'ROOT').length}`,
      },
      {
        label: 'OPS',
        value: `${adminRolesData.filter((role) => role.role === 'OPS').length}`,
      },
      {
        label: 'CS',
        value: `${adminRolesData.filter((role) => role.role === 'CS').length}`,
      },
    ],
    [],
  );

  return (
    <>
      <AdminHeader
        placeholder="권한 검색 (관리자 ID/역할/범위)..."
        onSearch={setSearch}
        rightContent={
          <button
            className="rounded-md border border-blue-500 bg-blue-500 px-3.5 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-600"
            onClick={() => alert('관리자 추가 - 데모')}
          >
            관리자 추가
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

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
                            onClick={() =>
                              alert(`${role.adminId} 권한 편집 - 데모`)
                            }
                          >
                            권한 편집
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
                ROOT 권한은 권한 편집과 정책 변경에만 사용하고, 운영 작업은
                OPS/CS로 분리하는 구성을 기준으로 합니다.
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
                  <li>관리자 추가 시 기본 역할은 OPS 또는 CS로 시작합니다.</li>
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
