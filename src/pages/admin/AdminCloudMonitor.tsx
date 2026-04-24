import React, { useEffect, useState, useCallback, useRef } from 'react';
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
function fmtStorage(val: number) {
  if (val <= 0) return null;
  // 카카오클라우드 disk_used/disk_total/mem_used/mem_total 단위: 바이트(B)
  if (val >= 1024 * 1024 * 1024) return `${(val / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (val >= 1024 * 1024) return `${(val / 1024 / 1024).toFixed(0)} MB`;
  if (val >= 1024) return `${(val / 1024).toFixed(0)} KB`;
  return `${val.toFixed(0)} B`;
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

// ── 스파크라인 (요약카드용 미니) ──
function SparkLine({ data, color = '#6366f1', height = 48 }: { data: RangePoint[]; color?: string; height?: number }) {
  if (data.length < 2) return (
    <div className="flex items-center justify-center text-xs text-gray-300" style={{ height }}>데이터 없음</div>
  );
  const W = 300, H = height, P = 2;
  const vals = data.map(d => d.val);
  const min = Math.min(...vals), max = Math.max(...vals) || 1;
  const xs = data.map((_, i) => P + (i / (data.length - 1)) * (W - P * 2));
  const ys = vals.map(v => H - P - ((v - min) / (max - min || 1)) * (H - P * 2));
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ');
  const fill = `${path} L${xs[xs.length - 1].toFixed(1)},${H} L${xs[0].toFixed(1)},${H} Z`;
  const gradId = `sg_${color.replace('#', '')}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fill} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ── 메인 라인 차트 (리소스 추이용 — Y축 0~100, X축 시간) ──
function LineChart({ data, color = '#6366f1', period, isBytes = false }: {
  data: RangePoint[]; color?: string; period: string; isBytes?: boolean;
}) {
  const [tooltip, setTooltip] = React.useState<{ x: number; y: number; val: number; time: string } | null>(null);

  if (data.length < 2) return (
    <div className="flex items-center justify-center h-full text-sm text-gray-400">
      데이터가 없습니다. 서버를 선택하거나 에이전트 설치를 확인해 주세요.
    </div>
  );

  const W = 800, H = 180;
  const PAD = { top: 12, right: 16, bottom: 32, left: 44 };
  const CW = W - PAD.left - PAD.right;
  const CH = H - PAD.top - PAD.bottom;

  const vals = data.map(d => d.val);
  const yMin = 0;
  const yMax = isBytes ? Math.max(...vals) * 1.15 || 1 : 100;

  const toX = (i: number) => PAD.left + (i / (data.length - 1)) * CW;
  const toY = (v: number) => PAD.top + CH - ((v - yMin) / (yMax - yMin)) * CH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.val).toFixed(1)}`).join(' ');
  const fillPath = `${linePath} L${toX(data.length - 1).toFixed(1)},${PAD.top + CH} L${toX(0).toFixed(1)},${PAD.top + CH} Z`;

  // Y축 눈금
  const yTicks = isBytes
    ? [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax].map(v => ({
        v,
        label: v === 0 ? '0'
          : v >= 1024*1024 ? `${(v/1024/1024).toFixed(1)}M`
          : v >= 1024 ? `${(v/1024).toFixed(0)}K`
          : `${v.toFixed(0)}`
      }))
    : [0, 25, 50, 75, 100].map(v => ({ v, label: `${v}` }));

  // X축 눈금 — 기간별 포맷
  // 기간별 눈금 수: 30m=6(5분간격), 1h=6(10분), 3h=6(30분), 6h=6(1시간), 24h=8(3시간)
  const xTickCount = period === '30m' ? 6 : period === '1h' ? 6 : period === '3h' ? 6 : period === '6h' ? 6 : 8;
  const xTicks = Array.from({ length: xTickCount + 1 }, (_, i) => {
    const ts = data[0].ts + (i / xTickCount) * (data[data.length - 1].ts - data[0].ts);
    const d = new Date(ts);
    let label: string;
    if (period === '24h') {
      label = `${String(d.getHours()).padStart(2,'0')}:00`;
    } else if (period === '6h') {
      label = `${String(d.getHours()).padStart(2,'0')}:00`;
    } else if (period === '3h') {
      const min = d.getMinutes();
      label = `${String(d.getHours()).padStart(2,'0')}:${String(Math.round(min/30)*30).padStart(2,'0')}`;
    } else if (period === '1h') {
      label = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    } else {
      // 30m: 5분 단위
      label = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }
    return { x: PAD.left + (i / xTickCount) * CW, label };
  });

  const gradId = `lg_${color.replace('#', '')}`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const chartX = svgX - PAD.left;
    if (chartX < 0 || chartX > CW) { setTooltip(null); return; }
    const idx = Math.round((chartX / CW) * (data.length - 1));
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    const pt = data[clamped];
    const d = new Date(pt.ts);
    const time = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
    setTooltip({ x: toX(clamped), y: toY(pt.val), val: pt.val, time });
  };

  const fmtVal = (v: number) => isBytes
    ? v >= 1024*1024 ? `${(v/1024/1024).toFixed(2)} MB/s`
      : v >= 1024 ? `${(v/1024).toFixed(1)} KB/s`
      : `${v.toFixed(0)} B/s`
    : `${v.toFixed(2)}%`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-full cursor-crosshair"
      preserveAspectRatio="none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setTooltip(null)}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Y축 그리드 */}
      {yTicks.map(({ v, label }) => {
        const y = toY(v);
        return (
          <g key={v}>
            <line x1={PAD.left} x2={PAD.left + CW} y1={y} y2={y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={PAD.left - 5} y={y + 3.5} textAnchor="end" fontSize="9" fill="#9ca3af">{label}</text>
          </g>
        );
      })}

      {/* X축 레이블 */}
      {xTicks.map(({ x, label }, i) => (
        <g key={i}>
          <line x1={x} x2={x} y1={PAD.top} y2={PAD.top + CH} stroke="#f3f4f6" strokeWidth="1" />
          <text x={x} y={H - 10} textAnchor="middle" fontSize="9" fill="#9ca3af">{label}</text>
        </g>
      ))}

      {/* 영역 채우기 */}
      <path d={fillPath} fill={`url(#${gradId})`} />

      {/* 라인 */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />

      {/* 테두리 */}
      <line x1={PAD.left} x2={PAD.left} y1={PAD.top} y2={PAD.top + CH} stroke="#e5e7eb" strokeWidth="1" />
      <line x1={PAD.left} x2={PAD.left + CW} y1={PAD.top + CH} y2={PAD.top + CH} stroke="#e5e7eb" strokeWidth="1" />

      {/* 툴팁 */}
      {tooltip && (
        <g>
          <line x1={tooltip.x} x2={tooltip.x} y1={PAD.top} y2={PAD.top + CH} stroke={color} strokeWidth="1" strokeDasharray="3,2" opacity="0.5" />
          <circle cx={tooltip.x} cy={tooltip.y} r="3.5" fill={color} />
          <rect
            x={tooltip.x < W - 110 ? tooltip.x + 8 : tooltip.x - 108}
            y={tooltip.y < 40 ? tooltip.y + 6 : tooltip.y - 36}
            width="100" height="28" rx="5"
            fill="white" stroke="#e5e7eb" strokeWidth="1"
          />
          <text
            x={tooltip.x < W - 110 ? tooltip.x + 58 : tooltip.x - 58}
            y={tooltip.y < 40 ? tooltip.y + 17 : tooltip.y - 25}
            textAnchor="middle" fontSize="9" fill="#6b7280"
          >{tooltip.time}</text>
          <text
            x={tooltip.x < W - 110 ? tooltip.x + 58 : tooltip.x - 58}
            y={tooltip.y < 40 ? tooltip.y + 28 : tooltip.y - 14}
            textAnchor="middle" fontSize="10" fontWeight="600" fill={color}
          >{fmtVal(tooltip.val)}</text>
        </g>
      )}
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
  const [selectedServer, setSelectedServer] = useState<string>('all');

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

  const loadRange = useCallback(async (metric: string, period: string, server?: string) => {
    setRangeLoading(true);
    const { seconds, step } = PERIOD_MAP[period] ?? PERIOD_MAP['1h'];
    const now = Math.floor(Date.now() / 1000);
    try {
      const serverParam = server && server !== 'all' ? `&instance_id=${encodeURIComponent(server)}` : '';
      const res = await fetch(`${API}/range?metric=${metric}&start=${now - seconds}&end=${now}&step=${step}${serverParam}`);
      const data = await res.json();
      if (res.ok) {
        const pts: RangePoint[] = [];
        for (const s of data.result ?? [])
          for (const [ts, val] of s.values ?? [])
            pts.push({ ts: (ts as number) * 1000, val: parseFloat(val as string) || 0 });
        pts.sort((a, b) => a.ts - b.ts);
        const key = `${metric}_${period}_${server ?? 'all'}`;
        setRangeData(prev => ({ ...prev, [key]: pts }));
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

  useEffect(() => { void loadRange(selectedMetric, selectedPeriod, selectedServer); }, [selectedMetric, selectedPeriod, selectedServer, loadRange]);

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
  const currentRange = rangeData[`${selectedMetric}_${selectedPeriod}_${selectedServer}`] ?? [];
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
            {/* 헤더 */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-bold text-gray-800">리소스 추이</p>
                <p className="text-xs text-gray-400">서버 선택 후 기간별 그래프 확인</p>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                {/* 서버 선택 */}
                <select
                  value={selectedServer}
                  onChange={e => setSelectedServer(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 bg-white"
                >
                  <option value="all">전체 합산</option>
                  {servers.map(([label]) => {
                    const idEntry = Object.entries(INSTANCE_NAME_MAP).find(([, v]) => v === label);
                    return <option key={label} value={idEntry?.[0] ?? label}>{label}</option>;
                  })}
                </select>
                {/* 메트릭 선택 */}
                <select
                  value={selectedMetric}
                  onChange={e => setSelectedMetric(e.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-400 bg-white"
                >
                  {METRIC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {/* 기간 선택 */}
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
            {/* 차트 */}
            <div className="relative h-52">
              {rangeLoading ? (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">불러오는 중...</div>
              ) : (
                <LineChart
                  data={currentRange}
                  color={currentColor}
                  period={selectedPeriod}
                  isBytes={selectedMetric.includes('bytes')}
                />
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
                            {s.memTotal > 0 && fmtStorage(s.memUsed) && fmtStorage(s.memTotal) && (
                              <p className="text-xs text-gray-400 mt-0.5 text-right tabular-nums">{fmtStorage(s.memUsed)} / {fmtStorage(s.memTotal)}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right tabular-nums whitespace-nowrap">{fmtBytes(s.netIn)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right tabular-nums whitespace-nowrap">{fmtBytes(s.netOut)}</td>
                          <td className="px-4 py-3 min-w-[150px]">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold w-14 text-right tabular-nums ${statusColor(s.disk)}`}>{fmtPct(s.disk)}</span>
                              <div className="flex-1"><GaugeBar value={s.disk} /></div>
                            </div>
                            {s.diskTotal > 0 && fmtStorage(s.diskUsed) && fmtStorage(s.diskTotal) && (
                              <p className="text-xs text-gray-400 mt-0.5 text-right tabular-nums">{fmtStorage(s.diskUsed)} / {fmtStorage(s.diskTotal)}</p>
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
