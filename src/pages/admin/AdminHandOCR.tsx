import { Fragment, useEffect, useMemo, useState } from 'react';
import AdminHeader from './components/AdminHeader';
import FilterTabs from './components/FilterTabs';
import {
  expireAdminHandOcrSession,
  fetchAdminHandOcrBlocks,
  fetchAdminHandOcrHealth,
  fetchAdminHandOcrImageUrl,
  fetchAdminHandOcrRecords,
  fetchAdminHandOcrSessions,
  releaseAdminHandOcrBlock,
  resetAdminHandOcrIpFailures,
  type AdminHandOcrBlockItem,
  type AdminHandOcrHealth,
  type AdminHandOcrRecord,
  type AdminHandOcrSessionItem,
} from '../../apis/admin-hand-ocr';

const FILTER_TABS = [
  '전체',
  '성공',
  '실패',
  '저신뢰',
  '포즈불일치',
  '문자불일치',
];

const STATUS_STYLE: Record<string, string> = {
  성공: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  실패: 'bg-rose-50 text-rose-600 border-rose-100',
  저신뢰: 'bg-amber-50 text-amber-600 border-amber-100',
  포즈불일치: 'bg-orange-50 text-orange-600 border-orange-100',
  문자불일치: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100',
  'GPU/모델오류': 'bg-violet-50 text-violet-600 border-violet-100',
};

type SummaryCard = {
  label: string;
  value: string;
  tone?: string;
};

type HealthTone = 'ok' | 'warn' | 'error';
type InspectionRecord = Record<string, unknown>;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatConfidence = (value?: number | null) => {
  if (value === null || value === undefined) return '-';
  return value.toFixed(2);
};

const formatSeconds = (value?: number | null) => {
  if (value === null || value === undefined) return '-';
  if (value < 60) return `${value}초`;
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}분 ${seconds}초`;
};

const getNestedNumber = (source: unknown, path: string[]): number | null => {
  let current: unknown = source;

  for (const key of path) {
    if (!isObject(current) || !(key in current)) {
      return null;
    }
    current = current[key];
  }

  return typeof current === 'number' ? current : null;
};

const getNestedValue = (source: unknown, path: string[]): unknown => {
  let current: unknown = source;

  for (const key of path) {
    if (!isObject(current) || !(key in current)) {
      return null;
    }
    current = current[key];
  }

  return current;
};

const getRecordKey = (record: AdminHandOcrRecord) =>
  [record.sessionId, record.requestId, record.createdAt]
    .filter(Boolean)
    .join(':');

const getElapsedMs = (inspection?: InspectionRecord | null) =>
  getNestedNumber(inspection, ['timing', 'total_elapsed_ms']);

const getHealthTone = (health?: AdminHandOcrHealth | null): HealthTone => {
  if (!health) return 'error';
  if (!health.ok || !health.poseModelLoaded || !health.ocrLoaded) {
    return 'error';
  }
  if (!health.paddleCudaAvailable || !health.ocrUseGpu) return 'warn';
  return 'ok';
};

const getHealthBadgeClass = (tone: HealthTone) => {
  if (tone === 'ok') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }
  if (tone === 'warn') {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }
  return 'border-rose-200 bg-rose-50 text-rose-700';
};

const getRecordStatus = (record: AdminHandOcrRecord) => {
  if (record.verifySuccess) return '성공';
  if (
    record.aiErrorCode?.startsWith('GPU_') ||
    record.aiErrorCode === 'HAND_LANDMARKER_FAILED' ||
    record.aiErrorCode === 'MODEL_PREDICTION_FAILED'
  ) {
    return 'GPU/모델오류';
  }
  if (record.ocrLowConfidence) return '저신뢰';
  if (record.poseMatch === false) return '포즈불일치';
  if (record.textMatch === false) return '문자불일치';
  return '실패';
};

const matchesActiveTab = (record: AdminHandOcrRecord, tab: string) => {
  if (tab === '전체') return true;
  if (tab === '성공') return record.verifySuccess;
  if (tab === '실패') return !record.verifySuccess;
  if (tab === '저신뢰') return record.ocrLowConfidence === true;
  if (tab === '포즈불일치') return record.poseMatch === false;
  if (tab === '문자불일치') return record.textMatch === false;
  return true;
};

const openImageWindow = (url?: string | null) => {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const renderBBoxSummary = (bbox: unknown) => {
  if (!isObject(bbox)) return '-';

  const xMin = bbox.xMin ?? bbox.x_min;
  const yMin = bbox.yMin ?? bbox.y_min;
  const xMax = bbox.xMax ?? bbox.x_max;
  const yMax = bbox.yMax ?? bbox.y_max;
  const width = bbox.width;
  const height = bbox.height;

  return `x:${String(xMin ?? '-')} y:${String(yMin ?? '-')} / w:${String(width ?? '-')} h:${String(height ?? '-')} / x2:${String(xMax ?? '-')} y2:${String(yMax ?? '-')}`;
};

const getAdminErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (
      ((error as { message: string }).message || '').trim() ||
      '관리자 요청 처리 중 오류가 발생했습니다.'
    );
  }

  return '관리자 요청 처리 중 오류가 발생했습니다.';
};

export default function AdminHandOCR() {
  const [activeTab, setActiveTab] = useState('전체');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [errorCode, setErrorCode] = useState('전체');
  const [poseFilter, setPoseFilter] = useState('전체');

  const [records, setRecords] = useState<AdminHandOcrRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [health, setHealth] = useState<AdminHandOcrHealth | null>(null);
  const [healthError, setHealthError] = useState('');

  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const [imageUrlMap, setImageUrlMap] = useState<Record<string, string | null>>(
    {},
  );
  const [imageLoadingMap, setImageLoadingMap] = useState<
    Record<string, boolean>
  >({});

  const [blockKeyword, setBlockKeyword] = useState('');
  const [blocks, setBlocks] = useState<AdminHandOcrBlockItem[]>([]);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [blocksError, setBlocksError] = useState('');
  const [busyBlockIp, setBusyBlockIp] = useState<string | null>(null);
  const [busyResetIp, setBusyResetIp] = useState<string | null>(null);

  const [sessionKeyword, setSessionKeyword] = useState('');
  const [sessions, setSessions] = useState<AdminHandOcrSessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState('');
  const [busySessionId, setBusySessionId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const loadInitialData = async () => {
      setLoading(true);
      setError('');
      setHealthError('');

      const [recordsResult, healthResult] = await Promise.allSettled([
        fetchAdminHandOcrRecords(),
        fetchAdminHandOcrHealth(),
      ]);

      if (!alive) return;

      if (recordsResult.status === 'fulfilled') {
        setRecords(recordsResult.value);
      } else {
        setError(getAdminErrorMessage(recordsResult.reason));
        setRecords([]);
      }

      if (healthResult.status === 'fulfilled') {
        setHealth(healthResult.value);
        setHealthError('');
      } else {
        setHealth(null);
        setHealthError(getAdminErrorMessage(healthResult.reason));
      }

      setLoading(false);
    };

    void loadInitialData();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    const loadBlocks = async () => {
      try {
        setBlocksLoading(true);
        setBlocksError('');
        const nextBlocks = await fetchAdminHandOcrBlocks({
          keyword: blockKeyword || undefined,
        });
        if (!alive) return;
        setBlocks(nextBlocks);
      } catch (err) {
        if (!alive) return;
        setBlocksError(getAdminErrorMessage(err));
      } finally {
        if (alive) {
          setBlocksLoading(false);
        }
      }
    };

    void loadBlocks();

    return () => {
      alive = false;
    };
  }, [blockKeyword]);

  useEffect(() => {
    let alive = true;

    const loadSessions = async () => {
      try {
        setSessionsLoading(true);
        setSessionsError('');
        const nextSessions = await fetchAdminHandOcrSessions({
          keyword: sessionKeyword || undefined,
        });
        if (!alive) return;
        setSessions(nextSessions);
      } catch (err) {
        if (!alive) return;
        setSessionsError(getAdminErrorMessage(err));
      } finally {
        if (alive) {
          setSessionsLoading(false);
        }
      }
    };

    void loadSessions();

    return () => {
      alive = false;
    };
  }, [sessionKeyword]);

  const errorCodeOptions = useMemo(
    () => [
      '전체',
      ...Array.from(
        new Set(
          records
            .map((record) => record.aiErrorCode)
            .filter(
              (value): value is string =>
                typeof value === 'string' && value.length > 0,
            ),
        ),
      ),
    ],
    [records],
  );

  const poseOptions = useMemo(
    () => [
      '전체',
      ...Array.from(
        new Set(
          records
            .flatMap((record) => [record.expectedPose, record.detectedPose])
            .filter(
              (value): value is string =>
                typeof value === 'string' && value.length > 0,
            ),
        ),
      ),
    ],
    [records],
  );

  const buildParams = (tab = activeTab) => ({
    keyword: search || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    error_code: errorCode !== '전체' ? errorCode : undefined,
    pose: poseFilter !== '전체' ? poseFilter : undefined,
    status_tab: tab !== '전체' ? tab : undefined,
  });

  const reloadRecords = async (tab = activeTab) => {
    setLoading(true);
    setError('');
    try {
      setRecords(await fetchAdminHandOcrRecords(buildParams(tab)));
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const reloadBlocks = async () => {
    setBlocksLoading(true);
    setBlocksError('');
    try {
      setBlocks(
        await fetchAdminHandOcrBlocks({ keyword: blockKeyword || undefined }),
      );
    } catch (err) {
      setBlocksError(getAdminErrorMessage(err));
    } finally {
      setBlocksLoading(false);
    }
  };

  const reloadSessions = async () => {
    setSessionsLoading(true);
    setSessionsError('');
    try {
      setSessions(
        await fetchAdminHandOcrSessions({
          keyword: sessionKeyword || undefined,
        }),
      );
    } catch (err) {
      setSessionsError(getAdminErrorMessage(err));
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleSearch = async (tab = activeTab) => {
    await reloadRecords(tab);
  };

  const handleReset = async () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setErrorCode('전체');
    setPoseFilter('전체');
    setActiveTab('전체');
    setExpandedRecordId(null);
    setImageUrlMap({});
    setImageLoadingMap({});
    setLoading(true);
    setError('');

    try {
      setRecords(await fetchAdminHandOcrRecords());
    } catch (err) {
      setError(getAdminErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadImageUrlByKey = async (key?: string | null) => {
    if (!key) return null;

    if (imageUrlMap[key] !== undefined) {
      return imageUrlMap[key];
    }

    setImageLoadingMap((prev) => ({ ...prev, [key]: true }));

    try {
      const url = await fetchAdminHandOcrImageUrl(key);
      setImageUrlMap((prev) => ({ ...prev, [key]: url }));
      return url;
    } catch (err) {
      setError(getAdminErrorMessage(err));
      setImageUrlMap((prev) => ({ ...prev, [key]: null }));
      return null;
    } finally {
      setImageLoadingMap((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleOpenImage = async (
    key?: string | null,
    existingUrl?: string | null,
  ) => {
    if (existingUrl) {
      openImageWindow(existingUrl);
      return;
    }

    const nextUrl = await loadImageUrlByKey(key);
    if (nextUrl) {
      openImageWindow(nextUrl);
    }
  };

  const handleToggleDetail = (record: AdminHandOcrRecord) => {
    const key = getRecordKey(record);

    if (expandedRecordId === key) {
      setExpandedRecordId(null);
      return;
    }

    setExpandedRecordId(key);

    void Promise.allSettled([
      loadImageUrlByKey(record.imageKey),
      loadImageUrlByKey(record.textCropKey),
    ]);
  };

  const handleReleaseBlock = async (ip: string) => {
    try {
      setBusyBlockIp(ip);
      await releaseAdminHandOcrBlock(ip);
      await reloadBlocks();
    } catch (err) {
      setBlocksError(getAdminErrorMessage(err));
    } finally {
      setBusyBlockIp(null);
    }
  };

  const handleResetIpFailures = async (ip: string) => {
    try {
      setBusyResetIp(ip);
      await resetAdminHandOcrIpFailures(ip);
      await Promise.all([reloadBlocks(), reloadSessions()]);
    } catch (err) {
      setBlocksError(getAdminErrorMessage(err));
    } finally {
      setBusyResetIp(null);
    }
  };

  const handleExpireSession = async (sessionId: string) => {
    try {
      setBusySessionId(sessionId);
      await expireAdminHandOcrSession(sessionId);
      await Promise.all([reloadSessions(), reloadBlocks()]);
    } catch (err) {
      setSessionsError(getAdminErrorMessage(err));
    } finally {
      setBusySessionId(null);
    }
  };

  const filtered = useMemo(
    () => records.filter((record) => matchesActiveTab(record, activeTab)),
    [records, activeTab],
  );

  const summary = useMemo<SummaryCard[]>(() => {
    const gpuErrorCount = records.filter(
      (record) =>
        record.aiErrorCode?.startsWith('GPU_') ||
        record.aiErrorCode === 'HAND_LANDMARKER_FAILED' ||
        record.aiErrorCode === 'MODEL_PREDICTION_FAILED',
    ).length;

    return [
      { label: '전체 검증', value: `${records.length}` },
      {
        label: '성공',
        value: `${records.filter((record) => record.verifySuccess).length}`,
        tone: 'text-emerald-600',
      },
      {
        label: '실패',
        value: `${records.filter((record) => !record.verifySuccess).length}`,
        tone: 'text-rose-600',
      },
      {
        label: 'OCR 저신뢰',
        value: `${records.filter((record) => record.ocrLowConfidence).length}`,
        tone: 'text-amber-600',
      },
      {
        label: '포즈 불일치',
        value: `${records.filter((record) => record.poseMatch === false).length}`,
        tone: 'text-orange-600',
      },
      {
        label: 'GPU / 모델 오류',
        value: `${gpuErrorCount}`,
        tone: 'text-violet-600',
      },
    ];
  }, [records]);

  const healthTone = getHealthTone(health);
  const healthLabel =
    healthTone === 'ok'
      ? 'GPU 정상'
      : healthTone === 'warn'
        ? 'GPU 경고'
        : 'GPU 오류';

  return (
    <>
      <AdminHeader
        placeholder="세션 / 요청 ID / 기대 문자열 검색..."
        onSearch={setSearch}
        rightContent={
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded-md border px-3 py-1.5 text-xs font-semibold ${getHealthBadgeClass(healthTone)}`}
            >
              {healthLabel}
            </span>
            <button
              type="button"
              className="rounded-md border border-gray-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              onClick={() => setIsGuideOpen((prev) => !prev)}
            >
              {isGuideOpen ? '가이드 닫기' : '운영 가이드'}
            </button>
          </div>
        }
      />

      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <section>
            <h1 className="text-2xl font-bold text-gray-900">
              HandOCR CAPTCHA 관리
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              인증 성공/실패, OCR/포즈 품질, GPU 상태, 샘플 이미지, 차단 IP와
              활성 세션을 한 화면에서 관리할 수 있게 구성했습니다.
            </p>
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {summary.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <p className="text-sm text-gray-500">{item.label}</p>
                <p
                  className={`mt-2 text-2xl font-bold text-gray-900 ${item.tone ?? ''}`}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    GPU / OCR 상태
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    health 체크와 추론 런타임 구성을 같이 표시합니다.
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getHealthBadgeClass(healthTone)}`}
                >
                  {healthLabel}
                </span>
              </div>

              {healthError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {healthError}
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  ['서비스', health?.service ?? '-'],
                  ['Paddle Device', health?.paddleDevice ?? '-'],
                  [
                    'CUDA 사용 가능',
                    health?.paddleCudaAvailable ? '예' : '아니오',
                  ],
                  ['OCR GPU 사용', health?.ocrUseGpu ? '예' : '아니오'],
                  ['포즈 모델 로드', health?.poseModelLoaded ? '완료' : '실패'],
                  ['OCR 로드', health?.ocrLoaded ? '완료' : '실패'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                  >
                    <div className="text-xs font-medium text-slate-400">
                      {label}
                    </div>
                    <div className="mt-1 break-all text-sm font-semibold text-slate-800">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">운영 기준</h2>
              <p className="mt-1 text-xs text-gray-500">
                화면 분류는 저장된 검증 결과와 Redis 상태를 기준으로 계산합니다.
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="font-semibold text-slate-800">성공</span> :
                  verifySuccess = true
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="font-semibold text-slate-800">저신뢰</span> :
                  ocrLowConfidence = true
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="font-semibold text-slate-800">
                    포즈불일치
                  </span>{' '}
                  : poseMatch = false
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="font-semibold text-slate-800">
                    문자불일치
                  </span>{' '}
                  : textMatch = false
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="font-semibold text-slate-800">차단 IP</span>{' '}
                  : captcha:block:{'{ip}'}
                </div>
              </div>
            </div>
          </section>

          <FilterTabs
            tabs={FILTER_TABS}
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
              void handleSearch(tab);
            }}
          />

          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">
                  키워드
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="session ID / request ID / expected text / detected text"
                  className="w-72 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">
                  에러코드
                </span>
                <select
                  value={errorCode}
                  onChange={(event) => setErrorCode(event.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                >
                  {errorCodeOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">
                  손 포즈
                </span>
                <select
                  value={poseFilter}
                  onChange={(event) => setPoseFilter(event.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                >
                  {poseOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">
                  시작일
                </span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">
                  종료일
                </span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                />
              </label>

              <div className="flex gap-2 pb-0.5">
                <button
                  type="button"
                  onClick={() => void handleSearch()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  조회
                </button>
                <button
                  type="button"
                  onClick={() => void handleReset()}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  초기화
                </button>
              </div>
            </div>
          </section>

          {isGuideOpen && (
            <section className="rounded-2xl border border-blue-100 bg-blue-50/70 px-5 py-4 text-sm text-slate-600 shadow-sm">
              성공/실패, 포즈 불일치, 문자열 불일치, OCR 저신뢰 상태를 한
              화면에서 비교합니다. 이미지 미리보기는 presigned URL 또는 공개
              URL을 내려주는 관리자 API가 연결되어야 정상 표시됩니다.
            </section>
          )}

          {loading && (
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500 shadow-sm">
              HandOCR 검증 이력을 불러오는 중입니다.
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 shadow-sm">
              {error}
            </div>
          )}

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      생성 시각
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      세션 / 요청
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      요구 미션
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      인식 결과
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      상태
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      OCR
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      포즈
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      에러
                    </th>
                    <th className="px-4 py-3.5 text-left text-sm font-semibold text-gray-500">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((record) => {
                    const key = getRecordKey(record);
                    const statusLabel = getRecordStatus(record);
                    const isExpanded = expandedRecordId === key;
                    const inspection = (record.inspection ??
                      null) as InspectionRecord | null;
                    const elapsedMs = getElapsedMs(inspection);

                    const imageUrl =
                      imageUrlMap[record.imageKey ?? ''] ??
                      record.imageUrl ??
                      null;

                    const textCropUrl =
                      imageUrlMap[record.textCropKey ?? ''] ??
                      record.textCropUrl ??
                      null;

                    const isOriginalImageLoading = record.imageKey
                      ? Boolean(imageLoadingMap[record.imageKey])
                      : false;

                    const isTextCropLoading = record.textCropKey
                      ? Boolean(imageLoadingMap[record.textCropKey])
                      : false;

                    const bbox =
                      record.textRegionBbox ??
                      getNestedValue(inspection, ['ocr', 'best_bbox']);

                    return (
                      <Fragment key={key}>
                        <tr className="border-b border-gray-100 transition hover:bg-gray-50">
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            {formatDateTime(record.createdAt)}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            <div className="font-medium text-gray-900">
                              {record.sessionId}
                            </div>
                            <div className="mt-1 text-xs text-gray-400">
                              {record.requestId ?? '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            <div>{record.expectedPose}</div>
                            <div className="mt-1 text-xs text-gray-400">
                              {record.expectedText}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            <div>{record.detectedPose ?? '-'}</div>
                            <div className="mt-1 text-xs text-gray-400">
                              {record.detectedText ?? '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[statusLabel]}`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            <div>{formatConfidence(record.ocrConfidence)}</div>
                            <div className="mt-1 text-xs text-gray-400">
                              {record.ocrLowConfidence
                                ? 'low confidence'
                                : 'normal'}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            <div>{formatConfidence(record.poseConfidence)}</div>
                            <div className="mt-1 text-xs text-gray-400">
                              {record.poseMatch === false
                                ? 'mismatch'
                                : 'match'}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-600">
                            {record.aiErrorCode ?? '-'}
                          </td>
                          <td className="px-4 py-3.5 text-sm">
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                className={`rounded-md border px-3 py-1 text-xs font-medium transition ${
                                  isExpanded
                                    ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                                onClick={() => handleToggleDetail(record)}
                              >
                                {isExpanded ? '닫기' : '상세'}
                              </button>
                              <button
                                type="button"
                                className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={
                                  isOriginalImageLoading || !record.imageKey
                                }
                                onClick={() =>
                                  void handleOpenImage(
                                    record.imageKey,
                                    imageUrl,
                                  )
                                }
                              >
                                {isOriginalImageLoading
                                  ? '불러오는 중...'
                                  : '원본'}
                              </button>
                              <button
                                type="button"
                                className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                disabled={
                                  isTextCropLoading || !record.textCropKey
                                }
                                onClick={() =>
                                  void handleOpenImage(
                                    record.textCropKey,
                                    textCropUrl,
                                  )
                                }
                              >
                                {isTextCropLoading ? '불러오는 중...' : 'Crop'}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="border-b border-gray-100 bg-slate-50/70">
                            <td colSpan={9} className="px-4 py-4">
                              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(320px,1fr)]">
                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <h3 className="text-base font-semibold text-slate-900">
                                        검증 상세
                                      </h3>
                                      <p className="mt-1 text-sm text-slate-500">
                                        기대값, 인식값, 매칭 결과, 에러 메시지를
                                        확인합니다.
                                      </p>
                                    </div>
                                    <span
                                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[statusLabel]}`}
                                    >
                                      {statusLabel}
                                    </span>
                                  </div>

                                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                                    {[
                                      ['Session ID', record.sessionId],
                                      ['Request ID', record.requestId ?? '-'],
                                      ['기대 포즈', record.expectedPose],
                                      ['인식 포즈', record.detectedPose ?? '-'],
                                      ['기대 문자열', record.expectedText],
                                      [
                                        '인식 문자열',
                                        record.detectedText ?? '-',
                                      ],
                                      [
                                        '포즈 매칭',
                                        record.poseMatch === null
                                          ? '-'
                                          : record.poseMatch
                                            ? '일치'
                                            : '불일치',
                                      ],
                                      [
                                        '문자 매칭',
                                        record.textMatch === null
                                          ? '-'
                                          : record.textMatch
                                            ? '일치'
                                            : '불일치',
                                      ],
                                      [
                                        'AI 에러코드',
                                        record.aiErrorCode ?? '-',
                                      ],
                                      ['AI 메시지', record.aiMessage ?? '-'],
                                      ['가이드', record.aiGuide ?? '-'],
                                      [
                                        '총 처리시간',
                                        elapsedMs !== null
                                          ? `${elapsedMs} ms`
                                          : '-',
                                      ],
                                    ].map(([label, value]) => (
                                      <div
                                        key={label}
                                        className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                                      >
                                        <div className="text-xs font-medium text-slate-400">
                                          {label}
                                        </div>
                                        <div className="mt-1 break-all text-sm font-semibold text-slate-800">
                                          {value}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                  <h3 className="text-base font-semibold text-slate-900">
                                    이미지 샘플
                                  </h3>
                                  <p className="mt-1 text-sm text-slate-500">
                                    원본 이미지와 OCR text crop 이미지를
                                    확인합니다.
                                  </p>

                                  <div className="mt-5 grid gap-4">
                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                      <div className="mb-2 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-500">
                                          원본 이미지
                                        </span>
                                        {(imageUrl || record.imageKey) && (
                                          <button
                                            type="button"
                                            className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-white"
                                            onClick={() =>
                                              void handleOpenImage(
                                                record.imageKey,
                                                imageUrl,
                                              )
                                            }
                                          >
                                            새 창 열기
                                          </button>
                                        )}
                                      </div>
                                      {isOriginalImageLoading ? (
                                        <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
                                          이미지 URL을 불러오는 중입니다.
                                        </div>
                                      ) : imageUrl ? (
                                        <img
                                          src={imageUrl}
                                          alt="HandOCR original"
                                          className="h-52 w-full rounded-xl border border-slate-200 object-contain bg-white"
                                        />
                                      ) : (
                                        <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
                                          이미지 URL이 없습니다.
                                        </div>
                                      )}
                                      <div className="mt-2 break-all text-xs text-slate-400">
                                        {record.imageKey ?? '-'}
                                      </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                                      <div className="mb-2 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-500">
                                          Text Crop
                                        </span>
                                        {(textCropUrl ||
                                          record.textCropKey) && (
                                          <button
                                            type="button"
                                            className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-white"
                                            onClick={() =>
                                              void handleOpenImage(
                                                record.textCropKey,
                                                textCropUrl,
                                              )
                                            }
                                          >
                                            새 창 열기
                                          </button>
                                        )}
                                      </div>
                                      {isTextCropLoading ? (
                                        <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
                                          Crop 이미지 URL을 불러오는 중입니다.
                                        </div>
                                      ) : textCropUrl ? (
                                        <img
                                          src={textCropUrl}
                                          alt="HandOCR crop"
                                          className="h-52 w-full rounded-xl border border-slate-200 object-contain bg-white"
                                        />
                                      ) : (
                                        <div className="flex h-52 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
                                          Crop 이미지 URL이 없습니다.
                                        </div>
                                      )}
                                      <div className="mt-2 break-all text-xs text-slate-400">
                                        {record.textCropKey ?? '-'}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                  <h3 className="text-base font-semibold text-slate-900">
                                    OCR / Inspection
                                  </h3>
                                  <p className="mt-1 text-sm text-slate-500">
                                    OCR 후보, bbox, inspection 원문을
                                    확인합니다.
                                  </p>

                                  <div className="mt-5 space-y-4">
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                      <div className="text-xs font-medium text-slate-400">
                                        OCR confidence
                                      </div>
                                      <div className="mt-1 text-sm font-semibold text-slate-800">
                                        {formatConfidence(record.ocrConfidence)}
                                      </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                      <div className="text-xs font-medium text-slate-400">
                                        Pose confidence
                                      </div>
                                      <div className="mt-1 text-sm font-semibold text-slate-800">
                                        {formatConfidence(
                                          record.poseConfidence,
                                        )}
                                      </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                      <div className="text-xs font-medium text-slate-400">
                                        OCR best attempt
                                      </div>
                                      <div className="mt-1 break-all text-sm font-semibold text-slate-800">
                                        {record.ocrBestAttempt ?? '-'}
                                      </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                      <div className="text-xs font-medium text-slate-400">
                                        Text region bbox
                                      </div>
                                      <div className="mt-1 break-all text-sm font-semibold text-slate-800">
                                        {renderBBoxSummary(bbox)}
                                      </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                                      <div className="text-xs font-medium text-slate-400">
                                        OCR 후보
                                      </div>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {(record.ocrTextCandidates ?? [])
                                          .length > 0 ? (
                                          record.ocrTextCandidates.map(
                                            (candidate) => (
                                              <span
                                                key={candidate}
                                                className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                                              >
                                                {candidate}
                                              </span>
                                            ),
                                          )
                                        ) : (
                                          <span className="text-sm text-slate-400">
                                            OCR 후보가 없습니다.
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-slate-950 p-0 shadow-inner">
                                      <div className="border-b border-slate-800 px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                                        inspection
                                      </div>
                                      <pre className="max-h-[360px] overflow-auto px-4 py-4 text-xs leading-6 text-slate-200">
                                        {JSON.stringify(
                                          record.inspection ?? {},
                                          null,
                                          2,
                                        )}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
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
              상세 패널은 저장된 OCR 후보, bbox, inspection 원문 기준으로
              표시합니다. 이미지 미리보기는 관리자 API에서 presigned URL 또는
              공개 URL을 내려줄 때 활성화됩니다.
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      차단 IP 관리
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Redis 차단 상태와 남은 TTL을 확인하고 차단 해제/실패
                      카운트 초기화를 수행합니다.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={blockKeyword}
                      onChange={(event) => setBlockKeyword(event.target.value)}
                      placeholder="IP / 사유 검색"
                      className="w-52 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                    />
                    <button
                      type="button"
                      onClick={() => void reloadBlocks()}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                      새로고침
                    </button>
                  </div>
                </div>
              </div>

              {blocksLoading && (
                <div className="px-5 py-4 text-sm text-gray-500">
                  차단 IP 목록을 불러오는 중입니다.
                </div>
              )}

              {blocksError && (
                <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {blocksError}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                        IP
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                        사유
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                        남은 시간
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {blocks.map((block) => (
                      <tr
                        key={block.ip}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {block.ip}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {block.reason ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatSeconds(block.ttlSeconds)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={busyBlockIp === block.ip}
                              onClick={() => void handleReleaseBlock(block.ip)}
                            >
                              {busyBlockIp === block.ip
                                ? '처리 중...'
                                : '차단 해제'}
                            </button>
                            <button
                              type="button"
                              className="rounded-md border border-amber-300 px-3 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={busyResetIp === block.ip}
                              onClick={() =>
                                void handleResetIpFailures(block.ip)
                              }
                            >
                              {busyResetIp === block.ip
                                ? '처리 중...'
                                : '실패 카운트 초기화'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!blocksLoading && blocks.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-sm text-gray-400"
                        >
                          차단된 IP가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      활성 세션 관리
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      현재 발급된 HandOCR 세션, 남은 TTL, 시도 횟수를 조회하고
                      강제 만료시킬 수 있습니다.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={sessionKeyword}
                      onChange={(event) =>
                        setSessionKeyword(event.target.value)
                      }
                      placeholder="IP / session / text / pose 검색"
                      className="w-56 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                    />
                    <button
                      type="button"
                      onClick={() => void reloadSessions()}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                      새로고침
                    </button>
                  </div>
                </div>
              </div>

              {sessionsLoading && (
                <div className="px-5 py-4 text-sm text-gray-500">
                  활성 세션 목록을 불러오는 중입니다.
                </div>
              )}

              {sessionsError && (
                <div className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {sessionsError}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                        IP
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                        세션
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                        미션
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                        TTL / 시도
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr
                        key={`${session.ip}:${session.sessionId ?? 'none'}`}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {session.ip}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 break-all">
                          {session.sessionId ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div>{session.pose ?? '-'}</div>
                          <div className="mt-1 text-xs text-gray-400">
                            {session.text ?? '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <div>
                            active:{' '}
                            {formatSeconds(session.activeSessionTtlSeconds)}
                          </div>
                          <div className="mt-1 text-xs text-gray-400">
                            session: {formatSeconds(session.sessionTtlSeconds)}{' '}
                            / attempts: {session.attempts ?? '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={
                                !session.sessionId ||
                                busySessionId === session.sessionId
                              }
                              onClick={() =>
                                session.sessionId &&
                                void handleExpireSession(session.sessionId)
                              }
                            >
                              {busySessionId === session.sessionId
                                ? '처리 중...'
                                : '세션 만료'}
                            </button>
                            <button
                              type="button"
                              className="rounded-md border border-amber-300 px-3 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={busyResetIp === session.ip}
                              onClick={() =>
                                void handleResetIpFailures(session.ip)
                              }
                            >
                              {busyResetIp === session.ip
                                ? '처리 중...'
                                : '실패 카운트 초기화'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!sessionsLoading && sessions.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-sm text-gray-400"
                        >
                          활성 세션이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
