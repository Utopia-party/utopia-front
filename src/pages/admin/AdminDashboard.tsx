import { useEffect, useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import {
  fetchAdminDashboard,
  getAdminErrorMessage,
  type AdminDashboard as AdminDashboardData,
  type DashboardChart,
  type DashboardMetric,
  type DashboardSeriesPoint,
} from '../../apis/admin';

type CompareMode = 'previous_period' | 'year_over_year';
type ChartTabId = 'sales' | 'members' | 'reports' | 'settlements';

const CARD_ACCENTS: Record<string, string> = {
  members: 'from-[#61e4c5] via-[#52d4d4] to-[#54a8ff]',
  sales: 'from-[#7bc7ff] via-[#5f9dff] to-[#4f6fff]',
  commission: 'from-[#f9a84d] via-[#f97316] to-[#ea580c]',
  reports: 'from-[#8898ff] via-[#8f8ae7] to-[#a48ce9]',
  settlements: 'from-[#8fe3ff] via-[#61c2ff] to-[#4f8bff]',
};

function formatWon(value: number) {
  return `₩ ${value.toLocaleString()}`;
}

function formatPointValue(value: number, unit: string) {
  return unit === 'currency' ? formatWon(value) : `${value.toLocaleString()}건`;
}

function buildLinePath(values: number[], width: number, height: number) {
  if (values.length === 0) {
    return '';
  }
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const step = values.length > 1 ? width / (values.length - 1) : width;

  return values
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function shouldShowAxisLabel(index: number, total: number) {
  if (total <= 10) {
    return true;
  }
  const interval = Math.ceil(total / 8);
  if (index === 0 || index === total - 1) {
    return true;
  }
  if (total - 1 - index < interval) {
    return false;
  }
  return index % interval === 0;
}

function DashboardLineChart({
  title,
  eyebrow,
  description,
  periodLabel,
  unit,
  points,
}: {
  title: string;
  eyebrow: string;
  description: string;
  periodLabel: string;
  unit: string;
  points: DashboardSeriesPoint[];
}) {
  const width = 720;
  const height = 220;
  const paddingLeft = 104;
  const paddingRight = 48;
  const topPadding = 16;
  const labelY = topPadding + height + 28;
  const viewWidth = width + paddingLeft + paddingRight;
  const currentValues = points.map((point) => point.current);
  const max = Math.max(...currentValues, 1);
  const pathCurrent = buildLinePath(currentValues, width, height);

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(36,54,94,0.08)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-500">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {title}
          </h2>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <div className="grid gap-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
            {periodLabel}
          </div>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto">
        <svg
          viewBox={`0 0 ${viewWidth} ${labelY + 16}`}
          className="h-[280px] min-w-[760px] w-full"
          role="img"
          aria-label="기간별 승인 매출 비교 그래프"
        >
          <g transform={`translate(${paddingLeft}, ${topPadding})`}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = height - height * ratio;
              const labelValue = Math.round(max * ratio);
              return (
                <g key={ratio}>
                  <line
                    x1="0"
                    y1={y}
                    x2={width}
                    y2={y}
                    stroke="#e2e8f0"
                    strokeDasharray="4 6"
                  />
                  <text
                    x="-96"
                    y={Math.max(y - 8, 12)}
                    fill="#94a3b8"
                    fontSize="11"
                    textAnchor="start"
                  >
                    {formatPointValue(labelValue, unit)}
                  </text>
                </g>
              );
            })}

            <path
              d={pathCurrent}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {points.map((point, index) => {
              const step =
                points.length > 1 ? width / (points.length - 1) : width;
              const x = index * step;
              const currentY =
                height - (point.current / Math.max(max, 1)) * height;
              const textAnchor =
                index === 0
                  ? 'start'
                  : index === points.length - 1
                    ? 'end'
                    : 'middle';
              return (
                <g key={point.label}>
                  <circle cx={x} cy={currentY} r="5" fill="#38bdf8" />
                  {shouldShowAxisLabel(index, points.length) && (
                    <text
                      x={x}
                      y={labelY - topPadding}
                      textAnchor={textAnchor}
                      fill="#94a3b8"
                      fontSize="11"
                    >
                      {point.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

function MetricCard({ metric }: { metric: DashboardMetric }) {
  const accent = CARD_ACCENTS[metric.id] ?? CARD_ACCENTS.members;

  return (
    <article className="relative overflow-hidden rounded-[28px] border border-white/50 bg-white p-6 shadow-[0_20px_50px_rgba(39,64,120,0.10)]">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`}
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            {metric.label}
          </p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
            {metric.value}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-500">{metric.helper}</p>
    </article>
  );
}

function SummaryPanel({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(39,64,120,0.08)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-6 space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
          >
            <span className="text-sm text-slate-600">{row.label}</span>
            <span className="text-sm font-semibold text-slate-900">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CompactStatCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'accent';
}) {
  return (
    <div
      className={`rounded-[24px] border p-5 shadow-[0_14px_30px_rgba(39,64,120,0.06)] ${
        tone === 'accent'
          ? 'border-cyan-100 bg-gradient-to-r from-[#61e4c5] to-[#54a8ff] text-white'
          : 'border-slate-200 bg-white text-slate-900'
      }`}
    >
      <div
        className={`text-xs font-semibold uppercase tracking-[0.22em] ${
          tone === 'accent' ? 'text-white/75' : 'text-slate-400'
        }`}
      >
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const compareMode: CompareMode = 'previous_period';
  const [activeChartId, setActiveChartId] = useState<ChartTabId>('sales');
  const [breakdownDashboard, setBreakdownDashboard] =
    useState<AdminDashboardData | null>(null);
  const [breakdownLoading, setBreakdownLoading] = useState(true);
  const [breakdownError, setBreakdownError] = useState('');
  const breakdownCompareMode: CompareMode = 'previous_period';

  const loadDashboard = async (
    nextParams?: Partial<{
      date_from: string;
      date_to: string;
      compare_mode: CompareMode;
    }>,
  ) => {
    try {
      setLoading(true);
      setError('');
      const nextDashboard = await fetchAdminDashboard({
        date_from: nextParams?.date_from ?? (dateFrom || undefined),
        date_to: nextParams?.date_to ?? (dateTo || undefined),
        compare_mode: nextParams?.compare_mode ?? compareMode,
      });
      setDashboard(nextDashboard);
      setDateFrom(nextDashboard.rangeStart);
      setDateTo(nextDashboard.rangeEnd);
      setBreakdownDashboard(nextDashboard);
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const loadBreakdownDashboard = async (
    nextParams?: Partial<{
      date_from: string;
      date_to: string;
      compare_mode: CompareMode;
    }>,
  ) => {
    try {
      setBreakdownLoading(true);
      setBreakdownError('');
      const nextDashboard = await fetchAdminDashboard({
        date_from: nextParams?.date_from ?? (dateFrom || undefined),
        date_to: nextParams?.date_to ?? (dateTo || undefined),
        compare_mode: nextParams?.compare_mode ?? breakdownCompareMode,
      });
      setBreakdownDashboard(nextDashboard);
    } catch (err) {
      setBreakdownError(getAdminErrorMessage(err));
    } finally {
      setBreakdownLoading(false);
    }
  };

  useEffect(() => {
    void loadBreakdownDashboard();
  }, []);

  const handleAnalyzeDashboard = async () => {
    await loadDashboard({
      date_from: dateFrom,
      date_to: dateTo,
      compare_mode: compareMode,
    });
  };

  const activeChart = useMemo<DashboardChart | null>(() => {
    const chart =
      dashboard?.chartGroups.find((item) => item.id === activeChartId) ??
      dashboard?.chartGroups[0];
    return chart ?? null;
  }, [activeChartId, dashboard]);
  const chartSnapshot = useMemo(() => {
    const points = activeChart?.points ?? [];
    const totalCurrent = points.reduce((sum, point) => sum + point.current, 0);
    const peak = Math.max(...points.map((point) => point.current), 0);
    return { totalCurrent, peak };
  }, [activeChart]);
  const breakdownRows = useMemo(() => {
    const rows = breakdownDashboard?.salesStats ?? [];
    return rows.filter((row) => row.label !== '비교 기준');
  }, [breakdownDashboard]);
  return (
    <>
      <AdminHeader
        placeholder="관리자 검색..."
        rightContent={
          <span className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
            비교형 분석 대시보드
          </span>
        }
      />
      <div className="min-h-screen bg-[#f5f5f5] p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-[0_35px_90px_rgba(39,64,120,0.12)] backdrop-blur">
            <div className="grid gap-0 xl:grid-cols-[260px_minmax(0,1fr)]">
              <div className="border-b border-slate-200/80 bg-white/90 p-6 xl:border-b-0 xl:border-r">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                  Dashboard
                </p>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                  통계 대시보드
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  날짜 범위를 선택하면 해당 기간 실적과 변화 흐름을 바로 확인할
                  수 있습니다.
                </p>
                <div className="mt-8 rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Period
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">
                    {dashboard?.periodLabel ?? '-'}
                  </p>
                </div>
              </div>

              <div className="p-6">
                <div className="rounded-[28px] bg-gradient-to-r from-[#63e3c4] via-[#58c6e8] to-[#6faeff] p-[1px]">
                  <div className="rounded-[27px] bg-white px-5 py-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <label className="flex min-w-[160px] flex-col gap-1">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Start Date
                        </span>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(event) => setDateFrom(event.target.value)}
                          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400"
                        />
                      </label>
                      <label className="flex min-w-[160px] flex-col gap-1">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          End Date
                        </span>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(event) => setDateTo(event.target.value)}
                          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-sky-400"
                        />
                      </label>
                      <div className="ml-auto flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleAnalyzeDashboard()}
                          className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          분석 보기
                        </button>
                        <button
                          type="button"
                          onClick={() => void loadDashboard({})}
                          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          최신화
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {(dashboard?.metrics ?? []).map((metric) => (
                    <MetricCard key={metric.id} metric={metric} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {loading && (
            <section className="rounded-[28px] border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm">
              관리자 대시보드를 불러오는 중입니다.
            </section>
          )}

          {error && (
            <section className="rounded-[28px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-600 shadow-sm">
              {error}
            </section>
          )}

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(dashboard?.chartGroups ?? []).map((chart) => (
                  <button
                    key={chart.id}
                    type="button"
                    onClick={() => setActiveChartId(chart.id as ChartTabId)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeChart?.id === chart.id
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {chart.label}
                  </button>
                ))}
              </div>

              <DashboardLineChart
                title={`${activeChart?.label ?? '지표'} 기간 비교`}
                eyebrow="Trend View"
                description={
                  activeChart?.description ??
                  '선택한 기간의 지표 흐름을 날짜별로 보여줍니다.'
                }
                periodLabel={dashboard?.periodLabel ?? '-'}
                unit={activeChart?.unit ?? 'count'}
                points={activeChart?.points ?? []}
              />

              <div className="grid gap-4 md:grid-cols-3">
                <CompactStatCard
                  label="조회 기간 총합"
                  value={formatPointValue(
                    chartSnapshot.totalCurrent,
                    activeChart?.unit ?? 'count',
                  )}
                />
                <CompactStatCard
                  label="조회 기간 최고 피크"
                  value={formatPointValue(
                    chartSnapshot.peak,
                    activeChart?.unit ?? 'count',
                  )}
                  tone="accent"
                />
              </div>
            </div>

            <div className="space-y-6">
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(39,64,120,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Snapshot
                </p>
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <div className="text-sm text-slate-500">조회 기간 합계</div>
                    <div className="mt-2 text-3xl font-semibold text-slate-900">
                      {formatPointValue(
                        chartSnapshot.totalCurrent,
                        activeChart?.unit ?? 'count',
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-r from-[#61e4c5] to-[#54a8ff] px-4 py-4 text-white">
                    <div className="text-sm text-white/80">
                      조회 기간 최고 피크
                    </div>
                    <div className="mt-2 text-2xl font-semibold">
                      {formatPointValue(
                        chartSnapshot.peak,
                        activeChart?.unit ?? 'count',
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <SummaryPanel
                title="회원 상태"
                subtitle="전체 회원 기반 운영 상태를 한 번에 확인합니다."
                rows={dashboard?.memberStats ?? []}
              />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(39,64,120,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    매출/정산 세부 내역
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    상단에서 선택한 날짜 기준으로 함께 갱신됩니다.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {breakdownRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm text-slate-600">{row.label}</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {breakdownLoading && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  세부 내역을 불러오는 중입니다.
                </div>
              )}

              {breakdownError && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {breakdownError}
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_50px_rgba(39,64,120,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                Recent Activities
              </p>
              <p className="mt-2 text-sm text-slate-500">
                최근 관리자 활동 로그를 요약해 운영 이상 징후를 빠르게 봅니다.
              </p>
              <div className="mt-6 space-y-3">
                {(dashboard?.recentActivities ?? []).map((activity) => (
                  <div
                    key={`${activity.timestamp}-${activity.title}`}
                    className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {activity.title}
                      </p>
                      <span className="text-xs text-slate-400">
                        {activity.timestamp}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {activity.description}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl bg-slate-900 px-4 py-4 text-sm text-slate-100">
                {dashboard?.todaySummary ?? '운영 요약을 계산 중입니다.'}
              </div>
            </section>
          </section>
        </div>
      </div>
    </>
  );
}
