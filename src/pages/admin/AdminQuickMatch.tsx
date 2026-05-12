import { useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import Pagination from './components/Pagination';
import { useAdminQuickMatch } from '../../hooks/admin/useAdminQuickMatch';
import type {
  CandidateStatus,
  MainTab,
  QuickMatchCandidateRow,
  QuickMatchRequestRow,
  QuickMatchStatus,
  TrainingLabelStatus,
} from '../../types/admin/adminQuickMatch';

const MAIN_TABS: MainTab[] = [
  '요청 관리',
  '학습 통계',
  '학습 이벤트',
  '품질 지표',
];

const REQUEST_STATUS_TABS: Array<QuickMatchStatus | 'all'> = [
  'all',
  'requested',
  'matched',
  'failed',
  'expired',
];

const LABEL_STATUS_TABS: Array<TrainingLabelStatus | 'all'> = [
  'all',
  'pending',
  'success',
  'failed',
  'excluded',
];

const STAT_TYPES = [
  'all',
  'global',
  'service',
  'trust_bucket',
  'duration_match',
  'capacity_bucket',
];

const REQUEST_STATUS_LABEL: Record<string, string> = {
  all: '전체',
  requested: '요청',
  matched: '매칭 완료',
  failed: '실패',
  expired: '만료',
};

const LABEL_STATUS_LABEL: Record<string, string> = {
  all: '전체',
  pending: '관찰 중',
  success: '성공',
  failed: '실패',
  excluded: '제외',
};

const STAT_TYPE_LABEL: Record<string, string> = {
  all: '전체',
  global: '전체',
  service: '서비스',
  trust_bucket: '신뢰도 구간',
  duration_match: '기간 매칭',
  capacity_bucket: '인원 여유',
};

const REQUEST_STATUS_STYLE: Record<QuickMatchStatus, string> = {
  requested: 'border-blue-100 bg-blue-50 text-blue-700',
  matched: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  failed: 'border-rose-100 bg-rose-50 text-rose-700',
  expired: 'border-slate-200 bg-slate-100 text-slate-600',
};

const CANDIDATE_STATUS_STYLE: Record<CandidateStatus, string> = {
  selected: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  pending: 'border-blue-100 bg-blue-50 text-blue-700',
  rejected: 'border-rose-100 bg-rose-50 text-rose-700',
  failed: 'border-amber-100 bg-amber-50 text-amber-700',
  skipped: 'border-slate-200 bg-slate-100 text-slate-600',
};

const LABEL_STATUS_STYLE: Record<TrainingLabelStatus, string> = {
  pending: 'border-blue-100 bg-blue-50 text-blue-700',
  success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  failed: 'border-rose-100 bg-rose-50 text-rose-700',
  excluded: 'border-slate-200 bg-slate-100 text-slate-600',
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatNumber(value?: number | null) {
  return (value ?? 0).toLocaleString();
}

function formatPercent(value?: number | null, ratio = false) {
  const raw = Number(value ?? 0);
  const percent = ratio ? raw * 100 : raw;
  return `${percent.toFixed(1)}%`;
}

function formatScore(value?: number | null) {
  return Number(value ?? 0).toFixed(4);
}

function formatOptional(value?: string | number | boolean | null) {
  if (value === undefined || value === null || value === '') return '-';
  return String(value);
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
    <div className={`rounded-2xl border p-4 shadow-sm ${tone}`}>
      <div className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">
        {title}
      </div>
      <div className="mt-2 truncate text-2xl font-black">{value}</div>
      <div className="mt-1 text-xs leading-relaxed opacity-80">
        {description}
      </div>
    </div>
  );
}

function JsonBox({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[260px] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
      {JSON.stringify(value ?? {}, null, 2)}
    </pre>
  );
}

function StatusBadge({
  status,
  type,
}: {
  status: QuickMatchStatus | CandidateStatus | TrainingLabelStatus;
  type: 'request' | 'candidate' | 'label';
}) {
  const style =
    type === 'request'
      ? REQUEST_STATUS_STYLE[status as QuickMatchStatus]
      : type === 'candidate'
        ? CANDIDATE_STATUS_STYLE[status as CandidateStatus]
        : LABEL_STATUS_STYLE[status as TrainingLabelStatus];
  const label =
    type === 'label'
      ? LABEL_STATUS_LABEL[status]
      : type === 'request'
        ? REQUEST_STATUS_LABEL[status]
        : status;

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${style}`}
    >
      {label ?? status}
    </span>
  );
}

function CandidateList({
  candidates,
}: {
  candidates: QuickMatchCandidateRow[];
}) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
        저장된 후보 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {candidates.map((candidate) => (
        <details
          key={candidate.candidateId}
          className="rounded-2xl border border-slate-200 bg-white p-4"
        >
          <summary className="flex cursor-pointer list-none flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-slate-900">
                #{candidate.rank ?? '-'}{' '}
                {candidate.partyName ?? candidate.partyId}
              </div>
              <div className="mt-1 truncate text-xs text-slate-400">
                {candidate.partyId}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <StatusBadge status={candidate.status} type="candidate" />
              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                final {formatScore(candidate.finalScore)}
              </span>
            </div>
          </summary>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-bold text-slate-400">Rule</div>
              <div className="mt-1 text-sm font-black text-slate-800">
                {formatScore(candidate.ruleScore)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-bold text-slate-400">
                Probability
              </div>
              <div className="mt-1 text-sm font-black text-slate-800">
                {formatScore(candidate.probabilityScore)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-[11px] font-bold text-slate-400">Final</div>
              <div className="mt-1 text-sm font-black text-slate-800">
                {formatScore(candidate.finalScore)}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <JsonBox value={candidate.filterReasons} />
          </div>
        </details>
      ))}
    </div>
  );
}

function SelectedCandidateSummary({
  candidate,
}: {
  candidate?: QuickMatchCandidateRow | null;
}) {
  if (!candidate) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-400">
        선택 후보가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700/70">
            Selected Candidate
          </div>
          <div className="mt-1 break-words text-base font-black text-slate-900">
            #{candidate.rank ?? '-'} {candidate.partyName ?? '파티명 없음'}
          </div>
          <div className="mt-1 break-all text-xs text-slate-500">
            {candidate.partyId}
          </div>
        </div>
        <StatusBadge status={candidate.status} type="candidate" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <SummaryCell label="Rule" value={formatScore(candidate.ruleScore)} />
        <SummaryCell
          label="Probability"
          value={formatScore(candidate.probabilityScore)}
        />
        <SummaryCell label="Final" value={formatScore(candidate.finalScore)} />
      </div>

      <details className="rounded-xl border border-emerald-100 bg-white p-3">
        <summary className="cursor-pointer list-none text-xs font-bold text-slate-700">
          점수/필터 근거 보기
        </summary>
        <div className="mt-3">
          <JsonBox value={candidate.filterReasons} />
        </div>
      </details>
    </div>
  );
}

function RequestDetail({
  request,
  detailLoading,
}: {
  request: QuickMatchRequestRow;
  detailLoading: boolean;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            요청 상세
          </div>
          <div className="mt-1 break-all text-base font-black text-slate-900">
            {request.requestId}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            {request.userNickname} · {request.serviceName} ·{' '}
            {formatDate(request.requestedAt)}
          </div>
        </div>
        <StatusBadge status={request.status} type="request" />
      </div>

      {detailLoading && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-blue-700">
          상세 데이터를 불러오는 중입니다.
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCell label="매칭 파티" value={request.matchedPartyName} />
        <SummaryCell label="후보 수" value={`${request.candidateCount}개`} />
        <SummaryCell label="재시도" value={`${request.retryCount}회`} />
        <SummaryCell
          label="소요 시간"
          value={
            request.totalMatchSeconds == null
              ? '-'
              : `${request.totalMatchSeconds.toFixed(2)}초`
          }
        />
        <SummaryCell label="실패 사유" value={request.failReason} />
        <SummaryCell
          label="활성 상태"
          value={request.isActive ? '활성' : '종료'}
        />
        <SummaryCell label="matched_at" value={formatDate(request.matchedAt)} />
        <SummaryCell label="expired_at" value={formatDate(request.expiredAt)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-black text-slate-900">
            선택 후보 / 결과
          </h3>
          <div className="mt-3">
            <SelectedCandidateSummary candidate={request.selectedCandidate} />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-black text-slate-900">
            요청 프로필 스냅샷
          </h3>
          <div className="mt-3">
            <JsonBox value={request.requestProfileSnapshot} />
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-black text-slate-900">전체 후보</h3>
        <div className="mt-3">
          <CandidateList candidates={request.candidates} />
        </div>
      </section>
    </div>
  );
}

function SummaryCell({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className="mt-1 truncate text-sm font-bold text-slate-800">
        {formatOptional(value)}
      </div>
    </div>
  );
}

export default function AdminQuickMatch() {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('요청 관리');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(true);

  const {
    rows,
    summary,
    total,
    detail,
    trainingStats,
    trainingEvents,
    quality,
    selectedRequestId,
    loading,
    detailLoading,
    trainingLoading,
    qualityLoading,
    error,
    params,
    eventParams,
    statType,
    setStatType,
    updateParams,
    resetParams,
    updateEventParams,
    selectRequest,
    rebuildStats,
    runLabeling,
  } = useAdminQuickMatch();

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const eventPage = eventParams.page ?? 1;
  const eventPageSize = eventParams.pageSize ?? 20;

  const selectedRequest = detail?.request ?? null;
  const labelCounts = summary?.training.labelCounts ?? {};

  const statRows = useMemo(() => trainingStats?.rows ?? [], [trainingStats]);
  const qualityReasons = useMemo(
    () => quality?.reasonDistribution ?? [],
    [quality],
  );

  const handleAction = async (key: string, action: () => Promise<void>) => {
    try {
      setActionLoading(key);
      await action();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-1 flex-col overflow-x-hidden">
      <AdminHeader
        placeholder="요청 ID / 유저 닉네임 검색"
        onSearch={(value: string) => {
          setActiveMainTab('요청 관리');
          updateParams({ keyword: value });
        }}
      />

      <div className="flex-1 overflow-x-hidden bg-[#f5f5f5] p-4 sm:p-6 md:p-8">
        <div className="mx-auto w-full max-w-7xl space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                빠른매칭 관리
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                요청 처리 현황, 학습 라벨, 통계 기반 probability score 품질을
                함께 확인합니다.
              </p>
            </div>

            {(loading || trainingLoading || qualityLoading) && (
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500">
                데이터 불러오는 중...
              </span>
            )}
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <SummaryCard
              title="총 요청"
              value={formatNumber(summary?.requests.total)}
              description={`오늘 ${formatNumber(summary?.requests.todayTotal)}건`}
              tone="border-slate-200 bg-white text-slate-900"
            />
            <SummaryCard
              title="매칭률"
              value={formatPercent(summary?.requests.matchRate)}
              description={`matched ${formatNumber(summary?.requests.matched)}건`}
              tone="border-emerald-200 bg-emerald-50 text-emerald-800"
            />
            <SummaryCard
              title="학습 성공률"
              value={formatPercent(summary?.training.successRate, true)}
              description={`학습 표본 ${formatNumber(summary?.training.sampleCount)}건`}
              tone="border-indigo-200 bg-indigo-50 text-indigo-800"
            />
            <SummaryCard
              title="관찰 중"
              value={formatNumber(labelCounts.pending)}
              description={`success ${formatNumber(labelCounts.success)} · failed ${formatNumber(labelCounts.failed)} · excluded ${formatNumber(labelCounts.excluded)}`}
              tone="border-blue-200 bg-blue-50 text-blue-800"
            />
          </div>

          <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 shadow-sm md:rounded-2xl">
            <button
              type="button"
              onClick={() => setIsGuideOpen((prev) => !prev)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div className="text-[11px] font-semibold text-slate-500 md:text-xs">
                빠른매칭 관리 메뉴얼
              </div>
              <span className="shrink-0 text-xs font-bold text-slate-500">
                {isGuideOpen ? '접기' : '펼치기'}
              </span>
            </button>

            {isGuideOpen && (
              <div className="mt-3 space-y-3 text-[11px] text-slate-600 md:text-xs">
                <div className="rounded-xl border border-white bg-white px-4 py-4">
                  <div className="text-sm font-bold text-slate-900">
                    빠른매칭 관리 메뉴얼
                  </div>
                  <p className="mt-2 leading-relaxed">
                    빠른매칭 관리 페이지는 사용자의 빠른매칭 요청 흐름과 후보
                    점수, 운영 결과 라벨, 통계 기반 성공률을 함께 확인하는
                    화면입니다. 요청이 왜 매칭됐는지, 어떤 후보가 제외됐는지,
                    학습 데이터가 다음 매칭 점수에 어떻게 반영되는지를 한 곳에서
                    점검할 수 있습니다.
                  </p>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="rounded-xl border border-white bg-white px-4 py-4">
                    <div className="font-bold text-slate-800">
                      이 페이지에서 할 수 있는 기능
                    </div>
                    <div className="mt-2 space-y-2 leading-relaxed">
                      <p>
                        1. 빠른매칭 요청을 상태, 기간, 키워드 기준으로 검색하고
                        요청별 후보 목록과 최종 선택 파티를 확인할 수 있습니다.
                      </p>
                      <p>
                        2. 후보별 rule score, probability score, final score와
                        하드필터 제외 사유를 확인해 매칭 판단 근거를 추적할 수
                        있습니다.
                      </p>
                      <p>
                        3. 학습 이벤트 탭에서 success, failed, pending, excluded
                        라벨과 라벨 사유를 조회할 수 있습니다.
                      </p>
                      <p>
                        4. 학습 통계 탭에서 서비스별, 신뢰도 구간별, 기간
                        매칭별, 인원 여유별 성공률을 확인하고 통계를 수동
                        재집계할 수 있습니다.
                      </p>
                      <p>
                        5. 품질 지표 탭에서 학습 가능한 데이터와 제외 데이터를
                        분리해 라벨 품질과 실패 사유 분포를 점검할 수 있습니다.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white bg-white px-4 py-4">
                    <div className="font-bold text-slate-800">사용 방법</div>
                    <div className="mt-2 space-y-2 leading-relaxed">
                      <p>
                        1. 상단 요약 카드에서 매칭률, 학습 성공률, pending 라벨
                        수를 먼저 확인해 전체 상태를 파악합니다.
                      </p>
                      <p>
                        2. 요청 관리에서 `상세` 버튼을 눌러 선택 후보, 전체
                        후보, 요청 프로필 스냅샷, 연결된 학습 이벤트를
                        확인합니다.
                      </p>
                      <p>
                        3. 실패 요청은 실패 사유와 후보 제외 근거를 확인하고,
                        재처리가 필요하면 사용자에게 새 빠른매칭 요청을 다시
                        안내합니다.
                      </p>
                      <p>
                        4. 라벨 기준이나 집계 로직을 수정한 뒤에는 학습 통계
                        탭에서 `라벨링+통계 실행` 또는 `통계만 재집계`를 실행해
                        화면과 점수 반영 값을 최신화합니다.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-4">
                  <div className="font-bold text-slate-800">운영 시 참고</div>
                  <div className="mt-2 space-y-1.5 leading-relaxed text-slate-600">
                    <p>
                      `pending`은 아직 관찰 기간이 끝나지 않은 데이터입니다.
                      probability score에는 success/failed로 확정된 데이터만
                      사용하는 것이 안전합니다.
                    </p>
                    <p>
                      `excluded`는 후보 부족, 시스템 실패, 선택되지 않은
                      후보처럼 사용자 매칭 품질로 보기 어려운 데이터입니다.
                      성공률 계산에 섞이면 점수가 왜곡될 수 있으니 별도로
                      확인하세요.
                    </p>
                    <p>
                      통계 표본이 적은 구간은 성공률 변동이 큽니다. 특정
                      서비스나 구간의 표본 수가 충분한지 확인한 뒤 운영 판단에
                      사용하는 것이 좋습니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 overflow-x-auto">
              {MAIN_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveMainTab(tab)}
                  className={`shrink-0 rounded-xl border px-4 py-2 text-sm font-bold transition active:scale-95 ${
                    activeMainTab === tab
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="text-xs font-semibold text-slate-400">
              통계 갱신: {formatDate(summary?.training.lastGeneratedAt)}
            </div>
          </section>

          {activeMainTab === '요청 관리' && (
            <div className="space-y-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-500">
                      키워드
                    </span>
                    <input
                      value={params.keyword ?? ''}
                      onChange={(event) =>
                        updateParams({ keyword: event.target.value })
                      }
                      placeholder="요청 ID / 유저 ID / 닉네임"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-500">
                      시작일
                    </span>
                    <input
                      type="date"
                      value={params.dateFrom ?? ''}
                      onChange={(event) =>
                        updateParams({ dateFrom: event.target.value })
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-500">
                      종료일
                    </span>
                    <input
                      type="date"
                      value={params.dateTo ?? ''}
                      onChange={(event) =>
                        updateParams({ dateTo: event.target.value })
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={resetParams}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 active:scale-95"
                  >
                    초기화
                  </button>
                </div>
              </section>

              <FilterTabs
                tabs={REQUEST_STATUS_TABS}
                activeTab={params.status ?? 'all'}
                labels={REQUEST_STATUS_LABEL}
                onTabChange={(tab) =>
                  updateParams({ status: tab as QuickMatchStatus | 'all' })
                }
              />

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-[920px] w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold text-slate-500">
                        <th className="px-4 py-3">요청 시각</th>
                        <th className="px-4 py-3">사용자</th>
                        <th className="px-4 py-3">서비스</th>
                        <th className="px-4 py-3">상태</th>
                        <th className="px-4 py-3">후보</th>
                        <th className="px-4 py-3">최종 파티</th>
                        <th className="px-4 py-3 text-center">관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.requestId}
                          className={`border-b border-slate-100 ${
                            selectedRequestId === row.requestId
                              ? 'bg-blue-50/60'
                              : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <td className="px-4 py-3 text-sm text-slate-500">
                            {formatDate(row.requestedAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-bold text-slate-900">
                              {row.userNickname}
                            </div>
                            <div className="mt-1 max-w-[180px] truncate text-xs text-slate-400">
                              {row.userId}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {row.serviceName}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={row.status} type="request" />
                          </td>
                          <td className="px-4 py-3 text-sm font-bold text-slate-700">
                            {row.candidateCount}개
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {formatOptional(row.matchedPartyName)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  selectedRequestId === row.requestId
                                    ? selectRequest('')
                                    : selectRequest(row.requestId)
                                }
                                className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                                  selectedRequestId === row.requestId
                                    ? 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                                }`}
                              >
                                {selectedRequestId === row.requestId
                                  ? '닫기'
                                  : '상세'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {!loading && rows.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-12 text-center text-sm text-slate-400"
                          >
                            조건에 맞는 빠른매칭 요청이 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  total={total}
                  page={page}
                  pageSize={pageSize}
                  onChange={(nextPage) => updateParams({ page: nextPage })}
                />
              </section>
            </div>
          )}

          {activeMainTab === '학습 통계' && (
            <div className="space-y-5">
              <section className="grid gap-3 xl:grid-cols-4">
                <SummaryCard
                  title="통계 버킷"
                  value={formatNumber(trainingStats?.summary.statCount)}
                  description="현재 저장된 통계 row 수"
                  tone="border-slate-200 bg-white text-slate-900"
                />
                <SummaryCard
                  title="전체 성공률"
                  value={formatPercent(
                    trainingStats?.summary.globalSuccessRate,
                    true,
                  )}
                  description={`global 표본 ${formatNumber(trainingStats?.summary.globalSampleCount)}건`}
                  tone="border-emerald-200 bg-emerald-50 text-emerald-800"
                />
                <SummaryCard
                  title="마지막 집계"
                  value={formatDate(trainingStats?.summary.lastGeneratedAt)}
                  description="라벨링 이후 재집계 시각"
                  tone="border-indigo-200 bg-indigo-50 text-indigo-800"
                />
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                    수동 작업
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={actionLoading !== null}
                      onClick={() =>
                        handleAction('run-labeling', () => runLabeling(30))
                      }
                      className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50 active:scale-95"
                    >
                      라벨링+통계 실행
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading !== null}
                      onClick={() =>
                        handleAction('rebuild-stats', () => rebuildStats())
                      }
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 active:scale-95"
                    >
                      통계만 재집계
                    </button>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      probability_score 집계 기준
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      서비스, 신뢰도 구간, 기간 매칭, 인원 여유별 성공률입니다.
                    </p>
                  </div>
                  <select
                    value={statType}
                    onChange={(event) => setStatType(event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-blue-400"
                  >
                    {STAT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {STAT_TYPE_LABEL[type] ?? type}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-[760px] w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold text-slate-500">
                        <th className="px-4 py-3">타입</th>
                        <th className="px-4 py-3">키</th>
                        <th className="px-4 py-3">성공</th>
                        <th className="px-4 py-3">실패</th>
                        <th className="px-4 py-3">표본</th>
                        <th className="px-4 py-3">성공률</th>
                        <th className="px-4 py-3">집계 시각</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statRows.map((row) => (
                        <tr
                          key={row.statId}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 text-sm font-bold text-slate-700">
                            {STAT_TYPE_LABEL[row.statType] ?? row.statType}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {row.statKey}
                          </td>
                          <td className="px-4 py-3 text-sm text-emerald-700">
                            {row.successCount}
                          </td>
                          <td className="px-4 py-3 text-sm text-rose-700">
                            {row.failedCount}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {row.totalCount}
                          </td>
                          <td className="px-4 py-3 text-sm font-black text-indigo-700">
                            {formatPercent(row.successRate, true)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">
                            {formatDate(row.generatedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {activeMainTab === '학습 이벤트' && (
            <div className="space-y-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-500">
                      라벨 사유
                    </span>
                    <input
                      value={eventParams.labelReason ?? ''}
                      onChange={(event) =>
                        updateEventParams({ labelReason: event.target.value })
                      }
                      placeholder="예: retained_30_days, selected_candidate_not_joined"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600">
                    <input
                      type="checkbox"
                      checked={Boolean(eventParams.seedOnly)}
                      onChange={(event) =>
                        updateEventParams({ seedOnly: event.target.checked })
                      }
                    />
                    시드 데이터만 보기
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      updateEventParams({
                        labelStatus: 'all',
                        labelReason: '',
                        seedOnly: false,
                      })
                    }
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 active:scale-95"
                  >
                    초기화
                  </button>
                </div>
              </section>

              <FilterTabs
                tabs={LABEL_STATUS_TABS}
                activeTab={eventParams.labelStatus ?? 'all'}
                labels={LABEL_STATUS_LABEL}
                onTabChange={(tab) =>
                  updateEventParams({
                    labelStatus: tab as TrainingLabelStatus | 'all',
                  })
                }
              />

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-[980px] w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold text-slate-500">
                        <th className="px-4 py-3">생성 시각</th>
                        <th className="px-4 py-3">라벨</th>
                        <th className="px-4 py-3">사유</th>
                        <th className="px-4 py-3">선택/가입</th>
                        <th className="px-4 py-3">요청</th>
                        <th className="px-4 py-3">파티</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(trainingEvents?.rows ?? []).map((event) => (
                        <tr
                          key={event.eventId}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 text-sm text-slate-500">
                            {formatDate(event.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge
                              status={event.labelStatus}
                              type="label"
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {formatOptional(event.labelReason)}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            selected {String(event.isSelected)} · joined{' '}
                            {String(event.isJoined)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMainTab('요청 관리');
                                selectRequest(event.requestId);
                              }}
                              className="max-w-[180px] truncate text-left text-sm font-bold text-blue-700 hover:underline"
                            >
                              {event.requestId}
                            </button>
                          </td>
                          <td className="max-w-[180px] truncate px-4 py-3 text-sm text-slate-500">
                            {event.partyId}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  total={trainingEvents?.total ?? 0}
                  page={eventPage}
                  pageSize={eventPageSize}
                  onChange={(nextPage) => updateEventParams({ page: nextPage })}
                />
              </section>
            </div>
          )}

          {activeMainTab === '품질 지표' && (
            <div className="space-y-5">
              <section className="grid gap-3 xl:grid-cols-5">
                <SummaryCard
                  title="성공"
                  value={formatNumber(quality?.summary.success)}
                  description="학습 성공 라벨"
                  tone="border-emerald-200 bg-emerald-50 text-emerald-800"
                />
                <SummaryCard
                  title="실패"
                  value={formatNumber(quality?.summary.failed)}
                  description="학습 실패 라벨"
                  tone="border-rose-200 bg-rose-50 text-rose-800"
                />
                <SummaryCard
                  title="관찰 중"
                  value={formatNumber(quality?.summary.pending)}
                  description="30일 관찰 기간 전"
                  tone="border-blue-200 bg-blue-50 text-blue-800"
                />
                <SummaryCard
                  title="제외"
                  value={formatNumber(quality?.summary.excluded)}
                  description="학습 품질 대상 제외"
                  tone="border-slate-200 bg-white text-slate-800"
                />
                <SummaryCard
                  title="학습 성공률"
                  value={formatPercent(quality?.summary.successRate)}
                  description={`학습 가능 ${formatNumber(quality?.summary.trainableTotal)}건`}
                  tone="border-indigo-200 bg-indigo-50 text-indigo-800"
                />
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-base font-black text-slate-900">
                  라벨 사유 분포
                </h2>
                <div className="mt-4 grid gap-2">
                  {qualityReasons.map((item) => (
                    <div
                      key={`${item.labelStatus}-${item.labelReason ?? 'none'}`}
                      className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[160px_minmax(0,1fr)_90px] md:items-center"
                    >
                      <StatusBadge status={item.labelStatus} type="label" />
                      <div className="break-all text-sm font-semibold text-slate-700">
                        {formatOptional(item.labelReason)}
                      </div>
                      <div className="text-right text-sm font-black text-slate-900">
                        {formatNumber(item.count)}건
                      </div>
                    </div>
                  ))}
                  {qualityReasons.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-400">
                      라벨 사유 데이터가 없습니다.
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {activeMainTab === '요청 관리' && selectedRequest && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/35 backdrop-blur-[2px]">
          <button
            type="button"
            aria-label="상세 닫기"
            className="hidden flex-1 cursor-default lg:block"
            onClick={() => selectRequest('')}
          />

          <aside className="flex h-full w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl lg:w-[min(92vw,980px)]">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Quick Match Detail
                </div>
                <h2 className="mt-1 truncate text-lg font-black text-slate-900">
                  {selectedRequest.userNickname} · {selectedRequest.serviceName}
                </h2>
                <p className="mt-1 break-all text-xs text-slate-500">
                  {selectedRequest.requestId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => selectRequest('')}
                className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 active:scale-95"
              >
                닫기
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4 md:p-5">
              <RequestDetail
                request={selectedRequest}
                detailLoading={detailLoading}
              />

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-black text-slate-900">
                  결과 스냅샷
                </h3>
                <div className="mt-3">
                  <JsonBox value={detail?.result ?? {}} />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-black text-slate-900">
                  연결된 학습 이벤트
                </h3>
                <div className="mt-3 grid gap-2">
                  {(detail?.trainingEvents ?? []).map((event) => (
                    <div
                      key={event.eventId}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="break-all text-xs font-bold text-slate-700">
                          {event.eventId}
                        </div>
                        <StatusBadge status={event.labelStatus} type="label" />
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        selected {String(event.isSelected)} · joined{' '}
                        {String(event.isJoined)} · reason{' '}
                        {formatOptional(event.labelReason)}
                      </div>
                    </div>
                  ))}
                  {(detail?.trainingEvents ?? []).length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-400">
                      연결된 학습 이벤트가 없습니다.
                    </div>
                  )}
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
