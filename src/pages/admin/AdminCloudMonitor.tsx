import { useEffect, useState, useCallback } from 'react';
import AdminHeader from './components/AdminHeader';

const API = '/api/admin/cloud-monitor';

// ── 타입 ──
type PromMetricResult = {
  metric: Record<string, string>;
  value?: [number, string];
  values?: [number, string][];
};

type SummaryMetrics = {
  cpu: PromMetricResult[];
  mem: PromMetricResult[];
  net_in: PromMetricResult[];
  net_out: PromMetricResult[];
  disk: PromMetricResult[];
};

type RangePoint = { ts: number; val: number };

// ── 유틸 ──
function metricVal(r: PromMetricResult): number {
  if (!r.value) return 0;
  return parseFloat(r.value[1]) || 0;
}

function instanceName(r: PromMetricResult): string {
  return r.metric?.instance || r.metric?.hostname || r.metric?.host || '알 수 없음';
}

function fmtBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB/s`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
  return `${bytes.toFixed(0)} B/s`;
}

function fmtPct(v: number): string {
  return `${v.toFixed(1)}%`;
}

function statusColor(pct: number): string {
  if (pct >= 90) return 'text-red-600';
  if (pct >= 70) return 'text-amber-500';
  return 'text-emerald-600';
}

function barColor(pct: number): string {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 70) return 'bg-amber-400';
  return 'bg-emerald-500';
}

// ── 미니 라인차트 (SVG) ──
function SparkLine({ data, color = '#6366f1' }: { data: RangePoint[]; color?: string }) {
  if (data.length < 2) return <div className="h-10 flex items-center text-xs text-gray-300">데이터 없음</div>;
  const W = 200, H = 40, PAD = 2;
  const vals = data.map((d) => d.val);
  const min = Math.min(...vals);
  const max = Math.max(...vals) || 1;
  const xs = data.map((_, i) => PAD + (i / (data.length - 1)) * (W - PAD * 2));
  const ys = vals.map((v) => H - PAD - ((v - min) / (max - min || 1)) * (H - PAD * 2));
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');
  const fill = `${path} L${xs[xs.length - 1]},${H} L${xs[0]},${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-10" preserveAspectRatio="none">
      <path d={fill} fill={color} fillOpacity={0.15} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

// ── 게이지 바 ──
function GaugeBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${barColor(pct)}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── 메트릭 카드 ──
function MetricCard({
  title, value, subtitle, spark, sparkColor,
}: {
  title: string; value: string; subtitle?: string; spark?: RangePoint[]; sparkColor?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-gray-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      {spark && spark.length > 1 && (
        <div className="mt-2">
          <SparkLine data={spark} color={sparkColor} />
        </div>
      )}
    </div>
  );
}

// ── 서버 행 ──
function ServerRow({ label, cpu, mem, netIn, netOut, disk }: {
  label: string; cpu: number; mem: number; netIn: number; netOut: number; disk: number;
}) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
      <td className="px-4 py-3 text-sm font-mono text-gray-700 truncate max-w-[160px]">{label}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold w-14 text-right ${statusColor(cpu)}`}>{fmtPct(cpu)}</span>
          <div className="flex-1"><GaugeBar value={cpu} /></div>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold w-14 text-right ${statusColor(mem)}`}>{fmtPct(mem)}</span>
          <div className="flex-1"><GaugeBar value={mem} /></div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 text-right">{fmtBytes(netIn)}</td>
      <td className="px-4 py-3 text-sm text-gray-600 text-right">{fmtBytes(netOut)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold w-14 text-right ${statusColor(disk)}`}>{fmtPct(disk)}</span>
          <div className="flex-1"><GaugeBar value={disk} /></div>
        </div>
      </td>
    </tr>
  );
}

// ── 메인 컴포넌트 ──
export default function AdminCloudMonitor() {
  const [summary, setSummary] = useState<SummaryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const [rangeData, setRangeData] = useState<Record<string, RangePoint[]>>({});
  const [rangeLoading, setRangeLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('cpu_usage');
  const [selectedPeriod, setSelectedPeriod] = useState('1h');

  const PERIOD_MAP: Record<string, { seconds: number; step: string }> = {
    '30m': { seconds: 1800, step: '30' },
    '1h': { seconds: 3600, step: '60' },
    '3h': { seconds: 10800, step: '120' },
    '6h': { seconds: 21600, step: '300' },
    '24h': { seconds: 86400, step: '600' },
  };

  const METRIC_OPTIONS = [
    { value: 'cpu_usage', label: 'CPU 사용률' },
    { value: 'mem_usage', label: '메모리 사용률' },
    { value: 'network_rx_bytes_persec', label: '인바운드 트래픽' },
    { value: 'network_tx_bytes_persec', label: '아웃바운드 트래픽' },
    { value: 'disk_used_percent', label: '디스크 사용률' },
  ];

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API + '/summary');
      const data = await res.json();
      if (res.ok) {
        setSummary(data.metrics);
        setErrors(data.errors || []);
      } else {
        setErrors([data.detail || '조회 실패']);
      }
    } catch (e) {
      setErrors(['네트워크 오류']);
    }
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  const loadRange = useCallback(async (metric: string, period: string) => {
    setRangeLoading(true);
    const { seconds, step } = PERIOD_MAP[period] ?? PERIOD_MAP['1h'];
    const now = Math.floor(Date.now() / 1000);
    const start = now - seconds;
    try {
      const res = await fetch(
        `${API}/range?metric=${metric}&start=${start}&end=${now}&step=${step}`,
      );
      const data = await res.json();
      if (res.ok) {
        const combined: RangePoint[] = [];
        for (const series of data.result ?? []) {
          for (const [ts, val] of series.values ?? []) {
            combined.push({ ts: ts * 1000, val: parseFloat(val) || 0 });
          }
        }
        combined.sort((a, b) => a.ts - b.ts);
        setRangeData((prev) => ({ ...prev, [`${metric}_${period}`]: combined }));
      }
    } catch {}
    setRangeLoading(false);
  }, []);

  useEffect(() => {
    void loadSummary();
    const interval = setInterval(() => void loadSummary(), 30000);
    return () => clearInterval(interval);
  }, [loadSummary]);

  useEffect(() => {
    void loadRange(selectedMetric, selectedPeriod);
  }, [selectedMetric, selectedPeriod, loadRange]);

  // 서버별 집계
  const serverMap: Record<string, { cpu: number; mem: number; netIn: number; netOut: number; disk: number }> = {};
  if (summary) {
    for (const r of summary.cpu) {
      const k = instanceName(r);
      if (!serverMap[k]) serverMap[k] = { cpu: 0, mem: 0, netIn: 0, netOut: 0, disk: 0 };
      serverMap[k].cpu = metricVal(r);
    }
    for (const r of summary.mem) {
      const k = instanceName(r);
      if (!serverMap[k]) serverMap[k] = { cpu: 0, mem: 0, netIn: 0, netOut: 0, disk: 0 };
      serverMap[k].mem = metricVal(r);
    }
    for (const r of summary.net_in) {
      const k = instanceName(r);
      if (!serverMap[k]) serverMap[k] = { cpu: 0, mem: 0, netIn: 0, netOut: 0, disk: 0 };
      serverMap[k].netIn = metricVal(r);
    }
    for (const r of summary.net_out) {
      const k = instanceName(r);
      if (!serverMap[k]) serverMap[k] = { cpu: 0, mem: 0, netIn: 0, netOut: 0, disk: 0 };
      serverMap[k].netOut = metricVal(r);
    }
    for (const r of summary.disk) {
      const k = instanceName(r);
      if (!serverMap[k]) serverMap[k] = { cpu: 0, mem: 0, netIn: 0, netOut: 0, disk: 0 };
      serverMap[k].disk = metricVal(r);
    }
  }

  const servers = Object.entries(serverMap);

  // 요약 평균
  const avgOf = (arr: PromMetricResult[]) =>
    arr.length ? arr.reduce((s, r) => s + metricVal(r), 0) / arr.length : 0;
  const maxOf = (arr: PromMetricResult[]) =>
    arr.length ? Math.max(...arr.map(metricVal)) : 0;
  const sumOf = (arr: PromMetricResult[]) =>
    arr.reduce((s, r) => s + metricVal(r), 0);

  const currentRangeKey = `${selectedMetric}_${selectedPeriod}`;
  const currentRange = rangeData[currentRangeKey] ?? [];

  return (
    <>
      <AdminHeader
        placeholder="서버 검색..."
        onSearch={() => {}}
        rightContent={
          <span className="rounded-md border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-sm font-semibold text-blue-700">
            클라우드 모니터링
          </span>
        }
      />

      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">클라우드 모니터링</h1>
              <p className="mt-1 text-sm text-gray-400">
                카카오클라우드 서버 리소스 실시간 현황
                {lastUpdated && (
                  <span className="ml-2 text-gray-300">
                    · 마지막 갱신 {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => void loadSummary()}
              disabled={loading}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
            >
              {loading ? '갱신 중...' : '새로고침'}
            </button>
          </div>

          {/* 오류 */}
          {errors.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 space-y-1">
              <p className="font-semibold">일부 메트릭을 가져오지 못했습니다.</p>
              {errors.map((e, i) => <p key={i} className="text-xs opacity-80">{e}</p>)}
              <p className="text-xs mt-1 opacity-70">
                .env에 KAKAO_CLOUD_PROJECT_ID / KAKAO_CLOUD_CREDENTIAL_ID / KAKAO_CLOUD_CREDENTIAL_SECRET 설정이 필요합니다.
              </p>
            </div>
          )}

          {/* 요약 카드 */}
          {loading && !summary ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : summary ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <MetricCard
                title="평균 CPU"
                value={fmtPct(avgOf(summary.cpu))}
                subtitle={`최대 ${fmtPct(maxOf(summary.cpu))}`}
                sparkColor="#6366f1"
              />
              <MetricCard
                title="평균 메모리"
                value={fmtPct(avgOf(summary.mem))}
                subtitle={`최대 ${fmtPct(maxOf(summary.mem))}`}
                sparkColor="#0ea5e9"
              />
              <MetricCard
                title="인바운드"
                value={fmtBytes(sumOf(summary.net_in))}
                subtitle="전체 합산"
                sparkColor="#10b981"
              />
              <MetricCard
                title="아웃바운드"
                value={fmtBytes(sumOf(summary.net_out))}
                subtitle="전체 합산"
                sparkColor="#f59e0b"
              />
              <MetricCard
                title="평균 디스크"
                value={fmtPct(avgOf(summary.disk))}
                subtitle={`최대 ${fmtPct(maxOf(summary.disk))}`}
                sparkColor="#ef4444"
              />
            </div>
          ) : null}

          {/* 시계열 차트 */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-bold text-gray-800">시계열 추이</p>
                <p className="text-xs text-gray-400">서버 전체 합산 기준</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 bg-white"
                >
                  {METRIC_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  {Object.keys(PERIOD_MAP).map((p) => (
                    <button
                      key={p}
                      onClick={() => setSelectedPeriod(p)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                        selectedPeriod === p ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {rangeLoading ? (
              <div className="h-32 flex items-center justify-center text-sm text-gray-400">불러오는 중...</div>
            ) : currentRange.length > 1 ? (
              <div className="h-32">
                <SparkLine
                  data={currentRange}
                  color={
                    selectedMetric.includes('cpu') ? '#6366f1' :
                    selectedMetric.includes('mem') ? '#0ea5e9' :
                    selectedMetric.includes('rx') ? '#10b981' :
                    selectedMetric.includes('tx') ? '#f59e0b' : '#ef4444'
                  }
                />
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-sm text-gray-400">
                데이터가 없습니다. 모니터링 에이전트 설치 여부를 확인해 주세요.
              </div>
            )}
          </div>

          {/* 서버별 상세 테이블 */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-800">서버별 리소스 현황</p>
              <p className="text-xs text-gray-400 mt-0.5">30초 자동 갱신</p>
            </div>
            {servers.length === 0 && !loading ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400">
                서버 데이터가 없습니다.<br />
                <span className="text-xs">카카오클라우드 콘솔에서 모니터링 에이전트가 설치되어 있는지 확인해 주세요.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['인스턴스', 'CPU', '메모리', '인바운드', '아웃바운드', '디스크'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {servers.map(([label, s]) => (
                      <ServerRow key={label} label={label} {...s} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
