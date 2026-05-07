import { useEffect, useMemo, useState, type ReactNode } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import Pagination from './components/Pagination';
import { useAdminQuickMatch } from '../../hooks/admin/useAdminQuickMatch';
import type {
  CandidateStatus,
  MainTab,
  QuickMatchStatus,
  TuningPolicy,
} from '../../types/admin/adminQuickMatch.ts';

const MAIN_TABS: MainTab[] = ['요청 관리', '튜닝 설정'];

const STATUS_FILTER_TABS: Array<QuickMatchStatus | '전체'> = [
  '전체',
  'REQUESTED',
  'MATCHED',
  'FAILED',
  'EXPIRED',
  'REMATCHING',
];

const STATUS_STYLE: Record<QuickMatchStatus, string> = {
  REQUESTED: 'bg-blue-50 text-blue-600 border-blue-100',
  MATCHED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  FAILED: 'bg-rose-50 text-rose-600 border-rose-100',
  EXPIRED: 'bg-slate-100 text-slate-600 border-slate-200',
  REMATCHING: 'bg-amber-50 text-amber-600 border-amber-100',
};

const CANDIDATE_STATUS_STYLE: Record<CandidateStatus, string> = {
  SELECTED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  PENDING: 'bg-blue-50 text-blue-600 border-blue-100',
  REJECTED: 'bg-rose-50 text-rose-600 border-rose-100',
  FAILED: 'bg-amber-50 text-amber-600 border-amber-100',
};

const FAILURE_REASON_LABELS: Record<string, string> = {
  NO_CANDIDATE: '조건 통과 후보 없음',
  NO_RECRUITING_PARTY: '모집중 파티 없음',
  USER_EMBEDDING_NOT_FOUND: '사용자 임베딩 없음',
  party_embedding_not_found: '파티 임베딩 없음',
  trust_score_too_low: '신뢰도 부족',
  duration_mismatch: '기간 불일치',
  category_mismatch: '카테고리 불일치',
  platform_mismatch: '플랫폼 불일치',
  party_full: '정원 초과',
  PARTY_FULL: '가입 시점 정원 초과',
  PARTY_STATUS_CHANGED: '가입 시점 파티 상태 변경',
  ALREADY_JOINED: '이미 가입된 파티',
  MAX_RETRY_EXCEEDED: '최대 재시도 초과',
  NO_MORE_CANDIDATES: '남은 후보 없음',
};

const DEFAULT_POLICY: TuningPolicy = {
  quickMatchEnabled: true,
  topN: 5,
  maxCandidates: 30,
  minMatchScore: 0.7,
  vectorWeight: 0.5,
  trustWeight: 0.4,
  capacityWeight: 0.3,
  durationWeight: 0.3,
  joinPartyLockTtlSeconds: 30,
  maxRetry: 3,
};

function formatSeconds(value?: number | null) {
  if (value == null) return '-';
  return `${value.toFixed(2)}초`;
}

function formatMs(value?: number | null) {
  if (value == null) return '-';
  return `${value.toLocaleString()}ms`;
}

function labelFailureReason(value?: string | null) {
  if (!value) return '-';
  return FAILURE_REASON_LABELS[value] ?? value;
}

function formatOptional(value?: string | number | null) {
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
    // 💡 모바일 최적화: 여백과 모서리 둥글기 살짝 조절
    <div
      className={`rounded-xl md:rounded-2xl border p-4 md:p-5 shadow-sm ${tone}`}
    >
      <div className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
        {title}
      </div>
      <div className="mt-1.5 md:mt-2 text-2xl md:text-3xl font-bold truncate">
        {value}
      </div>
      <div className="mt-1.5 md:mt-2 text-[11px] md:text-sm opacity-80 break-keep">
        {description}
      </div>
    </div>
  );
}

function PolicyField({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col rounded-xl md:rounded-2xl border border-slate-200 bg-white p-3 md:p-4 shadow-sm">
      <div className="text-xs md:text-sm font-semibold text-slate-900">
        {label}
      </div>
      <div className="mt-1 text-[11px] md:text-xs leading-5 text-slate-500 break-keep">
        {description}
      </div>
      <div className="mt-2 md:mt-3">{children}</div>
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
      // 💡 모바일 폼 최적화: py-2.5로 터치 영역 확보
      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 md:py-2 text-sm text-slate-700 outline-none transition focus:border-indigo-300"
    />
  );
}

export default function AdminQuickMatch() {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('요청 관리');
  const [policyDraft, setPolicyDraft] = useState<TuningPolicy | null>(null);
  const [policyDirty, setPolicyDirty] = useState(false);
  const [policySaved, setPolicySaved] = useState(false);
  const [partyBackfillRequested, setPartyBackfillRequested] = useState(false);
  const [userBackfillRequested, setUserBackfillRequested] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const {
    rows,
    summary,
    total,
    policy,
    selected,
    loading,
    policyLoading,
    error,
    params,
    selectedRequestId,
    setSelectedRequestId,
    updateParams,
    resetParams,
    savePolicy,
    retryRequest,
    forceFailRequest,
    regenerateUserEmbedding,
    regeneratePartyEmbedding,
    runEmbeddingBackfill,
    runUserEmbeddingBackfill,
  } = useAdminQuickMatch();

  useEffect(() => {
    if (policy) {
      setPolicyDraft(policy);
      setPolicyDirty(false);
    }
  }, [policy]);

  const services = useMemo(
    () => ['전체', ...Array.from(new Set(rows.map((row) => row.serviceName)))],
    [rows],
  );

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const selectedPolicy = policyDraft ?? policy ?? DEFAULT_POLICY;

  const rejectedCount =
    selected?.candidates.filter((candidate) => candidate.status === 'REJECTED')
      .length ?? 0;
  const failedCandidates =
    selected?.candidates.filter((candidate) => candidate.status === 'FAILED') ??
    [];

  const ruleWeightSum =
    selectedPolicy.trustWeight +
    selectedPolicy.capacityWeight +
    selectedPolicy.durationWeight;
  const isRuleWeightInvalid = Math.abs(ruleWeightSum - 1) > 0.001;
  const vectorWeightPercent = Math.round(selectedPolicy.vectorWeight * 100);
  const ruleWeightPercent = 100 - vectorWeightPercent;

  const updatePolicyDraft = <K extends keyof TuningPolicy>(
    key: K,
    value: TuningPolicy[K],
  ) => {
    setPolicyDraft((prev) => ({
      ...(prev ?? DEFAULT_POLICY),
      [key]: value,
    }));
    setPolicyDirty(true);
    setPolicySaved(false);
  };

  const handleResetFilter = () => {
    resetParams();
  };

  const handleSavePolicy = async () => {
    if (!policyDraft || isRuleWeightInvalid) return;

    try {
      setActionLoading('save-policy');
      await savePolicy(policyDraft);
      setPolicyDirty(false);
      setPolicySaved(true);
      setTimeout(() => setPolicySaved(false), 2000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPolicy = () => {
    setPolicyDraft(DEFAULT_POLICY);
    setPolicyDirty(true);
    setPolicySaved(false);
  };

  const handlePartyBackfill = async () => {
    try {
      setActionLoading('party-backfill');
      await runEmbeddingBackfill();
      setPartyBackfillRequested(true);
      setTimeout(() => setPartyBackfillRequested(false), 2500);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserBackfill = async () => {
    try {
      setActionLoading('user-backfill');
      await runUserEmbeddingBackfill();
      setUserBackfillRequested(true);
      setTimeout(() => setUserBackfillRequested(false), 2500);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAction = async (
    actionKey: string,
    action: () => Promise<void>,
  ) => {
    try {
      setActionLoading(actionKey);
      await action();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    // 💡 최상위 Wrapper에 플렉스 속성을 줘서 좌우 찌그러짐 방지
    <div className="flex w-full min-w-0 flex-1 flex-col overflow-x-hidden">
      <AdminHeader
        placeholder="요청 ID / 유저 / 서비스 / 파티 검색"
        onSearch={(value: string) => {
          updateParams({ keyword: value });
          setActiveMainTab('요청 관리');
        }}
      />

      <div className="flex-1 overflow-x-hidden bg-[#f5f5f5] p-4 sm:p-6 md:p-8">
        <div className="mx-auto w-full min-w-0 max-w-7xl space-y-5 md:space-y-6">
          <div className="mb-5 md:mb-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 break-keep">
                빠른매칭 관리
              </h1>
              <p className="mt-1 text-xs md:text-sm text-slate-500 break-keep">
                상단에서는 빠른매칭 핵심 지표를 보고, 아래 탭에서 요청 관리와
                튜닝 설정을 처리합니다.
              </p>
            </div>

            {loading && (
              <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] md:text-xs font-semibold text-slate-500">
                데이터 불러오는 중...
              </div>
            )}
          </div>

          {error && (
            <div className="mb-5 md:mb-6 rounded-xl md:rounded-2xl border border-rose-200 bg-rose-50 p-3 md:p-4 text-xs md:text-sm text-rose-700 break-keep">
              {error}
            </div>
          )}

          <div className="mb-5 md:mb-6 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
            <SummaryCard
              title="총 요청 수"
              value={(summary?.total ?? 0).toLocaleString()}
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
              description={`${summary?.matched ?? 0}건 성공`}
              tone="border-emerald-200 bg-emerald-50 text-emerald-700"
            />
            <SummaryCard
              title="평균 매칭 시간"
              value={formatSeconds(summary?.avgSeconds)}
              description="요청 생성부터 완료까지 평균"
              tone="border-blue-200 bg-blue-50 text-blue-700"
            />
          </div>

          {/* 💡 탭 버튼 모바일 가로 스크롤 허용 */}
          <div className="mb-5 md:mb-6 flex gap-2 md:gap-1 border-b border-gray-200 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {MAIN_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveMainTab(tab)}
                className={`shrink-0 border-b-2 px-4 py-2 md:px-5 md:py-2.5 text-xs md:text-sm font-bold transition-all ${
                  activeMainTab === tab
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeMainTab === '요청 관리' && (
            <div className="grid min-w-0 gap-5 md:gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
              {/* --- 1. 요청 목록 테이블 영역 --- */}
              <section className="rounded-xl md:rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 px-4 md:px-5 pt-3 md:pt-4">
                  <FilterTabs
                    tabs={STATUS_FILTER_TABS}
                    activeTab={params.status ?? '전체'}
                    onTabChange={(tab: string) => {
                      updateParams({
                        status: tab as QuickMatchStatus | '전체',
                      });
                    }}
                  />

                  <div className="mb-4 mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                    <label className="flex flex-col gap-1 w-full sm:w-auto">
                      <span className="text-[11px] md:text-xs font-medium text-gray-500">
                        키워드
                      </span>
                      <input
                        type="text"
                        value={params.keyword ?? ''}
                        onChange={(e) => {
                          updateParams({ keyword: e.target.value });
                        }}
                        placeholder="요청ID / 유저 / 서비스"
                        className="w-full sm:w-44 rounded-lg border border-gray-200 px-3 py-2.5 md:py-2 text-sm outline-none focus:border-blue-400"
                      />
                    </label>

                    <label className="flex flex-col gap-1 w-full sm:w-auto">
                      <span className="text-[11px] md:text-xs font-medium text-gray-500">
                        서비스
                      </span>
                      <select
                        value={params.serviceName ?? '전체'}
                        onChange={(e) => {
                          updateParams({ serviceName: e.target.value });
                        }}
                        className="w-full sm:w-auto rounded-lg border border-slate-200 px-3 py-2.5 md:py-2 text-sm text-slate-700 outline-none focus:border-indigo-300 bg-white"
                      >
                        {services.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="flex w-full sm:w-auto gap-2">
                      <label className="flex flex-1 sm:flex-none flex-col gap-1">
                        <span className="text-[11px] md:text-xs font-medium text-gray-500">
                          시작일
                        </span>
                        <input
                          type="date"
                          value={params.dateFrom ?? ''}
                          onChange={(e) => {
                            updateParams({ dateFrom: e.target.value });
                          }}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 md:py-2 text-[11px] md:text-sm outline-none focus:border-blue-400"
                        />
                      </label>

                      <label className="flex flex-1 sm:flex-none flex-col gap-1">
                        <span className="text-[11px] md:text-xs font-medium text-gray-500">
                          종료일
                        </span>
                        <input
                          type="date"
                          value={params.dateTo ?? ''}
                          onChange={(e) => {
                            updateParams({ dateTo: e.target.value });
                          }}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2.5 md:py-2 text-[11px] md:text-sm outline-none focus:border-blue-400"
                        />
                      </label>
                    </div>

                    <div className="flex items-center justify-between w-full sm:w-auto sm:ml-auto gap-3">
                      <button
                        onClick={handleResetFilter}
                        className="flex-1 sm:flex-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 md:py-2 text-xs md:text-sm font-bold text-gray-600 transition hover:bg-gray-50 active:scale-95"
                      >
                        초기화
                      </button>
                      <div className="text-[11px] md:text-xs font-medium text-slate-400">
                        총 {total.toLocaleString()}건
                      </div>
                    </div>
                  </div>
                </div>

                {/* 💡 테이블 가로 스크롤 허용 */}
                <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                  <table className="min-w-175 md:min-w-200 w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        {[
                          '요청 시각',
                          '요청 ID',
                          '사용자',
                          '서비스',
                          '상태',
                          '선택 파티',
                          '소요 시간',
                        ].map((head) => (
                          <th
                            key={head}
                            className="px-3 md:px-4 py-3 text-left text-[11px] md:text-xs font-semibold text-slate-500 whitespace-nowrap"
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.requestId}
                          onClick={() => setSelectedRequestId(row.requestId)}
                          className={`cursor-pointer border-b border-slate-100 transition hover:bg-indigo-50/40 ${
                            selectedRequestId === row.requestId
                              ? 'bg-indigo-50/80'
                              : 'bg-white'
                          }`}
                        >
                          <td className="whitespace-nowrap px-3 md:px-4 py-3 text-[11px] md:text-sm text-slate-500">
                            {row.requestedAt}
                          </td>
                          <td className="px-3 md:px-4 py-3 text-xs md:text-sm font-bold text-slate-900 truncate max-w-20 md:max-w-none">
                            {row.requestId}
                          </td>
                          <td className="px-3 md:px-4 py-3">
                            <div className="text-xs md:text-sm font-bold text-slate-800 break-keep">
                              {row.userNickname}
                            </div>
                            <div className="text-[10px] md:text-xs text-slate-400 truncate max-w-20 md:max-w-none">
                              {row.userId}
                            </div>
                          </td>
                          <td className="px-3 md:px-4 py-3 text-[11px] md:text-sm text-slate-600 whitespace-nowrap">
                            {row.serviceName}
                          </td>
                          <td className="px-3 md:px-4 py-3">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-bold ${STATUS_STYLE[row.status]}`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="px-3 md:px-4 py-3 text-[11px] md:text-sm text-slate-600 truncate max-w-25 md:max-w-37.5">
                            {formatOptional(row.matchedPartyName)}
                          </td>
                          <td className="whitespace-nowrap px-3 md:px-4 py-3 text-[11px] md:text-sm text-slate-600">
                            {formatSeconds(row.totalMatchSeconds)}
                          </td>
                        </tr>
                      ))}

                      {!loading && rows.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-10 text-center text-xs md:text-sm text-slate-400"
                          >
                            조건에 맞는 빠른매칭 요청이 없습니다.
                          </td>
                        </tr>
                      )}

                      {loading && rows.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-4 py-10 text-center text-xs md:text-sm text-slate-400"
                          >
                            요청 목록을 불러오는 중입니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-slate-100 px-4 py-3 md:px-5 md:py-4">
                  <Pagination
                    total={total}
                    page={page}
                    pageSize={pageSize}
                    onChange={(nextPage: number) => {
                      updateParams({ page: nextPage });
                    }}
                  />
                </div>
              </section>

              {/* --- 2. 요청 상세 패널 영역 --- */}
              <section className="rounded-xl md:rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
                {!selected ? (
                  <div className="p-8 text-center text-xs md:text-sm text-slate-400 my-auto">
                    선택된 요청이 없습니다.
                    <br className="md:hidden" />
                    목록에서 항목을 선택해주세요.
                  </div>
                ) : (
                  <div className="p-4 md:p-5">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="text-[10px] md:text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          요청 상세
                        </div>
                        <h2 className="mt-1 text-sm md:text-lg font-bold text-slate-900 break-all">
                          {selected.requestId}
                        </h2>
                        <p className="mt-1 text-[11px] md:text-sm text-slate-500 break-keep">
                          {selected.userNickname} · {selected.serviceName} ·{' '}
                          {selected.requestedAt}
                        </p>
                      </div>
                      <span
                        className={`inline-flex self-start md:self-auto rounded-full border px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-bold ${STATUS_STYLE[selected.status]}`}
                      >
                        {selected.status}
                      </span>
                    </div>

                    {/* 상세 지표 그리드 */}
                    <div className="mt-4 md:mt-5 grid grid-cols-2 gap-2 md:gap-3">
                      {[
                        [
                          '최종 결과',
                          formatOptional(selected.matchedPartyName),
                        ],
                        ['실패 사유', labelFailureReason(selected.failReason)],
                        ['후보 수', `${selected.candidates.length}개`],
                        ['제외 후보 수', `${rejectedCount}개`],
                        ['가입 실패 후보', `${failedCandidates.length}개`],
                        [
                          '총 소요 시간',
                          formatSeconds(selected.totalMatchSeconds),
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-lg md:rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:px-4 md:py-3"
                        >
                          <div className="text-[10px] md:text-xs font-medium text-slate-400 truncate">
                            {label}
                          </div>
                          <div className="mt-0.5 md:mt-1 text-xs md:text-sm font-bold text-slate-800 truncate">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 md:mt-6">
                      <h3 className="text-xs md:text-sm font-bold text-slate-900">
                        단계별 소요 시간
                      </h3>
                      <div className="mt-2 md:mt-3 grid grid-cols-2 gap-2">
                        {[
                          ['요청 검증', selected.stepTimings.validationMs],
                          [
                            '프로필/임베딩',
                            selected.stepTimings.profileEmbeddingMs,
                          ],
                          ['하드 필터링', selected.stepTimings.hardFilterMs],
                          ['Rule 점수', selected.stepTimings.ruleScoringMs],
                          ['Vector 점수', selected.stepTimings.vectorScoringMs],
                          ['join_party()', selected.stepTimings.joinPartyMs],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-lg md:rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:px-3 md:py-2.5"
                          >
                            <div className="text-[9px] md:text-[11px] font-bold uppercase tracking-wide text-slate-400 truncate">
                              {label}
                            </div>
                            <div className="mt-0.5 md:mt-1 text-xs md:text-sm font-bold text-slate-800">
                              {formatMs(Number(value))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 md:mt-6">
                      <h3 className="text-xs md:text-sm font-bold text-slate-900">
                        사용자 프로필 스냅샷
                      </h3>
                      <div className="mt-2 md:mt-3 grid gap-2 md:gap-3">
                        <div className="rounded-lg md:rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 md:px-4 md:py-3">
                          <div className="text-[10px] md:text-xs font-medium text-slate-400">
                            요청 조건
                          </div>
                          <div className="mt-1 text-[11px] md:text-sm text-slate-700 break-keep">
                            카테고리{' '}
                            {formatOptional(
                              selected.aiProfileSnapshot.preferredConditions
                                .category,
                            )}{' '}
                            · 플랫폼{' '}
                            {formatOptional(
                              selected.aiProfileSnapshot.preferredConditions
                                .platform,
                            )}{' '}
                            · 선호기간{' '}
                            {formatOptional(
                              selected.aiProfileSnapshot.preferredConditions
                                .durationPreference,
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                          <div className="rounded-lg md:rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 md:px-4 md:py-3">
                            <div className="text-[10px] md:text-xs font-medium text-slate-400">
                              활동 요약
                            </div>
                            <div className="mt-1 text-[11px] md:text-sm text-slate-700 break-keep">
                              총{' '}
                              {
                                selected.aiProfileSnapshot.activitySummary
                                  .totalPartyJoinCount
                              }
                              회 · 서비스{' '}
                              {
                                selected.aiProfileSnapshot.activitySummary
                                  .servicePartyJoinCount
                              }
                              회 · 활성{' '}
                              {
                                selected.aiProfileSnapshot.activitySummary
                                  .activePartyCount
                              }
                              개
                            </div>
                          </div>
                          <div className="rounded-lg md:rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 md:px-4 md:py-3">
                            <div className="text-[10px] md:text-xs font-medium text-slate-400">
                              리스크 / 신뢰도
                            </div>
                            <div className="mt-1 text-[11px] md:text-sm text-slate-700 break-keep">
                              신뢰도{' '}
                              {selected.aiProfileSnapshot.trustScore.toFixed(1)}{' '}
                              · 신고{' '}
                              {
                                selected.aiProfileSnapshot.riskSummary
                                  .reportCount
                              }
                              회 · 이탈{' '}
                              {
                                selected.aiProfileSnapshot.riskSummary
                                  .leaveCount
                              }
                              회
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 md:mt-6">
                      <div className="mb-2.5 md:mb-3 flex flex-wrap items-center justify-between gap-1">
                        <h3 className="text-xs md:text-sm font-bold text-slate-900">
                          후보 / 결과 상세
                        </h3>
                        <div className="text-[10px] md:text-xs text-slate-400">
                          rule / vector / final
                        </div>
                      </div>

                      <div className="max-h-120 space-y-2.5 md:space-y-3 overflow-y-auto pr-1">
                        {selected.candidates.map((candidate) => (
                          <div
                            key={candidate.candidateId}
                            className="rounded-xl md:rounded-2xl border border-slate-200 bg-white p-3 md:p-4"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <div className="text-xs md:text-sm font-bold text-slate-900 break-all">
                                  #{candidate.rank ?? '-'} {candidate.partyName}
                                </div>
                                <div className="mt-0.5 md:mt-1 text-[10px] md:text-xs text-slate-400 truncate max-w-50 md:max-w-none">
                                  {candidate.partyId}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                                <span
                                  className={`inline-flex rounded-full border px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-bold ${CANDIDATE_STATUS_STYLE[candidate.status]}`}
                                >
                                  {candidate.status}
                                </span>
                                <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 md:px-2.5 md:py-1 text-[10px] md:text-xs font-bold text-indigo-600">
                                  Final {candidate.finalScore.toFixed(3)}
                                </span>
                              </div>
                            </div>

                            <div className="mt-3 md:mt-4 grid grid-cols-3 gap-1.5 md:gap-2">
                              {[
                                ['Rule', candidate.ruleScore.toFixed(3)],
                                ['Vector', candidate.vectorScore.toFixed(3)],
                                ['Final', candidate.finalScore.toFixed(3)],
                              ].map(([label, value]) => (
                                <div
                                  key={label}
                                  className="rounded-lg md:rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 md:px-3 md:py-2.5 text-center sm:text-left"
                                >
                                  <div className="text-[9px] md:text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                    {label}
                                  </div>
                                  <div className="mt-0.5 md:mt-1 text-[11px] md:text-sm font-bold text-slate-800">
                                    {value}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <div className="mt-2.5 md:mt-3 rounded-lg md:rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:px-3 md:py-3 overflow-hidden">
                              <div className="text-[10px] md:text-xs font-medium text-slate-400 mb-1.5">
                                필터 / 점수 근거
                              </div>
                              {/* 💡 pre 태그 오버플로우 방어: overflow-x-auto 추가 */}
                              <pre className="whitespace-pre-wrap break-all text-[10px] md:text-xs leading-relaxed text-slate-600 overflow-x-auto max-h-37.5 overflow-y-auto">
                                {JSON.stringify(
                                  candidate.filterReasons,
                                  null,
                                  2,
                                )}
                              </pre>
                            </div>
                          </div>
                        ))}

                        {selected.candidates.length === 0 && (
                          <div className="py-4 text-center text-xs md:text-sm text-slate-400">
                            후보 데이터가 없습니다.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 md:mt-6 border-t border-slate-100 pt-4 md:pt-5">
                      <div className="mb-2 md:mb-3 text-xs md:text-sm font-bold text-slate-900">
                        운영 액션
                      </div>
                      {/* 모바일 1열 스태킹 */}
                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
                        <button
                          disabled={actionLoading !== null}
                          onClick={() =>
                            handleAction(`retry-${selected.requestId}`, () =>
                              retryRequest(selected.requestId),
                            )
                          }
                          className="w-full sm:w-auto rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 md:py-2 text-[11px] md:text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50 active:scale-95"
                        >
                          실패 요청 재시도
                        </button>
                        <button
                          disabled={actionLoading !== null}
                          onClick={() =>
                            handleAction(
                              `user-embedding-${selected.userId}`,
                              () => regenerateUserEmbedding(selected.userId),
                            )
                          }
                          className="w-full sm:w-auto rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 md:py-2 text-[11px] md:text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 active:scale-95"
                        >
                          사용자 임베딩 재생성
                        </button>
                        <button
                          disabled={
                            actionLoading !== null || !selected.matchedPartyId
                          }
                          onClick={() => {
                            if (!selected.matchedPartyId) return;
                            handleAction(
                              `party-embedding-${selected.matchedPartyId}`,
                              () =>
                                regeneratePartyEmbedding(
                                  selected.matchedPartyId as string,
                                ),
                            );
                          }}
                          className="w-full sm:w-auto rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 md:py-2 text-[11px] md:text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-50 active:scale-95"
                        >
                          파티 임베딩 재생성
                        </button>
                        <button
                          disabled={actionLoading !== null}
                          onClick={() =>
                            handleAction(
                              `force-fail-${selected.requestId}`,
                              () => forceFailRequest(selected.requestId),
                            )
                          }
                          className="w-full sm:w-auto rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 md:py-2 text-[11px] md:text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 active:scale-95"
                        >
                          요청 강제 실패
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* --- 3. 튜닝 설정 탭 영역 --- */}
          {activeMainTab === '튜닝 설정' && (
            <div className="space-y-5 md:space-y-6">
              <section className="rounded-xl md:rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h2 className="text-sm md:text-base font-bold text-slate-900">
                      튜닝 설정
                    </h2>
                    <p className="mt-1 text-[11px] md:text-xs leading-relaxed text-slate-500 break-keep">
                      관리자는 운영 중 바로 조정해도 되는 값만 수정합니다.
                      하드필터 조건이나 점수 산식 변경은 코드 배포로 관리하세요.
                    </p>
                  </div>

                  <div className="flex w-full md:w-auto gap-2">
                    <button
                      onClick={handleResetPolicy}
                      className="flex-1 md:flex-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 md:py-2 text-[11px] md:text-sm font-bold text-slate-600 transition hover:bg-slate-50 active:scale-95"
                    >
                      기본값 복원
                    </button>
                    <button
                      onClick={handleSavePolicy}
                      disabled={
                        !policyDirty ||
                        isRuleWeightInvalid ||
                        policyLoading ||
                        actionLoading === 'save-policy'
                      }
                      className="flex-1 md:flex-none rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 md:py-2 text-[11px] md:text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-40 active:scale-95"
                    >
                      {policySaved ? '저장됨 ✓' : '튜닝값 저장'}
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.3fr]">
                  <div className="rounded-xl md:rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs md:text-sm font-bold text-slate-900">
                          빠른매칭 전체 사용
                        </div>
                        <div className="mt-1 text-[10px] md:text-xs leading-relaxed text-slate-500 break-keep">
                          장애나 배포 직후 문제가 생겼을 때 빠른매칭 요청을 잠시
                          막는 운영용 스위치입니다.
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          updatePolicyDraft(
                            'quickMatchEnabled',
                            !selectedPolicy.quickMatchEnabled,
                          )
                        }
                        className={`min-w-16 md:min-w-18 shrink-0 rounded-full px-3 py-1.5 text-[10px] md:text-xs font-bold transition active:scale-95 ${
                          selectedPolicy.quickMatchEnabled
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {selectedPolicy.quickMatchEnabled ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-200 bg-white px-3 py-3 md:px-4 md:py-3">
                      <div className="text-[10px] md:text-xs font-medium text-slate-400">
                        현재 최종 점수 비율
                      </div>
                      <div className="mt-1 text-xs md:text-sm font-bold text-slate-800">
                        Vector {vectorWeightPercent}% · Rule {ruleWeightPercent}
                        %
                      </div>
                      <div className="mt-2 h-1.5 md:h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${vectorWeightPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-3 py-3 md:px-4 md:py-3 text-[10px] md:text-xs leading-relaxed text-blue-700 break-keep">
                      초반 운영에서는 Vector 50%, Rule 50%를 기본으로 두고, 실제
                      실패 로그를 보면서 한 번에 5~10%p씩만 조정하는 것을
                      권장합니다.
                    </div>
                  </div>

                  <div className="grid gap-3 md:gap-4 grid-cols-2">
                    <PolicyField
                      label="최종 추천 개수"
                      description="적용할 상위 후보 수 (보통 1~5개)"
                    >
                      <NumberInput
                        value={selectedPolicy.topN}
                        min={1}
                        max={20}
                        onChange={(value) => updatePolicyDraft('topN', value)}
                      />
                    </PolicyField>

                    <PolicyField
                      label="후보 탐색 수"
                      description="Vector 계산 대상 (크면 느려짐)"
                    >
                      <NumberInput
                        value={selectedPolicy.maxCandidates}
                        min={5}
                        max={200}
                        onChange={(value) =>
                          updatePolicyDraft('maxCandidates', value)
                        }
                      />
                    </PolicyField>

                    <PolicyField
                      label="최소 매칭 점"
                      description="final_score 하한선"
                    >
                      <NumberInput
                        value={selectedPolicy.minMatchScore}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(value) =>
                          updatePolicyDraft('minMatchScore', value)
                        }
                      />
                    </PolicyField>

                    <PolicyField
                      label="최대 재시도"
                      description="실패 시 시도 횟수"
                    >
                      <NumberInput
                        value={selectedPolicy.maxRetry}
                        min={0}
                        max={10}
                        onChange={(value) =>
                          updatePolicyDraft('maxRetry', value)
                        }
                      />
                    </PolicyField>
                  </div>
                </div>
              </section>

              <section className="grid gap-5 md:gap-6 lg:grid-cols-[1fr_1fr]">
                <div className="rounded-xl md:rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm md:text-base font-bold text-slate-900">
                        점수 비율
                      </h2>
                      <p className="mt-1 text-[11px] md:text-xs leading-relaxed text-slate-500 break-keep">
                        Vector는 유사도, Rule은 신뢰도/좌석/기간 적합도입니다.
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] md:text-xs font-bold ${
                        isRuleWeightInvalid
                          ? 'border-rose-200 bg-rose-50 text-rose-600'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      Rule 합계 {ruleWeightSum.toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-4 md:mt-5 grid gap-3 md:gap-4">
                    <PolicyField
                      label="Vector 가중치"
                      description="최종 점수 반영 비율 (나머지는 Rule 점수 비율)"
                    >
                      <NumberInput
                        value={selectedPolicy.vectorWeight}
                        min={0}
                        max={1}
                        step={0.05}
                        onChange={(value) =>
                          updatePolicyDraft('vectorWeight', value)
                        }
                      />
                    </PolicyField>

                    <div className="grid grid-cols-3 gap-2 md:gap-4">
                      <PolicyField
                        label="신뢰도"
                        description="최소 신뢰도 차이"
                      >
                        <NumberInput
                          value={selectedPolicy.trustWeight}
                          min={0}
                          max={1}
                          step={0.05}
                          onChange={(value) =>
                            updatePolicyDraft('trustWeight', value)
                          }
                        />
                      </PolicyField>

                      <PolicyField label="좌석" description="잔여 좌석 여유">
                        <NumberInput
                          value={selectedPolicy.capacityWeight}
                          min={0}
                          max={1}
                          step={0.05}
                          onChange={(value) =>
                            updatePolicyDraft('capacityWeight', value)
                          }
                        />
                      </PolicyField>

                      <PolicyField label="기간" description="기간 적합도">
                        <NumberInput
                          value={selectedPolicy.durationWeight}
                          min={0}
                          max={1}
                          step={0.05}
                          onChange={(value) =>
                            updatePolicyDraft('durationWeight', value)
                          }
                        />
                      </PolicyField>
                    </div>

                    {isRuleWeightInvalid && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] md:text-sm leading-relaxed text-rose-700 break-keep">
                        Rule 내부 가중치 합계가 1.00이 되도록 맞추세요. 합계가
                        맞지 않으면 저장 버튼이 비활성화됩니다.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl md:rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h2 className="text-sm md:text-base font-bold text-slate-900">
                        운영 안정화
                      </h2>
                      <p className="mt-1 text-[11px] md:text-xs leading-relaxed text-slate-500 break-keep">
                        장애 대응처럼 운영자가 바로 처리해야 하는 항목입니다.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handlePartyBackfill}
                        disabled={actionLoading !== null}
                        className="w-full md:w-auto rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 md:py-2 text-[11px] md:text-sm font-bold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 active:scale-95"
                      >
                        {partyBackfillRequested
                          ? '파티 백필 요청됨 ✓'
                          : actionLoading === 'party-backfill'
                            ? '파티 백필 요청 중...'
                            : '파티 임베딩 백필 실행'}
                      </button>
                      <button
                        onClick={handleUserBackfill}
                        disabled={actionLoading !== null}
                        className="rounded-md border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {userBackfillRequested
                          ? '사용자 백필 요청됨 ✓'
                          : actionLoading === 'user-backfill'
                            ? '사용자 백필 요청 중...'
                            : '사용자 임베딩 백필 실행'}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 md:mt-5 grid gap-3 md:gap-4">
                    <PolicyField
                      label="Redis Lock TTL"
                      description="join_party() 분산락 TTL (평균 처리시간보다 길게)"
                    >
                      <NumberInput
                        value={selectedPolicy.joinPartyLockTtlSeconds}
                        min={5}
                        max={120}
                        onChange={(value) =>
                          updatePolicyDraft('joinPartyLockTtlSeconds', value)
                        }
                      />
                    </PolicyField>

                    <div className="grid grid-cols-3 gap-2 md:gap-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 md:px-4 md:py-3 text-center sm:text-left">
                        <div className="text-[9px] md:text-[11px] font-medium text-slate-400 truncate">
                          평균 join
                        </div>
                        <div className="mt-1 text-sm md:text-lg font-bold text-slate-900">
                          {formatMs(summary?.stepAvg.joinPartyMs)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 md:px-4 md:py-3 text-center sm:text-left">
                        <div className="text-[9px] md:text-[11px] font-medium text-slate-400 truncate">
                          현재 TTL
                        </div>
                        <div className="mt-1 text-sm md:text-lg font-bold text-slate-900">
                          {selectedPolicy.joinPartyLockTtlSeconds}초
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 md:px-4 md:py-3 text-center sm:text-left">
                        <div className="text-[9px] md:text-[11px] font-medium text-slate-400 truncate">
                          평균 매칭
                        </div>
                        <div className="mt-1 text-sm md:text-lg font-bold text-slate-900">
                          {formatSeconds(summary?.avgSeconds)}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] md:text-sm leading-relaxed text-amber-800 break-keep">
                      임베딩 백필은 파티 로직이 바뀌었거나 기존 파티에 임베딩이
                      없는 경우에만 실행하세요. (비용 증가 주의)
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
