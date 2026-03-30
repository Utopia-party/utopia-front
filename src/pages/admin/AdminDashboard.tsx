import AdminHeader from './components/AdminHeader';
import {
  dashboardMemberStatsData,
  dashboardMetricsData,
  dashboardSalesStatsData,
} from './data/mockData';

function SummaryList({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
      </div>
      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
          >
            <span className="text-sm text-gray-600">{row.label}</span>
            <span className="text-sm font-semibold text-gray-900">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AdminDashboard() {
  return (
    <>
      <AdminHeader
        placeholder="관리자 검색..."
        rightContent={
          <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
            최근 5분 기준 갱신
          </span>
        }
      />
      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <section>
            <h1 className="text-2xl font-bold text-gray-900">통계 대시보드</h1>
            <p className="mt-1 text-sm text-gray-500">
              운영 지표와 승인 현황을 한 번에 확인하는 관리자 메인 화면입니다.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboardMetricsData.map((metric) => (
              <article
                key={metric.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-gray-500">
                  {metric.label}
                </p>
                <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
                  {metric.value}
                </p>
                <p className="mt-2 text-xs text-gray-400">{metric.helper}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <SummaryList
              title="회원 통계(상태별)"
              subtitle="활성/정지 상태를 빠르게 점검할 수 있습니다."
              rows={dashboardMemberStatsData}
            />
            <SummaryList
              title="매출/정산 통계(샘플)"
              subtitle="승인, 대기, 거절 금액을 분리해 보여줍니다."
              rows={dashboardSalesStatsData}
            />
          </section>

          <section className="rounded-2xl border border-dashed border-gray-300 bg-white/80 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  오늘 운영 체크 포인트
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  신고 접수와 정산 승인 대기 건을 우선 확인하면 운영 리스크를
                  빠르게 줄일 수 있습니다.
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                접수 신고 7건 / 정산 대기 3건 / 실시간 가입 +12
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
