import { useCallback, useEffect, useMemo, useState } from 'react';
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
    <div className="w-full min-w-0 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(36,54,94,0.08)] md:p-6">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-500">
            {eyebrow}
          </p>

          <h2 className="mt-1 text-xl font-semibold text-slate-900 break-keep md:mt-2 md:text-2xl">
            {title}
          </h2>

          <p className="mt-1.5 text-xs text-slate-500 break-keep md:mt-2 md:text-sm">
            {description}
          </p>
        </div>

        <div className="grid shrink-0 gap-2 text-xs text-slate-600 md:text-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-sky-500 md:h-2.5 md:w-2.5" />
            <span className="wrap-break-word">{periodLabel}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 w-full min-w-0 overflow-hidden md:mt-8">
        <svg
          viewBox={`0 0 ${viewWidth} ${labelY + 16}`}
          className="h-55 w-full min-w-0 sm:h-65 md:h-70"
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
    <article className="relative min-w-0 overflow-hidden rounded-3xl border border-white/50 bg-white p-5 shadow-[0_20px_50px_rgba(39,64,120,0.10)] transition-transform hover:-translate-y-1 md:rounded-[28px] md:p-6">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${accent}`}
      />

      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 md:text-xs">
            {metric.label}
          </p>

          <p className="mt-3 break-all text-2xl font-semibold tracking-tight text-slate-900 md:mt-4 md:text-3xl">
            {metric.value}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-500 break-keep md:mt-4 md:text-sm">
        {metric.helper}
      </p>
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
    <section className="w-full min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(39,64,120,0.08)] md:rounded-[28px] md:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 md:text-xs">
        {title}
      </p>

      <p className="mt-1.5 text-xs text-slate-500 break-keep md:mt-2 md:text-sm">
        {subtitle}
      </p>

      <div className="mt-5 space-y-2.5 md:mt-6 md:space-y-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex min-w-0 flex-col gap-1 rounded-xl bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:rounded-2xl"
          >
            <span className="text-xs text-slate-600 md:text-sm">
              {row.label}
            </span>

            <span className="wrap-break-word text-xs font-semibold text-slate-900 sm:text-right md:text-sm">
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
      className={`flex min-w-0 flex-col justify-center rounded-[20px] border p-4 shadow-[0_14px_30px_rgba(39,64,120,0.06)] md:rounded-3xl md:p-5 ${
        tone === 'accent'
          ? 'border-cyan-100 bg-linear-to-r from-[#61e4c5] to-[#54a8ff] text-white'
          : 'border-slate-200 bg-white text-slate-900'
      }`}
    >
      <div
        className={`text-[10px] font-semibold uppercase tracking-[0.22em] md:text-xs ${
          tone === 'accent' ? 'text-white/75' : 'text-slate-400'
        }`}
      >
        {label}
      </div>

      <div className="mt-2 break-all text-xl font-semibold tracking-tight md:mt-3 md:text-3xl">
        {value}
      </div>
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

  const loadDashboard = useCallback(
    async (
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
    },
    [dateFrom, dateTo, compareMode],
  );

  useEffect(() => {
    void loadDashboard();

    const timer = setInterval(() => {
      void loadDashboard();
    }, 30_000);

    return () => clearInterval(timer);
  }, [loadDashboard]);

  const loadBreakdownDashboard = useCallback(
    async (
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
    },
    [dateFrom, dateTo, breakdownCompareMode],
  );

  useEffect(() => {
    void loadBreakdownDashboard();

    const timer = setInterval(() => {
      void loadBreakdownDashboard();
    }, 30_000);

    return () => clearInterval(timer);
  }, [loadBreakdownDashboard]);

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
    <div className="flex w-full min-w-0 flex-1 flex-col overflow-x-hidden">
      <AdminHeader
        placeholder="관리자 검색..."
        rightContent={
          <span className="hidden rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700 sm:inline-block">
            비교형 분석 대시보드
          </span>
        }
      />

      <div className="w-full min-w-0 flex-1 overflow-x-hidden bg-[#f5f5f5] p-4 sm:p-6 md:p-8">
        <div className="mx-auto w-full min-w-0 max-w-7xl space-y-5 md:space-y-6">
          <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-white/70 bg-white/80 shadow-[0_35px_90px_rgba(39,64,120,0.12)] backdrop-blur md:rounded-4xl">
            <div className="grid w-full min-w-0 grid-cols-1 gap-0 2xl:grid-cols-[260px_minmax(0,1fr)]">
              <div className="min-w-0 border-b border-slate-200/80 bg-white/90 p-5 md:p-6 2xl:border-b-0 2xl:border-r">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400 md:text-xs">
                  Dashboard
                </p>

                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 break-keep md:mt-4 md:text-3xl">
                  통계 대시보드
                </h1>

                <p className="mt-2 text-xs leading-relaxed text-slate-500 break-keep md:mt-3 md:text-sm">
                  날짜 범위를 선택하면 해당 기간 실적과 변화 흐름을 바로 확인할
                  수 있습니다.
                </p>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4 md:mt-8 md:rounded-3xl">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 md:text-xs">
                    Period
                  </p>

                  <p className="mt-1 wrap-break-word text-base font-semibold text-slate-900 md:mt-2 md:text-lg">
                    {dashboard?.periodLabel ?? '-'}
                  </p>
                </div>
              </div>

              <div className="min-w-0 p-4 md:p-6">
                <div className="rounded-2xl bg-linear-to-r from-[#63e3c4] via-[#58c6e8] to-[#6faeff] p-px md:rounded-[28px]">
                  <div className="rounded-[15px] bg-white p-4 md:rounded-[27px] md:px-5 md:py-4">
                    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                      <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row">
                        <label className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 md:text-xs">
                            Start Date
                          </span>

                          <input
                            type="date"
                            value={dateFrom}
                            onChange={(event) =>
                              setDateFrom(event.target.value)
                            }
                            className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-400 md:rounded-2xl md:px-4 md:py-3"
                          />
                        </label>

                        <label className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 md:text-xs">
                            End Date
                          </span>

                          <input
                            type="date"
                            value={dateTo}
                            onChange={(event) => setDateTo(event.target.value)}
                            className="w-full min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-400 md:rounded-2xl md:px-4 md:py-3"
                          />
                        </label>
                      </div>

                      <div className="flex w-full min-w-0 gap-2 sm:ml-auto sm:w-auto">
                        <button
                          type="button"
                          onClick={() => void handleAnalyzeDashboard()}
                          className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-95 sm:flex-none md:rounded-2xl md:px-5 md:py-3"
                        >
                          분석 보기
                        </button>

                        <button
                          type="button"
                          onClick={() => void loadDashboard({})}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 active:scale-95 sm:flex-none md:rounded-2xl md:px-5 md:py-3"
                        >
                          최신화
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 md:mt-6 md:gap-4 2xl:grid-cols-4">
                  {(dashboard?.metrics ?? []).map((metric) => (
                    <MetricCard key={metric.id} metric={metric} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {loading && (
            <section className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-sm md:rounded-[28px] md:px-5 md:py-4 md:text-sm">
              관리자 대시보드를 불러오는 중입니다.
            </section>
          )}

          {error && (
            <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-600 shadow-sm md:rounded-[28px] md:px-5 md:py-4 md:text-sm">
              {error}
            </section>
          )}

          <section className="grid w-full min-w-0 gap-5 md:gap-6 2xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
            <div className="min-w-0 space-y-4">
              <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                {(dashboard?.chartGroups ?? []).map((chart) => (
                  <button
                    key={chart.id}
                    type="button"
                    onClick={() => setActiveChartId(chart.id as ChartTabId)}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition active:scale-95 md:text-sm ${
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

              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4">
                <CompactStatCard
                  label="조회 기간 총합"
                  value={formatPointValue(
                    chartSnapshot.totalCurrent,
                    activeChart?.unit ?? 'count',
                  )}
                />

                <CompactStatCard
                  label="조회 최고 피크"
                  value={formatPointValue(
                    chartSnapshot.peak,
                    activeChart?.unit ?? 'count',
                  )}
                  tone="accent"
                />
              </div>
            </div>

            <div className="min-w-0 space-y-5 md:space-y-6">
              <section className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(39,64,120,0.08)] md:rounded-[28px] md:p-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 md:text-xs">
                  Snapshot
                </p>

                <div className="mt-4 space-y-3 md:mt-5 md:space-y-4">
                  <div className="rounded-xl bg-slate-50 p-4 md:rounded-2xl">
                    <div className="text-xs text-slate-500 md:text-sm">
                      조회 기간 합계
                    </div>

                    <div className="mt-1 break-all text-2xl font-semibold text-slate-900 md:mt-2 md:text-3xl">
                      {formatPointValue(
                        chartSnapshot.totalCurrent,
                        activeChart?.unit ?? 'count',
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-linear-to-r from-[#61e4c5] to-[#54a8ff] p-4 text-white md:rounded-2xl">
                    <div className="text-xs text-white/80 break-keep md:text-sm">
                      조회 기간 최고 피크
                    </div>

                    <div className="mt-1 break-all text-xl font-semibold md:mt-2 md:text-2xl">
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

          <section className="grid w-full min-w-0 gap-5 md:gap-6 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(39,64,120,0.08)] md:rounded-[28px] md:p-6">
              <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 md:text-xs">
                    매출/정산 세부 내역
                  </p>

                  <p className="mt-1.5 text-xs text-slate-500 break-keep md:mt-2 md:text-sm">
                    상단에서 선택한 날짜 기준으로 함께 갱신됩니다.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2.5 md:mt-6 md:space-y-3">
                {breakdownRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex min-w-0 flex-col gap-1 rounded-xl bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:rounded-2xl"
                  >
                    <span className="text-xs text-slate-600 md:text-sm">
                      {row.label}
                    </span>

                    <span className="wrap-break-word text-xs font-semibold text-slate-900 sm:text-right md:text-sm">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {breakdownLoading && (
                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 md:mt-4 md:rounded-2xl md:text-sm">
                  세부 내역을 불러오는 중입니다.
                </div>
              )}

              {breakdownError && (
                <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-600 md:mt-4 md:rounded-2xl md:text-sm">
                  {breakdownError}
                </div>
              )}
            </section>

            <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_20px_50px_rgba(39,64,120,0.08)] md:rounded-[28px] md:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400 md:text-xs">
                Recent Activities
              </p>

              <p className="mt-1.5 text-xs text-slate-500 break-keep md:mt-2 md:text-sm">
                최근 관리자 활동 로그를 요약해 운영 이상 징후를 빠르게 봅니다.
              </p>

              <div className="mt-5 space-y-3 md:mt-6 md:space-y-4">
                {(dashboard?.recentActivities ?? []).map((activity) => (
                  <div
                    key={`${activity.timestamp}-${activity.title}`}
                    className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-4 md:rounded-2xl"
                  >
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-semibold text-slate-900">
                        {activity.title}
                      </p>

                      <span className="shrink-0 text-[10px] text-slate-400 md:text-xs">
                        {activity.timestamp}
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-relaxed text-slate-500 break-keep md:text-sm">
                      {activity.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-slate-900 p-4 text-xs leading-relaxed text-slate-100 break-keep md:mt-5 md:rounded-2xl md:text-sm">
                {dashboard?.todaySummary ?? '운영 요약을 계산 중입니다.'}
              </div>
            </section>
          </section>
        </div>
      </div>
    </div>
  );
}
