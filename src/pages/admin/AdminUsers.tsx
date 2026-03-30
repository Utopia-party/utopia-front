import { useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import { adminUsersData } from './data/mockData';

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
  const [activeTab, setActiveTab] = useState('전체');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let data = adminUsersData;

    if (activeTab !== '전체') {
      data = data.filter((user) => user.status === activeTab);
    }

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (user) =>
          user.id.toLowerCase().includes(q) ||
          user.nickname.toLowerCase().includes(q) ||
          user.status.toLowerCase().includes(q),
      );
    }

    return data;
  }, [activeTab, search]);

  const summary = useMemo(
    () => [
      { label: '전체 사용자', value: `${adminUsersData.length}` },
      {
        label: '정상',
        value: `${adminUsersData.filter((user) => user.status === '정상').length}`,
      },
      {
        label: '정지',
        value: `${adminUsersData.filter((user) => user.status === '정지').length}`,
      },
      {
        label: '신뢰도 주의',
        value: `${adminUsersData.filter((user) => user.trustScore < 75).length}`,
      },
    ],
    [],
  );

  return (
    <>
      <AdminHeader
        placeholder="사용자 검색 (ID/닉네임/상태)..."
        onSearch={setSearch}
        rightContent={
          <button
            className="rounded-md border border-gray-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            onClick={() => alert('신뢰도 정책 안내 - 데모')}
          >
            신뢰도 정책
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
                  {filtered.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 transition hover:bg-gray-50"
                    >
                      <td className="px-4 py-3.5">
                        <div className="text-sm font-medium text-gray-900">
                          {user.id}
                        </div>
                        <div className="text-xs text-gray-400">
                          {user.nickname}
                        </div>
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
                            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                            onClick={() => alert(`${user.id} 상세 보기 - 데모`)}
                          >
                            상세
                          </button>
                          <button
                            className="rounded-md border border-blue-300 px-3 py-1 text-xs font-medium text-blue-600 transition hover:bg-blue-50"
                            onClick={() => alert(`${user.id} 상태 변경 - 데모`)}
                          >
                            상태 변경
                          </button>
                          {user.status !== '정지' && (
                            <button
                              className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-500 transition hover:bg-red-50"
                              onClick={() =>
                                alert(`${user.id} 강제 정지 - 데모`)
                              }
                            >
                              강제 정지
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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
