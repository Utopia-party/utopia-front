import { useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import { adminPartiesData } from './data/mockData';

const STATUS_STYLE: Record<string, string> = {
  운영중: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  모집중: 'bg-blue-50 text-blue-600 border-blue-100',
  위험: 'bg-amber-50 text-amber-600 border-amber-100',
  '종료 예정': 'bg-red-50 text-red-600 border-red-100',
};

const FILTER_TABS = ['전체', '운영중', '모집중', '위험', '종료 예정'];

const formatWon = (amount: number) => `₩ ${amount.toLocaleString()}`;

export default function AdminParties() {
  const [activeTab, setActiveTab] = useState('전체');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let data = adminPartiesData;

    if (activeTab !== '전체') {
      data = data.filter((party) => party.status === activeTab);
    }

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (party) =>
          party.id.toLowerCase().includes(q) ||
          party.service.toLowerCase().includes(q) ||
          party.leaderId.toLowerCase().includes(q) ||
          party.status.toLowerCase().includes(q),
      );
    }

    return data;
  }, [activeTab, search]);

  const summary = useMemo(
    () => [
      { label: '전체 파티', value: `${adminPartiesData.length}` },
      {
        label: '운영중',
        value: `${adminPartiesData.filter((party) => party.status === '운영중').length}`,
      },
      {
        label: '위험',
        value: `${adminPartiesData.filter((party) => party.status === '위험').length}`,
      },
      {
        label: '종료 예정',
        value: `${adminPartiesData.filter((party) => party.status === '종료 예정').length}`,
      },
    ],
    [],
  );

  return (
    <>
      <AdminHeader
        placeholder="파티 검색 (파티 ID/서비스/리더)..."
        onSearch={setSearch}
        rightContent={
          <button
            className="rounded-md border border-gray-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            onClick={() => alert('정산 정책 안내 - 데모')}
          >
            정산 정책
          </button>
        }
      />
      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section>
            <h1 className="text-2xl font-bold text-gray-900">파티관리</h1>
            <p className="mt-1 text-sm text-gray-500">
              파티 운영 상태, 신고 누적, 최근 정산 이슈를 한 화면에서 관리할 수
              있게 구성했습니다.
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

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      파티
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      서비스
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      리더
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      멤버
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      상태
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      월 결제
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      신고
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((party) => (
                    <tr
                      key={party.id}
                      className="border-b border-gray-100 transition hover:bg-gray-50"
                    >
                      <td className="px-4 py-3.5 text-sm font-medium text-gray-900">
                        {party.id}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        <div>{party.service}</div>
                        <div className="mt-1 text-xs text-gray-400">
                          {party.lastPayment}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        {party.leaderId}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        {party.memberCount}명
                      </td>
                      <td className="px-4 py-3.5 text-sm">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[party.status]}`}
                        >
                          {party.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        {formatWon(party.monthlyAmount)}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">
                        {party.reportCount}건
                      </td>
                      <td className="px-4 py-3.5 text-sm">
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                            onClick={() =>
                              alert(`${party.id} 상세 보기 - 데모`)
                            }
                          >
                            상세
                          </button>
                          <button
                            className="rounded-md border border-blue-300 px-3 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                            onClick={() =>
                              alert(`${party.id} 정산 내역 - 데모`)
                            }
                          >
                            정산
                          </button>
                          {party.status !== '종료 예정' && (
                            <button
                              className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50"
                              onClick={() =>
                                alert(`${party.id} 강제 종료 - 데모`)
                              }
                            >
                              강제 종료
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
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
            <div className="border-t border-gray-100 px-4 py-3 text-xs text-gray-400">
              위험 상태 파티는 신고 누적 또는 정산 지연 기준으로 표시했고, 강제
              종료 액션은 실제 API 없이 프론트 데모 동작만 연결했습니다.
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
