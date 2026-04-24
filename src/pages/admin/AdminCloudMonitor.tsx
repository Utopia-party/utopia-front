import { useEffect, useState, useCallback, useRef } from 'react';
import AdminHeader from './components/AdminHeader';

const API = '/api/admin/cloud-monitor';

// ── 서버 역할 매핑 (이름 기반) ──
const SERVER_ROLE: Record<string, { label: string; color: string }> = {
  front:   { label: 'Frontend',  color: 'bg-blue-100 text-blue-700' },
  backe:   { label: 'Backend',   color: 'bg-violet-100 text-violet-700' },
  db:      { label: 'DB',        color: 'bg-amber-100 text-amber-700' },
  gpu:     { label: 'GPU',       color: 'bg-emerald-100 text-emerald-700' },
};

function getRoleTag(name: string) {
  for (const [key, val] of Object.entries(SERVER_ROLE)) {
    if (name.toLowerCase().includes(key)) return val;
  }
  return null;
}

// ── 타입 ──
type PromResult = { metric: Record<string, string>; value?: [number, string]; values?: [number, string][] };
type SummaryMetrics = { cpu: PromResult[]; mem: PromResult[]; mem_used: PromResult[]; mem_total: PromResult[]; net_in: PromResult[]; net_out: PromResult[]; disk: PromResult[]; disk_used: PromResult[]; disk_total: PromResult[] };
type RangePoint = { ts: number; val: number };

// ── ID → 서버 이름 매핑 (카카오클라우드 VM instance_id 기준) ──
const INSTANCE_NAME_MAP: Record<string, string> = {
  '0a54afc2-6d12-47a8-ac89-0f9a7c912805': 't1_4vm_t1i_large_front',
  '21806463-9d53-48c6-81ef-fcf0ae960592': 't1_3vm_t1i_large_db',
  'b3b9f672-01bd-4189-b8a3-6cfd8437abd3': 't1_2vm_t1i_xlarge_backend',
  '3fd334a5-c5cc-49d9-84d5-f8918fb74196': 't1_1vm_gpu_gn1i_4xlarge',
};

// ── 레이블에서 인스턴스명 추출 ──
function instanceName(r: PromResult): string {
  const m = r.metric;
  const id = m?.instance_id;
  if (id && INSTANCE_NAME_MAP[id]) return INSTANCE_NAME_MAP[id];
  return (
    m?.instance_name ?? m?.display_name ?? m?.name ??
    m?.hostname ?? m?.host ?? m?.instance ??
    m?.resource_id ?? id ?? '알 수 없음'
  );
}

// ── 유틸 ──
function metricVal(r: PromResult): number { return parseFloat(r.value?.[1] ?? '0') || 0; }
function avgOf(arr: PromResult[]) { return arr.length ? arr.reduce((s, r) => s + metricVal(r), 0) / arr.length : 0; }
function maxOf(arr: PromResult[]) { return arr.length ? Math.max(...arr.map(metricVal)) : 0; }
function sumOf(arr: PromResult[]) { return arr.reduce((s, r) => s + metricVal(r), 0); }

function fmtBytes(b: number) {
  if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB/s`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB/s`;
  return `${b.toFixed(0)} B/s`;
}
function fmtPct(v: number) { return `${v.toFixed(1)}%`; }
function fmtGB(bytes: number) {
  if (bytes <= 0) return null;
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}
function fmtDatetime(d: Date) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 `
    + `${String(d.getHours()).padStart(2, '0')}시 `
    + `${String(d.getMinutes()).padStart(2, '0')}분 `
    + `${String(d.getSeconds()).padStart(2, '0')}초`;
}
function statusColor(pct: number) {
  if (pct >= 90) return 'text-red-600';
  if (pct >= 70) return 'text-amber-500';
  return 'text-emerald-600';
}
function barColor(pct: number) {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 70) return 'bg-amber-400';
  return 'bg-emerald-500';
}

// ── 스파크라인 ──
function SparkLine({ data, color = '#6366f1', height = 48 }: { data: RangePoint[]; color?: string; height?: number }) {
  if (data.length < 2) return (
    <div className="flex items-center justify-center text-xs text-gray-300" style={{ height }}>
      데이터 없음
    </div>
  );
  const W = 300, H = height, P = 3;
  const vals = data.map(d => d.val);
  const min = Math.min(...vals), max = Math.max(...vals) || 1;
  const xs = data.map((_, i) => P + (i / (data.length - 1)) * (W - P * 2));
  const ys = vals.map(v => H - P - ((v - min) / (max - min || 1)) * (H - P * 2));
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const fill = `${path} L${xs[xs.length - 1].toFixed(1)},${H} L${xs[0].toFixed(1)},${H} Z`;
  const gradId = `grad_${color.replace('#', '')}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx={xs[xs.length - 1].toFixed(1)} cy={ys[ys.length - 1].toFixed(1)} r="3" fill={color} />
      <text x={W - P} y={P + 10} textAnchor="end" fontSize="9" fill={color} fontWeight="600">
        {vals[vals.length - 1].toFixed(1)}
      </text>
    </svg>
  );
}

// ── 게이지 바 ──
function GaugeBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${barColor(Math.min(100, value))}`}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

// ── 요약 카드 ──
function SummaryCard({ title, value, sub, color, spark }: {
  title: string; value: string; sub?: string; color: string; spark?: RangePoint[];
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-1.5">
      <p className="text-xs font-medium text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
      {spark && <SparkLine data={spark} color={color} height={36} />}
    </div>
  );
}

// ── 메인 컴포넌트 ──
export default function AdminCloudMonitor() {
  const [summary, setSummary] = useState<SummaryMetrics | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveActive, setLiveActive] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [rangeData, setRangeData] = useState<Record<string, RangePoint[]>>({});
  const [rangeLoading, setRangeLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('cpu_usage');
  const [selectedPeriod, setSelectedPeriod] = useState('1h');

  const PERIOD_MAP: Record<string, { seconds: number; step: string }> = {
    '30m': { seconds: 1800, step: '30' },
    '1h':  { seconds: 3600, step: '60' },
    '3h':  { seconds: 10800, step: '120' },
    '6h':  { seconds: 21600, step: '300' },
    '24h': { seconds: 86400, step: '600' },
  };

  const METRIC_OPTIONS = [
    { value: 'cpu_usage',               label: 'CPU 사용률',        color: '#6366f1' },
    { value: 'cpu_usage_user',          label: 'CPU User',          color: '#818cf8' },
    { value: 'cpu_usage_system',        label: 'CPU System',        color: '#a5b4fc' },
    { value: 'mem_usage',               label: '메모리 사용률',     color: '#0ea5e9' },
    { value: 'network_rx_bytes_persec', label: '인바운드 트래픽',   color: '#10b981' },
    { value: 'network_tx_bytes_persec', label: '아웃바운드 트래픽', color: '#f59e0b' },
    { value: 'disk_used_percent',       label: '디스크 사용률',     color: '#ef4444' },
    { value: 'disk_read_bytes_persec',  label: '디스크 읽기',       color: '#f97316' },
    { value: 'disk_write_bytes_persec', label: '디스크 쓰기',       color: '#fb923c' },
  ];

  const currentColor = METRIC_OPTIONS.find(o => o.value === selectedMetric)?.color ?? '#6366f1';

  const loadSummary = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(API + '/summary');
      const data = await res.json();
      if (res.ok) { setSummary(data.metrics); setErrors(data.errors ?? []); }
      else setErrors([data.detail ?? '조회 실패']);
    } catch { setErrors(['네트워크 오류']); }
    setLastUpdated(new Date());
    if (!silent) setLoading(false);
  }, []);

  const loadRange = useCallback(async (metric: string, period: string) => {
    setRangeLoading(true);
    const { seconds, step } = PERIOD_MAP[period] ?? PERIOD_MAP['1h'];
    const now = Math.floor(Date.now() / 1000);
    try {
      const res = await fetch(`${API}/range?metric=${metric}&start=${now - seconds}&end=${now}&step=${step}`);
      const data = await res.json();
      if (res.ok) {
        const pts: RangePoint[] = [];
        for (const s of data.result ?? [])
          for (const [ts, val] of s.values ?? [])
            pts.push({ ts: (ts as number) * 1000, val: parseFloat(val as string) || 0 });
        pts.sort((a, b) => a.ts - b.ts);
        setRangeData(prev => ({ ...prev, [`${metric}_${period}`]: pts }));
      }
    } catch {}
    setRangeLoading(false);
  }, []);

  useEffect(() => { void loadSummary(); }, [loadSummary]);

  // 5초 실시간 갱신
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (liveActive) intervalRef.current = setInterval(() => void loadSummary(true), 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [liveActive, loadSummary]);

  useEffect(() => { void loadRange(selectedMetric, selectedPeriod); }, [selectedMetric, selectedPeriod, loadRange]);

  // 서버별 집계
  const serverMap: Record<string, { cpu: number; mem: number; memUsed: number; memTotal: number; netIn: number; netOut: number; disk: number; diskUsed: number; diskTotal: number }> = {};
  if (summary) {
    const merge = (arr: PromResult[], key: 'cpu' | 'mem' | 'memUsed' | 'memTotal' | 'netIn' | 'netOut' | 'disk' | 'diskUsed' | 'diskTotal') => {
      for (const r of arr) {
        const k = instanceName(r);
        if (!serverMap[k]) serverMap[k] = { cpu: 0, mem: 0, memUsed: 0, memTotal: 0, netIn: 0, netOut: 0, disk: 0, diskUsed: 0, diskTotal: 0 };
        serverMap[k][key] = metricVal(r);
      }
    };
    merge(summary.cpu, 'cpu');
    merge(summary.mem, 'mem');
    merge(summary.mem_used ?? [], 'memUsed');
    merge(summary.mem_total ?? [], 'memTotal');
    merge(summary.net_in, 'netIn');
    merge(summary.net_out, 'netOut');
    merge(summary.disk, 'disk');
    merge(summary.disk_used ?? [], 'diskUsed');
    merge(summary.disk_total ?? [], 'diskTotal');
  }
  const servers = Object.entries(serverMap);
  const currentRange = rangeData[`${selectedMetric}_${selectedPeriod}`] ?? [];
  const cpuSpark = rangeData[`cpu_usage_${selectedPeriod}`] ?? [];
  const memSpark = rangeData[`mem_usage_${selectedPeriod}`] ?? [];

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
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">클라우드 모니터링</h1>
              <p className="mt-0.5 text-sm text-gray-400">
                카카오클라우드 서버 리소스 실시간 현황
                {lastUpdated && <span className="ml-2 text-gray-300">· {fmtDatetime(lastUpdated)} 갱신</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLiveActive(v => !v)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                  liveActive
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-white text-gray-500'
                }`}
              >
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${liveActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                {liveActive ? '실시간 ON' : '실시간 OFF'}
              </button>
              <button
                onClick={() => void loadSummary()}
                disabled={loading}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                {loading ? '갱신 중...' : '새로고침'}
              </button>
            </div>
          </div>

          {/* 오류 배너 */}
          {errors.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 space-y-1">
              <p className="font-semibold">일부 메트릭을 가져오지 못했습니다.</p>
              {errors.map((e, i) => <p key={i} className="text-xs opacity-80">{e}</p>)}
              <p className="text-xs opacity-60 mt-1">.env에 KAKAO_CLOUD_* 키 3개 설정이 필요합니다.</p>
            </div>
          )}

          {/* 요약 카드 */}
          {loading && !summary ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : summary ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <SummaryCard title="평균 CPU"    value={fmtPct(avgOf(summary.cpu))}      sub={`최대 ${fmtPct(maxOf(summary.cpu))}`}   color="#6366f1" spark={cpuSpark} />
              <SummaryCard title="평균 메모리" value={fmtPct(avgOf(summary.mem))}      sub={`최대 ${fmtPct(maxOf(summary.mem))}`}   color="#0ea5e9" spark={memSpark} />
              <SummaryCard title="인바운드"    value={fmtBytes(sumOf(summary.net_in))} sub="전체 합산"                              color="#10b981" />
              <SummaryCard title="아웃바운드"  value={fmtBytes(sumOf(summary.net_out))} sub="전체 합산"                             color="#f59e0b" />
              <SummaryCard title="평균 디스크" value={fmtPct(avgOf(summary.disk))}     sub={`최대 ${fmtPct(maxOf(summary.disk))}`}  color="#ef4444" />
            </div>
          ) : null}

          {/* 리소스 추이 */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-bold text-gray-800">리소스 추이</p>
                <p className="text-xs text-gray-400">서버 전체 합산 기준</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={selectedMetric}
                  onChange={e => setSelectedMetric(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 bg-white"
                >
                  {METRIC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  {Object.keys(PERIOD_MAP).map(p => (
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
            <div className="relative h-32">
              {rangeLoading ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">불러오는 중...</div>
              ) : currentRange.length > 1 ? (
                <SparkLine data={currentRange} color={currentColor} height={128} />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                  데이터가 없습니다. 에이전트 설치 여부를 확인해 주세요.
                </div>
              )}
            </div>
          </div>

          {/* 서버별 리소스 테이블 */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800">서버별 리소스 현황</p>
                {lastUpdated ? (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {fmtDatetime(lastUpdated)} 기준
                    {liveActive && <span className="ml-1.5 text-emerald-500">· 5초마다 갱신</span>}
                  </p>
                ) : null}
              </div>
            </div>

            {servers.length === 0 && !loading ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400">
                서버 데이터가 없습니다.<br />
                <span className="text-xs">카카오클라우드 콘솔에서 모니터링 에이전트 설치 여부를 확인해 주세요.</span>
                <br />
                <a
                  href={`${API}/debug/labels`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 underline mt-1 inline-block"
                >
                  레이블 디버그 확인
                </a>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['인스턴스', '역할', 'CPU', '메모리', '인바운드', '아웃바운드', '디스크'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {servers.map(([label, s]) => {
                      const role = getRoleTag(label);
                      return (
                        <tr key={label} className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors">
                          <td className="px-4 py-3 text-sm font-mono text-gray-700 truncate max-w-[180px]">{label}</td>
                          <td className="px-4 py-3">
                            {role
                              ? <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${role.color}`}>{role.label}</span>
                              : <span className="text-xs text-gray-300">-</span>
                            }
                          </td>
                          <td className="px-4 py-3 min-w-[130px]">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold w-14 text-right tabular-nums ${statusColor(s.cpu)}`}>{fmtPct(s.cpu)}</span>
                              <div className="flex-1"><GaugeBar value={s.cpu} /></div>
                            </div>
                          </td>
                          <td className="px-4 py-3 min-w-[150px]">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold w-14 text-right tabular-nums ${statusColor(s.mem)}`}>{fmtPct(s.mem)}</span>
                              <div className="flex-1"><GaugeBar value={s.mem} /></div>
                            </div>
                            {fmtGB(s.memUsed) && fmtGB(s.memTotal) && (
                              <p className="text-xs text-gray-400 mt-0.5 text-right tabular-nums">{fmtGB(s.memUsed)} / {fmtGB(s.memTotal)}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right tabular-nums whitespace-nowrap">{fmtBytes(s.netIn)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right tabular-nums whitespace-nowrap">{fmtBytes(s.netOut)}</td>
                          <td className="px-4 py-3 min-w-[150px]">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold w-14 text-right tabular-nums ${statusColor(s.disk)}`}>{fmtPct(s.disk)}</span>
                              <div className="flex-1"><GaugeBar value={s.disk} /></div>
                            </div>
                            {fmtGB(s.diskUsed) && fmtGB(s.diskTotal) && (
                              <p className="text-xs text-gray-400 mt-0.5 text-right tabular-nums">{fmtGB(s.diskUsed)} / {fmtGB(s.diskTotal)}</p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
