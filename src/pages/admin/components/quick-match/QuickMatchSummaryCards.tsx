import type {
  AdminQuickMatchSummary,
  QuickMatchRequestRow,
} from '../../../../types/admin/adminQuickMatch.ts';

function formatSeconds(value?: number | null) {
  if (value == null) return '-';
  return `${value.toFixed(2)}초`;
}

function SummaryCard({
  title,
  value,
  description,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tone}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
        {title}
      </div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      <div className="mt-2 text-sm opacity-80">{description}</div>
    </div>
  );
}

export function QuickMatchSummaryCards({
  summary,
  rows,
}: {
  summary: AdminQuickMatchSummary | null;
  rows: QuickMatchRequestRow[];
}) {
  const total = summary?.total ?? 0;
  const matched = summary?.matched ?? 0;
  const failed = summary?.failed ?? Math.max(total - matched, 0);
  const todayFailedOnPage = rows.filter(
    (row) =>
      row.status === 'FAILED' ||
      row.status === 'TIMEOUT' ||
      row.status === 'BLOCKED',
  ).length;

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        title="총 요청 수"
        value={total.toLocaleString()}
        description="전체 빠른매칭 요청 수"
        tone="border-slate-200 bg-white text-slate-900"
      />
      <SummaryCard
        title="오늘 요청 수"
        value={(summary?.todayTotal ?? 0).toLocaleString()}
        description="당일 생성된 빠른매칭 요청 수"
        tone="border-indigo-200 bg-indigo-50 text-indigo-700"
      />
      <SummaryCard
        title="성공률"
        value={`${(summary?.successRate ?? 0).toFixed(1)}%`}
        description={`${matched.toLocaleString()}건 성공`}
        tone="border-emerald-200 bg-emerald-50 text-emerald-700"
      />
      <SummaryCard
        title="실패/점검 대상"
        value={failed.toLocaleString()}
        description={`현재 페이지 위험 요청 ${todayFailedOnPage}건 · 평균 ${formatSeconds(summary?.avgSeconds)}`}
        tone="border-rose-200 bg-rose-50 text-rose-700"
      />
    </div>
  );
}
